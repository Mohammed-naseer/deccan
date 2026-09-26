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

ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"]
MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10 MB
MAX_VIDEO_SIZE = 100 * 1024 * 1024  # 100 MB

async def upload_image_to_cloudinary(file: UploadFile, folder: str = "deccan_space_works/images") -> dict:
    """Validate and upload an image to Cloudinary."""
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail={"success": False, "message": f"Unsupported file type '{file.content_type}'. Only JPG, PNG, WEBP allowed.", "errorCode": "INVALID_FILE_TYPE"}
        )
    
    contents = await file.read()
    if len(contents) > MAX_IMAGE_SIZE:
        raise HTTPException(
            status_code=400,
            detail={"success": False, "message": "File exceeds maximum allowed size of 10MB.", "errorCode": "FILE_TOO_LARGE"}
        )
    
    if not (settings.CLOUDINARY_CLOUD_NAME and settings.CLOUDINARY_API_KEY and settings.CLOUDINARY_API_SECRET):
        # Fallback simulation for local development when keys not provided
        return {
            "secure_url": f"/images/uploads/{file.filename}",
            "public_id": f"local_{file.filename}",
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
            detail={"success": False, "message": f"Unsupported video type '{file.content_type}'. Only MP4, WebM allowed.", "errorCode": "INVALID_VIDEO_TYPE"}
        )
    
    contents = await file.read()
    if len(contents) > MAX_VIDEO_SIZE:
        raise HTTPException(
            status_code=400,
            detail={"success": False, "message": "Video exceeds maximum size of 100MB.", "errorCode": "FILE_TOO_LARGE"}
        )

    if not (settings.CLOUDINARY_CLOUD_NAME and settings.CLOUDINARY_API_KEY and settings.CLOUDINARY_API_SECRET):
        return {
            "secure_url": f"/videos/uploads/{file.filename}",
            "public_id": f"local_{file.filename}",
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
