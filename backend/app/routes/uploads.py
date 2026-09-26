from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from app.schemas.api_schemas import ResponseBase
from app.core.security import get_current_admin
from app.services.cloudinary_service import upload_image_to_cloudinary, upload_video_to_cloudinary, delete_from_cloudinary
from app.services.activity_service import log_admin_activity
from app.core.database import get_database

router = APIRouter(prefix="/api/admin/uploads", tags=["Uploads & Media Library"])

@router.post("/image", response_model=ResponseBase)
async def upload_image_file(file: UploadFile = File(...), current_admin: dict = Depends(get_current_admin)):
    """Upload image to Cloudinary and record in media collection."""
    res = await upload_image_to_cloudinary(file, folder="deccan_space_works/media")
    
    # Store media item in DB for Media Library
    db = get_database()
    if db is not None:
        media_doc = {
            "name": file.filename,
            "type": "image",
            "url": res["secure_url"],
            "publicId": res["public_id"],
            "size": res.get("bytes", 0),
            "format": res.get("format", "jpg")
        }
        await db.media.insert_one(media_doc)

    await log_admin_activity(
        admin_email=current_admin["sub"],
        action="upload",
        entity="media",
        details=f"Uploaded image: {file.filename}"
    )

    return ResponseBase(
        success=True,
        message="Image uploaded successfully",
        data=res
    )

@router.post("/video", response_model=ResponseBase)
async def upload_video_file(file: UploadFile = File(...), current_admin: dict = Depends(get_current_admin)):
    """Upload video to Cloudinary and record in media collection."""
    res = await upload_video_to_cloudinary(file, folder="deccan_space_works/media_videos")
    
    db = get_database()
    if db is not None:
        media_doc = {
            "name": file.filename,
            "type": "video",
            "url": res["secure_url"],
            "publicId": res["public_id"],
            "size": res.get("bytes", 0),
            "format": res.get("format", "mp4")
        }
        await db.media.insert_one(media_doc)

    await log_admin_activity(
        admin_email=current_admin["sub"],
        action="upload",
        entity="media",
        details=f"Uploaded video: {file.filename}"
    )

    return ResponseBase(
        success=True,
        message="Video uploaded successfully",
        data=res
    )

@router.get("/media", response_model=ResponseBase)
async def get_media_library(current_admin: dict = Depends(get_current_admin)):
    """Retrieve all uploaded media for the Admin Media Library."""
    db = get_database()
    if db is None:
        return ResponseBase(success=True, message="Media retrieved", data=[])
    
    cursor = db.media.find().sort("_id", -1).limit(100)
    items = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        items.append(doc)
        
    return ResponseBase(success=True, message="Media library items retrieved", data=items)
