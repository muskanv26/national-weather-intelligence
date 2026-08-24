import asyncio
import os
import json
import logging
from datetime import datetime
from dotenv import load_dotenv
from twscrape import API, gather
from kafka import KafkaProducer
from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

load_dotenv()

# Kafka config
KAFKA_BROKER = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "kafka:9092")
KAFKA_TOPIC = os.getenv("KAFKA_TOPIC", "weather-events")

def get_kafka_producer():
    return KafkaProducer(
        bootstrap_servers=[KAFKA_BROKER],
        value_serializer=lambda v: json.dumps(v).encode('utf-8'),
        api_version=(0,10,1)
    )

async def setup_account(api):
    auth_token = os.getenv("TWITTER_AUTH_TOKEN")
    ct0 = os.getenv("TWITTER_CT0")

    if not all([auth_token, ct0]):
        logger.warning("Twitter credentials not fully provided in .env. Ensure account is in twscrape pool.")
        return

    username = "scraper_account_1"

    # Check if account is already added
    accounts = await api.pool.get_all()
    if any(acc.username == username for acc in accounts):
        logger.info(f"Account {username} already exists in twscrape pool.")
    else:
        logger.info(f"Adding account {username} with cookies to twscrape pool...")
        cookies = f"auth_token={auth_token}; ct0={ct0}"
        await api.pool.add_account(username, "dummy_pass", "dummy_email", "dummy_epass", cookies=cookies)
    
    # Usually no need to login_all() if cookies are provided and valid
    try:
        await api.pool.login_all()
    except Exception as e:
        logger.warning(f"login_all step had an issue, but cookies might still work: {e}")

def map_tweet_to_event(tweet):
    text = tweet.rawContent.lower()
    
    event_type = "UNKNOWN"
    if "flood" in text:
        event_type = "FLOOD"
    elif "cyclone" in text:
        event_type = "CYCLONE"
    elif "rain" in text:
        event_type = "RAIN"
    elif "heat" in text or "heatwave" in text:
        event_type = "HEATWAVE"
    else:
        event_type = "RAIN" # Default fallback

    severity = "MODERATE"
    if "severe" in text or "red alert" in text:
        severity = "CRITICAL"
    elif "heavy" in text:
        severity = "HIGH"

    city = "Unknown"
    state = "Unknown"
    lat, lng = 20.5937, 78.9629
    
    if "mumbai" in text:
        city, state, lat, lng = "Mumbai", "Maharashtra", 19.0760, 72.8777
    elif "delhi" in text:
        city, state, lat, lng = "New Delhi", "Delhi", 28.6139, 77.2090
    elif "bengaluru" in text or "bangalore" in text:
        city, state, lat, lng = "Bengaluru", "Karnataka", 12.9716, 77.5946
    elif "chennai" in text:
        city, state, lat, lng = "Chennai", "Tamil Nadu", 13.0827, 80.2707
    elif "hyderabad" in text:
        city, state, lat, lng = "Hyderabad", "Telangana", 17.3850, 78.4867
    elif "kolkata" in text:
        city, state, lat, lng = "Kolkata", "West Bengal", 22.5726, 88.3639

    img_url = None
    if tweet.media:
        if tweet.media.photos:
            img_url = tweet.media.photos[0].url
        elif tweet.media.videos:
            img_url = tweet.media.videos[0].thumbnailUrl

    return {
        "externalId": tweet.id_str,
        "title": f"Live {event_type} update via X",
        "description": tweet.rawContent,
        "author": tweet.user.username,
        "imageUrl": img_url,
        "latitude": lat,
        "longitude": lng,
        "temperature": None,
        "humidity": None,
        "precipitation": None,
        "windSpeed": None,
        "atmosphericPressure": None,
        "eventType": event_type,
        "severity": severity,
        "sourceType": "SOCIAL_MEDIA",
        "state": state,
        "city": city,
        "timestamp": tweet.date.replace(tzinfo=None).isoformat() if tweet.date else datetime.now().isoformat()
    }

twscrape_api = API()
kafka_producer = None

async def execute_scrape():
    global kafka_producer
    if kafka_producer is None:
        try:
            kafka_producer = get_kafka_producer()
        except Exception as e:
            logger.error(f"Failed to connect to Kafka: {e}")
            return
            
    # Added filter:media so we prioritize fetching rich visual content for the dashboard!
    query = "(flood OR cyclone OR heavy rain) (India OR Mumbai OR Delhi OR Bengaluru OR Chennai) lang:en filter:media"
    
    try:
        logger.info(f"Searching tweets for query: {query}")
        tweets = await gather(twscrape_api.search(query, limit=10))
        
        for tweet in tweets:
            event_dto = map_tweet_to_event(tweet)
            kafka_producer.send(KAFKA_TOPIC, event_dto)
            
        kafka_producer.flush()
        logger.info(f"Published {len(tweets)} tweets to Kafka topic {KAFKA_TOPIC}.")
        
    except Exception as e:
        logger.error(f"Error during tweet fetching/publishing: {e}")

async def background_scheduler():
    await setup_account(twscrape_api)
    while True:
        await execute_scrape()
        logger.info("Sleeping for 15 minutes...")
        await asyncio.sleep(900)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(background_scheduler())

@app.post("/scrape")
async def trigger_scrape(background_tasks: BackgroundTasks):
    background_tasks.add_task(execute_scrape)
    return {"status": "Scrape job queued."}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
