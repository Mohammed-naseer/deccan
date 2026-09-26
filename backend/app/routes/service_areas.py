from fastapi import APIRouter, HTTPException, Depends, Query, status
from bson import ObjectId
from datetime import datetime, timezone

from app.schemas.api_schemas import ServiceAreaCreate, ServiceAreaUpdate, ResponseBase
from app.core.database import get_database
from app.core.security import get_current_admin
from app.services.activity_service import log_admin_activity

router = APIRouter(tags=["Service Areas"])

DEFAULT_SERVICE_AREAS = [
    "Gachibowli", "Madhapur", "Kondapur", "Manikonda", "Jubilee Hills",
    "Banjara Hills", "Hitech City", "Kukatpally", "Ameerpet", "Secunderabad",
    "Kokapet", "Financial District", "Tellapur", "Nallagandla", "Miyapur",
    "All Areas in Hyderabad"
]

# Public endpoint
@router.get("/api/service-areas", response_model=ResponseBase)
async def get_public_service_areas():
    """Retrieve active Hyderabad service areas for public display."""
    db = get_database()
    if db is None:
        return ResponseBase(success=True, message="Service areas retrieved", data=[{"name": a, "isActive": True} for a in DEFAULT_SERVICE_AREAS])

    cursor = db.service_areas.find({"isActive": True}).sort("displayOrder", 1)
    items = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        items.append(doc)

    if len(items) == 0:
        for idx, area in enumerate(DEFAULT_SERVICE_AREAS):
            doc = {
                "name": area,
                "district": "Hyderabad",
                "isActive": True,
                "displayOrder": idx + 1,
                "createdAt": datetime.now(timezone.utc)
            }
            res = await db.service_areas.insert_one(doc)
            doc["_id"] = str(res.inserted_id)
            items.append(doc)

    return ResponseBase(success=True, message="Service areas retrieved", data=items)

# Admin endpoints
@router.get("/api/admin/service-areas", response_model=ResponseBase)
async def get_admin_service_areas(current_admin: dict = Depends(get_current_admin)):
    """Admin view all service areas (active and inactive)."""
    db = get_database()
    cursor = db.service_areas.find().sort("displayOrder", 1)
    items = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        items.append(doc)

    if len(items) == 0:
        for idx, area in enumerate(DEFAULT_SERVICE_AREAS):
            doc = {
                "name": area,
                "district": "Hyderabad",
                "isActive": True,
                "displayOrder": idx + 1,
                "createdAt": datetime.now(timezone.utc)
            }
            res = await db.service_areas.insert_one(doc)
            doc["_id"] = str(res.inserted_id)
            items.append(doc)

    return ResponseBase(success=True, message="Service areas retrieved", data=items)

@router.post("/api/admin/service-areas", response_model=ResponseBase)
async def create_service_area(payload: ServiceAreaCreate, current_admin: dict = Depends(get_current_admin)):
    """Add a new service area."""
    db = get_database()
    doc = payload.model_dump()
    doc["createdAt"] = datetime.now(timezone.utc)

    result = await db.service_areas.insert_one(doc)
    doc["_id"] = str(result.inserted_id)

    await log_admin_activity(
        admin_email=current_admin["sub"],
        action="create",
        entity="service_area",
        entity_id=doc["_id"],
        details=f"Added service area: {payload.name}"
    )

    return ResponseBase(success=True, message="Service area added successfully", data=doc)

@router.patch("/api/admin/service-areas/{id}", response_model=ResponseBase)
async def update_service_area(id: str, payload: ServiceAreaUpdate, current_admin: dict = Depends(get_current_admin)):
    """Update service area name or active status."""
    db = get_database()
    try:
        obj_id = ObjectId(id)
    except Exception:
        raise HTTPException(status_code=400, detail={"success": False, "message": "Invalid ID format."})

    update_data = {k: v for k, v in payload.model_dump().items() if v is not None}
    res = await db.service_areas.update_one({"_id": obj_id}, {"$set": update_data})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail={"success": False, "message": "Service area not found."})

    await log_admin_activity(
        admin_email=current_admin["sub"],
        action="update",
        entity="service_area",
        entity_id=id,
        details="Updated service area"
    )

    return ResponseBase(success=True, message="Service area updated successfully")

@router.delete("/api/admin/service-areas/{id}", response_model=ResponseBase)
async def delete_service_area(id: str, current_admin: dict = Depends(get_current_admin)):
    """Delete a service area."""
    db = get_database()
    try:
        obj_id = ObjectId(id)
    except Exception:
        raise HTTPException(status_code=400, detail={"success": False, "message": "Invalid ID format."})

    res = await db.service_areas.delete_one({"_id": obj_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail={"success": False, "message": "Service area not found."})

    await log_admin_activity(
        admin_email=current_admin["sub"],
        action="delete",
        entity="service_area",
        entity_id=id,
        details="Deleted service area"
    )

    return ResponseBase(success=True, message="Service area deleted successfully")
