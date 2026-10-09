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
        if not settings.MONGODB_URI or not settings.MONGODB_URI.strip():
            logger.warning("MongoDB URI is not set in backend/.env. Database will run in offline/fallback mode until MONGODB_URI is configured.")
            db_instance.client = None
            db_instance.db = None
            return

        host_info = settings.MONGODB_URI.split("@")[-1].split("?")[0] if "@" in settings.MONGODB_URI else "local host"
        logger.info(f"Connecting to MongoDB at {host_info}...")

        motor_kwargs = {
            "serverSelectionTimeoutMS": 5000,
            "connectTimeoutMS": 5000,
            "socketTimeoutMS": 10000,
            "maxPoolSize": 50,
            "minPoolSize": 5,
            "retryWrites": True,
            "retryReads": True,
        }
        try:
            import certifi
            motor_kwargs["tlsCAFile"] = certifi.where()
        except Exception:
            pass

        client = AsyncIOMotorClient(
            settings.MONGODB_URI.strip(),
            **motor_kwargs
        )
        # Test connection ping
        await client[settings.MONGODB_DATABASE].command("ping")
        db_instance.client = client
        db_instance.db = client[settings.MONGODB_DATABASE]
        logger.info(f"Successfully connected to MongoDB database: {settings.MONGODB_DATABASE}")
        
        # Create Indexes for high performance & constraints
        await create_indexes()
    except Exception as e:
        db_instance.client = None
        db_instance.db = None
        logger.warning(f"MongoDB connection notice: {e}. If MongoDB is not yet running locally or credentials are not yet set, API routes will handle fallback gracefully.")

async def close_mongo_connection():
    if db_instance.client:
        logger.info("Closing MongoDB connection...")
        db_instance.client.close()
        logger.info("MongoDB connection closed.")

def get_database() -> AsyncIOMotorDatabase:
    return db_instance.db

async def ping_database() -> bool:
    """Verify live MongoDB connection health with bounded timeout."""
    if db_instance.db is None or db_instance.client is None:
        return False
    try:
        await db_instance.db.command("ping")
        return True
    except Exception as err:
        logger.warning(f"Database health ping failed: {err}")
        return False

async def create_indexes():
    """Ensure indexes for fast lookup, deduplication, and query optimization."""
    if db_instance.db is None:
        return
    try:
        # Admins index
        await db_instance.db.admins.create_index("email", unique=True)
        # Reviews index
        await db_instance.db.reviews.create_index([("status", 1), ("createdAt", -1)])
        await db_instance.db.reviews.create_index([("name", 1), ("createdAt", -1)])
        # Site visits index (including deduplication compound index)
        await db_instance.db.site_visits.create_index([("status", 1), ("createdAt", -1)])
        await db_instance.db.site_visits.create_index([("phoneNumber", 1), ("createdAt", -1)])
        await db_instance.db.site_visits.create_index("scheduledDate")
        await db_instance.db.site_visits.create_index("followUpDate")
        # Contacts index (including deduplication compound index)
        await db_instance.db.contacts.create_index([("status", 1), ("createdAt", -1)])
        await db_instance.db.contacts.create_index([("phone", 1), ("createdAt", -1)])
        await db_instance.db.contacts.create_index("followUpDate")
        # Products index
        await db_instance.db.products.create_index("slug", unique=True)
        await db_instance.db.products.create_index("status")
        # Gallery index
        await db_instance.db.gallery.create_index([("status", 1), ("displayOrder", 1)])
        # Videos index
        await db_instance.db.videos.create_index([("status", 1), ("displayOrder", 1)])
        # Testimonials index
        await db_instance.db.testimonials.create_index([("status", 1), ("displayOrder", 1)])
        # Service areas index
        await db_instance.db.service_areas.create_index([("isActive", 1), ("displayOrder", 1)])
        # Site visits trackingCode index
        await db_instance.db.site_visits.create_index("trackingCode", sparse=True)
        # Activity logs index
        await db_instance.db.activity_logs.create_index([("timestamp", -1)])
        logger.info("MongoDB database indexes confirmed.")
    except Exception as err:
        logger.warning(f"Index creation notice: {err}")
