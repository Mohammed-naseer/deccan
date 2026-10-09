from fastapi import APIRouter, HTTPException, Depends, Query, status
from bson import ObjectId
from datetime import datetime, timezone, timedelta
from typing import Optional

from app.schemas.api_schemas import ContactCreate, ContactUpdateStatus, ConvertContactToSiteVisit, ResponseBase
from app.core.database import get_database
from app.core.security import get_current_admin
from app.services.email_service import send_new_contact_email
import re
from app.core.rate_limiter import rate_limit_public_submission
from app.services.activity_service import log_admin_activity

router = APIRouter(tags=["Contact Enquiries"])

@router.post("/api/contact", response_model=ResponseBase, dependencies=[Depends(rate_limit_public_submission)])
async def submit_public_contact(payload: ContactCreate):
    """Public contact/general enquiry submission with abuse rate limiting and idempotency."""
    db = get_database()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"success": False, "message": "Service unavailable.", "errorCode": "DB_UNAVAILABLE"}
        )

    # 60-second duplicate submission idempotency check
    cutoff = datetime.now(timezone.utc) - timedelta(seconds=60)
    existing = await db.contacts.find_one({
        "phone": payload.phone.strip(),
        "message": payload.message.strip(),
        "createdAt": {"$gte": cutoff}
    })
    if existing:
        return ResponseBase(
            success=True,
            message="Your message has been received. We'll get back to you within 24 hours.",
            data={"id": str(existing["_id"])}
        )

    doc = payload.model_dump()
    doc["status"] = "new"  # new, contacted, in-progress, resolved, closed
    doc["adminNotes"] = None
    doc["createdAt"] = datetime.now(timezone.utc)
    doc["updatedAt"] = datetime.now(timezone.utc)

    result = await db.contacts.insert_one(doc)
    doc["_id"] = str(result.inserted_id)

    # Email notification to owner
    try:
        await send_new_contact_email(doc)
    except Exception:
        pass

    return ResponseBase(
        success=True,
        message="Your message has been received. We'll get back to you within 24 hours.",
        data={"id": doc["_id"]}
    )

@router.get("/api/admin/contacts", response_model=ResponseBase)
async def get_admin_contacts(
    status: Optional[str] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_admin: dict = Depends(get_current_admin)
):
    """Admin view all contact enquiries with search, filtering, and pagination."""
    db = get_database()
    query = {}
    if status and status != "All":
        if status in {"new", "contacted", "in-progress", "resolved", "closed"}:
            query["status"] = status
    if search:
        safe_search = re.escape(search.strip()[:100])
        query["$or"] = [
            {"name": {"$regex": safe_search, "$options": "i"}},
            {"phone": {"$regex": safe_search, "$options": "i"}},
            {"email": {"$regex": safe_search, "$options": "i"}},
            {"city": {"$regex": safe_search, "$options": "i"}},
            {"message": {"$regex": safe_search, "$options": "i"}}
        ]

    total = await db.contacts.count_documents(query)
    skip = (page - 1) * limit
    cursor = db.contacts.find(query).sort("createdAt", -1).skip(skip).limit(limit)

    items = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        items.append(doc)

    return ResponseBase(
        success=True,
        message="Contact enquiries retrieved successfully",
        data={
            "items": items,
            "total": total,
            "page": page,
            "limit": limit,
            "totalPages": (total + limit - 1) // limit if total > 0 else 1
        }
    )

@router.patch("/api/admin/contacts/{id}", response_model=ResponseBase)
async def update_contact_status(
    id: str,
    payload: ContactUpdateStatus,
    current_admin: dict = Depends(get_current_admin)
):
    """Change status, follow-up scheduling, lead quality, and internal notes for an enquiry."""
    db = get_database()
    try:
        obj_id = ObjectId(id)
    except Exception:
        raise HTTPException(status_code=400, detail={"success": False, "message": "Invalid ID format."})

    existing = await db.contacts.find_one({"_id": obj_id})
    if not existing:
        raise HTTPException(status_code=404, detail={"success": False, "message": "Enquiry not found."})

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
    if payload.followUpDate is not None:
        update_data["followUpDate"] = payload.followUpDate
        changes.append(f"Follow-up set to {payload.followUpDate}")
    if payload.followUpNotes is not None:
        update_data["followUpNotes"] = payload.followUpNotes
    if payload.leadQuality is not None:
        update_data["leadQuality"] = payload.leadQuality
        changes.append(f"Priority marked as {payload.leadQuality.upper()}")

    now_iso = datetime.now(timezone.utc).isoformat()
    history_entry = {
        "adminEmail": current_admin["sub"],
        "action": "update",
        "description": "; ".join(changes) if changes else "Lead details saved",
        "timestamp": now_iso
    }

    res = await db.contacts.update_one(
        {"_id": obj_id},
        {"$set": update_data, "$push": {"history": history_entry}}
    )

    await log_admin_activity(
        admin_email=current_admin["sub"],
        action="update_status",
        entity="contact",
        entity_id=id,
        details=f"Contact enquiry updated: {'; '.join(changes) if changes else 'saved'}"
    )

    return ResponseBase(
        success=True,
        message="Contact enquiry updated successfully.",
        data={"id": id, "status": payload.status or existing.get("status")}
    )

@router.post("/api/admin/contacts/{id}/convert-to-site-visit", response_model=ResponseBase)
async def convert_contact_to_site_visit(
    id: str,
    payload: ConvertContactToSiteVisit,
    current_admin: dict = Depends(get_current_admin)
):
    """Convert an existing contact enquiry into an official site visit request with back-link."""
    db = get_database()
    try:
        obj_id = ObjectId(id)
    except Exception:
        raise HTTPException(status_code=400, detail={"success": False, "message": "Invalid ID format."})

    contact = await db.contacts.find_one({"_id": obj_id})
    if not contact:
        raise HTTPException(status_code=404, detail={"success": False, "message": "Enquiry not found."})

    # Prevent accidental duplicate conversion
    if contact.get("linkedSiteVisitId"):
        try:
            existing_sv = await db.site_visits.find_one({"_id": ObjectId(contact["linkedSiteVisitId"])})
            if existing_sv:
                return ResponseBase(
                    success=True,
                    message=f"Enquiry is already converted to site visit ({contact.get('linkedSiteVisitCode')}).",
                    data={
                        "siteVisitId": contact["linkedSiteVisitId"],
                        "trackingCode": contact.get("linkedSiteVisitCode"),
                        "alreadyConverted": True
                    }
                )
        except Exception:
            pass

    sv_doc = {
        "name": contact["name"],
        "phoneNumber": contact["phone"],
        "whatsappNumber": contact.get("phone"),
        "email": contact.get("email"),
        "cityArea": contact.get("city") or "Hyderabad",
        "propertyType": payload.propertyType,
        "windowType": payload.windowType or "Balcony",
        "approximateWindows": payload.approximateWindows,
        "preferredVisitDate": payload.preferredVisitDate,
        "preferredTime": payload.preferredTime,
        "requirementDetails": payload.requirementDetails or contact.get("message"),
        "imageUrls": [],
        "imagePublicIds": [],
        "status": "new",
        "adminNotes": f"Converted from Contact Enquiry (Phone: {contact.get('phone')}). {payload.requirementDetails or ''}".strip(),
        "linkedContactId": id,
        "createdAt": datetime.now(timezone.utc),
        "updatedAt": datetime.now(timezone.utc),
        "history": [
            {
                "adminEmail": current_admin["sub"],
                "action": "converted_from_contact",
                "description": f"Created from Contact Enquiry ID {id}",
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        ]
    }

    sv_res = await db.site_visits.insert_one(sv_doc)
    sv_id = str(sv_res.inserted_id)
    assigned_code = f"DSW-HYD-{sv_id[-4:].upper()}"
    await db.site_visits.update_one({"_id": sv_res.inserted_id}, {"$set": {"trackingCode": assigned_code}})

    now_iso = datetime.now(timezone.utc).isoformat()
    await db.contacts.update_one(
        {"_id": obj_id},
        {
            "$set": {
                "status": "in-progress",
                "linkedSiteVisitId": sv_id,
                "linkedSiteVisitCode": assigned_code,
                "updatedAt": datetime.now(timezone.utc)
            },
            "$push": {
                "history": {
                    "adminEmail": current_admin["sub"],
                    "action": "converted_to_site_visit",
                    "description": f"Converted to Site Visit {assigned_code}",
                    "timestamp": now_iso
                }
            }
        }
    )

    await log_admin_activity(
        admin_email=current_admin["sub"],
        action="convert_to_site_visit",
        entity="contact",
        entity_id=id,
        details=f"Converted enquiry to site visit {assigned_code}"
    )

    return ResponseBase(
        success=True,
        message=f"Site visit request {assigned_code} scheduled and linked successfully.",
        data={"siteVisitId": sv_id, "trackingCode": assigned_code}
    )

@router.delete("/api/admin/contacts/{id}", response_model=ResponseBase)
async def delete_contact(id: str, current_admin: dict = Depends(get_current_admin)):
    """Delete a contact enquiry."""
    db = get_database()
    try:
        obj_id = ObjectId(id)
    except Exception:
        raise HTTPException(status_code=400, detail={"success": False, "message": "Invalid ID format."})

    res = await db.contacts.delete_one({"_id": obj_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail={"success": False, "message": "Enquiry not found."})

    await log_admin_activity(
        admin_email=current_admin["sub"],
        action="delete",
        entity="contact",
        entity_id=id,
        details="Deleted contact enquiry"
    )

    return ResponseBase(success=True, message="Contact enquiry deleted successfully.")
