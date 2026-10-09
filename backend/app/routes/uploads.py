from bson import ObjectId
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, status
from app.schemas.api_schemas import ResponseBase
from app.core.security import get_current_admin
from app.services.cloudinary_service import upload_image_to_cloudinary, upload_video_to_cloudinary, delete_from_cloudinary
from app.services.activity_service import log_admin_activity
from app.core.database import get_database

router = APIRouter(prefix="/api/admin/uploads", tags=["Uploads & Media Library"])

import os

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"}
ALLOWED_IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
ALLOWED_VIDEO_TYPES = {"video/mp4", "video/webm", "video/quicktime"}
ALLOWED_VIDEO_EXTS = {".mp4", ".webm", ".mov"}
MAX_IMAGE_BYTES = 10 * 1024 * 1024   # 10 MB
MAX_VIDEO_BYTES = 50 * 1024 * 1024   # 50 MB

@router.post("/image", response_model=ResponseBase)
async def upload_image_file(file: UploadFile = File(...), current_admin: dict = Depends(get_current_admin)):
    """Upload image to media storage and record in media collection with strict validation."""
    if not file.content_type or file.content_type.lower() not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"success": False, "message": "Invalid image file type. Supported types: JPG, PNG, WEBP, GIF.", "errorCode": "INVALID_FILE_TYPE"}
        )

    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_IMAGE_EXTS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"success": False, "message": f"Unsupported image file extension '{ext}'.", "errorCode": "INVALID_FILE_EXTENSION"}
        )

    res = await upload_image_to_cloudinary(file, folder="deccan_space_works/media")
    
    # Store media item in DB for Media Library
    db = get_database()
    if db is not None:
        media_doc = {
            "name": file.filename,
            "type": "image",
            "url": res["secure_url"],
            "publicId": res.get("public_id"),
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
    """Upload video to media storage and record in media collection with strict validation."""
    if not file.content_type or file.content_type.lower() not in ALLOWED_VIDEO_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"success": False, "message": "Invalid video file type. Supported types: MP4, WebM, QuickTime.", "errorCode": "INVALID_FILE_TYPE"}
        )

    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_VIDEO_EXTS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"success": False, "message": f"Unsupported video file extension '{ext}'.", "errorCode": "INVALID_FILE_EXTENSION"}
        )

    res = await upload_video_to_cloudinary(file, folder="deccan_space_works/media_videos")
    
    db = get_database()
    if db is not None:
        media_doc = {
            "name": file.filename,
            "type": "video",
            "url": res["secure_url"],
            "publicId": res.get("public_id"),
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

@router.delete("/media/{media_id}", response_model=ResponseBase)
async def delete_media_item(media_id: str, current_admin: dict = Depends(get_current_admin)):
    """Delete a media asset reference from database and cleanup external storage if public_id present."""
    db = get_database()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"success": False, "message": "Database unavailable.", "errorCode": "DB_UNAVAILABLE"}
        )

    try:
        obj_id = ObjectId(media_id)
    except Exception:
        raise HTTPException(status_code=400, detail={"success": False, "message": "Invalid media ID format."})

    doc = await db.media.find_one({"_id": obj_id})
    if not doc:
        raise HTTPException(status_code=404, detail={"success": False, "message": "Media item not found."})

    # Cleanup external storage if public_id exists
    public_id = doc.get("publicId")
    if public_id and not str(public_id).startswith("local_"):
        try:
            await delete_from_cloudinary(public_id, resource_type=doc.get("type", "image"))
        except Exception:
            pass

    await db.media.delete_one({"_id": obj_id})

    await log_admin_activity(
        admin_email=current_admin["sub"],
        action="delete",
        entity="media",
        entity_id=media_id,
        details=f"Deleted media asset: {doc.get('name', media_id)}"
    )

    return ResponseBase(success=True, message="Media asset deleted successfully.")
