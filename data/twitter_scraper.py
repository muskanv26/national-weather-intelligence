import asyncio
import json
import os
import uuid
from datetime import datetime
from dotenv import load_dotenv
from twscrape import API, gather
from aiokafka import AIOKafkaProducer

load_dotenv()

KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
KAFKA_TOPIC = os.getenv("KAFKA_WEATHER_TOPIC", "weather-events")

TWITTER_AUTH_TOKEN = os.getenv("TWITTER_AUTH_TOKEN")
TWITTER_CT0 = os.getenv("TWITTER_CT0")

QUERIES = [
    "flood lang:en",
    "cyclone lang:en",
    "wildfire lang:en",
    "hurricane lang:en",
    "tornado lang:en"
]

def map_tweet_to_event(tweet):
    """
    Naively map a tweet to a WeatherEventDto JSON.
    In a real scenario, NLP would extract precise location, severity, and event type.
    """
    text = tweet.rawContent.lower()
    
    # Determine EventType
    event_type = "OTHER"
    if "flood" in text:
        event_type = "FLOOD"
    elif "hurricane" in text or "cyclone" in text or "tornado" in text:
        event_type = "CYCLONE"
    elif "wind" in text:
        event_type = "STRONG_WIND"
    elif "rain" in text:
        event_type = "RAIN"
        
    # Determine Severity
    severity = "MODERATE"
    if "emergency" in text or "evacuate" in text or "fatal" in text:
        severity = "CRITICAL"
    elif "warning" in text or "danger" in text:
        severity = "HIGH"
        
    # Determine Source
    source = "SOCIAL_MEDIA"

    # Default mock location
    lat, lng = 0.0, 0.0
    city, state = "Unknown", "Unknown"
    
    if tweet.place:
        city = tweet.place.name or "Unknown"
        state = tweet.place.countryCode or "Unknown"

    return {
        "id": str(uuid.uuid4()),
        "latitude": lat,
        "longitude": lng,
        "eventType": event_type,
        "severity": severity,
        "sourceType": source,
        "city": city,
        "state": state,
        "timestamp": tweet.date.isoformat() if tweet.date else datetime.utcnow().isoformat()
    }

async def start_scraping():
    api = API()
    
    if TWITTER_AUTH_TOKEN and TWITTER_CT0:
        print("Adding account cookies...")
        await api.pool.add_account_cookies("scraper_acc", f"auth_token={TWITTER_AUTH_TOKEN}; ct0={TWITTER_CT0}")
    else:
        print("Warning: TWITTER_AUTH_TOKEN or TWITTER_CT0 not provided. If no accounts exist in DB, scraping will fail.")

    producer = AIOKafkaProducer(bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS)
    await producer.start()
    print("Kafka producer started. Beginning Twitter scrape loop...")
    
    try:
        while True:
            for query in QUERIES:
                print(f"Scraping for query: {query}")
                try:
                    tweets = await gather(api.search(query, limit=20))
                    for tweet in tweets:
                        event = map_tweet_to_event(tweet)
                        await producer.send_and_wait(
                            KAFKA_TOPIC, 
                            json.dumps(event).encode("utf-8")
                        )
                        print(f"Sent event to Kafka: {event['eventType']} in {event['city']}")
                except Exception as e:
                    print(f"Error scraping {query}: {e}")
            
            print("Sleeping for 5 minutes before next run...")
            await asyncio.sleep(300)
    finally:
        await producer.stop()

if __name__ == "__main__":
    asyncio.run(start_scraping())
