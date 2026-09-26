from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime, timezone
from app.schemas.api_schemas import (
    AdminLoginRequest, 
    AdminLoginResponse, 
    AdminCreateRequest,
    ResponseBase
)
from app.core.database import get_database
from app.core.security import verify_password, hash_password, create_access_token, get_current_admin
from app.services.activity_service import log_admin_activity

router = APIRouter(prefix="/api/admin", tags=["Admin Authentication"])

@router.post("/login", response_model=ResponseBase)
async def admin_login(payload: AdminLoginRequest):
    """Secure Admin login returning JWT bearer token."""
    db = get_database()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"success": False, "message": "Database service unavailable. Please check MongoDB configuration.", "errorCode": "DB_UNAVAILABLE"}
        )
    
    admin = await db.admins.find_one({"email": payload.email.lower()})
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"success": False, "message": "Invalid email address or password.", "errorCode": "INVALID_CREDENTIALS"}
        )
    
    if not verify_password(payload.password, admin.get("passwordHash", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"success": False, "message": "Invalid email address or password.", "errorCode": "INVALID_CREDENTIALS"}
        )
    
    # Update last login timestamp
    await db.admins.update_one(
        {"_id": admin["_id"]},
        {"$set": {"lastLogin": datetime.now(timezone.utc)}}
    )
    
    token = create_access_token(data={"sub": admin["email"], "role": admin.get("role", "admin"), "name": admin.get("name", "Admin")})
    
    await log_admin_activity(
        admin_email=admin["email"],
        action="login",
        entity="auth",
        entity_id=str(admin["_id"]),
        details="Admin logged in successfully"
    )
    
    return ResponseBase(
        success=True,
        message="Login successful",
        data={
            "token": token,
            "tokenType": "bearer",
            "admin": {
                "name": admin.get("name", "Admin"),
                "email": admin["email"],
                "role": admin.get("role", "admin")
            }
        }
    )

@router.get("/me", response_model=ResponseBase)
async def get_current_admin_profile(current_admin: dict = Depends(get_current_admin)):
    """Verify session token and get current admin info."""
    db = get_database()
    admin = await db.admins.find_one({"email": current_admin["sub"]}, {"passwordHash": 0})
    if not admin:
        return ResponseBase(
            success=True,
            message="Admin session active",
            data=current_admin
        )
    admin["_id"] = str(admin["_id"])
    return ResponseBase(
        success=True,
        message="Admin profile retrieved",
        data=admin
    )
