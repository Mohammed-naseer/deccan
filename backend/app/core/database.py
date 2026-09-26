import logging
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.core.config import settings

logger = logging.getLogger("uvicorn")

class Database:
    client: AsyncIOMotorClient = None
    db: AsyncIOMotorDatabase = None

db_instance = Database()

async def connect_to_mongo():
    try:
        logger.info(f"Connecting to MongoDB at {settings.MONGODB_URI.split('@')[-1] if '@' in settings.MONGODB_URI else 'local host'}...")
        db_instance.client = AsyncIOMotorClient(
            settings.MONGODB_URI,
            serverSelectionTimeoutMS=5000
        )
        db_instance.db = db_instance.client[settings.MONGODB_DATABASE]
        
        # Test connection ping
        await db_instance.db.command("ping")
        logger.info("Successfully connected to MongoDB Atlas database: " + settings.MONGODB_DATABASE)
        
        # Create Indexes for high performance & constraints
        await create_indexes()
    except Exception as e:
        logger.warning(f"MongoDB connection notice: {e}. If MongoDB is not yet running locally or credentials are not yet set, API routes will handle fallback gracefully.")

async def close_mongo_connection():
    if db_instance.client:
        logger.info("Closing MongoDB connection...")
        db_instance.client.close()
        logger.info("MongoDB connection closed.")

def get_database() -> AsyncIOMotorDatabase:
    return db_instance.db

async def create_indexes():
    """Ensure indexes for fast lookup and query optimization."""
    if db_instance.db is None:
        return
    try:
        # Admins index
        await db_instance.db.admins.create_index("email", unique=True)
        # Reviews index
        await db_instance.db.reviews.create_index([("status", 1), ("createdAt", -1)])
        # Site visits index
        await db_instance.db.site_visits.create_index([("status", 1), ("createdAt", -1)])
        await db_instance.db.site_visits.create_index("phoneNumber")
        # Contacts index
        await db_instance.db.contacts.create_index([("status", 1), ("createdAt", -1)])
        # Products index
        await db_instance.db.products.create_index("slug", unique=True)
        await db_instance.db.products.create_index("status")
        # Gallery index
        await db_instance.db.gallery.create_index([("status", 1), ("displayOrder", 1)])
        # Videos index
        await db_instance.db.videos.create_index([("status", 1), ("displayOrder", 1)])
        # Testimonials index
        await db_instance.db.testimonials.create_index([("status", 1), ("displayOrder", 1)])
        # Activity logs index
        await db_instance.db.activity_logs.create_index([("timestamp", -1)])
        logger.info("MongoDB database indexes confirmed.")
    except Exception as err:
        logger.warning(f"Index creation notice: {err}")
