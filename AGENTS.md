# AGENTS GUIDE — DECCAN SPACE WORKS

## Instructions & Context for AI Agents Working on this Codebase

### 1. Codebase Ground Rules
- **Do NOT break or redesign UI styling**: The dark architectural aesthetic (`deccan-dark`, `deccan-cyan`, `deccan-card`) and typography (Inter + Outfit) must be preserved. Never rewrite styling into generic light templates or alter the design identity without explicit instructions.
- **Do NOT reintroduce fake/mock customer tracking**: Phase 1A deleted `/customer`. Customer portal should only be introduced in Phase 6 as a genuine post-installation warranty/service dashboard connected to database records.
- **Always preserve graceful static fallbacks**: Public components must be able to render static defaults if the backend is down or not yet configured.

### 2. Tech Stack & Environment
- **Frontend**: Next.js 14 App Router, React 18, Tailwind CSS, Framer Motion, Lucide React.
  - Run linting: `npm run lint`
  - Run production build test: `npm run build`
  - Dev server: `npm run dev` (Runs on `http://localhost:3000`)
- **Backend**: FastAPI, Motor (MongoDB), Pydantic v2, PyJWT.
  - Install dependencies: `pip install -r backend/requirements.txt`
  - Run backend: `uvicorn app.main:app --reload --port 8000` (from `backend/` directory)
  - Create admin: `python create_admin.py` (from `backend/` directory)

### 3. API Patterns & Conventions
- Public endpoints are prefixed with `/api/...` (e.g., `/api/content`, `/api/products`, `/api/testimonials`).
- Protected admin endpoints are prefixed with `/api/admin/...` and require `Authorization: Bearer <JWT>`.
- JWT token validation checks that the admin user exists in MongoDB and is active.
- Media handling follows a URL-first pattern: components and admin editors accept direct image URLs in addition to file uploads.
