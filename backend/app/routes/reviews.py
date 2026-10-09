from fastapi import APIRouter, HTTPException, Depends, Query, status
from bson import ObjectId
from datetime import datetime, timezone, timedelta
from typing import Optional
from app.schemas.api_schemas import ReviewCreate, ReviewUpdateStatus, ResponseBase
from app.core.database import get_database
from app.core.security import get_current_admin
from app.services.email_service import send_new_review_email
from app.services.activity_service import log_admin_activity

import re
from app.core.rate_limiter import rate_limit_public_submission

router = APIRouter(tags=["Reviews"])

# Public endpoint
@router.post("/api/reviews", response_model=ResponseBase, dependencies=[Depends(rate_limit_public_submission)])
async def submit_public_review(payload: ReviewCreate):
    """Public customer review submission with abuse rate limiting and idempotency. Default status: pending."""
    db = get_database()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"success": False, "message": "Service unavailable.", "errorCode": "DB_UNAVAILABLE"}
        )

    # 60-second duplicate submission idempotency check
    cutoff = datetime.now(timezone.utc) - timedelta(seconds=60)
    existing = await db.reviews.find_one({
        "name": payload.name.strip(),
        "review": payload.review.strip(),
        "createdAt": {"$gte": cutoff}
    })
    if existing:
        return ResponseBase(
            success=True,
            message="Thank you! Your review has been submitted and is pending verification.",
            data={"id": str(existing["_id"])}
        )
    
    doc = payload.model_dump()
    doc["status"] = "pending"
    doc["createdAt"] = datetime.now(timezone.utc)
    
    result = await db.reviews.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    
    # Notify business owner asynchronously
    try:
        await send_new_review_email(doc)
    except Exception:
        pass
    
    return ResponseBase(
        success=True,
        message="Thank you! Your review has been submitted and is pending verification.",
        data={"id": doc["_id"]}
    )

# Public endpoint: Only approved reviews (PII protected)
@router.get("/api/reviews", response_model=ResponseBase)
async def get_public_reviews():
    """Retrieve approved reviews for public landing page with email/phone/adminNotes redacted for privacy."""
    db = get_database()
    if db is None:
        return ResponseBase(success=True, message="Approved reviews", data=[])
    
    # Explicitly project out private PII fields: email, phone, adminNotes
    cursor = db.reviews.find(
        {"status": "approved"},
        {"email": 0, "phone": 0, "adminNotes": 0}
    ).sort("createdAt", -1).limit(50)
    reviews = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        reviews.append(doc)
    
    return ResponseBase(
        success=True,
        message="Approved reviews retrieved",
        data=reviews
    )

# Admin endpoints: All reviews with filters & pagination
@router.get("/api/admin/reviews", response_model=ResponseBase)
async def get_admin_reviews(
    status: Optional[str] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_admin: dict = Depends(get_current_admin)
):
    """Admin view all reviews with status filters, search, and pagination."""
    db = get_database()
    query = {}
    if status and status != "All":
        if status in {"pending", "approved", "rejected"}:
            query["status"] = status
    if search:
        safe_search = re.escape(search.strip()[:100])
        query["$or"] = [
            {"name": {"$regex": safe_search, "$options": "i"}},
            {"review": {"$regex": safe_search, "$options": "i"}},
            {"email": {"$regex": safe_search, "$options": "i"}},
            {"city": {"$regex": safe_search, "$options": "i"}}
        ]
    
    total = await db.reviews.count_documents(query)
    skip = (page - 1) * limit
    cursor = db.reviews.find(query).sort("createdAt", -1).skip(skip).limit(limit)
    
    items = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        items.append(doc)
        
    return ResponseBase(
        success=True,
        message="Reviews retrieved successfully",
        data={
            "items": items,
            "total": total,
            "page": page,
            "limit": limit,
            "totalPages": (total + limit - 1) // limit if total > 0 else 1
        }
    )

@router.patch("/api/admin/reviews/{id}/approve", response_model=ResponseBase)
async def approve_review(id: str, current_admin: dict = Depends(get_current_admin)):
    """Approve a review so it appears on the public website."""
    db = get_database()
    try:
        obj_id = ObjectId(id)
    except Exception:
        raise HTTPException(status_code=400, detail={"success": False, "message": "Invalid review ID format."})
        
    res = await db.reviews.update_one({"_id": obj_id}, {"$set": {"status": "approved"}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail={"success": False, "message": "Review not found."})
        
    await log_admin_activity(
        admin_email=current_admin["sub"],
        action="approve",
        entity="review",
        entity_id=id,
        details="Approved review"
    )
    return ResponseBase(success=True, message="Review approved successfully.")

@router.patch("/api/admin/reviews/{id}/reject", response_model=ResponseBase)
async def reject_review(id: str, current_admin: dict = Depends(get_current_admin)):
    """Reject a review."""
    db = get_database()
    try:
        obj_id = ObjectId(id)
    except Exception:
        raise HTTPException(status_code=400, detail={"success": False, "message": "Invalid review ID format."})
        
    res = await db.reviews.update_one({"_id": obj_id}, {"$set": {"status": "rejected"}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail={"success": False, "message": "Review not found."})
        
    await log_admin_activity(
        admin_email=current_admin["sub"],
        action="reject",
        entity="review",
        entity_id=id,
        details="Rejected review"
    )
    return ResponseBase(success=True, message="Review marked as rejected.")

@router.delete("/api/admin/reviews/{id}", response_model=ResponseBase)
async def delete_review(id: str, current_admin: dict = Depends(get_current_admin)):
    """Delete a review."""
    db = get_database()
    try:
        obj_id = ObjectId(id)
    except Exception:
        raise HTTPException(status_code=400, detail={"success": False, "message": "Invalid review ID format."})
        
    res = await db.reviews.delete_one({"_id": obj_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail={"success": False, "message": "Review not found."})
        
    await log_admin_activity(
        admin_email=current_admin["sub"],
        action="delete",
        entity="review",
        entity_id=id,
        details="Deleted review"
    )
    return ResponseBase(success=True, message="Review deleted successfully.")
