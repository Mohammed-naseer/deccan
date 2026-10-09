from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List, Dict, Any, Union
from datetime import datetime

def validate_safe_url(url: Optional[str]) -> Optional[str]:
    """Ensure URL does not use dangerous protocols like javascript: or data:."""
    if url is None:
        return None
    url_clean = str(url).strip().lower()
    if url_clean.startswith("javascript:") or url_clean.startswith("data:") or url_clean.startswith("vbscript:"):
        raise ValueError("Invalid URL scheme. javascript:, data:, and vbscript: are strictly disallowed.")
    return str(url).strip()

# Standard API response wrappers
class ResponseBase(BaseModel):
    success: bool
    message: str
    data: Optional[Any] = None
    errorCode: Optional[str] = None

# Admin Auth Schemas
class AdminLoginRequest(BaseModel):
    email: EmailStr = Field(..., max_length=255)
    password: str = Field(..., min_length=6, max_length=128)

class AdminLoginResponse(BaseModel):
    token: str
    tokenType: str = "bearer"
    admin: Dict[str, Any]

class AdminCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr = Field(..., max_length=255)
    password: str = Field(..., min_length=6, max_length=128)
    role: str = "admin"

# Review Schemas
class ReviewCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr = Field(..., max_length=255)
    phone: Optional[str] = Field(None, max_length=20)
    rating: int = Field(..., ge=1, le=5)
    review: str = Field(..., min_length=5, max_length=2000)
    city: str = Field("Hyderabad", max_length=100)

    @field_validator("name")
    @classmethod
    def validate_name(cls, v):
        if not v or len(v.strip()) < 2:
            raise ValueError("Name must contain at least 2 non-whitespace characters.")
        return v.strip()

    @field_validator("review")
    @classmethod
    def validate_review(cls, v):
        if not v or len(v.strip()) < 5:
            raise ValueError("Review must contain at least 5 non-whitespace characters.")
        return v.strip()

class ReviewUpdateStatus(BaseModel):
    status: str = Field(..., pattern="^(pending|approved|rejected)$")

# Site Visit Schemas
class SiteVisitCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    phoneNumber: str = Field(..., min_length=10, max_length=20)
    whatsappNumber: Optional[str] = Field(None, max_length=20)
    email: Optional[EmailStr] = None
    cityArea: str = Field(..., max_length=100)
    propertyType: str = Field("Apartment", max_length=100)
    windowType: Optional[str] = Field("Balcony", max_length=100)
    approximateWindows: Optional[str] = Field(None, max_length=100)
    preferredVisitDate: Optional[str] = Field(None, max_length=50)
    preferredTime: Optional[str] = Field("Morning (10 AM - 1 PM)", max_length=50)
    requirementDetails: Optional[str] = Field(None, max_length=2000)
    imageUrls: List[str] = []

    @field_validator("imageUrls")
    @classmethod
    def check_urls(cls, v):
        return [validate_safe_url(u) for u in v]

    @field_validator("name")
    @classmethod
    def validate_name(cls, v):
        if not v or len(v.strip()) < 2:
            raise ValueError("Name must contain at least 2 non-whitespace characters.")
        return v.strip()

    @field_validator("cityArea")
    @classmethod
    def validate_city(cls, v):
        if not v or len(v.strip()) < 2:
            raise ValueError("City area must contain at least 2 non-whitespace characters.")
        return v.strip()

class SiteVisitUpdateStatus(BaseModel):
    status: Optional[str] = Field(None, pattern="^(new|contacted|scheduled|completed|cancelled)$")
    adminNotes: Optional[str] = Field(None, max_length=2000)
    scheduledDate: Optional[str] = Field(None, max_length=50)
    scheduledTime: Optional[str] = Field(None, max_length=50)
    assignedTechnician: Optional[str] = Field(None, max_length=100)
    quoteAmount: Optional[Union[float, int, str]] = None
    sqftEstimated: Optional[Union[float, int, str]] = None
    followUpDate: Optional[str] = Field(None, max_length=50)
    followUpNotes: Optional[str] = Field(None, max_length=2000)

    @field_validator("quoteAmount")
    @classmethod
    def validate_quote(cls, v):
        if v is None or v == "":
            return None
        try:
            val = float(v)
            if val < 0:
                raise ValueError("Quotation amount cannot be negative.")
            if val > 10_000_000:
                raise ValueError("Quotation amount exceeds realistic limit (max 10,000,000).")
            return val
        except (ValueError, TypeError) as e:
            if "Quotation amount" in str(e):
                raise
            raise ValueError("Quotation amount must be a valid number.")

    @field_validator("sqftEstimated")
    @classmethod
    def validate_sqft(cls, v):
        if v is None or v == "":
            return None
        try:
            val = float(v)
            if val < 0:
                raise ValueError("Estimated area cannot be negative.")
            if val > 100_000:
                raise ValueError("Estimated area exceeds realistic limit (max 100,000 sq ft).")
            return val
        except (ValueError, TypeError) as e:
            if "Estimated area" in str(e):
                raise
            raise ValueError("Estimated area must be a valid number.")

# Contact Enquiry Schemas
class ContactCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    phone: str = Field(..., min_length=10, max_length=20)
    email: EmailStr = Field(..., max_length=255)
    service: Optional[str] = Field(None, max_length=100)
    city: Optional[str] = Field("Hyderabad", max_length=100)
    message: str = Field(..., min_length=3, max_length=2000)

    @field_validator("name")
    @classmethod
    def validate_name(cls, v):
        if not v or len(v.strip()) < 2:
            raise ValueError("Name must contain at least 2 non-whitespace characters.")
        return v.strip()

    @field_validator("message")
    @classmethod
    def validate_message(cls, v):
        if not v or len(v.strip()) < 3:
            raise ValueError("Message must contain at least 3 non-whitespace characters.")
        return v.strip()

class ContactUpdateStatus(BaseModel):
    status: Optional[str] = Field(None, pattern="^(new|contacted|in-progress|resolved|closed)$")
    adminNotes: Optional[str] = Field(None, max_length=2000)
    followUpDate: Optional[str] = Field(None, max_length=50)
    followUpNotes: Optional[str] = Field(None, max_length=2000)
    leadQuality: Optional[str] = Field(None, pattern="^(hot|warm|cold)$")

class ConvertContactToSiteVisit(BaseModel):
    preferredVisitDate: Optional[str] = Field(None, max_length=50)
    preferredTime: Optional[str] = Field("Morning (10 AM - 1 PM)", max_length=50)
    propertyType: str = Field("Apartment", max_length=100)
    windowType: Optional[str] = Field("Balcony", max_length=100)
    approximateWindows: Optional[str] = Field(None, max_length=100)
    requirementDetails: Optional[str] = Field(None, max_length=2000)

# Product Schemas
class ProductCreate(BaseModel):
    name: str = Field(..., max_length=150)
    slug: str = Field(..., max_length=150)
    shortDescription: str = Field(..., max_length=500)
    description: str = Field(..., max_length=5000)
    features: List[str] = []
    image: str
    gallery: List[str] = []
    highlight: Optional[str] = Field(None, max_length=100)
    status: str = "published"
    displayOrder: int = 0

    @field_validator("image")
    @classmethod
    def check_image(cls, v):
        return validate_safe_url(v)

    @field_validator("gallery")
    @classmethod
    def check_gallery(cls, v):
        return [validate_safe_url(u) for u in v]

class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=150)
    slug: Optional[str] = Field(None, max_length=150)
    shortDescription: Optional[str] = Field(None, max_length=500)
    description: Optional[str] = Field(None, max_length=5000)
    features: Optional[List[str]] = None
    image: Optional[str] = None
    gallery: Optional[List[str]] = None
    highlight: Optional[str] = Field(None, max_length=100)
    status: Optional[str] = None
    displayOrder: Optional[int] = None

    @field_validator("image")
    @classmethod
    def check_image(cls, v):
        return validate_safe_url(v)

    @field_validator("gallery")
    @classmethod
    def check_gallery(cls, v):
        return [validate_safe_url(u) for u in v] if v is not None else None

# Gallery Schemas
class GalleryCreate(BaseModel):
    title: str = Field(..., max_length=150)
    description: Optional[str] = Field(None, max_length=1000)
    category: str = Field("Balconies", max_length=100)
    imageUrl: str
    publicId: Optional[str] = Field(None, max_length=200)
    displayOrder: int = 0
    status: str = "active"

    @field_validator("imageUrl")
    @classmethod
    def check_url(cls, v):
        return validate_safe_url(v)

class GalleryUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=150)
    description: Optional[str] = Field(None, max_length=1000)
    category: Optional[str] = Field(None, max_length=100)
    imageUrl: Optional[str] = None
    displayOrder: Optional[int] = None
    status: Optional[str] = None

    @field_validator("imageUrl")
    @classmethod
    def check_url(cls, v):
        return validate_safe_url(v)

# Video Schemas
class VideoCreate(BaseModel):
    title: str = Field(..., max_length=150)
    description: Optional[str] = Field(None, max_length=1000)
    subtitle: Optional[str] = Field(None, max_length=150)
    category: str = Field("Installation", max_length=100)
    videoUrl: str
    thumbnailUrl: Optional[str] = None
    publicId: Optional[str] = Field(None, max_length=200)
    displayOrder: int = 0
    status: str = "active"
    tag: Optional[str] = Field("INSTALLATION PROCESS", max_length=100)

    @field_validator("videoUrl")
    @classmethod
    def check_vid(cls, v):
        return validate_safe_url(v)

    @field_validator("thumbnailUrl")
    @classmethod
    def check_thumb(cls, v):
        return validate_safe_url(v)

class VideoUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=150)
    description: Optional[str] = Field(None, max_length=1000)
    subtitle: Optional[str] = Field(None, max_length=150)
    category: Optional[str] = Field(None, max_length=100)
    videoUrl: Optional[str] = None
    thumbnailUrl: Optional[str] = None
    displayOrder: Optional[int] = None
    status: Optional[str] = None
    tag: Optional[str] = Field(None, max_length=100)

    @field_validator("videoUrl")
    @classmethod
    def check_vid(cls, v):
        return validate_safe_url(v)

    @field_validator("thumbnailUrl")
    @classmethod
    def check_thumb(cls, v):
        return validate_safe_url(v)

# Testimonial Schemas
class TestimonialCreate(BaseModel):
    name: str
    city: str = "Hyderabad"
    property: Optional[str] = None
    rating: int = Field(default=5, ge=1, le=5)
    message: str
    highlight: Optional[str] = None
    photo: Optional[str] = None
    status: str = "approved"
    displayOrder: int = 0

class TestimonialUpdate(BaseModel):
    name: Optional[str] = None
    city: Optional[str] = None
    property: Optional[str] = None
    rating: Optional[int] = None
    message: Optional[str] = None
    highlight: Optional[str] = None
    photo: Optional[str] = None
    status: Optional[str] = None
    displayOrder: Optional[int] = None

# Service Area Schemas
class ServiceAreaCreate(BaseModel):
    name: str
    district: str = "Hyderabad"
    isActive: bool = True
    displayOrder: int = 0

class ServiceAreaUpdate(BaseModel):
    name: Optional[str] = None
    district: Optional[str] = None
    isActive: Optional[bool] = None
    displayOrder: Optional[int] = None

# Website Content & Statistics Schemas
class WebsiteContentUpdate(BaseModel):
    heroHeading: Optional[str] = Field(None, max_length=200)
    heroSubtitle: Optional[str] = Field(None, max_length=300)
    heroDescription: Optional[str] = Field(None, max_length=1000)
    ctaText: Optional[str] = Field(None, max_length=100)
    installationCount: Optional[str] = Field(None, max_length=50)
    customerSatisfaction: Optional[str] = Field(None, max_length=50)
    yearsExperience: Optional[str] = Field(None, max_length=50)
    companyDescription: Optional[str] = Field(None, max_length=2000)
    whyChooseUs: Optional[List[Dict[str, str]]] = None
    contactPhone: Optional[str] = Field(None, max_length=50)
    contactWhatsapp: Optional[str] = Field(None, max_length=50)
    contactEmail: Optional[str] = Field(None, max_length=100)
    instagramUrl: Optional[str] = None
    facebookUrl: Optional[str] = None
    youtubeUrl: Optional[str] = None
    googleMapsUrl: Optional[str] = None

    @field_validator("instagramUrl", "facebookUrl", "youtubeUrl", "googleMapsUrl")
    @classmethod
    def check_social_urls(cls, v):
        return validate_safe_url(v)
