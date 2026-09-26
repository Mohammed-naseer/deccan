from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

# Standard API response wrappers
class ResponseBase(BaseModel):
    success: bool
    message: str
    data: Optional[Any] = None
    errorCode: Optional[str] = None

# Admin Auth Schemas
class AdminLoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)

class AdminLoginResponse(BaseModel):
    token: str
    tokenType: str = "bearer"
    admin: Dict[str, Any]

class AdminCreateRequest(BaseModel):
    name: str = Field(..., min_length=2)
    email: EmailStr
    password: str = Field(..., min_length=6)
    role: str = "admin"

# Review Schemas
class ReviewCreate(BaseModel):
    name: str = Field(..., min_length=2)
    email: EmailStr
    phone: Optional[str] = None
    rating: int = Field(..., ge=1, le=5)
    review: str = Field(..., min_length=5)
    city: str = "Hyderabad"

class ReviewUpdateStatus(BaseModel):
    status: str = Field(..., pattern="^(pending|approved|rejected)$")

# Site Visit Schemas
class SiteVisitCreate(BaseModel):
    name: str = Field(..., min_length=2)
    phoneNumber: str = Field(..., min_length=10)
    whatsappNumber: Optional[str] = None
    email: Optional[EmailStr] = None
    cityArea: str
    propertyType: str = "Apartment"
    windowType: Optional[str] = "Balcony"
    approximateWindows: Optional[str] = None
    preferredVisitDate: Optional[str] = None
    preferredTime: Optional[str] = "Morning (10 AM - 1 PM)"
    requirementDetails: Optional[str] = None
    imageUrls: List[str] = []

class SiteVisitUpdateStatus(BaseModel):
    status: str = Field(..., pattern="^(new|contacted|scheduled|completed|cancelled)$")
    adminNotes: Optional[str] = None

# Contact Enquiry Schemas
class ContactCreate(BaseModel):
    name: str = Field(..., min_length=2)
    phone: str = Field(..., min_length=10)
    email: EmailStr
    service: Optional[str] = None
    city: Optional[str] = "Hyderabad"
    message: str = Field(..., min_length=3)

class ContactUpdateStatus(BaseModel):
    status: str = Field(..., pattern="^(new|contacted|in-progress|resolved|closed)$")
    adminNotes: Optional[str] = None

# Product Schemas
class ProductCreate(BaseModel):
    name: str
    slug: str
    shortDescription: str
    description: str
    features: List[str] = []
    image: str
    gallery: List[str] = []
    highlight: Optional[str] = None
    status: str = "published"
    displayOrder: int = 0

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    shortDescription: Optional[str] = None
    description: Optional[str] = None
    features: Optional[List[str]] = None
    image: Optional[str] = None
    gallery: Optional[List[str]] = None
    highlight: Optional[str] = None
    status: Optional[str] = None
    displayOrder: Optional[int] = None

# Gallery Schemas
class GalleryCreate(BaseModel):
    title: str
    description: Optional[str] = None
    category: str = "Balconies"
    imageUrl: str
    publicId: Optional[str] = None
    displayOrder: int = 0
    status: str = "active"

class GalleryUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    imageUrl: Optional[str] = None
    displayOrder: Optional[int] = None
    status: Optional[str] = None

# Video Schemas
class VideoCreate(BaseModel):
    title: str
    description: Optional[str] = None
    subtitle: Optional[str] = None
    category: str = "Installation"
    videoUrl: str
    thumbnailUrl: Optional[str] = None
    publicId: Optional[str] = None
    displayOrder: int = 0
    status: str = "active"
    tag: Optional[str] = "INSTALLATION PROCESS"

class VideoUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    subtitle: Optional[str] = None
    category: Optional[str] = None
    videoUrl: Optional[str] = None
    thumbnailUrl: Optional[str] = None
    displayOrder: Optional[int] = None
    status: Optional[str] = None
    tag: Optional[str] = None

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
    heroHeading: Optional[str] = None
    heroSubtitle: Optional[str] = None
    heroDescription: Optional[str] = None
    ctaText: Optional[str] = None
    installationCount: Optional[str] = None
    customerSatisfaction: Optional[str] = None
    yearsExperience: Optional[str] = None
    companyDescription: Optional[str] = None
    whyChooseUs: Optional[List[Dict[str, str]]] = None
    contactPhone: Optional[str] = None
    contactWhatsapp: Optional[str] = None
    contactEmail: Optional[str] = None
    instagramUrl: Optional[str] = None
    facebookUrl: Optional[str] = None
    youtubeUrl: Optional[str] = None
    googleMapsUrl: Optional[str] = None
