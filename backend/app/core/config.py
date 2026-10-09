from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List
import os

class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    PORT: int = 8000
    
    # MongoDB Atlas (Loaded from backend/.env)
    MONGODB_URI: str = ""
    MONGODB_DATABASE: str = "deccan_space_works"
    
    # Security (Loaded from backend/.env)
    JWT_SECRET: str = ""
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    
    # Cloudinary
    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""
    
    # Resend Email
    RESEND_API_KEY: str = ""
    OWNER_EMAIL: str = "Deccanspaceworks@gmail.com"
    SENDER_EMAIL: str = "notifications@deccanspaceworks.com"
    
    # WhatsApp Official Cloud API
    WHATSAPP_API_URL: str = "https://graph.facebook.com/v20.0"
    WHATSAPP_ACCESS_TOKEN: str = ""
    WHATSAPP_PHONE_NUMBER_ID: str = ""
    WHATSAPP_RECIPIENT_NUMBER: str = "919100720137"
    
    # CORS (supports either CORS_ORIGINS or FRONTEND_URL)
    CORS_ORIGINS: str = ""
    FRONTEND_URL: str = "https://deccanspaceworks.com,https://www.deccanspaceworks.com,https://deccanspaceworks.vercel.app,https://deccan-five.vercel.app,http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001,http://localhost:3002,http://127.0.0.1:3002"

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def cors_origins(self) -> List[str]:
        raw = self.CORS_ORIGINS or self.FRONTEND_URL
        default_origins = [
            "https://deccanspaceworks.com",
            "https://www.deccanspaceworks.com",
            "https://deccanspaceworks.vercel.app",
            "https://deccan-five.vercel.app",
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:3001",
            "http://127.0.0.1:3001",
            "http://localhost:3002",
            "http://127.0.0.1:3002"
        ]
        origins = []
        if raw:
            for url in raw.split(","):
                cleaned = url.strip().rstrip("/")
                if cleaned and cleaned not in origins:
                    origins.append(cleaned)
        else:
            origins = list(default_origins)

        # Always guarantee canonical production domains are included
        canonical_production = [
            "https://deccanspaceworks.com",
            "https://www.deccanspaceworks.com",
            "https://deccanspaceworks.vercel.app",
            "https://deccan-five.vercel.app",
        ]
        for prod_origin in canonical_production:
            if prod_origin not in origins:
                origins.append(prod_origin)

        # In development/staging, always guarantee local development origins are present
        if self.ENVIRONMENT != "production":
            for local_origin in [
                "http://localhost:3000",
                "http://127.0.0.1:3000",
                "http://localhost:3001",
                "http://127.0.0.1:3001",
                "http://localhost:3002",
                "http://127.0.0.1:3002",
            ]:
                if local_origin not in origins:
                    origins.append(local_origin)

        return origins

settings = Settings()
