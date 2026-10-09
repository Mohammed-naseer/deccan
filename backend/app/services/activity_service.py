import logging
from datetime import datetime, timezone
from app.core.database import get_database

logger = logging.getLogger("uvicorn")

async def log_admin_activity(
    admin_email: str,
    action: str,
    entity: str,
    entity_id: str = None,
    details: str = None
):
    """Record an audit trail log in MongoDB."""
    db = get_database()
    if db is None:
        return
    try:
        doc = {
            "adminEmail": admin_email,
            "action": action,
            "entity": entity,
            "entityId": entity_id,
            "details": details,
            "timestamp": datetime.now(timezone.utc)
        }
        await db.activity_logs.insert_one(doc)
    except Exception as e:
        logger.warning(f"Failed to record activity log: {e}")
