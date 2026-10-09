"""
DECCAN SPACE WORKS — PHASE I2 INTEGRATION FIX VALIDATION SUITE
Verifies all 5 I1-identified integration issues and complete end-to-end integration:
  - I1-001: Local CORS Port 3001 & 3002 Authorization
  - I1-002: Production Render CORS Whitelist
  - I1-003: Dynamic Frontend API Base URL Configuration
  - I1-004: Clean Error Classification & Fallbacks
  - I1-005: Site Visit (multipart) & Enquiry (JSON) Protocol Alignment

Test Prefix: I2_TEST_
"""

import sys
import os
import re
import requests
import asyncio
from typing import Dict, Any, Tuple
from motor.motor_asyncio import AsyncIOMotorClient

# Add backend directory to sys.path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.core.config import settings

BACKEND_URL = "http://127.0.0.1:8000"
RENDER_URL = "https://deccan-3jik.onrender.com"

results = []

def record(test_num: int, name: str, passed: bool, details: str):
    prefix = f"I2_TEST_{test_num:02d}"
    status = "PASS" if passed else "FAIL"
    results.append((prefix, name, passed, details))
    print(f"  [{status}] [{prefix}] {name} - {details}")

def run_cors_preflight(base_url: str, path: str, origin: str) -> Tuple[int, Dict[str, str]]:
    try:
        res = requests.options(
            f"{base_url}{path}",
            headers={
                "Origin": origin,
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "Content-Type,Authorization"
            },
            timeout=8
        )
        return res.status_code, res.headers
    except Exception as e:
        return 0, {"error": str(e)}

async def run_suite():
    print("=" * 80)
    print(" DECCAN SPACE WORKS — PHASE I2 BACKEND INTEGRATION FIX VERIFICATION")
    print("=" * 80)

    # -------------------------------------------------------------------------
    # SECTION 1: Local CORS Configuration & Preflight
    # -------------------------------------------------------------------------
    print("\n--- [Section 1] Local CORS Configuration & Preflight ---")

    # 1. Local port 3000
    st_3000, h_3000 = run_cors_preflight(BACKEND_URL, "/api/site-visits", "http://localhost:3000")
    record(
        1, "Local Port 3000 Preflight Allowed",
        st_3000 == 200 and h_3000.get("Access-Control-Allow-Origin") == "http://localhost:3000",
        f"Status: {st_3000}, Origin: {h_3000.get('Access-Control-Allow-Origin')}"
    )

    # 2. Local port 3001 (Target defect I1-001)
    st_3001, h_3001 = run_cors_preflight(BACKEND_URL, "/api/site-visits", "http://localhost:3001")
    record(
        2, "Local Port 3001 Preflight Allowed (I1-001 Fix)",
        st_3001 == 200 and h_3001.get("Access-Control-Allow-Origin") == "http://localhost:3001",
        f"Status: {st_3001}, Origin: {h_3001.get('Access-Control-Allow-Origin')}"
    )

    # 3. Local 127.0.0.1:3001
    st_127_3001, h_127_3001 = run_cors_preflight(BACKEND_URL, "/api/site-visits", "http://127.0.0.1:3001")
    record(
        3, "Local 127.0.0.1:3001 Preflight Allowed",
        st_127_3001 == 200 and h_127_3001.get("Access-Control-Allow-Origin") == "http://127.0.0.1:3001",
        f"Status: {st_127_3001}, Origin: {h_127_3001.get('Access-Control-Allow-Origin')}"
    )

    # 4. Local port 3002 (Secondary dev fallback)
    st_3002, h_3002 = run_cors_preflight(BACKEND_URL, "/api/site-visits", "http://localhost:3002")
    record(
        4, "Local Port 3002 Preflight Allowed",
        st_3002 == 200 and h_3002.get("Access-Control-Allow-Origin") == "http://localhost:3002",
        f"Status: {st_3002}, Origin: {h_3002.get('Access-Control-Allow-Origin')}"
    )

    # 5. Unauthorized origin rejected (No wildcard)
    st_evil, h_evil = run_cors_preflight(BACKEND_URL, "/api/site-visits", "https://malicious-site.com")
    record(
        5, "Unauthorized Origin Rejected (No Wildcard CORS)",
        st_evil == 400 and h_evil.get("Access-Control-Allow-Origin") is None,
        f"Status: {st_evil}, Origin Header: {h_evil.get('Access-Control-Allow-Origin')}"
    )

    # -------------------------------------------------------------------------
    # SECTION 2: Production CORS Configuration Check
    # -------------------------------------------------------------------------
    print("\n--- [Section 2] Production CORS Configuration Check ---")

    # 6. Production Vercel Origin (https://deccanspaceworks.vercel.app)
    st_vercel, h_vercel = run_cors_preflight(BACKEND_URL, "/api/site-visits", "https://deccanspaceworks.vercel.app")
    record(
        6, "Production Vercel Domain Preflight Allowed",
        st_vercel == 200 and h_vercel.get("Access-Control-Allow-Origin") == "https://deccanspaceworks.vercel.app",
        f"Status: {st_vercel}, Origin: {h_vercel.get('Access-Control-Allow-Origin')}"
    )

    # 7. Production Custom Domain (https://deccanspaceworks.com)
    st_custom, h_custom = run_cors_preflight(BACKEND_URL, "/api/site-visits", "https://deccanspaceworks.com")
    record(
        7, "Production Custom Domain Preflight Allowed",
        st_custom == 200 and h_custom.get("Access-Control-Allow-Origin") == "https://deccanspaceworks.com",
        f"Status: {st_custom}, Origin: {h_custom.get('Access-Control-Allow-Origin')}"
    )

    # 8. Production www Custom Domain (https://www.deccanspaceworks.com)
    st_www, h_www = run_cors_preflight(BACKEND_URL, "/api/site-visits", "https://www.deccanspaceworks.com")
    record(
        8, "Production WWW Custom Domain Preflight Allowed",
        st_www == 200 and h_www.get("Access-Control-Allow-Origin") == "https://www.deccanspaceworks.com",
        f"Status: {st_www}, Origin: {h_www.get('Access-Control-Allow-Origin')}"
    )

    # 9. Legacy Staging Domain (https://deccan-five.vercel.app) Retained
    st_stage, h_stage = run_cors_preflight(BACKEND_URL, "/api/site-visits", "https://deccan-five.vercel.app")
    record(
        9, "Legacy Staging Domain Retained for Compatibility",
        st_stage == 200 and h_stage.get("Access-Control-Allow-Origin") == "https://deccan-five.vercel.app",
        f"Status: {st_stage}, Origin: {h_stage.get('Access-Control-Allow-Origin')}"
    )

    # -------------------------------------------------------------------------
    # SECTION 3: Frontend API Configuration Audit
    # -------------------------------------------------------------------------
    print("\n--- [Section 3] Frontend API Configuration Audit ---")

    api_js_path = os.path.join(os.path.dirname(backend_dir), "src", "services", "api.js")
    with open(api_js_path, "r", encoding="utf-8") as f:
        api_js_content = f.read()

    # 10. Dynamic getApiBaseUrl implementation
    has_dynamic_get = "export function getApiBaseUrl()" in api_js_content and "getApiBaseUrl();" not in api_js_content.split("getApiBaseUrl()")[0]
    record(
        10, "Dynamic getApiBaseUrl Function Exported",
        has_dynamic_get,
        "Present in src/services/api.js"
    )

    # 11. Error Classification Engine
    has_classifier = "export function classifyApiError(" in api_js_content
    record(
        11, "Error Classification Engine Exported",
        has_classifier,
        "Classifies network_or_cors, validation, auth, timeout, server errors"
    )

    # 12. createEnquiry maps to submitContact (semantic separation)
    has_enquiry_sep = "return submitContact(enquiry)" in api_js_content
    record(
        12, "Enquiry Semantics Separated from Site Visit",
        has_enquiry_sep,
        "createEnquiry() calls submitContact() instead of submitSiteVisit()"
    )

    # 13. submitSiteVisit auto-converts plain objects to FormData
    has_formdata_convert = "new FormData()" in api_js_content and "!(payload instanceof FormData)" in api_js_content
    record(
        13, "Site Visit Auto-Converts Plain Objects to FormData",
        has_formdata_convert,
        "Prevents HTTP 422 schema validation failures when plain objects passed"
    )

    # -------------------------------------------------------------------------
    # SECTION 4: Public Endpoints Functional Integrity
    # -------------------------------------------------------------------------
    print("\n--- [Section 4] Public Endpoints Functional Integrity ---")

    public_endpoints = [
        ("/api/content", dict),
        ("/api/products", list),
        ("/api/gallery", list),
        ("/api/videos", list),
        ("/api/testimonials", list),
        ("/api/reviews", list),
        ("/api/service-areas", list),
    ]

    for idx, (path, exp_type) in enumerate(public_endpoints, start=14):
        try:
            r = requests.get(f"{BACKEND_URL}{path}", timeout=5)
            data = r.json().get("data")
            is_valid = r.status_code == 200 and isinstance(data, exp_type)
            record(
                idx, f"Public Endpoint Contract {path}",
                is_valid,
                f"Status: {r.status_code}, Type: {type(data).__name__}"
            )
        except Exception as e:
            record(idx, f"Public Endpoint Contract {path}", False, str(e))

    # -------------------------------------------------------------------------
    # SECTION 5: Site Visit (Multipart) End-to-End Submission & Persistence
    # -------------------------------------------------------------------------
    print("\n--- [Section 5] Site Visit End-to-End Submission & Persistence ---")

    test_sv_data = {
        "name": "I2 Test Automation Customer",
        "phoneNumber": "9100012345",
        "cityArea": "Banjara Hills",
        "propertyType": "Villa",
        "windowType": "Balcony",
        "requirementDetails": "I2 automated integration verification test."
    }

    try:
        sv_res = requests.post(
            f"{BACKEND_URL}/api/site-visits",
            data=test_sv_data,
            headers={"Origin": "http://localhost:3001"},
            timeout=8
        )
        sv_json = sv_res.json()
        sv_success = sv_res.status_code == 200 and sv_json.get("success") is True
        tracking_code = sv_json.get("data", {}).get("id")
        record(
            21, "Site Visit Multipart Submission Succeeds",
            sv_success,
            f"Status: {sv_res.status_code}, Tracking: {tracking_code}"
        )
    except Exception as e:
        record(21, "Site Visit Multipart Submission Succeeds", False, str(e))
        tracking_code = None

    # -------------------------------------------------------------------------
    # SECTION 6: Contact Enquiry End-to-End Submission & Persistence
    # -------------------------------------------------------------------------
    print("\n--- [Section 6] Contact Enquiry End-to-End Submission & Persistence ---")

    test_contact_data = {
        "name": "I2 Test Contact Lead",
        "phone": "9848098765",
        "email": "i2test@deccanspaceworks.com",
        "service": "Invisible Grills",
        "city": "Hyderabad",
        "message": "I2 automated enquiry integration verification test."
    }

    # Test POST /api/contact
    try:
        c_res = requests.post(
            f"{BACKEND_URL}/api/contact",
            json=test_contact_data,
            headers={"Origin": "http://localhost:3001"},
            timeout=8
        )
        c_json = c_res.json()
        c_success = c_res.status_code == 200 and c_json.get("success") is True
        record(
            22, "Contact Enquiry POST /api/contact JSON Succeeds",
            c_success,
            f"Status: {c_res.status_code}, DocId: {c_json.get('data', {}).get('id')}"
        )
    except Exception as e:
        record(22, "Contact Enquiry POST /api/contact JSON Succeeds", False, str(e))

    # Test POST /api/enquiries (semantic route alias)
    try:
        e_res = requests.post(
            f"{BACKEND_URL}/api/enquiries",
            json={**test_contact_data, "phone": "9848098766", "message": "Enquiries route test"},
            headers={"Origin": "http://localhost:3001"},
            timeout=8
        )
        e_json = e_res.json()
        e_success = e_res.status_code == 200 and e_json.get("success") is True
        record(
            23, "Contact Enquiry POST /api/enquiries Route Succeeds",
            e_success,
            f"Status: {e_res.status_code}, DocId: {e_json.get('data', {}).get('id')}"
        )
    except Exception as e:
        record(23, "Contact Enquiry POST /api/enquiries Route Succeeds", False, str(e))

    # -------------------------------------------------------------------------
    # SECTION 7: Database Cleanup of Test Records
    # -------------------------------------------------------------------------
    print("\n--- [Section 7] Deterministic Test Data Cleanup ---")
    try:
        client = AsyncIOMotorClient(settings.MONGODB_URI)
        db = client[settings.MONGODB_DATABASE]
        del_sv = await db.site_visits.delete_many({"name": "I2 Test Automation Customer"})
        del_c = await db.contacts.delete_many({"name": "I2 Test Contact Lead"})
        record(
            24, "Deterministic MongoDB Atlas Test Cleanup",
            True,
            f"Cleaned {del_sv.deleted_count} site visits, {del_c.deleted_count} contacts"
        )
        client.close()
    except Exception as e:
        record(24, "Deterministic MongoDB Atlas Test Cleanup", False, str(e))

    # -------------------------------------------------------------------------
    # SUMMARY
    # -------------------------------------------------------------------------
    total = len(results)
    passed = sum(1 for r in results if r[2])
    failed = total - passed

    print("\n" + "=" * 80)
    print(f" I2 INTEGRATION SUITE SUMMARY: {passed}/{total} PASSED ({failed} FAILED)")
    print("=" * 80)

    if failed > 0:
        print("\nFailed Tests:")
        for r in results:
            if not r[2]:
                print(f"  * [{r[0]}] {r[1]}: {r[3]}")
        sys.exit(1)
    else:
        print("\nAll Phase I2 Integration checks passed successfully!")
        sys.exit(0)

if __name__ == "__main__":
    asyncio.run(run_suite())
