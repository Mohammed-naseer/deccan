import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from app.core.config import settings
from app.core.database import connect_to_mongo, close_mongo_connection
from app.routes import (
    auth,
    reviews,
    site_visits,
    contacts,
    products,
    gallery,
    videos,
    testimonials,
    service_areas,
    content,
    uploads,
    dashboard
)

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("uvicorn")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect to MongoDB Atlas
    await connect_to_mongo()
    yield
    # Shutdown: Close database pool
    await close_mongo_connection()

app = FastAPI(
    title="Deccan Space Works API",
    description="Production REST API for Deccan Space Works Public Website & Admin Portal",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS Configuration
# Restricts access to production Vercel frontend URL, custom domain, and local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=86400,
)

# Global Custom Exception Handlers for uniform error responses
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    error_messages = []
    for err in exc.errors():
        field = " -> ".join([str(loc) for loc in err["loc"] if loc != "body"])
        error_messages.append(f"{field}: {err['msg']}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "message": "Validation error: " + "; ".join(error_messages),
            "errorCode": "VALIDATION_ERROR",
            "data": None
        }
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error on {request.url.path}: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "message": "An internal server error occurred. Our technical team has been notified.",
            "errorCode": "INTERNAL_SERVER_ERROR",
            "data": None
        }
    )

# Root Health Check
@app.get("/", tags=["Health"])
async def root():
    return {
        "success": True,
        "name": "Deccan Space Works API",
        "status": "operational",
        "environment": settings.ENVIRONMENT,
        "docs": "/docs"
    }

@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "timestamp": "live"}

# Register all Routers
app.include_router(auth.router)
app.include_router(dashboard.router)
app.include_router(reviews.router)
app.include_router(site_visits.router)
app.include_router(contacts.router)
app.include_router(products.router)
app.include_router(gallery.router)
app.include_router(videos.router)
app.include_router(testimonials.router)
app.include_router(service_areas.router)
app.include_router(content.router)
app.include_router(uploads.router)
