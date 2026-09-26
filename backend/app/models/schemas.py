from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class MongoBaseModel(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")

    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda dt: dt.isoformat()
        }

class AdminModel(MongoBaseModel):
    name: str
    email: str
    passwordHash: str
    role: str = "admin"  # superadmin, admin
    lastLogin: Optional[datetime] = None
    createdAt: datetime = Field(default_factory=datetime.utcnow)

class ReviewModel(MongoBaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    rating: int = Field(ge=1, le=5)
    review: str
    city: str = "Hyderabad"
    status: str = "pending"  # pending, approved, rejected
    createdAt: datetime = Field(default_factory=datetime.utcnow)

class SiteVisitModel(MongoBaseModel):
    name: str
    phoneNumber: str
    whatsappNumber: Optional[str] = None
    email: Optional[str] = None
    cityArea: str
    propertyType: str = "Apartment"
    windowType: Optional[str] = "Balcony"
    approximateWindows: Optional[str] = None
    preferredVisitDate: Optional[str] = None
    preferredTime: Optional[str] = "Morning (10 AM - 1 PM)"
    requirementDetails: Optional[str] = None
    imageUrls: List[str] = []
    imagePublicIds: List[str] = []
    status: str = "new"  # new, contacted, scheduled, completed, cancelled
    adminNotes: Optional[str] = None
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

class ContactModel(MongoBaseModel):
    name: str
    phone: str
    email: str
    service: Optional[str] = None
    city: Optional[str] = "Hyderabad"
    message: str
    status: str = "new"  # new, contacted, in-progress, resolved, closed
    adminNotes: Optional[str] = None
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

class ProductModel(MongoBaseModel):
    name: str
    slug: str
    shortDescription: str
    description: str
    features: List[str] = []
    image: str
    gallery: List[str] = []
    highlight: Optional[str] = None
    status: str = "published"  # published, draft
    displayOrder: int = 0
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

class GalleryItemModel(MongoBaseModel):
    title: str
    description: Optional[str] = None
    category: str = "Balconies"  # Balconies, Windows, Installation, Details, Projects, Other
    imageUrl: str
    publicId: Optional[str] = None
    displayOrder: int = 0
    status: str = "active"  # active, hidden
    createdAt: datetime = Field(default_factory=datetime.utcnow)

class VideoItemModel(MongoBaseModel):
    title: str
    description: Optional[str] = None
    subtitle: Optional[str] = None
    category: str = "Installation"  # Installation, Product Showcase, Client Walkthrough
    videoUrl: str
    thumbnailUrl: Optional[str] = None
    publicId: Optional[str] = None
    displayOrder: int = 0
    status: str = "active"  # active, hidden
    tag: Optional[str] = "INSTALLATION PROCESS"
    createdAt: datetime = Field(default_factory=datetime.utcnow)

class TestimonialModel(MongoBaseModel):
    name: str
    city: str = "Hyderabad"
    property: Optional[str] = None
    rating: int = Field(ge=1, le=5, default=5)
    message: str
    highlight: Optional[str] = None
    photo: Optional[str] = None
    status: str = "approved"  # pending, approved, hidden
    displayOrder: int = 0
    createdAt: datetime = Field(default_factory=datetime.utcnow)

class ServiceAreaModel(MongoBaseModel):
    name: str
    district: str = "Hyderabad"
    isActive: bool = True
    displayOrder: int = 0
    createdAt: datetime = Field(default_factory=datetime.utcnow)

class WebsiteContentModel(MongoBaseModel):
    section: str = "general"  # hero, stats, trust, contact, brand
    heroHeading: str = "Upgrade Your Home With Smart & Stylish Solutions"
    heroSubtitle: str = "Premium Home Safety & Space Management Services"
    heroDescription: str = "Invisible Grills • Cloth Hangers • Mosquito Mesh • UPVC Windows • Shoe Racks • Security Screen Doors"
    ctaText: str = "Get a Free Site Visit"
    installationCount: str = "8,000+"
    customerSatisfaction: str = "100%"
    yearsExperience: str = "5+ Years"
    companyDescription: str = "Hyderabad's premier invisible grill and architectural safety provider."
    whyChooseUs: List[Dict[str, str]] = []
    contactPhone: str = "+91 9100720137"
    contactWhatsapp: str = "919100720137"
    contactEmail: str = "Deccanspaceworks@gmail.com"
    instagramUrl: str = "https://instagram.com/deccan_space_works"
    facebookUrl: Optional[str] = None
    youtubeUrl: Optional[str] = None
    googleMapsUrl: Optional[str] = None
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

class ActivityLogModel(MongoBaseModel):
    adminEmail: str
    action: str  # login, create, update, delete, approve, reject
    entity: str  # review, site_visit, contact, product, gallery, video, content, settings
    entityId: Optional[str] = None
    details: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
