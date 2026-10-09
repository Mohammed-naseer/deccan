"""
Deccan Space Works — Phase I1 Complete Integration Audit
Diagnostic Test Suite (I1_TEST_*)

Verifies frontend <-> backend <-> database <-> production integration contracts,
CORS policies, endpoint schemas, environment configurations, and failure modes.
"""

import os
import sys
import json
import time
import asyncio
import urllib.request
import urllib.error
import urllib.parse
from datetime import datetime, timezone

# Ensure backend modules are loadable
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.config import settings
from app.core.database import connect_to_mongo, close_mongo_connection, ping_database, get_database
from app.core.security import hash_password, create_access_token

BACKEND_LOCAL_URL = "http://localhost:8000"
RENDER_PROD_URL = "https://deccan-3jik.onrender.com"

PASSED_AUDITS = []
FAILED_AUDITS = []
DIAGNOSTIC_FINDINGS = []

def record(test_num, name, passed, details="", is_finding=False):
    marker = "I1_TEST_"
    tag = f"[{marker}{test_num:02d}] {name}"
    if passed:
        print(f"  [PASS] {tag} - {details}")
        PASSED_AUDITS.append((test_num, name, details))
    else:
        print(f"  [AUDIT-FLAG] {tag} - {details}")
        if is_finding:
            DIAGNOSTIC_FINDINGS.append((test_num, name, details))
        else:
            FAILED_AUDITS.append((test_num, name, details))

def test_cors_options(base_url, endpoint, origin):
    url = f"{base_url}{endpoint}"
    req = urllib.request.Request(
        url,
        headers={
            "Origin": origin,
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type"
        },
        method="OPTIONS"
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return resp.status, resp.headers.get("Access-Control-Allow-Origin")
    except urllib.error.HTTPError as e:
        return e.code, e.headers.get("Access-Control-Allow-Origin")
    except Exception as e:
        return 0, str(e)

def test_cors_get(base_url, endpoint, origin):
    url = f"{base_url}{endpoint}"
    req = urllib.request.Request(url, headers={"Origin": origin})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return resp.status, resp.headers.get("Access-Control-Allow-Origin")
    except urllib.error.HTTPError as e:
        return e.code, e.headers.get("Access-Control-Allow-Origin")
    except Exception as e:
        return 0, str(e)

async def run_i1_audit():
    print("=" * 80)
    print(" DECCAN SPACE WORKS — PHASE I1 INTEGRATION AUDIT SUITE")
    print("=" * 80)

    # -------------------------------------------------------------------------
    # 1. Local Backend CORS Audit (localhost:3000 vs localhost:3001)
    # -------------------------------------------------------------------------
    print("\n--- [Section 1] Local Backend CORS Policy Audit ---")
    st_3000, h_3000 = test_cors_options(BACKEND_LOCAL_URL, "/api/site-visits", "http://localhost:3000")
    record(1, "Local Port 3000 OPTIONS Preflight", st_3000 == 200 and h_3000 == "http://localhost:3000",
           f"Status: {st_3000}, CORS Header: {h_3000}")

    st_3001, h_3001 = test_cors_options(BACKEND_LOCAL_URL, "/api/site-visits", "http://localhost:3001")
    # This is an observed issue: 3001 is missing from backend CORS
    record(2, "Local Port 3001 OPTIONS Preflight (Target Defect)", st_3001 == 200,
           f"Status: {st_3001}, CORS Header: {h_3001} (Root Cause: 3001 absent in backend allow_origins)", is_finding=True)

    st_127_3001, h_127_3001 = test_cors_options(BACKEND_LOCAL_URL, "/api/site-visits", "http://127.0.0.1:3001")
    record(3, "Local 127.0.0.1:3001 OPTIONS Preflight", st_127_3001 == 200,
           f"Status: {st_127_3001}, CORS Header: {h_127_3001} (Root Cause: 127.0.0.1:3001 absent)", is_finding=True)

    # -------------------------------------------------------------------------
    # 2. Live Render Production Backend CORS Audit
    # -------------------------------------------------------------------------
    print("\n--- [Section 2] Live Render Backend CORS Policy Audit ---")
    st_five, h_five = test_cors_options(RENDER_PROD_URL, "/api/site-visits", "https://deccan-five.vercel.app")
    record(4, "Render Backend deccan-five.vercel.app Preflight", st_five == 200 and h_five == "https://deccan-five.vercel.app",
           f"Status: {st_five}, CORS Header: {h_five}")

    st_ds_vercel, h_ds_vercel = test_cors_options(RENDER_PROD_URL, "/api/site-visits", "https://deccanspaceworks.vercel.app")
    record(5, "Render Backend deccanspaceworks.vercel.app Preflight", st_ds_vercel == 200,
           f"Status: {st_ds_vercel}, CORS Header: {h_ds_vercel} (Defect: deccanspaceworks.vercel.app missing on Render env)", is_finding=True)

    st_custom, h_custom = test_cors_options(RENDER_PROD_URL, "/api/site-visits", "https://deccanspaceworks.com")
    record(6, "Render Backend deccanspaceworks.com Preflight", st_custom == 200,
           f"Status: {st_custom}, CORS Header: {h_custom} (Defect: deccanspaceworks.com missing on Render env)", is_finding=True)

    # -------------------------------------------------------------------------
    # 3. Public API Catalog Responsiveness & Schema Structure
    # -------------------------------------------------------------------------
    print("\n--- [Section 3] Public API Catalog Audit ---")
    public_endpoints = [
        ("/api/content", dict),
        ("/api/products", list),
        ("/api/gallery", list),
        ("/api/videos", list),
        ("/api/testimonials", list),
        ("/api/reviews", list),
        ("/api/service-areas", list),
    ]
    for ep, expected_type in public_endpoints:
        url = f"{BACKEND_LOCAL_URL}{ep}"
        try:
            req = urllib.request.Request(url)
            with urllib.request.urlopen(req, timeout=5) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                d_val = data.get("data")
                is_valid = resp.status == 200 and isinstance(d_val, expected_type)
                record(7, f"Public Endpoint Contract {ep}", is_valid,
                       f"Status: {resp.status}, Expected: {expected_type.__name__}, Received: {type(d_val).__name__}")
        except Exception as e:
            record(7, f"Public Endpoint Contract {ep}", False, f"Exception: {e}")

    # -------------------------------------------------------------------------
    # 4. Site Visit Endpoint Content-Type & FormData Protocol Audit
    # -------------------------------------------------------------------------
    print("\n--- [Section 4] Site Visit Form Protocol Audit ---")
    # Test JSON submission against /api/site-visits (FastAPI Form(...) vs JSON)
    json_payload = json.dumps({"name": "Test", "phoneNumber": "9100720137", "cityArea": "Gachibowli"}).encode("utf-8")
    req_json = urllib.request.Request(
        f"{BACKEND_LOCAL_URL}/api/site-visits",
        data=json_payload,
        headers={"Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(req_json, timeout=5) as resp:
            record(8, "Site Visit Rejects application/json (Requires Form)", False, f"Unexpected 200 for JSON: {resp.status}")
    except urllib.error.HTTPError as e:
        # Expected: FastAPI returns 422 because Form(...) fields are not parsed from JSON body
        record(8, "Site Visit Requires multipart/form-data Protocol", e.code == 422,
               f"HTTP {e.code} (FastAPI Form(...) requires Form/Multipart, not JSON)")

    # -------------------------------------------------------------------------
    # 5. Error Fallback & Exception Handling Audit
    # -------------------------------------------------------------------------
    print("\n--- [Section 5] Error Handling & Fallback Text Audit ---")
    api_js_code = open("src/services/api.js", "r", encoding="utf-8").read()
    has_misleading_msg = "Backend service is currently not configured" in api_js_code
    record(9, "Frontend api.js Static Config Check", has_misleading_msg,
           "Message thrown when API_BASE_URL is falsy: 'Backend service is currently not configured'")

    # -------------------------------------------------------------------------
    # 6. MongoDB Atlas Live Connectivity & Index Health
    # -------------------------------------------------------------------------
    print("\n--- [Section 6] Database Connectivity Audit ---")
    await connect_to_mongo()
    db = get_database()
    is_atlas_up = await ping_database()
    record(10, "MongoDB Atlas WAN Ping Status", is_atlas_up, f"Database: {settings.MONGODB_DATABASE}")

    coll_names = await db.list_collection_names()
    expected_colls = [
        "admins", "contacts", "site_visits", "reviews", "testimonials",
        "products", "gallery", "videos", "service_areas", "website_content",
        "media", "activity_logs"
    ]
    all_colls_present = all(c in coll_names for c in expected_colls)
    record(11, "All 12 Core Architectural Collections Exist", all_colls_present, f"Present: {len(coll_names)} collections")

    # -------------------------------------------------------------------------
    # 7. Environment Variables & Secret Masking Audit
    # -------------------------------------------------------------------------
    print("\n--- [Section 7] Environment Configuration Audit ---")
    root_env_example = open(".env.example", "r", encoding="utf-8").read()
    backend_env_example = open("backend/.env.example", "r", encoding="utf-8").read()
    render_yaml = open("backend/render.yaml", "r", encoding="utf-8").read()

    record(12, "Root .env.example Declares NEXT_PUBLIC_API_URL", "NEXT_PUBLIC_API_URL" in root_env_example, "Present")
    record(13, "Backend .env.example Masks MONGODB_URI", "<" in backend_env_example or "placeholder" in backend_env_example.lower(), "Masked")
    record(14, "render.yaml Configures FRONTEND_URL", "FRONTEND_URL" in render_yaml, "Present")

    # -------------------------------------------------------------------------
    # 8. External Services Dry-Run Audit
    # -------------------------------------------------------------------------
    print("\n--- [Section 8] External Services Audit ---")
    record(15, "Resend Email Service Configured for Dry-Run", not bool(settings.RESEND_API_KEY), "Dry-run / logging active")
    record(16, "WhatsApp Cloud API Configured for Safe Fallback", not bool(settings.WHATSAPP_ACCESS_TOKEN), "Dry-run / logging active")

    await close_mongo_connection()

    # -------------------------------------------------------------------------
    # Summary of Findings
    # -------------------------------------------------------------------------
    print("\n" + "=" * 80)
    print(f" I1 AUDIT CHECKS: {len(PASSED_AUDITS)} PASSED | {len(DIAGNOSTIC_FINDINGS)} DIAGNOSTIC FINDINGS IDENTIFIED")
    print("=" * 80)
    for num, name, details in DIAGNOSTIC_FINDINGS:
        print(f"  * FINDING [{num:02d}]: {name} -> {details}")

if __name__ == "__main__":
    asyncio.run(run_i1_audit())
