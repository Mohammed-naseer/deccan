from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List
import os

class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    PORT: int = 8000
    
    # MongoDB Atlas
    MONGODB_URI: str = "mongodb://localhost:27017"
    MONGODB_DATABASE: str = "deccan_space_works"
    
    # Security
    JWT_SECRET: str = "deccan_space_works_secure_default_secret_key_change_in_production"
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
    
    # CORS
    FRONTEND_URL: str = "https://deccan-five.vercel.app,http://localhost:3000,http://127.0.0.1:3000"

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def cors_origins(self) -> List[str]:
        if not self.FRONTEND_URL:
            return ["http://localhost:3000", "https://deccan-five.vercel.app"]
        origins = [url.strip() for url in self.FRONTEND_URL.split(",") if url.strip()]
        return origins

settings = Settings()
