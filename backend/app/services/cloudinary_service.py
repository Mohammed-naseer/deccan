import logging
import cloudinary
import cloudinary.uploader
from fastapi import UploadFile, HTTPException
from app.core.config import settings

logger = logging.getLogger("uvicorn")

# Configure Cloudinary if credentials are present
if settings.CLOUDINARY_CLOUD_NAME and settings.CLOUDINARY_API_KEY and settings.CLOUDINARY_API_SECRET:
    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
        secure=True
    )
    logger.info("Cloudinary SDK configured.")
else:
    logger.warning("Cloudinary credentials not set in environment. Uploads will run in mock/local fallback mode until configured.")

import os
import re

ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"]
ALLOWED_IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"]
ALLOWED_VIDEO_EXTS = {".mp4", ".webm", ".mov"}
MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10 MB
MAX_VIDEO_SIZE = 50 * 1024 * 1024  # 50 MB

def _sanitize_filename(filename: str) -> str:
    """Sanitize filename to prevent path traversal and shell injection."""
    base = os.path.basename(filename or "file")
    clean = re.sub(r"[^\w\.-]", "_", base)
    return clean[:100]

async def upload_image_to_cloudinary(file: UploadFile, folder: str = "deccan_space_works/images") -> dict:
    """Validate and upload an image to Cloudinary."""
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail={"success": False, "message": f"Unsupported file type '{file.content_type}'. Only JPG, PNG, WEBP allowed.", "errorCode": "INVALID_FILE_TYPE"}
        )
    
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_IMAGE_EXTS:
        raise HTTPException(
            status_code=400,
            detail={"success": False, "message": f"Unsupported image extension '{ext}'. Only .jpg, .jpeg, .png, .webp allowed.", "errorCode": "INVALID_FILE_EXTENSION"}
        )

    contents = await file.read()
    if not contents or len(contents) == 0:
        raise HTTPException(
            status_code=400,
            detail={"success": False, "message": "Uploaded image file cannot be empty.", "errorCode": "EMPTY_FILE"}
        )

    if len(contents) > MAX_IMAGE_SIZE:
        raise HTTPException(
            status_code=400,
            detail={"success": False, "message": "File exceeds maximum allowed size of 10MB.", "errorCode": "FILE_TOO_LARGE"}
        )
    
    safe_name = _sanitize_filename(file.filename)
    if not (settings.CLOUDINARY_CLOUD_NAME and settings.CLOUDINARY_API_KEY and settings.CLOUDINARY_API_SECRET):
        # Fallback simulation for local development when keys not provided
        return {
            "secure_url": f"/images/uploads/{safe_name}",
            "public_id": f"local_{safe_name}",
            "format": file.content_type.split("/")[-1],
            "bytes": len(contents)
        }
    
    try:
        response = cloudinary.uploader.upload(
            contents,
            folder=folder,
            resource_type="image"
        )
        return {
            "secure_url": response.get("secure_url"),
            "public_id": response.get("public_id"),
            "format": response.get("format"),
            "bytes": response.get("bytes")
        }
    except Exception as e:
        logger.error(f"Cloudinary upload error: {e}")
        raise HTTPException(
            status_code=500,
            detail={"success": False, "message": f"Failed to upload image to media storage: {str(e)}", "errorCode": "UPLOAD_ERROR"}
        )

async def upload_video_to_cloudinary(file: UploadFile, folder: str = "deccan_space_works/videos") -> dict:
    """Validate and upload a video to Cloudinary."""
    if file.content_type not in ALLOWED_VIDEO_TYPES:
        raise HTTPException(
            status_code=400,
            detail={"success": False, "message": f"Unsupported video type '{file.content_type}'. Only MP4, WebM, QuickTime allowed.", "errorCode": "INVALID_VIDEO_TYPE"}
        )
    
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_VIDEO_EXTS:
        raise HTTPException(
            status_code=400,
            detail={"success": False, "message": f"Unsupported video extension '{ext}'. Only .mp4, .webm, .mov allowed.", "errorCode": "INVALID_FILE_EXTENSION"}
        )

    contents = await file.read()
    if not contents or len(contents) == 0:
        raise HTTPException(
            status_code=400,
            detail={"success": False, "message": "Uploaded video file cannot be empty.", "errorCode": "EMPTY_FILE"}
        )

    if len(contents) > MAX_VIDEO_SIZE:
        raise HTTPException(
            status_code=400,
            detail={"success": False, "message": "Video exceeds maximum size of 50MB.", "errorCode": "FILE_TOO_LARGE"}
        )

    safe_name = _sanitize_filename(file.filename)
    if not (settings.CLOUDINARY_CLOUD_NAME and settings.CLOUDINARY_API_KEY and settings.CLOUDINARY_API_SECRET):
        return {
            "secure_url": f"/videos/uploads/{safe_name}",
            "public_id": f"local_{safe_name}",
            "format": file.content_type.split("/")[-1],
            "bytes": len(contents)
        }

    try:
        response = cloudinary.uploader.upload_large(
            contents,
            folder=folder,
            resource_type="video"
        )
        return {
            "secure_url": response.get("secure_url"),
            "public_id": response.get("public_id"),
            "format": response.get("format"),
            "bytes": response.get("bytes"),
            "thumbnail_url": response.get("secure_url", "").replace(".mp4", ".jpg")
        }
    except Exception as e:
        logger.error(f"Cloudinary video upload error: {e}")
        raise HTTPException(
            status_code=500,
            detail={"success": False, "message": f"Failed to upload video to media storage: {str(e)}", "errorCode": "VIDEO_UPLOAD_ERROR"}
        )

async def delete_from_cloudinary(public_id: str, resource_type: str = "image") -> bool:
    """Delete asset from Cloudinary."""
    if not (settings.CLOUDINARY_CLOUD_NAME and settings.CLOUDINARY_API_KEY and settings.CLOUDINARY_API_SECRET):
        return True
    try:
        res = cloudinary.uploader.destroy(public_id, resource_type=resource_type)
        return res.get("result") in ["ok", "not found"]
    except Exception as e:
        logger.error(f"Cloudinary deletion error: {e}")
        return False
