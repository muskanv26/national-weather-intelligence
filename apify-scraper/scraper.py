import asyncio
import os
import json
import logging
from datetime import datetime
from dotenv import load_dotenv
from kafka import KafkaProducer
from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from apify_client import ApifyClient
import re
from langdetect import detect, DetectorFactory
DetectorFactory.seed = 0

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

load_dotenv()

# Kafka config
KAFKA_BROKER = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "kafka:9092")
KAFKA_TOPIC = os.getenv("KAFKA_TOPIC", "weather-events")
APIFY_TOKEN = os.getenv("APIFY_TOKEN")

def get_kafka_producer():
    return KafkaProducer(
        bootstrap_servers=[KAFKA_BROKER],
        value_serializer=lambda v: json.dumps(v).encode('utf-8'),
        api_version=(0,10,1)
    )

def map_tweet_to_event(tweet):
    text = tweet.get("text", "").lower()
    
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

    # Try to safely extract image
    img_url = None
    
    # 1. Try extendedEntities
    ext_ent = tweet.get("extendedEntities", {})
    if ext_ent and "media" in ext_ent and len(ext_ent["media"]) > 0:
        media_item = ext_ent["media"][0]
        img_url = media_item.get("media_url_https") or media_item.get("url")
        if media_item.get("type") == "video":
            img_url = media_item.get("media_url_https")
            
    # 2. Try media array
    if not img_url:
        media_arr = tweet.get("media", [])
        if media_arr and isinstance(media_arr, list) and len(media_arr) > 0:
            first_media = media_arr[0]
            if isinstance(first_media, dict):
                img_url = first_media.get("url") or first_media.get("media_url_https")
            elif isinstance(first_media, str):
                img_url = first_media
                
    author = "Unknown"
    author_data = tweet.get("author", {})
    if isinstance(author_data, dict):
        author = author_data.get("userName") or author_data.get("screenName") or author_data.get("name") or "Unknown"
    else:
        author = tweet.get("userName", "Unknown")

    # Timestamp parsing
    raw_ts = tweet.get("createdAt")
    if raw_ts:
        try:
            # Apify twitter format: "Tue Aug 25 07:03:58 +0000 2026"
            dt = datetime.strptime(raw_ts, "%a %b %d %H:%M:%S %z %Y")
            ts = dt.replace(tzinfo=None).isoformat()
        except ValueError:
            ts = datetime.now().isoformat()
    else:
        ts = datetime.now().isoformat()
    
    return {
        "externalId": tweet.get("id") or tweet.get("id_str") or str(hash(text)),
        "title": f"Live {event_type} update via X",
        "description": tweet.get("text", ""),
        "author": author,
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
        "timestamp": ts
    }

kafka_producer = None

def execute_twitter_scrape():
    global kafka_producer
    if kafka_producer is None:
        try:
            kafka_producer = get_kafka_producer()
        except Exception as e:
            logger.error(f"Failed to connect to Kafka: {e}")
            return
            
    if not APIFY_TOKEN:
        logger.error("APIFY_TOKEN is missing!")
        return

    client = ApifyClient(APIFY_TOKEN)
    query = "(flood OR cyclone OR heavy rain) (India OR Mumbai OR Delhi OR Bengaluru OR Chennai) lang:en filter:media"
    
    run_input = {
        "searchTerms": [query],
        "maxItems": 20,
        "sort": "Latest"
    }
    
    try:
        logger.info(f"Triggering Apify apidojo/tweet-scraper with query: {query}")
        run = client.actor("apidojo/tweet-scraper").call(run_input=run_input)
        
        count = 0
        for item in client.dataset(run["defaultDatasetId"]).iterate_items():
            text = str(item.get("text") or item.get("full_text") or "")
            if not is_english(text):
                continue

            event_dto = map_tweet_to_event(item)
            kafka_producer.send(KAFKA_TOPIC, event_dto)
            count += 1
            
        kafka_producer.flush()
        logger.info(f"Published {count} tweets from Apify to Kafka topic {KAFKA_TOPIC}.")
        
    except Exception as e:
        logger.error(f"Error during tweet fetching/publishing: {e}")

def map_ig_to_event(item):
    text = str(item.get("caption") or "").lower()
    
    event_type = "RAIN"
    if "flood" in text:
        event_type = "FLOOD"
    elif "cyclone" in text:
        event_type = "CYCLONE"
    
    severity = "MODERATE"
    if "severe" in text or "red alert" in text:
        severity = "CRITICAL"
    elif "heavy" in text:
        severity = "HIGH"

    city, state, lat, lng = "Unknown", "Unknown", 20.5937, 78.9629
    if "mumbai" in text:
        city, state, lat, lng = "Mumbai", "Maharashtra", 19.0760, 72.8777
    elif "delhi" in text:
        city, state, lat, lng = "New Delhi", "Delhi", 28.6139, 77.2090
    elif "chennai" in text:
        city, state, lat, lng = "Chennai", "Tamil Nadu", 13.0827, 80.2707

    img_url = item.get("displayUrl") or item.get("videoUrl") or item.get("thumbnailUrl")
    
    author = item.get("ownerUsername") or "InstagramUser"
    
    # Force timestamp to now so it appears at the top of the UI feed
    ts = datetime.now().isoformat()

    return {
        "externalId": item.get("id") or item.get("url") or str(hash(text)),
        "title": f"Live {event_type} update via Instagram",
        "description": item.get("caption", ""),
        "author": author,
        "imageUrl": img_url,
        "latitude": lat,
        "longitude": lng,
        "eventType": event_type,
        "severity": severity,
        "sourceType": "SOCIAL_MEDIA",
        "state": state,
        "city": city,
        "timestamp": ts
    }

def is_english(text):
    text = str(text or "").strip()
    if not text or len(text) < 3:
        return False
    try:
        return detect(text) == 'en'
    except:
        return False

def execute_instagram_scrape():
    global kafka_producer
    if kafka_producer is None:
        try:
            kafka_producer = get_kafka_producer()
        except Exception as e:
            return
            
    client = ApifyClient(APIFY_TOKEN)
    
    # We use Apify's hashtag scraper as it's reliable for searches
    run_input = {
        "hashtags": ["mumbaiflood", "delhirain", "chennaicyclone"],
        "resultsType": "posts",
        "resultsLimit": 15
    }
    
    try:
        logger.info("Triggering Apify apify/instagram-hashtag-scraper")
        run = client.actor("apify/instagram-hashtag-scraper").call(run_input=run_input)
        
        count = 0
        for item in client.dataset(run["defaultDatasetId"]).iterate_items():
            caption = str(item.get("caption") or "")
            if not is_english(caption):
                continue

            event_dto = map_ig_to_event(item)
            kafka_producer.send(KAFKA_TOPIC, event_dto)
            count += 1
            
        kafka_producer.flush()
        logger.info(f"Published {count} IG posts from Apify.")
    except Exception as e:
        logger.error(f"Error during IG fetching: {e}")

def execute_all_scrapes():
    execute_twitter_scrape()
    execute_instagram_scrape()

async def background_scheduler():
    while True:
        import asyncio
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, execute_all_scrapes)
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
    background_tasks.add_task(execute_all_scrapes)
    return {"status": "Apify Twitter & IG Scrape jobs queued."}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)
