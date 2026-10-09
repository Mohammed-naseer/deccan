# REQUIREMENTS — DECCAN SPACE WORKS

## 1. Functional Requirements

### 1.1 Public Website
- **Branding & Presentation**: Showcase Deccan Space Works with premium architectural aesthetics.
- **Dynamic Content Wiring**: Public components (`HeroSection`, `HomeServicesSection`, `ServiceAreasSection`, `TrustSection`, `ReviewsSection`, `Navbar`, `FloatingContact`) must dynamically fetch backend content from FastAPI (`/api/content`, `/api/products`, `/api/service-areas`, `/api/testimonials`, `/api/reviews`) while falling back gracefully to static defaults if backend is unreachable.
- **Lead Capture**:
  - Direct Site Visit booking form with name, phone, optional email, location, service type, and optional site photos.
  - General contact/enquiry modal with validation.
  - Quick WhatsApp & direct phone calling CTAs with prefilled message templates.
- **Social Proof**:
  - Carousel of approved testimonials and customer reviews.
  - Public submission modal allowing customers to write reviews that enter pending approval queue.

### 1.2 Admin Management Portal
- **Secure Authentication**:
  - Secure email + password authentication against MongoDB `admins` collection.
  - JWT token verification on every protected route.
  - Rejection of disabled or deleted admins.
  - Removal of mock credentials/auto-login shortcuts.
- **Content & Lead Management**:
  - Site visits queue with status management (Pending, Confirmed, Completed, Cancelled).
  - Customer contacts & enquiries triage.
  - Product catalog editing with images, descriptions, and feature lists.
  - Service areas management for Hyderabad neighborhoods.
  - Testimonial and review approval/rejection moderation.
  - Media asset management with URL-first direct links and upload handling.
  - Website general copy, contact numbers, and statistics customization.
  - Audit logging of admin actions in `admin_activity` collection.

---

## 2. Non-Functional & Security Requirements

- **Security & Integrity**:
  - HTML injection prevention: user-controlled fields in emails and inputs sanitized.
  - Upload protection: strict file size checks (10MB image, 50MB video) and MIME type validation.
  - Robots exclusion: `/public/robots.txt` disallows search engines from indexing `/admin/` and `/api/` endpoints.
- **Accessibility & UX**:
  - Keyboard focus trapping in all modals (`WriteReviewModal`, `VisualGallery` lightbox).
  - Escape key closes open modals.
  - Focus returns to triggering button upon modal dismissal.
  - Complete ARIA attributes on interactive and icon elements.
- **Performance & Reliability**:
  - Clean Next.js 14 production builds without lint errors.
  - Graceful static fallback across all public data fetchers so site functions perfectly even when backend is offline.
  - URL-first media support so external CDNs or direct URLs work alongside local storage.
