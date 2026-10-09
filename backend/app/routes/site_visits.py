from fastapi import APIRouter, HTTPException, Depends, Query, UploadFile, File, Form, status
from bson import ObjectId
from datetime import datetime, timezone, timedelta
from typing import Optional, List
import json

from app.schemas.api_schemas import SiteVisitCreate, SiteVisitUpdateStatus, ResponseBase
from app.core.database import get_database
from app.core.security import get_current_admin
from app.services.cloudinary_service import upload_image_to_cloudinary, delete_from_cloudinary
from app.services.email_service import send_new_site_visit_email
from app.services.whatsapp_service import notify_site_visit_whatsapp
from app.services.activity_service import log_admin_activity

import re
from app.core.rate_limiter import rate_limit_public_submission

router = APIRouter(tags=["Free Site Visits"])

# Public endpoint: Handles JSON or Multipart form with image uploads
@router.post("/api/site-visits", response_model=ResponseBase, dependencies=[Depends(rate_limit_public_submission)])
async def submit_site_visit(
    name: str = Form(...),
    phoneNumber: str = Form(...),
    whatsappNumber: Optional[str] = Form(None),
    email: Optional[str] = Form(None),
    cityArea: str = Form(...),
    propertyType: str = Form("Apartment"),
    windowType: Optional[str] = Form("Balcony"),
    approximateWindows: Optional[str] = Form(None),
    preferredVisitDate: Optional[str] = Form(None),
    preferredTime: Optional[str] = Form("Morning (10 AM - 1 PM)"),
    requirementDetails: Optional[str] = Form(None),
    images: List[UploadFile] = File(default=[])
):
    """
    Public Free Site Visit submission with optional uploaded site photos.
    Images are securely uploaded to Cloudinary, URLs stored in MongoDB.
    Includes 60-second idempotency deduplication.
    """
    db = get_database()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"success": False, "message": "Service unavailable.", "errorCode": "DB_UNAVAILABLE"}
        )

    # Input length bounds check
    if len(name.strip()) < 2 or len(cityArea.strip()) < 2 or len(phoneNumber.strip()) < 10:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"success": False, "message": "Name and city area must be at least 2 non-whitespace characters, and phone at least 10 digits.", "errorCode": "VALIDATION_ERROR"}
        )
    if len(name.strip()) > 100 or len(phoneNumber.strip()) > 20 or len(cityArea.strip()) > 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"success": False, "message": "Input field exceeded maximum allowed length.", "errorCode": "INPUT_TOO_LONG"}
        )
    if requirementDetails and len(requirementDetails) > 2000:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"success": False, "message": "Requirement details cannot exceed 2000 characters.", "errorCode": "INPUT_TOO_LONG"}
        )

    # 60-second duplicate submission idempotency check
    cutoff = datetime.now(timezone.utc) - timedelta(seconds=60)
    existing = await db.site_visits.find_one({
        "phoneNumber": phoneNumber.strip(),
        "cityArea": cityArea.strip(),
        "createdAt": {"$gte": cutoff}
    })
    if existing:
        existing_doc_id = str(existing["_id"])
        existing_tracking = existing.get("trackingCode") or f"DSW-HYD-{existing_doc_id[-4:].upper()}"
        return ResponseBase(
            success=True,
            message="Thank you! Your site visit request has been received. Our team will contact you promptly.",
            data={"id": existing_tracking, "docId": existing_doc_id}
        )

    # Process and upload images with strict limits (max 5 photos)
    ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/jpg"}
    valid_images = [img for img in images if img and img.filename]
    if len(valid_images) > 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"success": False, "message": "Maximum 5 site images allowed per request.", "errorCode": "TOO_MANY_FILES"}
        )

    for img in valid_images:
        if img.content_type and img.content_type.lower() not in ALLOWED_IMAGE_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"success": False, "message": f"Unsupported file type for '{img.filename}'. Only JPG, PNG, and WEBP allowed.", "errorCode": "INVALID_FILE_TYPE"}
            )

    image_urls = []
    image_public_ids = []
    
    for img in valid_images:
        try:
            upload_res = await upload_image_to_cloudinary(img, folder="deccan_space_works/site_visits")
            image_urls.append(upload_res["secure_url"])
            if upload_res.get("public_id"):
                image_public_ids.append(upload_res["public_id"])
        except HTTPException:
            raise
        except Exception:
            pass

    doc = {
        "name": name.strip(),
        "phoneNumber": phoneNumber.strip(),
        "whatsappNumber": whatsappNumber.strip() if whatsappNumber else None,
        "email": email.strip() if email else None,
        "cityArea": cityArea.strip(),
        "propertyType": propertyType,
        "windowType": windowType,
        "approximateWindows": approximateWindows,
        "preferredVisitDate": preferredVisitDate,
        "preferredTime": preferredTime,
        "requirementDetails": requirementDetails,
        "imageUrls": image_urls,
        "imagePublicIds": image_public_ids,
        "status": "new",  # new, contacted, scheduled, completed, cancelled
        "adminNotes": None,
        "createdAt": datetime.now(timezone.utc),
        "updatedAt": datetime.now(timezone.utc)
    }

    result = await db.site_visits.insert_one(doc)
    doc_id = str(result.inserted_id)
    doc["_id"] = doc_id

    # Format Hyderabad tracking ID e.g. DSW-HYD-5821
    assigned_id = f"DSW-HYD-{doc_id[-4:].upper()}"
    await db.site_visits.update_one({"_id": result.inserted_id}, {"$set": {"trackingCode": assigned_id}})

    # Trigger transactional email to business owner
    try:
        await send_new_site_visit_email(doc, image_urls)
    except Exception:
        pass

    # Trigger official WhatsApp alert if configured
    try:
        await notify_site_visit_whatsapp(name, phoneNumber, cityArea)
    except Exception:
        pass

    return ResponseBase(
        success=True,
        message="Thank you! Your site visit request has been received. Our team will contact you promptly.",
        data={"id": assigned_id, "docId": doc_id}
    )

# Admin endpoints: Query all site visits with filters, search, and pagination
@router.get("/api/admin/site-visits", response_model=ResponseBase)
async def get_admin_site_visits(
    status: Optional[str] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_admin: dict = Depends(get_current_admin)
):
    """Admin view all site visit requests with search and status filters."""
    db = get_database()
    query = {}
    if status and status != "All":
        if status in {"new", "contacted", "scheduled", "completed", "cancelled"}:
            query["status"] = status
    if search:
        safe_search = re.escape(search.strip()[:100])
        query["$or"] = [
            {"name": {"$regex": safe_search, "$options": "i"}},
            {"phoneNumber": {"$regex": safe_search, "$options": "i"}},
            {"email": {"$regex": safe_search, "$options": "i"}},
            {"cityArea": {"$regex": safe_search, "$options": "i"}},
            {"trackingCode": {"$regex": safe_search, "$options": "i"}}
        ]

    total = await db.site_visits.count_documents(query)
    skip = (page - 1) * limit
    cursor = db.site_visits.find(query).sort("createdAt", -1).skip(skip).limit(limit)

    items = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        items.append(doc)

    return ResponseBase(
        success=True,
        message="Site visits retrieved successfully",
        data={
            "items": items,
            "total": total,
            "page": page,
            "limit": limit,
            "totalPages": (total + limit - 1) // limit if total > 0 else 1
        }
    )

@router.get("/api/admin/site-visits/{id}", response_model=ResponseBase)
async def get_site_visit_detail(id: str, current_admin: dict = Depends(get_current_admin)):
    """Get complete details for a single site visit request."""
    db = get_database()
    try:
        obj_id = ObjectId(id)
    except Exception:
        raise HTTPException(status_code=400, detail={"success": False, "message": "Invalid ID format."})

    doc = await db.site_visits.find_one({"_id": obj_id})
    if not doc:
        raise HTTPException(status_code=404, detail={"success": False, "message": "Site visit request not found."})
    doc["_id"] = str(doc["_id"])
    return ResponseBase(success=True, message="Site visit details retrieved", data=doc)

@router.patch("/api/admin/site-visits/{id}", response_model=ResponseBase)
async def update_site_visit_status(
    id: str,
    payload: SiteVisitUpdateStatus,
    current_admin: dict = Depends(get_current_admin)
):
    """Update site visit status, appointment scheduling, quote, technician, and internal notes."""
    db = get_database()
    try:
        obj_id = ObjectId(id)
    except Exception:
        raise HTTPException(status_code=400, detail={"success": False, "message": "Invalid ID format."})

    existing = await db.site_visits.find_one({"_id": obj_id})
    if not existing:
        raise HTTPException(status_code=404, detail={"success": False, "message": "Site visit request not found."})

    update_data = {
        "updatedAt": datetime.now(timezone.utc)
    }
    changes = []
    if payload.status:
        update_data["status"] = payload.status
        if payload.status != existing.get("status"):
            changes.append(f"Status changed from {existing.get('status')} to {payload.status}")
    if payload.adminNotes is not None:
        update_data["adminNotes"] = payload.adminNotes
        changes.append("Internal notes updated")
    if payload.scheduledDate is not None:
        update_data["scheduledDate"] = payload.scheduledDate
        changes.append(f"Confirmed visit date: {payload.scheduledDate}")
    if payload.scheduledTime is not None:
        update_data["scheduledTime"] = payload.scheduledTime
        changes.append(f"Confirmed time: {payload.scheduledTime}")
    if payload.assignedTechnician is not None:
        update_data["assignedTechnician"] = payload.assignedTechnician
        changes.append(f"Engineer assigned: {payload.assignedTechnician}")
    if payload.quoteAmount is not None:
        update_data["quoteAmount"] = payload.quoteAmount
        changes.append(f"Quote recorded: {payload.quoteAmount}")
    if payload.sqftEstimated is not None:
        update_data["sqftEstimated"] = payload.sqftEstimated
        changes.append(f"Area: {payload.sqftEstimated}")
    if payload.followUpDate is not None:
        update_data["followUpDate"] = payload.followUpDate
        changes.append(f"Follow-up set to {payload.followUpDate}")
    if payload.followUpNotes is not None:
        update_data["followUpNotes"] = payload.followUpNotes

    now_iso = datetime.now(timezone.utc).isoformat()
    history_entry = {
        "adminEmail": current_admin["sub"],
        "action": "update",
        "description": "; ".join(changes) if changes else "Site visit details updated",
        "timestamp": now_iso
    }

    res = await db.site_visits.update_one(
        {"_id": obj_id},
        {"$set": update_data, "$push": {"history": history_entry}}
    )

    await log_admin_activity(
        admin_email=current_admin["sub"],
        action="update_status",
        entity="site_visit",
        entity_id=id,
        details=f"Site visit updated: {'; '.join(changes) if changes else 'saved'}"
    )

    return ResponseBase(
        success=True,
        message="Site visit updated successfully.",
        data={"id": id, "status": payload.status or existing.get("status")}
    )

@router.delete("/api/admin/site-visits/{id}", response_model=ResponseBase)
async def delete_site_visit(id: str, current_admin: dict = Depends(get_current_admin)):
    """Delete a site visit enquiry and cleanup any associated Cloudinary images."""
    db = get_database()
    try:
        obj_id = ObjectId(id)
    except Exception:
        raise HTTPException(status_code=400, detail={"success": False, "message": "Invalid ID format."})

    doc = await db.site_visits.find_one({"_id": obj_id})
    if not doc:
        raise HTTPException(status_code=404, detail={"success": False, "message": "Site visit request not found."})

    # Delete all associated Cloudinary images
    public_ids = doc.get("imagePublicIds", [])
    for pid in public_ids:
        await delete_from_cloudinary(pid, resource_type="image")

    await db.site_visits.delete_one({"_id": obj_id})

    await log_admin_activity(
        admin_email=current_admin["sub"],
        action="delete",
        entity="site_visit",
        entity_id=id,
        details="Deleted site visit request and associated media"
    )

    return ResponseBase(success=True, message="Site visit request and associated media deleted successfully.")
