from fastapi import APIRouter, HTTPException, Depends, status
from bson import ObjectId
from datetime import datetime, timezone
import html

from app.schemas.api_schemas import WebsiteContentUpdate, ResponseBase
from app.core.database import get_database
from app.core.security import get_current_admin
from app.services.activity_service import log_admin_activity

router = APIRouter(tags=["Website Content & Settings"])

DEFAULT_CONTENT = {
    "section": "general",
    "heroHeading": "Upgrade Your Home With Smart & Stylish Solutions",
    "heroSubtitle": "Premium Home Safety & Space Management Services",
    "heroDescription": "Invisible Grills • Cloth Hangers • Mosquito Mesh • UPVC Windows • Shoe Racks • Security Screen Doors",
    "ctaText": "Get a Free Site Visit",
    "installationCount": "8,000+",
    "customerSatisfaction": "100%",
    "yearsExperience": "5+ Years",
    "companyDescription": "Delivering dependable space management and architectural protection for modern living in Hyderabad.",
    "contactPhone": "+91 9100720137",
    "contactWhatsapp": "919100720137",
    "contactEmail": "Deccanspaceworks@gmail.com",
    "instagramUrl": "https://instagram.com/deccan_space_works",
    "facebookUrl": "https://facebook.com/deccanspaceworks",
    "youtubeUrl": "https://youtube.com/@deccanspaceworks",
    "googleMapsUrl": "https://maps.google.com"
}

# Public endpoint
@router.get("/api/content", response_model=ResponseBase)
async def get_public_content():
    """Retrieve public website copy, hero texts, stats, and contact info."""
    db = get_database()
    if db is None:
        return ResponseBase(success=True, message="Content retrieved", data=DEFAULT_CONTENT)

    doc = await db.website_content.find_one({"section": "general"})
    if not doc:
        doc = DEFAULT_CONTENT.copy()
        doc["updatedAt"] = datetime.now(timezone.utc)
        res = await db.website_content.insert_one(doc)
        doc["_id"] = str(res.inserted_id)
    else:
        doc["_id"] = str(doc["_id"])

    return ResponseBase(success=True, message="Website content retrieved", data=doc)

# Admin endpoints
@router.get("/api/admin/content", response_model=ResponseBase)
async def get_admin_content(current_admin: dict = Depends(get_current_admin)):
    """Admin view editable website content."""
    db = get_database()
    doc = await db.website_content.find_one({"section": "general"})
    if not doc:
        doc = DEFAULT_CONTENT.copy()
        doc["updatedAt"] = datetime.now(timezone.utc)
        res = await db.website_content.insert_one(doc)
        doc["_id"] = str(res.inserted_id)
    else:
        doc["_id"] = str(doc["_id"])
    return ResponseBase(success=True, message="Website content retrieved", data=doc)

@router.patch("/api/admin/content", response_model=ResponseBase)
async def update_admin_content(payload: WebsiteContentUpdate, current_admin: dict = Depends(get_current_admin)):
    """Update website content, statistics (e.g. 8,000+ installations), and business contact info."""
    db = get_database()
    
    # Sanitize string inputs to prevent XSS / HTML injection
    raw_data = payload.model_dump()
    update_data = {}
    for k, v in raw_data.items():
        if v is not None:
            if isinstance(v, str):
                update_data[k] = html.escape(v.strip())
            else:
                update_data[k] = v

    update_data["updatedAt"] = datetime.now(timezone.utc)

    await db.website_content.update_one(
        {"section": "general"},
        {"$set": update_data},
        upsert=True
    )

    await log_admin_activity(
        admin_email=current_admin["sub"],
        action="update",
        entity="website_content",
        entity_id="general",
        details="Updated website content & statistics"
    )

    return ResponseBase(success=True, message="Website content updated successfully.")
