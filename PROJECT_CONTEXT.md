# PROJECT CONTEXT — DECCAN SPACE WORKS

## 1. Company & Product Profile
- **Company**: Deccan Space Works
- **Headquarters**: Hyderabad, Telangana, India
- **Core Specialization**: High-tensile stainless steel Invisible Grills for residential high-rises, villas, and commercial spaces.
- **Product Portfolio**:
  - Flagship: Invisible Grills (SS 316 Marine Grade / SS 304 High-Tensile with virgin nylon coating)
  - Complementary: Cloth Drying Hangers, Mosquito Mesh, UPVC Windows, Shoe Racks, Security Screen Doors
- **Key Brand Promise**: *"What's visible are seamless. What's invisible is strength."* Unobstructed panoramic views paired with certified structural safety and fall protection.
- **Primary Market**: Hyderabad metropolitan region (Gachibowli, Jubilee Hills, Banjara Hills, Kondapur, Hitec City, Kokapet, Madhapur, Financial District, Tellapur, Manikonda, and surrounding areas).

---

## 2. Technical Architecture Overview

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS with custom architectural dark theme (`#080C14` base, `#06B6D4` cyan accent, `#0F172A` card layers)
- **Animation & Motion**: Framer Motion
- **Icons**: Lucide React
- **Typography**: Inter (Body) + Outfit (Headings) via `next/font/google`
- **Focus Management & Accessibility**: WAI-ARIA compliant modal focus traps, escape key dismissal, and focus restoration to trigger elements.

### Backend
- **Framework**: FastAPI (Python 3.10+) with async endpoints
- **Database**: MongoDB Atlas via Motor (`motor.motor_asyncio.AsyncIOMotorClient`)
- **Authentication**: JWT authentication with passlib/bcrypt password hashing; token validation queries `admins` collection directly to reject deleted or deactivated accounts.
- **Mailing**: Resend API with HTML escaping for sanitizing user-controlled input, graceful fallback to dry-run/logging mode when unconfigured.
- **Media Architecture**: URL-first architecture; uploads support file size validation (10MB image, 50MB video) with local/mock fallback when Cloudinary is not configured.
- **CORS**: Configured with strict origin checks for production Vercel frontend, custom domains, and local dev environments (`localhost:3000`).

---

## 3. Directory Layout

```
deccan-main/
├── backend/
│   ├── app/
│   │   ├── core/
│   │   │   ├── config.py          # Pydantic v2 settings & env vars
│   │   │   ├── database.py        # Motor MongoDB async client
│   │   │   └── security.py        # JWT generation & admin database verification
│   │   ├── routes/
│   │   │   ├── auth.py            # /api/admin/login, /api/admin/me
│   │   │   ├── dashboard.py       # /api/admin/stats
│   │   │   ├── content.py         # /api/content, /api/admin/content
│   │   │   ├── products.py        # /api/products, /api/admin/products
│   │   │   ├── site_visits.py     # /api/site-visits, /api/admin/site-visits
│   │   │   ├── contacts.py        # /api/contacts, /api/admin/contacts
│   │   │   ├── gallery.py         # /api/gallery, /api/admin/gallery
│   │   │   ├── videos.py          # /api/videos, /api/admin/videos
│   │   │   ├── reviews.py         # /api/reviews, /api/admin/reviews
│   │   │   ├── testimonials.py    # /api/testimonials, /api/admin/testimonials
│   │   │   ├── service_areas.py   # /api/service-areas, /api/admin/service-areas
│   │   │   └── uploads.py         # /api/admin/uploads/media
│   │   ├── schemas/
│   │   │   └── api_schemas.py     # Pydantic models for validation
│   │   ├── services/
│   │   │   ├── activity_service.py # Audit logging in admin_activity
│   │   │   └── email_service.py    # Resend email notifications with HTML sanitization
│   │   └── main.py                # FastAPI initialization, CORS, global handlers
│   ├── create_admin.py            # CLI script to bootstrap admin account
│   └── requirements.txt           # Python dependencies
├── src/
│   ├── app/
│   │   ├── admin/                 # Admin management portal routes
│   │   ├── page.jsx               # High-converting public landing page
│   │   ├── layout.jsx             # Root layout with fonts and SEO metadata
│   │   └── globals.css            # Tailwind base & custom utilities
│   ├── components/
│   │   ├── areas/                 # Service areas section
│   │   ├── forms/                 # Free Site Visit & Contact Enquiry forms
│   │   ├── gallery/               # Visual gallery & CAD schematics lightbox
│   │   ├── hero/                  # Hero section with animated CTAs & live stats
│   │   ├── layout/                # Navbar, Footer, FloatingContact
│   │   ├── reviews/               # Reviews & Testimonials carousel + modal
│   │   ├── services/              # Product & Services showcase
│   │   └── trust/                 # Why Choose Deccan Space Works trust pillars
│   ├── config/
│   │   └── site.js                # Default static site configuration & fallbacks
│   └── services/
│       └── api.js                 # API client with JWT handling & graceful fallbacks
└── public/
    ├── images/                    # Local brand assets (hero_balcony.jpg, logo.jpg, etc.)
    └── robots.txt                 # SEO crawler controls protecting admin/API routes
```
