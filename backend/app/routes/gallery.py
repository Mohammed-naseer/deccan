from fastapi import APIRouter, HTTPException, Depends, Query, status
from bson import ObjectId
from datetime import datetime, timezone
from typing import Optional

from app.schemas.api_schemas import GalleryCreate, GalleryUpdate, ResponseBase
from app.core.database import get_database
from app.core.security import get_current_admin
from app.services.cloudinary_service import delete_from_cloudinary
from app.services.activity_service import log_admin_activity

router = APIRouter(tags=["Gallery"])

DEFAULT_GALLERY = [
    {
        "title": "High-Rise Balcony Panoramic View",
        "description": "2.5 mm SS 316 marine grade cables overlooking Hyderabad skyline.",
        "category": "Balconies",
        "imageUrl": "/images/highrise_view.jpg",
        "displayOrder": 1,
        "status": "active"
    },
    {
        "title": "Living Room Balcony Installation",
        "description": "Installed with 27 mm heavy-duty aluminium profile and protective cover caps.",
        "category": "Balconies",
        "imageUrl": "/images/living_balcony.jpg",
        "displayOrder": 2,
        "status": "active"
    },
    {
        "title": "Modern Residence Corner Balcony",
        "description": "Seamless safety without spoiling architectural sightlines.",
        "category": "Balconies",
        "imageUrl": "/images/modern_residence.jpg",
        "displayOrder": 3,
        "status": "active"
    },
    {
        "title": "Window Interior Invisible Protection",
        "description": "High-tensile SS wire installed directly on window reveals.",
        "category": "Windows",
        "imageUrl": "/images/window_interior.jpg",
        "displayOrder": 4,
        "status": "active"
    },
    {
        "title": "Terrace Panoramic Safety Grille",
        "description": "Full height floor-to-ceiling installation providing complete child & pet safety.",
        "category": "Installation",
        "imageUrl": "/images/terrace_panoramic.jpg",
        "displayOrder": 5,
        "status": "active"
    },
    {
        "title": "Sliding Window Track Integration",
        "description": "Custom sub-frame allows smooth sliding window movement while maintaining wire tension.",
        "category": "Windows",
        "imageUrl": "/images/type_sliding.jpg",
        "displayOrder": 6,
        "status": "active"
    },
    {
        "title": "27 mm Heavy-Duty Channel Profile",
        "description": "Cross-sectional engineering diagram of the 27 mm x 27 mm aluminium mounting channel.",
        "category": "Details",
        "imageUrl": "/images/diag_channel.png",
        "displayOrder": 7,
        "status": "active"
    },
    {
        "title": "SS 316 Multi-Strand Wire Structure",
        "description": "Multi-strand stainless steel core with premier transparent nylon melt coat.",
        "category": "Details",
        "imageUrl": "/images/diag_cable.png",
        "displayOrder": 8,
        "status": "active"
    }
]

# Public endpoint
@router.get("/api/gallery", response_model=ResponseBase)
async def get_public_gallery(category: Optional[str] = None):
    """Retrieve active gallery photos for public website."""
    db = get_database()
    if db is None:
        filtered = DEFAULT_GALLERY
        if category and category != "All":
            filtered = [g for g in DEFAULT_GALLERY if g["category"] == category]
        return ResponseBase(success=True, message="Gallery items retrieved", data=filtered)

    query = {"status": "active"}
    if category and category != "All":
        query["category"] = category

    cursor = db.gallery.find(query).sort("displayOrder", 1)
    items = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        items.append(doc)

    # Seed defaults if empty
    if len(items) == 0 and not category:
        for g in DEFAULT_GALLERY:
            g_copy = g.copy()
            g_copy["createdAt"] = datetime.now(timezone.utc)
            res = await db.gallery.insert_one(g_copy)
            g_copy["_id"] = str(res.inserted_id)
            items.append(g_copy)

    return ResponseBase(success=True, message="Gallery items retrieved", data=items)

# Admin endpoints
@router.get("/api/admin/gallery", response_model=ResponseBase)
async def get_admin_gallery(
    category: Optional[str] = None,
    current_admin: dict = Depends(get_current_admin)
):
    """Admin view all gallery photos (active and hidden)."""
    db = get_database()
    query = {}
    if category and category != "All":
        query["category"] = category

    cursor = db.gallery.find(query).sort("displayOrder", 1)
    items = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        items.append(doc)

    if len(items) == 0:
        for g in DEFAULT_GALLERY:
            g_copy = g.copy()
            g_copy["createdAt"] = datetime.now(timezone.utc)
            res = await db.gallery.insert_one(g_copy)
            g_copy["_id"] = str(res.inserted_id)
            items.append(g_copy)

    return ResponseBase(success=True, message="Gallery items retrieved", data=items)

@router.post("/api/admin/gallery", response_model=ResponseBase)
async def create_gallery_item(payload: GalleryCreate, current_admin: dict = Depends(get_current_admin)):
    """Create a new gallery image entry."""
    db = get_database()
    doc = payload.model_dump()
    doc["createdAt"] = datetime.now(timezone.utc)

    result = await db.gallery.insert_one(doc)
    doc["_id"] = str(result.inserted_id)

    await log_admin_activity(
        admin_email=current_admin["sub"],
        action="create",
        entity="gallery",
        entity_id=doc["_id"],
        details=f"Added gallery image: {payload.title}"
    )

    return ResponseBase(success=True, message="Gallery photo added successfully", data=doc)

@router.patch("/api/admin/gallery/{id}", response_model=ResponseBase)
async def update_gallery_item(id: str, payload: GalleryUpdate, current_admin: dict = Depends(get_current_admin)):
    """Update gallery metadata, category, or order."""
    db = get_database()
    try:
        obj_id = ObjectId(id)
    except Exception:
        raise HTTPException(status_code=400, detail={"success": False, "message": "Invalid ID format."})

    update_data = {k: v for k, v in payload.model_dump().items() if v is not None}
    res = await db.gallery.update_one({"_id": obj_id}, {"$set": update_data})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail={"success": False, "message": "Gallery item not found."})

    await log_admin_activity(
        admin_email=current_admin["sub"],
        action="update",
        entity="gallery",
        entity_id=id,
        details="Updated gallery image"
    )

    return ResponseBase(success=True, message="Gallery image updated successfully")

@router.delete("/api/admin/gallery/{id}", response_model=ResponseBase)
async def delete_gallery_item(id: str, current_admin: dict = Depends(get_current_admin)):
    """Delete a gallery photo and clean up Cloudinary asset."""
    db = get_database()
    try:
        obj_id = ObjectId(id)
    except Exception:
        raise HTTPException(status_code=400, detail={"success": False, "message": "Invalid ID format."})

    doc = await db.gallery.find_one({"_id": obj_id})
    if not doc:
        raise HTTPException(status_code=404, detail={"success": False, "message": "Gallery item not found."})

    if doc.get("publicId"):
        await delete_from_cloudinary(doc["publicId"], resource_type="image")

    await db.gallery.delete_one({"_id": obj_id})

    await log_admin_activity(
        admin_email=current_admin["sub"],
        action="delete",
        entity="gallery",
        entity_id=id,
        details="Deleted gallery image"
    )

    return ResponseBase(success=True, message="Gallery photo deleted successfully")
