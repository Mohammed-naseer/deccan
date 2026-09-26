from fastapi import APIRouter, HTTPException, Depends, Query, status
from bson import ObjectId
from datetime import datetime, timezone
from typing import Optional

from app.schemas.api_schemas import ContactCreate, ContactUpdateStatus, ResponseBase
from app.core.database import get_database
from app.core.security import get_current_admin
from app.services.email_service import send_new_contact_email
from app.services.activity_service import log_admin_activity

router = APIRouter(tags=["Contact Enquiries"])

@router.post("/api/contact", response_model=ResponseBase)
async def submit_public_contact(payload: ContactCreate):
    """Public contact/general enquiry submission."""
    db = get_database()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"success": False, "message": "Service unavailable.", "errorCode": "DB_UNAVAILABLE"}
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
        query["status"] = status
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"phone": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
            {"city": {"$regex": search, "$options": "i"}},
            {"message": {"$regex": search, "$options": "i"}}
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
    """Change status and internal notes for an enquiry."""
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

    res = await db.contacts.update_one({"_id": obj_id}, {"$set": update_data})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail={"success": False, "message": "Enquiry not found."})

    await log_admin_activity(
        admin_email=current_admin["sub"],
        action="update_status",
        entity="contact",
        entity_id=id,
        details=f"Contact status updated to {payload.status}"
    )

    return ResponseBase(success=True, message=f"Contact enquiry updated to {payload.status}.")

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
