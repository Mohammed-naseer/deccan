"""
Deccan Space Works — Idempotent Production Admin Setup
Creates or verifies the canonical production administrator account in MongoDB Atlas.

Security & Hygiene:
- Idempotent: If admin@deccanspaceworks.com already exists, it is untouched.
- Non-destructive: Never drops collections or resets data.
- Password is never stored in plaintext: Hashed with bcrypt before storage.
- Password is never hardcoded: Read securely from environment variable or interactive prompt.
- Never prints or logs passwords or password hashes.
"""

import os
import sys
import getpass
import asyncio
from datetime import datetime, timezone

# Ensure backend root is on sys.path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
from app.core.security import hash_password

ADMIN_EMAIL = "admin@deccanspaceworks.com"
ADMIN_NAME = "Deccan Space Works Admin"
ADMIN_ROLE = "admin"

async def setup_production_admin(password: str = None) -> bool:
    """
    Idempotently creates the production admin if not already present.
    Returns True if account exists or was created successfully.
    """
    if not password:
        password = os.environ.get("DSW_ADMIN_INITIAL_PASSWORD")

    client = AsyncIOMotorClient(settings.MONGODB_URI)
    db = client[settings.MONGODB_DATABASE]

    try:
        existing = await db.admins.find_one({"email": ADMIN_EMAIL.lower()})
        if existing:
            print(f"[STATUS] Production admin account '{ADMIN_EMAIL}' already exists in MongoDB Atlas.")
            print(f"         Active: {existing.get('isActive', True)} | Role: {existing.get('role', 'admin')}")
            return True

        if not password:
            if sys.stdin.isatty():
                password = getpass.getpass(f"Enter initial password for {ADMIN_EMAIL}: ")
            else:
                print("[ERROR] DSW_ADMIN_INITIAL_PASSWORD environment variable required for non-interactive execution.")
                return False

        if len(password) < 6:
            print("[ERROR] Password must be at least 6 characters.")
            return False

        # Hash with bcrypt
        password_hash = hash_password(password)

        admin_doc = {
            "name": ADMIN_NAME,
            "email": ADMIN_EMAIL.lower(),
            "passwordHash": password_hash,
            "role": ADMIN_ROLE,
            "isActive": True,
            "createdAt": datetime.now(timezone.utc),
            "updatedAt": datetime.now(timezone.utc),
            "lastLogin": None
        }

        result = await db.admins.insert_one(admin_doc)
        print(f"[SUCCESS] Production admin account created idempotently.")
        print(f"          Email: {ADMIN_EMAIL} | Document ID: {result.inserted_id}")
        return True

    except Exception as e:
        print(f"[ERROR] Failed to set up production admin: {e}")
        return False
    finally:
        client.close()

if __name__ == "__main__":
    pwd_arg = sys.argv[1] if len(sys.argv) > 1 else None
    success = asyncio.run(setup_production_admin(pwd_arg))
    sys.exit(0 if success else 1)
