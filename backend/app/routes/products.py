from fastapi import APIRouter, HTTPException, Depends, Query, status
from bson import ObjectId
from datetime import datetime, timezone
from typing import Optional

from app.schemas.api_schemas import ProductCreate, ProductUpdate, ResponseBase
from app.core.database import get_database
from app.core.security import get_current_admin
from app.services.activity_service import log_admin_activity

router = APIRouter(tags=["Products"])

DEFAULT_PRODUCTS = [
    {
        "name": "Invisible Grills",
        "slug": "invisible-grills",
        "shortDescription": "Safety with a clean, modern look. Enjoy uninterrupted views with maximum protection.",
        "description": "High tensile stainless steel wire (SS 316 & SS 304) with premier nylon melt coat. Tested to withstand up to 400 kg tension load with heavy-duty 27mm aluminium track.",
        "features": ["SS 316 & 304 Marine Grade", "2.5 mm / 3.0 mm Thickness", "Up to 400 kg Load Capacity", "Child & Pet Safe", "Transparent Frameless View"],
        "image": "/images/highrise_view.jpg",
        "gallery": ["/images/highrise_view.jpg", "/images/terrace_panoramic.jpg", "/images/living_balcony.jpg"],
        "highlight": "Flagship Product",
        "status": "published",
        "displayOrder": 1
    },
    {
        "name": "Mosquito Mesh",
        "slug": "mosquito-mesh",
        "shortDescription": "Fresh air, fewer mosquitoes. Keep your home comfortable and insect-free.",
        "description": "Durable high-grade mesh frames designed for smooth operation and long-lasting pest protection without obstructing ventilation.",
        "features": ["High Tensile Mesh", "Custom Frame Matching", "Easy Detachable Cleaning", "All Weather Resistant"],
        "image": "/images/window_interior.jpg",
        "gallery": ["/images/window_interior.jpg"],
        "highlight": "Healthy Living",
        "status": "published",
        "displayOrder": 2
    },
    {
        "name": "Cloth Hangers",
        "slug": "cloth-hangers",
        "shortDescription": "Smart and space-saving drying solutions for modern homes.",
        "description": "Ceiling-mounted pulley and gear operated stainless steel drying racks designed to save floor space in high-rise balconies.",
        "features": ["Ceiling Pulley System", "Stainless Steel Rods", "Smooth Effortless Lift", "Rust Proof"],
        "image": "/images/terrace_panoramic.jpg",
        "gallery": ["/images/terrace_panoramic.jpg"],
        "highlight": "Space Saver",
        "status": "published",
        "displayOrder": 3
    },
    {
        "name": "UPVC Windows",
        "slug": "upvc-windows",
        "shortDescription": "Stylish, durable and low-maintenance windows for better comfort.",
        "description": "Multi-chambered acoustic and thermal insulated UPVC windows fitted with high-durability hardware.",
        "features": ["Noise Reduction", "Dust & Water Proof", "Thermal Insulation", "Zero Maintenance"],
        "image": "/images/type_sliding.jpg",
        "gallery": ["/images/type_sliding.jpg", "/images/type_casement.jpg"],
        "highlight": "Weatherproof",
        "status": "published",
        "displayOrder": 4
    },
    {
        "name": "Shoe Racks",
        "slug": "shoe-racks",
        "shortDescription": "Organized and space-saving storage solutions for your footwear.",
        "description": "Wall-mounted slim architectural shoe cabinets with ventilated shelves.",
        "features": ["Ultra Slim Profile", "Ventilated Shelves", "Lockable Options", "Wall Mounted"],
        "image": "/images/modern_residence.jpg",
        "gallery": ["/images/modern_residence.jpg"],
        "highlight": "Smart Storage",
        "status": "published",
        "displayOrder": 5
    },
    {
        "name": "Security Screen Doors",
        "slug": "security-screen-doors",
        "shortDescription": "Extra protection for your entrances without compromising air flow.",
        "description": "Heavy-duty stainless steel security mesh doors with multipoint locking systems.",
        "features": ["3-Point Security Lock", "Cut & Impact Resistant", "Unobstructed Airflow", "Architectural Finish"],
        "image": "/images/type_bifold.jpg",
        "gallery": ["/images/type_bifold.jpg"],
        "highlight": "Tough Security",
        "status": "published",
        "displayOrder": 6
    }
]

# Public endpoints
@router.get("/api/products", response_model=ResponseBase)
async def get_public_products():
    """Retrieve all published products for public display."""
    db = get_database()
    if db is None:
        return ResponseBase(success=True, message="Products retrieved", data=DEFAULT_PRODUCTS)

    cursor = db.products.find({"status": "published"}).sort("displayOrder", 1)
    items = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        items.append(doc)

    # Seed defaults if collection is empty
    if len(items) == 0:
        for p in DEFAULT_PRODUCTS:
            p_copy = p.copy()
            p_copy["createdAt"] = datetime.now(timezone.utc)
            p_copy["updatedAt"] = datetime.now(timezone.utc)
            res = await db.products.insert_one(p_copy)
            p_copy["_id"] = str(res.inserted_id)
            items.append(p_copy)

    return ResponseBase(success=True, message="Products retrieved", data=items)

@router.get("/api/products/{slug}", response_model=ResponseBase)
async def get_product_by_slug(slug: str):
    """Retrieve a single published product by slug."""
    db = get_database()
    if db is None:
        matched = next((p for p in DEFAULT_PRODUCTS if p["slug"] == slug), None)
        if not matched:
            raise HTTPException(status_code=404, detail={"success": False, "message": "Product not found."})
        return ResponseBase(success=True, message="Product retrieved", data=matched)

    doc = await db.products.find_one({"slug": slug, "status": "published"})
    if not doc:
        raise HTTPException(status_code=404, detail={"success": False, "message": "Product not found."})
    doc["_id"] = str(doc["_id"])
    return ResponseBase(success=True, message="Product retrieved", data=doc)

# Admin endpoints
@router.get("/api/admin/products", response_model=ResponseBase)
async def get_admin_products(current_admin: dict = Depends(get_current_admin)):
    """Admin view all products (published and drafts)."""
    db = get_database()
    cursor = db.products.find().sort("displayOrder", 1)
    items = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        items.append(doc)

    if len(items) == 0:
        for p in DEFAULT_PRODUCTS:
            p_copy = p.copy()
            p_copy["createdAt"] = datetime.now(timezone.utc)
            p_copy["updatedAt"] = datetime.now(timezone.utc)
            res = await db.products.insert_one(p_copy)
            p_copy["_id"] = str(res.inserted_id)
            items.append(p_copy)

    return ResponseBase(success=True, message="Products retrieved", data=items)

@router.post("/api/admin/products", response_model=ResponseBase)
async def create_product(payload: ProductCreate, current_admin: dict = Depends(get_current_admin)):
    """Create a new product."""
    db = get_database()
    existing = await db.products.find_one({"slug": payload.slug})
    if existing:
        raise HTTPException(status_code=400, detail={"success": False, "message": f"Product with slug '{payload.slug}' already exists."})

    doc = payload.model_dump()
    doc["createdAt"] = datetime.now(timezone.utc)
    doc["updatedAt"] = datetime.now(timezone.utc)

    result = await db.products.insert_one(doc)
    doc["_id"] = str(result.inserted_id)

    await log_admin_activity(
        admin_email=current_admin["sub"],
        action="create",
        entity="product",
        entity_id=doc["_id"],
        details=f"Created product: {payload.name}"
    )

    return ResponseBase(success=True, message="Product created successfully", data=doc)

@router.patch("/api/admin/products/{id}", response_model=ResponseBase)
async def update_product(id: str, payload: ProductUpdate, current_admin: dict = Depends(get_current_admin)):
    """Update product information or publish/draft status."""
    db = get_database()
    try:
        obj_id = ObjectId(id)
    except Exception:
        raise HTTPException(status_code=400, detail={"success": False, "message": "Invalid ID format."})

    update_data = {k: v for k, v in payload.model_dump().items() if v is not None}
    update_data["updatedAt"] = datetime.now(timezone.utc)

    res = await db.products.update_one({"_id": obj_id}, {"$set": update_data})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail={"success": False, "message": "Product not found."})

    await log_admin_activity(
        admin_email=current_admin["sub"],
        action="update",
        entity="product",
        entity_id=id,
        details="Updated product details"
    )

    return ResponseBase(success=True, message="Product updated successfully")

@router.delete("/api/admin/products/{id}", response_model=ResponseBase)
async def delete_product(id: str, current_admin: dict = Depends(get_current_admin)):
    """Delete a product."""
    db = get_database()
    try:
        obj_id = ObjectId(id)
    except Exception:
        raise HTTPException(status_code=400, detail={"success": False, "message": "Invalid ID format."})

    res = await db.products.delete_one({"_id": obj_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail={"success": False, "message": "Product not found."})

    await log_admin_activity(
        admin_email=current_admin["sub"],
        action="delete",
        entity="product",
        entity_id=id,
        details="Deleted product"
    )

    return ResponseBase(success=True, message="Product deleted successfully")
