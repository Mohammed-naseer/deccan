"""
Deccan Space Works — Secure Admin Creation Script
Prompts for admin credentials, hashes password with bcrypt, and inserts into MongoDB.
Usage:
    python create_admin.py
"""

import asyncio
import getpass
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
from app.core.security import hash_password

async def create_admin():
    print("==================================================")
    print(" DECCAN SPACE WORKS — INITIAL ADMIN SETUP")
    print("==================================================")
    print(f"Connecting to MongoDB at: {settings.MONGODB_URI.split('@')[-1] if '@' in settings.MONGODB_URI else 'local host'}")
    
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    db = client[settings.MONGODB_DATABASE]
    
    try:
        await db.command("ping")
        print("Connected to MongoDB successfully.\n")
    except Exception as e:
        print(f"Error connecting to MongoDB: {e}")
        print("Please check your MONGODB_URI in backend/.env before running this script.")
        return

    name = input("Enter Admin Full Name [e.g. Deccan Admin]: ").strip() or "Deccan Admin"
    email = input("Enter Admin Email [e.g. admin@deccanspaceworks.com]: ").strip().lower()
    
    if not email or "@" not in email:
        print("Error: Valid email address is required.")
        return

    existing = await db.admins.find_one({"email": email})
    if existing:
        print(f"Notice: Admin with email '{email}' already exists.")
        overwrite = input("Do you want to update the password? (y/N): ").strip().lower()
        if overwrite != "y":
            print("Operation cancelled.")
            return

    password = getpass.getpass("Enter Secure Admin Password (min 6 chars): ")
    if len(password) < 6:
        print("Error: Password must be at least 6 characters.")
        return

    confirm_password = getpass.getpass("Confirm Admin Password: ")
    if password != confirm_password:
        print("Error: Passwords do not match.")
        return

    hashed = hash_password(password)

    if existing:
        await db.admins.update_one(
            {"email": email},
            {"$set": {"passwordHash": hashed, "name": name, "updatedAt": datetime.now(timezone.utc)}}
        )
        print(f"\nSuccess! Password updated for admin: {email}")
    else:
        admin_doc = {
            "name": name,
            "email": email,
            "passwordHash": hashed,
            "role": "superadmin",
            "createdAt": datetime.now(timezone.utc),
            "lastLogin": None
        }
        await db.admins.insert_one(admin_doc)
        print(f"\nSuccess! New Superadmin created: {email}")

    print("==================================================")
    client.close()

if __name__ == "__main__":
    asyncio.run(create_admin())
