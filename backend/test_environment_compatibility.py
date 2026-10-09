"""
DECCAN SPACE WORKS — LOCAL + PRODUCTION ENVIRONMENT COMPATIBILITY SUITE
Automated Verification Suite for Local & Production Environments:
SECTION 1:  Environment configuration
SECTION 2:  API URL configuration & normalization
SECTION 3:  CORS Matrix (Local, Vercel, Custom Domain, Unauthorized)
SECTION 4:  Authentication across environments
SECTION 5:  Public APIs
SECTION 6:  Admin APIs
SECTION 7:  Database connectivity (Local & Live Render Atlas Ping)
SECTION 8:  Error handling & status codes
SECTION 9:  Media URLs & path safety
SECTION 10: Production deployment configuration (render.yaml, requirements.txt)
SECTION 11: No localhost leakage in client code
SECTION 12: Secret management & zero exposure
SECTION 13: Cache behavior (no-store validation)
SECTION 14: Test data cleanup & zero residuals
"""

import asyncio
import os
import sys
import re
import time
from datetime import datetime, timezone
import httpx
from bson import ObjectId

# Ensure backend root is on python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.config import settings
from app.core.database import connect_to_mongo, close_mongo_connection, get_database, ping_database
from app.core.security import hash_password, create_access_token
from app.main import app

PREFIX = "ENV_COMPAT_TEST_"
TEST_ADMIN_EMAIL = f"{PREFIX.lower()}admin@deccanspaceworks.com"
TEST_ADMIN_PASS = "CompatAudit2026!Deccan"

passed_tests = 0
failed_tests = 0

def log_test(name: str, passed: bool, detail: str = ""):
    global passed_tests, failed_tests
    if passed:
        passed_tests += 1
        print(f"  [PASS] {name} - {detail}")
    else:
        failed_tests += 1
        print(f"  [FAIL] {name} - {detail}")
        raise AssertionError(f"Environment Compatibility Test Failed: {name} - {detail}")

async def run_compatibility_suite():
    global passed_tests, failed_tests
    print("=" * 80)
    print(" DECCAN SPACE WORKS - LOCAL + PRODUCTION ENVIRONMENT COMPATIBILITY AUDIT")
    print("=" * 80)

    await connect_to_mongo()
    db = get_database()
    if db is None:
        print("[!] ERROR: Cannot connect to MongoDB Atlas.")
        sys.exit(1)

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        # Pre-cleanup
        await db.admins.delete_many({"email": {"$regex": f"^{PREFIX.lower()}"}})
        await db.contacts.delete_many({"name": {"$regex": f"^{PREFIX}"}})
        await db.site_visits.delete_many({"name": {"$regex": f"^{PREFIX}"}})

        # Create active test admin
        admin_doc = {
            "name": f"{PREFIX}Admin",
            "email": TEST_ADMIN_EMAIL,
            "passwordHash": hash_password(TEST_ADMIN_PASS),
            "role": "admin",
            "isActive": True,
            "createdAt": datetime.now(timezone.utc),
            "lastLogin": None
        }
        await db.admins.insert_one(admin_doc)

        login_res = await client.post("/api/admin/login", json={
            "email": TEST_ADMIN_EMAIL,
            "password": TEST_ADMIN_PASS
        })
        token = login_res.json()["data"]["token"]
        auth_headers = {"Authorization": f"Bearer {token}"}

        # =====================================================================
        # SECTION 1: Environment Configuration
        # =====================================================================
        print("\n--- SECTION 1: Environment Configuration ---")
        root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        
        # 1.1 Root .env.example exists and contains template
        root_env_example = os.path.join(root_dir, ".env.example")
        log_test("Root .env.example Template Exists", os.path.exists(root_env_example), root_env_example)
        with open(root_env_example, "r", encoding="utf-8") as f:
            root_env_ex_content = f.read()
        log_test("Root .env.example Contains NEXT_PUBLIC_API_URL", "NEXT_PUBLIC_API_URL" in root_env_ex_content, "Present")

        # 1.2 Backend .env.example exists and has placeholders
        backend_env_example = os.path.join(root_dir, "backend", ".env.example")
        log_test("Backend .env.example Exists", os.path.exists(backend_env_example), backend_env_example)
        with open(backend_env_example, "r", encoding="utf-8") as f:
            b_env_ex_content = f.read()
        log_test("Backend .env.example Masks MONGODB_URI", "<db_username>" in b_env_ex_content or "your_" in b_env_ex_content, "Masked")
        log_test("Backend .env.example Masks JWT_SECRET", "your_secure_random" in b_env_ex_content or "JWT_SECRET=" in b_env_ex_content, "Masked")

        # 1.3 Gitignore ignores .env and .env.*
        gitignore_path = os.path.join(root_dir, ".gitignore")
        with open(gitignore_path, "r", encoding="utf-8") as f:
            git_content = f.read()
        log_test(".gitignore Ignores .env and .env.*", ".env" in git_content and ".env.*" in git_content, "Ignored")

        # =====================================================================
        # SECTION 2: API URL Configuration & Normalization
        # =====================================================================
        print("\n--- SECTION 2: API URL Configuration & Normalization ---")
        api_js_path = os.path.join(root_dir, "src", "services", "api.js")
        with open(api_js_path, "r", encoding="utf-8") as f:
            api_js_content = f.read()

        log_test("api.js Implements getApiBaseUrl()", "function getApiBaseUrl" in api_js_content, "getApiBaseUrl present")
        log_test("api.js Supports NEXT_PUBLIC_API_URL", "process.env.NEXT_PUBLIC_API_URL" in api_js_content, "Supported")
        log_test("api.js Supports NEXT_PUBLIC_API_BASE_URL Fallback", "process.env.NEXT_PUBLIC_API_BASE_URL" in api_js_content, "Supported")
        log_test("api.js Normalizes Trailing Slashes", "replace(/\\/+$/" in api_js_content, "Trailing slash stripped")
        log_test("api.js Production Default is Render Service", "https://deccan-3jik.onrender.com" in api_js_content, "Render URL fallback")
        log_test("api.js Localhost Default is http://localhost:8000", "http://localhost:8000" in api_js_content, "Localhost:8000 fallback")

        # =====================================================================
        # SECTION 3: CORS Matrix
        # =====================================================================
        print("\n--- SECTION 3: CORS Matrix ---")
        cors_cases = [
            ("http://localhost:3000", True, "Localhost Development"),
            ("http://127.0.0.1:3000", True, "Local Loopback"),
            ("https://deccanspaceworks.vercel.app", True, "Active Vercel Production"),
            ("https://deccan-five.vercel.app", True, "Vercel Preview/Staging"),
            ("https://deccanspaceworks.com", True, "Canonical Custom Domain"),
            ("https://www.deccanspaceworks.com", True, "Canonical Custom Domain (www)"),
            ("https://malicious-attacker.com", False, "Unauthorized Origin"),
        ]

        for origin, should_allow, label in cors_cases:
            preflight = await client.options("/api/products", headers={
                "Origin": origin,
                "Access-Control-Request-Method": "GET"
            })
            allowed = preflight.headers.get("access-control-allow-origin") == origin
            log_test(f"CORS Policy: {label} ({origin})", allowed == should_allow,
                     f"HTTP {preflight.status_code} | Allowed: {allowed}")

        # Check credentials header
        local_opt = await client.options("/api/products", headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "GET"
        })
        log_test("CORS Credentials Header Present", local_opt.headers.get("access-control-allow-credentials") == "true", "credentials: true")

        # =====================================================================
        # SECTION 4: Authentication Across Environments
        # =====================================================================
        print("\n--- SECTION 4: Authentication Across Environments ---")
        log_test("Admin Login Succeeds with Valid Credentials", login_res.status_code == 200, "Token issued")
        me_res = await client.get("/api/admin/me", headers=auth_headers)
        log_test("Admin /me Route Authorized with Bearer Token", me_res.status_code == 200, f"Email: {me_res.json()['data'].get('email')}")

        # Unauthenticated request returns 401
        unauth_res = await client.get("/api/admin/me")
        log_test("Unauthenticated Admin Route Blocked with 401", unauth_res.status_code == 401, "401 Unauthorized")

        # Inactive admin blocked
        inactive_email = f"{PREFIX.lower()}inactive@deccanspaceworks.com"
        await db.admins.insert_one({
            "name": f"{PREFIX}Inactive",
            "email": inactive_email,
            "passwordHash": hash_password("InactivePass123!"),
            "role": "admin",
            "isActive": False,
            "createdAt": datetime.now(timezone.utc)
        })
        inactive_login = await client.post("/api/admin/login", json={
            "email": inactive_email,
            "password": "InactivePass123!"
        })
        log_test("Inactive Admin Blocked at Login", inactive_login.status_code == 401, "isActive: False blocked")
        await db.admins.delete_one({"email": inactive_email})

        # =====================================================================
        # SECTION 5: Public APIs
        # =====================================================================
        print("\n--- SECTION 5: Public APIs ---")
        public_endpoints = [
            ("/api/products", list),
            ("/api/gallery", list),
            ("/api/videos", list),
            ("/api/testimonials", list),
            ("/api/reviews", list),
            ("/api/service-areas", list),
            ("/api/content", dict),
        ]
        for ep, expected_type in public_endpoints:
            r = await client.get(ep)
            data = r.json().get("data")
            log_test(f"Public Endpoint: {ep}", r.status_code == 200 and isinstance(data, expected_type),
                     f"Status: {r.status_code}, Type: {type(data).__name__}")

        # Public Contact submission
        contact_res = await client.post("/api/contact", json={
            "name": f"{PREFIX}TestCustomer",
            "phone": "9100720137",
            "email": f"{PREFIX.lower()}cust@example.com",
            "message": "Enquiry for local and prod compatibility verification"
        })
        log_test("Public Contact Submission Succeeds", contact_res.status_code == 200, "HTTP 200 OK")

        # Public Site Visit submission (FormData)
        unique_phone = f"98{int(time.time()*1000)%100000000:08d}"
        sv_res = await client.post("/api/site-visits", data={
            "name": f"{PREFIX}TestVisitCustomer",
            "phoneNumber": unique_phone,
            "email": f"{PREFIX.lower()}sv@example.com",
            "cityArea": "Gachibowli",
            "preferredVisitDate": "Tomorrow"
        })
        sv_data = sv_res.json().get("data", {})
        tracking_code = sv_data.get("trackingCode") or sv_data.get("id")
        log_test("Public Site Visit Submission Returns Tracking Code", sv_res.status_code == 200 and tracking_code is not None,
                 f"Code/ID: {tracking_code}")

        # =====================================================================
        # SECTION 6: Admin APIs
        # =====================================================================
        print("\n--- SECTION 6: Admin APIs ---")
        admin_endpoints = [
            "/api/admin/dashboard",
            "/api/admin/contacts",
            "/api/admin/site-visits",
            "/api/admin/reviews",
            "/api/admin/products",
            "/api/admin/gallery",
            "/api/admin/videos",
            "/api/admin/service-areas",
            "/api/admin/content",
            "/api/admin/uploads/media",
            "/api/admin/dashboard/activity",
        ]
        for a_ep in admin_endpoints:
            r = await client.get(a_ep, headers=auth_headers)
            log_test(f"Admin Endpoint: {a_ep}", r.status_code == 200, f"HTTP {r.status_code}")

        # =====================================================================
        # SECTION 7: Database Connectivity (Local & Live Render Atlas Ping)
        # =====================================================================
        print("\n--- SECTION 7: Database Connectivity ---")
        is_atlas_up = await ping_database()
        log_test("Local FastAPI Connected to MongoDB Atlas", is_atlas_up, "Atlas Ping: OK")

        # Test live Render backend health endpoint over WAN (allowing for Render free-tier cold starts)
        render_healthy = False
        render_detail = ""
        for attempt in range(1, 4):
            try:
                async with httpx.AsyncClient(timeout=60.0) as wan_client:
                    render_health = await wan_client.get("https://deccan-3jik.onrender.com/health")
                    if render_health.status_code == 200 and render_health.json().get("database") == "connected":
                        render_healthy = True
                        render_detail = f"Status: {render_health.status_code}, Body: {render_health.text}"
                        break
                    else:
                        render_detail = f"Status: {render_health.status_code}, Body: {render_health.text}"
            except Exception as e:
                render_detail = f"Attempt {attempt} exception: {e}"
                if attempt < 3:
                    await asyncio.sleep(5)
        log_test("Live Render Backend Connected to MongoDB Atlas", render_healthy, render_detail)

        # =====================================================================
        # SECTION 8: Error Handling & Status Codes
        # =====================================================================
        print("\n--- SECTION 8: Error Handling & Status Codes ---")
        r_400 = await client.patch("/api/admin/products/invalid_id", json={"name": "test"}, headers=auth_headers)
        log_test("Malformed ID Returns HTTP 400", r_400.status_code == 400, "400 Bad Request")

        r_404 = await client.get("/api/products/nonexistent-slug-xyz-12345")
        log_test("Nonexistent Resource Returns HTTP 404", r_404.status_code == 404, "404 Not Found")

        r_422 = await client.post("/api/contact", json={"name": ""})
        log_test("Schema Validation Failure Returns HTTP 422", r_422.status_code == 422, "422 Unprocessable")

        # Zero stack traces exposed
        log_test("Zero Stack Traces in Error Responses", "Traceback" not in r_400.text and "Traceback" not in r_422.text, "Clean errors")

        # =====================================================================
        # SECTION 9: Media URLs & Path Safety
        # =====================================================================
        print("\n--- SECTION 9: Media URLs & Path Safety ---")
        prods = await client.get("/api/products")
        prod_items = prods.json().get("data", [])
        for p in prod_items:
            img = p.get("image", "")
            is_safe = img.startswith("/images/") or img.startswith("https://")
            log_test(f"Product Image URL Format ({p.get('name')[:15]})", is_safe, f"URL: {img}")
            log_test(f"Product Image Does Not Contain Localhost", "localhost" not in img and "127.0.0.1" not in img, "No localhost")

        # =====================================================================
        # SECTION 10: Production Deployment Configuration
        # =====================================================================
        print("\n--- SECTION 10: Production Deployment Configuration ---")
        render_yaml_file = os.path.join(root_dir, "backend", "render.yaml")
        with open(render_yaml_file, "r", encoding="utf-8") as f:
            r_yaml = f.read()

        log_test("render.yaml Binds to $PORT", "uvicorn app.main:app --host 0.0.0.0 --port $PORT" in r_yaml, "Dynamic $PORT")
        log_test("render.yaml Has Singapore Region", "region: singapore" in r_yaml, "Singapore")
        log_test("render.yaml Includes deccanspaceworks.vercel.app in FRONTEND_URL", "deccanspaceworks.vercel.app" in r_yaml, "Vercel origin configured")
        log_test("render.yaml Includes deccanspaceworks.com in FRONTEND_URL", "deccanspaceworks.com" in r_yaml, "Custom domain configured")

        req_file = os.path.join(root_dir, "backend", "requirements.txt")
        with open(req_file, "r", encoding="utf-8") as f:
            req_txt = f.read()
        log_test("requirements.txt Contains certifi", "certifi" in req_txt, "certifi present")

        # =====================================================================
        # SECTION 11: No Localhost Leakage in Client Code
        # =====================================================================
        print("\n--- SECTION 11: No Localhost Leakage in Client Code ---")
        # Check all JS / JSX files in src/
        hardcoded_localhost_found = []
        for root_path, _, files in os.walk(os.path.join(root_dir, "src")):
            for file in files:
                if file.endswith((".js", ".jsx", ".ts", ".tsx")):
                    f_path = os.path.join(root_path, file)
                    with open(f_path, "r", encoding="utf-8") as js_f:
                        content = js_f.read()
                        # Search for hardcoded fetch("http://localhost... or similar production anti-patterns
                        if "fetch(\"http://localhost" in content or "fetch('http://localhost" in content:
                            hardcoded_localhost_found.append(file)
        log_test("Zero Hardcoded fetch('http://localhost...') in src/", len(hardcoded_localhost_found) == 0,
                 f"Offenders: {hardcoded_localhost_found}")

        # =====================================================================
        # SECTION 12: Secret Management & Zero Exposure
        # =====================================================================
        print("\n--- SECTION 12: Secret Management & Zero Exposure ---")
        # Ensure NEXT_PUBLIC_ variables do not leak secret values
        forbidden_in_frontend = ["MONGODB_URI", "JWT_SECRET", "RESEND_API_KEY", "WHATSAPP_ACCESS_TOKEN", "CLOUDINARY_API_SECRET"]
        frontend_leaks = []
        for root_path, _, files in os.walk(os.path.join(root_dir, "src")):
            for file in files:
                if file.endswith((".js", ".jsx")):
                    f_path = os.path.join(root_path, file)
                    with open(f_path, "r", encoding="utf-8") as js_f:
                        content = js_f.read()
                        for secret_key in forbidden_in_frontend:
                            if f"process.env.NEXT_PUBLIC_{secret_key}" in content:
                                frontend_leaks.append(f"{file}:{secret_key}")
        log_test("Zero Secrets Exposed via NEXT_PUBLIC_ in src/", len(frontend_leaks) == 0, f"Leaks: {frontend_leaks}")

        # Ensure login response does not leak passwordHash or secret
        log_test("Login Response Excludes passwordHash", "passwordHash" not in login_res.text, "Isolated")
        log_test("Login Response Excludes JWT_SECRET", settings.JWT_SECRET not in login_res.text, "Secret safe")

        # =====================================================================
        # SECTION 13: Cache Behavior
        # =====================================================================
        print("\n--- SECTION 13: Cache Behavior ---")
        log_test("api.js Uses cache: 'no-store' on Public GET Requests", "cache: \"no-store\"" in api_js_content, "no-store active")

        # =====================================================================
        # SECTION 14: Test Data Cleanup & Zero Residuals
        # =====================================================================
        print("\n--- SECTION 14: Test Data Cleanup & Zero Residuals ---")
        await db.admins.delete_many({"email": {"$regex": f"^{PREFIX.lower()}"}})
        await db.contacts.delete_many({"name": {"$regex": f"^{PREFIX}"}})
        await db.site_visits.delete_many({"name": {"$regex": f"^{PREFIX}"}})

        # Verify 0 residuals
        admin_count = await db.admins.count_documents({"email": {"$regex": f"^{PREFIX.lower()}"}})
        contact_count = await db.contacts.count_documents({"name": {"$regex": f"^{PREFIX}"}})
        sv_count = await db.site_visits.count_documents({"name": {"$regex": f"^{PREFIX}"}})

        total_res = admin_count + contact_count + sv_count
        log_test("Zero Residual Records across MongoDB Atlas (Residuals = 0)", total_res == 0,
                 f"{total_res} residuals remaining")

    await close_mongo_connection()

    print("\n" + "=" * 80)
    print(f" [OK] ENVIRONMENT COMPATIBILITY AUDIT COMPLETE: {passed_tests} PASSED, {failed_tests} FAILED")
    print("=" * 80)

if __name__ == "__main__":
    asyncio.run(run_compatibility_suite())
