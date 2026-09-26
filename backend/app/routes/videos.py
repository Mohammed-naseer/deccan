from fastapi import APIRouter, HTTPException, Depends, Query, status
from bson import ObjectId
from datetime import datetime, timezone
from typing import Optional

from app.schemas.api_schemas import VideoCreate, VideoUpdate, ResponseBase
from app.core.database import get_database
from app.core.security import get_current_admin
from app.services.cloudinary_service import delete_from_cloudinary
from app.services.activity_service import log_admin_activity

router = APIRouter(tags=["Videos"])

DEFAULT_VIDEOS = [
    {
        "title": "Live Installation Walkthrough",
        "subtitle": "Watch Our Team at Work",
        "description": "See a real invisible grill installation in action — from aluminium track mounting to stainless steel cable tensioning, all performed by our certified Hyderabad team.",
        "category": "Installation",
        "videoUrl": "/videos/install_video_1.mp4",
        "thumbnailUrl": "/images/highrise_view.jpg",
        "tag": "INSTALLATION PROCESS",
        "displayOrder": 1,
        "status": "active"
    },
    {
        "title": "Product Showcase & Finish Quality",
        "subtitle": "Seamless Design, Premium Feel",
        "description": "A close-up walkthrough of the finished grill — observe the nylon melt-coated SS 316 cables, the 27 mm aluminium base track, and the near-invisible look from every angle.",
        "category": "Product Showcase",
        "videoUrl": "/videos/install_video_2.mp4",
        "thumbnailUrl": "/images/living_balcony.jpg",
        "tag": "PRODUCT SHOWCASE",
        "displayOrder": 2,
        "status": "active"
    }
]

# Public endpoint
@router.get("/api/videos", response_model=ResponseBase)
async def get_public_videos():
    """Retrieve active videos for the public explore section."""
    db = get_database()
    if db is None:
        return ResponseBase(success=True, message="Videos retrieved", data=DEFAULT_VIDEOS)

    cursor = db.videos.find({"status": "active"}).sort("displayOrder", 1)
    items = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        items.append(doc)

    if len(items) == 0:
        for v in DEFAULT_VIDEOS:
            v_copy = v.copy()
            v_copy["createdAt"] = datetime.now(timezone.utc)
            res = await db.videos.insert_one(v_copy)
            v_copy["_id"] = str(res.inserted_id)
            items.append(v_copy)

    return ResponseBase(success=True, message="Videos retrieved", data=items)

# Admin endpoints
@router.get("/api/admin/videos", response_model=ResponseBase)
async def get_admin_videos(current_admin: dict = Depends(get_current_admin)):
    """Admin view all videos (active and hidden)."""
    db = get_database()
    cursor = db.videos.find().sort("displayOrder", 1)
    items = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        items.append(doc)

    if len(items) == 0:
        for v in DEFAULT_VIDEOS:
            v_copy = v.copy()
            v_copy["createdAt"] = datetime.now(timezone.utc)
            res = await db.videos.insert_one(v_copy)
            v_copy["_id"] = str(res.inserted_id)
            items.append(v_copy)

    return ResponseBase(success=True, message="Videos retrieved", data=items)

@router.post("/api/admin/videos", response_model=ResponseBase)
async def create_video(payload: VideoCreate, current_admin: dict = Depends(get_current_admin)):
    """Add a new video."""
    db = get_database()
    doc = payload.model_dump()
    doc["createdAt"] = datetime.now(timezone.utc)

    result = await db.videos.insert_one(doc)
    doc["_id"] = str(result.inserted_id)

    await log_admin_activity(
        admin_email=current_admin["sub"],
        action="create",
        entity="video",
        entity_id=doc["_id"],
        details=f"Added video: {payload.title}"
    )

    return ResponseBase(success=True, message="Video added successfully", data=doc)

@router.patch("/api/admin/videos/{id}", response_model=ResponseBase)
async def update_video(id: str, payload: VideoUpdate, current_admin: dict = Depends(get_current_admin)):
    """Update video details."""
    db = get_database()
    try:
        obj_id = ObjectId(id)
    except Exception:
        raise HTTPException(status_code=400, detail={"success": False, "message": "Invalid ID format."})

    update_data = {k: v for k, v in payload.model_dump().items() if v is not None}
    res = await db.videos.update_one({"_id": obj_id}, {"$set": update_data})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail={"success": False, "message": "Video not found."})

    await log_admin_activity(
        admin_email=current_admin["sub"],
        action="update",
        entity="video",
        entity_id=id,
        details="Updated video"
    )

    return ResponseBase(success=True, message="Video updated successfully")

@router.delete("/api/admin/videos/{id}", response_model=ResponseBase)
async def delete_video(id: str, current_admin: dict = Depends(get_current_admin)):
    """Delete video and clean up Cloudinary storage."""
    db = get_database()
    try:
        obj_id = ObjectId(id)
    except Exception:
        raise HTTPException(status_code=400, detail={"success": False, "message": "Invalid ID format."})

    doc = await db.videos.find_one({"_id": obj_id})
    if not doc:
        raise HTTPException(status_code=404, detail={"success": False, "message": "Video not found."})

    if doc.get("publicId"):
        await delete_from_cloudinary(doc["publicId"], resource_type="video")

    await db.videos.delete_one({"_id": obj_id})

    await log_admin_activity(
        admin_email=current_admin["sub"],
        action="delete",
        entity="video",
        entity_id=id,
        details="Deleted video"
    )

    return ResponseBase(success=True, message="Video deleted successfully")
