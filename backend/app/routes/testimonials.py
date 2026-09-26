from fastapi import APIRouter, HTTPException, Depends, Query, status
from bson import ObjectId
from datetime import datetime, timezone
from typing import Optional

from app.schemas.api_schemas import TestimonialCreate, TestimonialUpdate, ResponseBase
from app.core.database import get_database
from app.core.security import get_current_admin
from app.services.activity_service import log_admin_activity

router = APIRouter(tags=["Testimonials"])

DEFAULT_TESTIMONIALS = [
    {
        "name": "Ramesh Chandra",
        "city": "Hyderabad",
        "property": "3BHK Apartment · 18th Floor",
        "rating": 5,
        "message": "Excellent service from start to finish. The team came for a free site visit within 2 days of my enquiry, measured everything precisely, and completed the installation in a single day. The invisible grills on my balcony are absolutely seamless.",
        "highlight": "Completed in a single day",
        "photo": None,
        "status": "approved",
        "displayOrder": 1
    },
    {
        "name": "Priya Sharma",
        "city": "Hyderabad",
        "property": "Independent Villa · 2 Floors",
        "rating": 5,
        "message": "We have a 5-year-old and two dogs, so child and pet safety was our top priority. Deccan Space Works installed SS 316 marine grade grills on all 6 windows and the large balcony. The wire tension is rock solid.",
        "highlight": "SS 316 marine grade — rock solid",
        "photo": None,
        "status": "approved",
        "displayOrder": 2
    },
    {
        "name": "Vikram Nair",
        "city": "Hyderabad",
        "property": "2BHK Apartment · 12th Floor",
        "rating": 5,
        "message": "I researched invisible grills for 3 months before deciding. Compared 4 vendors in Hyderabad and Deccan Space Works had the best quality materials and the most transparent pricing. No hidden charges.",
        "highlight": "Most transparent pricing in Hyderabad",
        "photo": None,
        "status": "approved",
        "displayOrder": 3
    }
]

# Public endpoint
@router.get("/api/testimonials", response_model=ResponseBase)
async def get_public_testimonials():
    """Retrieve all approved testimonials."""
    db = get_database()
    if db is None:
        return ResponseBase(success=True, message="Testimonials retrieved", data=DEFAULT_TESTIMONIALS)

    cursor = db.testimonials.find({"status": "approved"}).sort("displayOrder", 1)
    items = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        items.append(doc)

    if len(items) == 0:
        for t in DEFAULT_TESTIMONIALS:
            t_copy = t.copy()
            t_copy["createdAt"] = datetime.now(timezone.utc)
            res = await db.testimonials.insert_one(t_copy)
            t_copy["_id"] = str(res.inserted_id)
            items.append(t_copy)

    return ResponseBase(success=True, message="Testimonials retrieved", data=items)

# Admin endpoints
@router.get("/api/admin/testimonials", response_model=ResponseBase)
async def get_admin_testimonials(current_admin: dict = Depends(get_current_admin)):
    """Admin view all testimonials."""
    db = get_database()
    cursor = db.testimonials.find().sort("displayOrder", 1)
    items = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        items.append(doc)

    if len(items) == 0:
        for t in DEFAULT_TESTIMONIALS:
            t_copy = t.copy()
            t_copy["createdAt"] = datetime.now(timezone.utc)
            res = await db.testimonials.insert_one(t_copy)
            t_copy["_id"] = str(res.inserted_id)
            items.append(t_copy)

    return ResponseBase(success=True, message="Testimonials retrieved", data=items)

@router.post("/api/admin/testimonials", response_model=ResponseBase)
async def create_testimonial(payload: TestimonialCreate, current_admin: dict = Depends(get_current_admin)):
    """Add a new client testimonial."""
    db = get_database()
    doc = payload.model_dump()
    doc["createdAt"] = datetime.now(timezone.utc)

    result = await db.testimonials.insert_one(doc)
    doc["_id"] = str(result.inserted_id)

    await log_admin_activity(
        admin_email=current_admin["sub"],
        action="create",
        entity="testimonial",
        entity_id=doc["_id"],
        details=f"Added testimonial: {payload.name}"
    )

    return ResponseBase(success=True, message="Testimonial added successfully", data=doc)

@router.patch("/api/admin/testimonials/{id}", response_model=ResponseBase)
async def update_testimonial(id: str, payload: TestimonialUpdate, current_admin: dict = Depends(get_current_admin)):
    """Update testimonial content or approval status."""
    db = get_database()
    try:
        obj_id = ObjectId(id)
    except Exception:
        raise HTTPException(status_code=400, detail={"success": False, "message": "Invalid ID format."})

    update_data = {k: v for k, v in payload.model_dump().items() if v is not None}
    res = await db.testimonials.update_one({"_id": obj_id}, {"$set": update_data})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail={"success": False, "message": "Testimonial not found."})

    await log_admin_activity(
        admin_email=current_admin["sub"],
        action="update",
        entity="testimonial",
        entity_id=id,
        details="Updated testimonial"
    )

    return ResponseBase(success=True, message="Testimonial updated successfully")

@router.delete("/api/admin/testimonials/{id}", response_model=ResponseBase)
async def delete_testimonial(id: str, current_admin: dict = Depends(get_current_admin)):
    """Delete a testimonial."""
    db = get_database()
    try:
        obj_id = ObjectId(id)
    except Exception:
        raise HTTPException(status_code=400, detail={"success": False, "message": "Invalid ID format."})

    res = await db.testimonials.delete_one({"_id": obj_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail={"success": False, "message": "Testimonial not found."})

    await log_admin_activity(
        admin_email=current_admin["sub"],
        action="delete",
        entity="testimonial",
        entity_id=id,
        details="Deleted testimonial"
    )

    return ResponseBase(success=True, message="Testimonial deleted successfully")
