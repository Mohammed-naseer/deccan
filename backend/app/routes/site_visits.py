from fastapi import APIRouter, HTTPException, Depends, Query, UploadFile, File, Form, status
from bson import ObjectId
from datetime import datetime, timezone
from typing import Optional, List
import json

from app.schemas.api_schemas import SiteVisitCreate, SiteVisitUpdateStatus, ResponseBase
from app.core.database import get_database
from app.core.security import get_current_admin
from app.services.cloudinary_service import upload_image_to_cloudinary, delete_from_cloudinary
from app.services.email_service import send_new_site_visit_email
from app.services.whatsapp_service import notify_site_visit_whatsapp
from app.services.activity_service import log_admin_activity

router = APIRouter(tags=["Free Site Visits"])

# Public endpoint: Handles JSON or Multipart form with image uploads
@router.post("/api/site-visits", response_model=ResponseBase)
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
    """
    db = get_database()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"success": False, "message": "Service unavailable.", "errorCode": "DB_UNAVAILABLE"}
        )

    # Process and upload images to Cloudinary
    image_urls = []
    image_public_ids = []
    
    for img in images:
        if img and img.filename:
            try:
                upload_res = await upload_image_to_cloudinary(img, folder="deccan_space_works/site_visits")
                image_urls.append(upload_res["secure_url"])
                image_public_ids.append(upload_res["public_id"])
            except Exception as e:
                # Log upload error and continue with other files
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
        query["status"] = status
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"phoneNumber": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
            {"cityArea": {"$regex": search, "$options": "i"}},
            {"trackingCode": {"$regex": search, "$options": "i"}}
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
    """Change site visit status (new, contacted, scheduled, completed, cancelled) and update notes."""
    db = get_database()
    try:
        obj_id = ObjectId(id)
    except Exception:
        raise HTTPException(status_code=400, detail={"success": False, "message": "Invalid ID format."})

    update_data = {
        "status": payload.status,
        "updatedAt": datetime.now(timezone.utc)
    }
    if payload.adminNotes is not None:
        update_data["adminNotes"] = payload.adminNotes

    res = await db.site_visits.update_one({"_id": obj_id}, {"$set": update_data})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail={"success": False, "message": "Site visit request not found."})

    await log_admin_activity(
        admin_email=current_admin["sub"],
        action="update_status",
        entity="site_visit",
        entity_id=id,
        details=f"Status changed to {payload.status}"
    )

    return ResponseBase(success=True, message=f"Site visit status updated to {payload.status}.")

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
