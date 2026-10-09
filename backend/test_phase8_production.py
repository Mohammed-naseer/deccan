"""
Phase 8 Production Deployment, Hardening & Release Verification Suite
Deccan Space Works — Invisible Grills
"""

import os
import sys
import requests
import json
from pathlib import Path

# Add backend directory to path
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

def test_secret_hygiene():
    print("\n--- 1. Environment Secrets & Git Hygiene Audit ---")
    
    # 1. Check .env exists and has required secrets
    env_path = backend_dir / ".env"
    log_test(".env Exists in Backend Directory", env_path.exists(), str(env_path))
    
    # 2. Check .env.example does not leak live credentials
    example_path = backend_dir / ".env.example"
    example_content = example_path.read_text(encoding="utf-8")
    log_test(
        ".env.example Masks MONGODB_URI",
        "<db_username>" in example_content or "<username>" in example_content,
        "Ensures no real MongoDB credentials in example file"
    )
    log_test(
        ".env.example Masks JWT_SECRET",
        "replace_with" in example_content.lower(),
        "Ensures no real JWT secrets in example file"
    )
    
    # 3. Check root and backend .gitignore
    root_gitignore = backend_dir.parent / ".gitignore"
    backend_gitignore = backend_dir / ".gitignore"
    log_test(
        "Root .gitignore Ignores .env Files",
        ".env" in root_gitignore.read_text(encoding="utf-8"),
        "Verified"
    )
    log_test(
        "Backend .gitignore Ignores .env Files",
        ".env" in backend_gitignore.read_text(encoding="utf-8"),
        "Verified"
    )

def test_render_deployment_config():
    print("\n--- 2. Render Deployment Configuration (render.yaml) ---")
    render_yaml_path = backend_dir / "render.yaml"
    log_test("render.yaml Exists", render_yaml_path.exists(), str(render_yaml_path))
    
    content = render_yaml_path.read_text(encoding="utf-8")
    log_test(
        "Start Command Binds to $PORT Dynamically",
        "--port $PORT" in content,
        "Ensures Render dynamic port assignment works"
    )
    log_test(
        "Host Binds to 0.0.0.0",
        "--host 0.0.0.0" in content,
        "Ensures external incoming requests reach the container"
    )
    log_test(
        "CORS Origins Include Production Domain",
        "deccanspaceworks.com" in content and "deccan-five.vercel.app" in content,
        "Ensures production frontend is authorized"
    )

def test_production_cors_and_headers():
    print("\n--- 3. Production CORS & Security Headers ---")
    res = requests.get(f"{BACKEND_URL}/health")
    log_test(
        "Backend /health Responds 200 OK",
        res.status_code == 200,
        f"payload: {res.json()}"
    )
    headers = res.headers
    log_test(
        "X-Content-Type-Options: nosniff",
        headers.get("X-Content-Type-Options") == "nosniff",
        str(headers.get("X-Content-Type-Options"))
    )
    log_test(
        "X-Frame-Options: DENY",
        headers.get("X-Frame-Options") == "DENY",
        str(headers.get("X-Frame-Options"))
    )
    log_test(
        "Referrer-Policy Present",
        headers.get("Referrer-Policy") == "strict-origin-when-cross-origin",
        str(headers.get("Referrer-Policy"))
    )

async def test_production_flow_phase8():
    print("\n--- 4. Live Production Flow & Verification (PHASE8_TEST_) ---")
    await connect_to_mongo()
    database = get_database()
    
    # 1. Submit public contact enquiry
    test_contact = {
        "name": "PHASE8_TEST_ProductionClient",
        "phone": "9876543210",
        "email": "phase8_prod@example.com",
        "location": "Jubilee Hills, Hyderabad",
        "message": "Phase 8 final production smoke test enquiry."
    }
    
    res = requests.post(f"{BACKEND_URL}/api/contact", json=test_contact)
    log_test(
        "Public Lead Enquiry Submitted",
        res.status_code == 200 and res.json().get("success") is True,
        f"status: {res.status_code}"
    )
    
    # 2. Submit free site visit request
    test_visit = {
        "name": "PHASE8_TEST_SiteVisitClient",
        "phoneNumber": "9123456789",
        "cityArea": "Gachibowli, Hyderabad",
        "preferredVisitDate": "2026-10-15",
        "propertyType": "High-Rise Apartment Balcony",
        "requirementDetails": "Phase 8 final verification site visit."
    }
    res_visit = requests.post(f"{BACKEND_URL}/api/site-visits", data=test_visit)
    log_test(
        "Site Visit Request Submitted",
        res_visit.status_code == 200 and res_visit.json().get("success") is True,
        f"Tracking: {res_visit.json().get('data', {}).get('id')}"
    )
    
    # 3. Verify records physically in MongoDB Atlas
    contact_doc = await database["contacts"].find_one({"name": "PHASE8_TEST_ProductionClient"})
    visit_doc = await database["site_visits"].find_one({"name": "PHASE8_TEST_SiteVisitClient"})
    log_test(
        "Physical Atlas Verification (Contact)",
        contact_doc is not None,
        f"Document ID: {contact_doc.get('_id') if contact_doc else None}"
    )
    log_test(
        "Physical Atlas Verification (Site Visit)",
        visit_doc is not None,
        f"Document ID: {visit_doc.get('_id') if visit_doc else None}"
    )
    
    # 4. Clean up temporary test data cleanly
    c_del = await database["contacts"].delete_many({"name": {"$regex": "^PHASE8_TEST_"}})
    v_del = await database["site_visits"].delete_many({"name": {"$regex": "^PHASE8_TEST_"}})
    log_test(
        "Complete Test Data Cleanup",
        c_del.deleted_count > 0 and v_del.deleted_count > 0,
        f"Purged {c_del.deleted_count} contact(s) and {v_del.deleted_count} site visit(s)"
    )
    
    # 5. Confirm zero residual test records remain
    c_remain = await database["contacts"].count_documents({"name": {"$regex": "^PHASE8_TEST_"}})
    v_remain = await database["site_visits"].count_documents({"name": {"$regex": "^PHASE8_TEST_"}})
    log_test(
        "Zero Residual Test Data Confirmed",
        c_remain == 0 and v_remain == 0,
        f"Remaining: contacts={c_remain}, site_visits={v_remain}"
    )
    
    await close_mongo_connection()

if __name__ == "__main__":
    import asyncio
    print("================================================================")
    print("  PHASE 8 TEST RUNNER — PRODUCTION READINESS & RELEASE AUDIT")
    print("================================================================")
    test_secret_hygiene()
    test_render_deployment_config()
    test_production_cors_and_headers()
    asyncio.run(test_production_flow_phase8())
    print("================================================================")
    print("  PHASE 8 TEST SUITE: ALL PRODUCTION CHECKS PASSED (100%)")
    print("================================================================")
