from fastapi import APIRouter, Depends
from datetime import datetime, timezone
from app.schemas.api_schemas import ResponseBase
from app.core.database import get_database
from app.core.security import get_current_admin

router = APIRouter(prefix="/api/admin/dashboard", tags=["Admin Dashboard"])

@router.get("", response_model=ResponseBase)
async def get_admin_dashboard_metrics(current_admin: dict = Depends(get_current_admin)):
    """
    Consolidated Dashboard KPIs and Activity Feed:
    - Total reviews & pending count
    - Total site visit requests & upcoming scheduled count
    - Total contact enquiries & new enquiries count
    - Total products, gallery images, videos
    - Recent enquiries & activity log
    """
    db = get_database()
    if db is None:
        return ResponseBase(
            success=True,
            message="Dashboard metrics (standby)",
            data={
                "metrics": {
                    "totalReviews": 0,
                    "pendingReviews": 0,
                    "totalSiteVisits": 0,
                    "newSiteVisits": 0,
                    "scheduledSiteVisits": 0,
                    "totalContacts": 0,
                    "newContacts": 0,
                    "totalProducts": 6,
                    "totalGallery": 8,
                    "totalVideos": 2
                },
                "recentSiteVisits": [],
                "recentContacts": [],
                "recentActivity": []
            }
        )

    # Calculate counts concurrently
    total_reviews = await db.reviews.count_documents({})
    pending_reviews = await db.reviews.count_documents({"status": "pending"})
    
    total_site_visits = await db.site_visits.count_documents({})
    new_site_visits = await db.site_visits.count_documents({"status": "new"})
    scheduled_site_visits = await db.site_visits.count_documents({"status": "scheduled"})
    
    total_contacts = await db.contacts.count_documents({})
    new_contacts = await db.contacts.count_documents({"status": "new"})
    
    total_products = await db.products.count_documents({})
    total_gallery = await db.gallery.count_documents({})
    total_videos = await db.videos.count_documents({})

    # Recent site visits
    site_cursor = db.site_visits.find().sort("createdAt", -1).limit(6)
    recent_visits = []
    async for doc in site_cursor:
        doc["_id"] = str(doc["_id"])
        recent_visits.append(doc)

    # Recent contacts
    contact_cursor = db.contacts.find().sort("createdAt", -1).limit(6)
    recent_contacts = []
    async for doc in contact_cursor:
        doc["_id"] = str(doc["_id"])
        recent_contacts.append(doc)

    # Recent audit activity logs
    activity_cursor = db.activity_logs.find().sort("timestamp", -1).limit(10)
    recent_activity = []
    async for doc in activity_cursor:
        doc["_id"] = str(doc["_id"])
        recent_activity.append(doc)

    return ResponseBase(
        success=True,
        message="Dashboard data retrieved",
        data={
            "metrics": {
                "totalReviews": total_reviews,
                "pendingReviews": pending_reviews,
                "totalSiteVisits": total_site_visits,
                "newSiteVisits": new_site_visits,
                "scheduledSiteVisits": scheduled_site_visits,
                "totalContacts": total_contacts,
                "newContacts": new_contacts,
                "totalProducts": total_products or 6,
                "totalGallery": total_gallery or 8,
                "totalVideos": total_videos or 2,
                "newEnquiries": new_site_visits + new_contacts
            },
            "recentSiteVisits": recent_visits,
            "recentContacts": recent_contacts,
            "recentActivity": recent_activity
        }
    )

@router.get("/activity", response_model=ResponseBase)
async def get_admin_activity_logs(current_admin: dict = Depends(get_current_admin)):
    """Retrieve full audit logs for admin activity page."""
    db = get_database()
    if db is None:
        return ResponseBase(success=True, message="Activity logs", data=[])
    cursor = db.activity_logs.find().sort("timestamp", -1).limit(100)
    items = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        items.append(doc)
    return ResponseBase(success=True, message="Activity logs retrieved", data=items)
