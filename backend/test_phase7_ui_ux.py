"""
Phase 7 UI/UX & Public Experience Automated Test Suite
Deccan Space Works — Invisible Grills
"""

import sys
import os
import requests
import json
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

from app.core.config import settings
from app.core.database import connect_to_mongo, close_mongo_connection, get_database

FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:3000")
BACKEND_URL = os.environ.get("BACKEND_URL", "http://127.0.0.1:8000")

def log_test(name, passed, detail=""):
    status = "[PASS]" if passed else "[FAIL]"
    print(f"{status} {name} — {detail}")
    if not passed:
        raise AssertionError(f"Test failed: {name} — {detail}")

def test_css_architectural_tokens():
    print("\n--- 1. CSS Architectural Design System Verification ---")
    css_path = backend_dir.parent / "src" / "app" / "globals.css"
    content = css_path.read_text(encoding="utf-8")
    
    log_test(
        "Architectural Card Token Present",
        ".architectural-card" in content,
        "Ensures precision architectural card utility exists"
    )
    log_test(
        "Hairline Divider Token Present",
        ".hairline-divider" in content,
        "Ensures hairline section separator exists"
    )
    log_test(
        "Cyan Hairline Divider Token Present",
        ".hairline-divider-cyan" in content,
        "Ensures brand cyan hairline divider exists"
    )
    log_test(
        "Prefers Reduced Motion Protected in CSS",
        "@media (prefers-reduced-motion: reduce)" in content,
        "Ensures accessibility motion protection is enforced"
    )

def test_frontend_rendered_dom():
    print("\n--- 2. Public Homepage UI/UX DOM Verification ---")
    res = requests.get(f"{FRONTEND_URL}/")
    log_test(
        "Homepage 200 OK",
        res.status_code == 200,
        f"status: {res.status_code}"
    )
    html = res.text
    
    log_test(
        "Brand Hero Section Present",
        "DECCAN SPACE WORKS" in html,
        "Hero brand identity rendered"
    )
    log_test(
        "Viewport & Mobile-Friendly Config",
        'name="viewport"' in html,
        "Mobile responsive viewport configured"
    )
    log_test(
        "Invisible Grills Engineering Terms Present",
        "SS 316" in html or "high-tensile" in html.lower() or "invisible grill" in html.lower(),
        "Core engineering identity verified"
    )

async def test_live_workflow_phase7():
    print("\n--- 3. Live Conversion Flow & Data Cleanup (PHASE7_TEST_) ---")
    await connect_to_mongo()
    database = get_database()
    
    # 1. Test public contact submission with PHASE7_TEST_ prefix
    test_contact = {
        "name": "PHASE7_TEST_Arjun Rao",
        "phone": "9876543210",
        "email": "phase7_test@example.com",
        "location": "Gachibowli, Hyderabad",
        "message": "Testing Phase 7 premium UI conversion form."
    }
    
    res = requests.post(f"{BACKEND_URL}/api/contact", json=test_contact)
    log_test(
        "Public Contact Conversion Submission",
        res.status_code == 200 and res.json().get("success") is True,
        f"status: {res.status_code}"
    )
    
    # 2. Verify record in MongoDB Atlas
    inserted = await database["contacts"].find_one({"name": "PHASE7_TEST_Arjun Rao"})
    log_test(
        "Contact Document Persisted in Atlas",
        inserted is not None and inserted.get("phone") == "9876543210",
        f"Persisted ID: {inserted.get('_id') if inserted else None}"
    )
    
    # 3. Clean up temporary test data
    del_res = await database["contacts"].delete_many({"name": {"$regex": "^PHASE7_TEST_"}})
    log_test(
        "Test Data Purged from MongoDB Atlas",
        del_res.deleted_count > 0,
        f"Deleted {del_res.deleted_count} temporary test document(s)"
    )
    
    await close_mongo_connection()

if __name__ == "__main__":
    import asyncio
    print("================================================================")
    print("  PHASE 7 TEST RUNNER — UI/UX, AESTHETICS & CONVERSION VERIFICATION")
    print("================================================================")
    test_css_architectural_tokens()
    test_frontend_rendered_dom()
    asyncio.run(test_live_workflow_phase7())
    print("================================================================")
    print("  PHASE 7 TEST SUITE: ALL CHECKS PASSED (100%)")
    print("================================================================")
