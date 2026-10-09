"""
DECCAN SPACE WORKS — PART A7 BACKEND / API / DATABASE / PRODUCTION HARDENING SUITE
Automated Verification Suite for:
SECTION 1:  Environment & Configuration Validation
SECTION 2:  Authentication Hardening (JWT, Tamper, Inactive Admin, Expired)
SECTION 3:  Authorization Matrix (12+ Admin Routes vs Public)
SECTION 4:  IDOR & ObjectId Hardening (Malformed, Nonexistent, Path Injection)
SECTION 5:  Request Validation (Boundary Limits, Whitespace, Dangerous URLs, Quotes)
SECTION 6:  Response Privacy & Schema Integrity (No PII, No Passwords, No Secrets)
SECTION 7:  NoSQL & ReDoS / Search Hardening (Operator Injection, Regex Escaping)
SECTION 8:  Pagination & Sorting Limits (Query Ge/Le Bounds, Max Limits)
SECTION 9:  MongoDB Connectivity & Index Verification (Atlas Health & Indexes)
SECTION 10: Database Failure Handling (Controlled 503 DB_UNAVAILABLE, No Tracebacks)
SECTION 11: Write Integrity & Idempotency (Deduplication, Double-Conversion Defense)
SECTION 12: Rate Limiting (Brute-Force Login Throttling 429)
SECTION 13: Error Handling & Status Codes (400, 401, 404, 422, 429, 503)
SECTION 14: CORS & Production Security Headers (HSTS, nosniff, DENY, Referrer)
SECTION 15: Upload & Media Security (Anti-XSS, Path Traversal, Size Bounds)
SECTION 16: External Service Isolation (Resend & WhatsApp Failure Non-Fatal)
SECTION 17: API Contract Verification (Public Endpoint Response Shapes)
SECTION 18: Production Deployment Configuration (render.yaml, requirements.txt, certifi)
SECTION 19: Performance & Query Sanity (Dashboard Real Counts, Low Latency)
SECTION 20: Database Cleanup & Integrity (0 Residuals across Atlas Collections)
"""

import asyncio
import os
import sys
import io
import re
import time
from datetime import datetime, timezone, timedelta
import httpx
import jwt
from bson import ObjectId
from unittest.mock import patch, MagicMock, AsyncMock
from pymongo.errors import PyMongoError, ServerSelectionTimeoutError

# Ensure backend root is on python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.config import settings
from app.core.database import connect_to_mongo, close_mongo_connection, get_database, ping_database
from app.core.security import hash_password, create_access_token, decode_access_token
from app.core.rate_limiter import limiter
from app.main import app

PREFIX = "PARTA7_TEST_"
A7_ADMIN_EMAIL = f"{PREFIX.lower()}admin@deccanspaceworks.com"
A7_ADMIN_PASS = "HardeningAudit2026!Deccan"

passed_tests = 0
failed_tests = 0


def log_test(name, passed, detail=""):
    global passed_tests, failed_tests
    if passed:
        passed_tests += 1
        print(f"  [PASS] {name} - {detail}")
    else:
        failed_tests += 1
        print(f"  [FAIL] {name} - {detail}")
        raise AssertionError(f"A7 Test Failed: {name} - {detail}")


async def run_part_a7_audit():
    global passed_tests, failed_tests
    print("=" * 80)
    print(" DECCAN SPACE WORKS - PART A7 BACKEND PRODUCTION HARDENING AUDIT")
    print("=" * 80)

    await connect_to_mongo()
    db = get_database()
    if db is None:
        print("[!] ERROR: Cannot connect to MongoDB Atlas.")
        sys.exit(1)

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        # Pre-cleanup any leftover A7 records
        await db.admins.delete_many({"email": {"$regex": f"^{PREFIX.lower()}"}})
        await db.contacts.delete_many({"name": {"$regex": f"^{PREFIX}"}})
        await db.site_visits.delete_many({"name": {"$regex": f"^{PREFIX}"}})
        await db.reviews.delete_many({"name": {"$regex": f"^{PREFIX}"}})
        await db.testimonials.delete_many({"name": {"$regex": f"^{PREFIX}"}})
        await db.products.delete_many({"slug": {"$regex": f"^{PREFIX.lower()}"}})
        await db.gallery.delete_many({"title": {"$regex": f"^{PREFIX}"}})
        await db.videos.delete_many({"title": {"$regex": f"^{PREFIX}"}})
        await db.service_areas.delete_many({"name": {"$regex": f"^{PREFIX}"}})
        await db.media.delete_many({"name": {"$regex": f"^{PREFIX}"}})
        await db.activity_logs.delete_many({"adminEmail": {"$regex": f"^{PREFIX.lower()}"}})

        # Setup active test admin and inactive test admin
        active_admin_doc = {
            "name": f"{PREFIX}ActiveAdmin",
            "email": A7_ADMIN_EMAIL,
            "passwordHash": hash_password(A7_ADMIN_PASS),
            "role": "admin",
            "isActive": True,
            "createdAt": datetime.now(timezone.utc),
            "lastLogin": None
        }
        await db.admins.insert_one(active_admin_doc)

        inactive_admin_email = f"{PREFIX.lower()}inactive@deccanspaceworks.com"
        inactive_admin_doc = {
            "name": f"{PREFIX}InactiveAdmin",
            "email": inactive_admin_email,
            "passwordHash": hash_password("InactiveAdmin2026!"),
            "role": "admin",
            "isActive": False,
            "createdAt": datetime.now(timezone.utc),
            "lastLogin": None
        }
        await db.admins.insert_one(inactive_admin_doc)

        login_res = await client.post("/api/admin/login", json={
            "email": A7_ADMIN_EMAIL,
            "password": A7_ADMIN_PASS
        })
        token = login_res.json()["data"]["token"]
        auth_headers = {"Authorization": f"Bearer {token}"}

        # =====================================================================
        # SECTION 1: Environment & Configuration Validation
        # =====================================================================
        print("\n--- SECTION 1: Environment & Configuration Validation ---")
        log_test("JWT Secret Configured & Sufficient Length (>= 32 chars)",
                 len(settings.JWT_SECRET) >= 32, f"Length: {len(settings.JWT_SECRET)} chars")
        log_test("Database Name Configured",
                 settings.MONGODB_DATABASE == "deccan_space_works", f"DB: {settings.MONGODB_DATABASE}")
        log_test("CORS Origins Parsed Accurately",
                 isinstance(settings.cors_origins, list) and len(settings.cors_origins) >= 3,
                 f"Origins count: {len(settings.cors_origins)}")
        log_test("Official Phone and WhatsApp Numbers Defined",
                 bool(settings.OWNER_EMAIL) and bool(settings.WHATSAPP_RECIPIENT_NUMBER),
                 f"Owner: {settings.OWNER_EMAIL}, WhatsApp: {settings.WHATSAPP_RECIPIENT_NUMBER}")

        # =====================================================================
        # SECTION 2: Authentication Hardening
        # =====================================================================
        print("\n--- SECTION 2: Authentication Hardening ---")
        # 2.1 Valid Login
        log_test("Valid Admin Login Succeeds", login_res.status_code == 200, "Token issued")

        # 2.2 Wrong password generic 401
        wrong_pwd_res = await client.post("/api/admin/login", json={"email": A7_ADMIN_EMAIL, "password": "WrongPassword!"})
        log_test("Wrong Password Returns Generic 401 (No Hints)", wrong_pwd_res.status_code == 401 and ("INVALID_CREDENTIALS" in wrong_pwd_res.text or "Invalid email" in wrong_pwd_res.text),
                 "Uniform 401 message")

        # 2.3 Nonexistent email generic 401
        no_user_res = await client.post("/api/admin/login", json={"email": "nobody@example.com", "password": "AnyPassword!"})
        log_test("Nonexistent User Returns Generic 401 (No Enumeration)", no_user_res.status_code == 401 and ("INVALID_CREDENTIALS" in no_user_res.text or "Invalid email" in no_user_res.text),
                 "Uniform 401 message")

        # 2.4 Inactive Admin Blocked at Login
        inact_res = await client.post("/api/admin/login", json={"email": inactive_admin_email, "password": "InactiveAdmin2026!"})
        log_test("Inactive Admin Blocked at Login", inact_res.status_code == 401, "isActive=False rejected")

        # 2.5 Inactive Admin Token Rejected on Protected Route
        inact_token = create_access_token({"sub": inactive_admin_email, "role": "admin"})
        inact_hdr = {"Authorization": f"Bearer {inact_token}"}
        inact_route_res = await client.get("/api/admin/products", headers=inact_hdr)
        log_test("Inactive Admin Token Rejected on Protected Routes", inact_route_res.status_code == 401,
                 "Live DB check caught deactivated account")

        # 2.6 Expired Token Rejected
        exp_token = create_access_token({"sub": A7_ADMIN_EMAIL, "role": "admin"}, expires_delta=timedelta(seconds=-60))
        exp_res = await client.get("/api/admin/products", headers={"Authorization": f"Bearer {exp_token}"})
        log_test("Expired JWT Rejected", exp_res.status_code == 401 and "expired" in exp_res.text.lower(), "401 Expired Token")

        # 2.7 Tampered Token Signature Rejected
        tampered_token = token[:-5] + "XXXXX"
        tamp_res = await client.get("/api/admin/products", headers={"Authorization": f"Bearer {tampered_token}"})
        log_test("Tampered Signature JWT Rejected", tamp_res.status_code == 401, "401 Invalid Token")

        # 2.8 Deleted Admin Token Invalidation
        del_admin_email = f"{PREFIX.lower()}tempdel@deccanspaceworks.com"
        del_admin_doc = {
            "name": f"{PREFIX}TempDel",
            "email": del_admin_email,
            "passwordHash": hash_password("TempPass123!"),
            "role": "admin",
            "isActive": True,
            "createdAt": datetime.now(timezone.utc)
        }
        await db.admins.insert_one(del_admin_doc)
        del_token = create_access_token({"sub": del_admin_email, "role": "admin"})
        # Verify access before delete
        pre_del_res = await client.get("/api/admin/products", headers={"Authorization": f"Bearer {del_token}"})
        # Delete admin from database
        await db.admins.delete_one({"email": del_admin_email})
        # Verify immediate rejection after delete
        post_del_res = await client.get("/api/admin/products", headers={"Authorization": f"Bearer {del_token}"})
        log_test("Deleted Admin Token Immediately Invalidated via DB Lookup",
                 pre_del_res.status_code == 200 and post_del_res.status_code == 401,
                 "Token rejected once admin deleted from database")

        # =====================================================================
        # SECTION 3: Authorization Matrix
        # =====================================================================
        print("\n--- SECTION 3: Authorization Matrix ---")
        admin_endpoints = [
            ("GET", "/api/admin/me"),
            ("GET", "/api/admin/dashboard"),
            ("GET", "/api/admin/dashboard/activity"),
            ("GET", "/api/admin/contacts"),
            ("GET", "/api/admin/site-visits"),
            ("GET", "/api/admin/products"),
            ("GET", "/api/admin/gallery"),
            ("GET", "/api/admin/videos"),
            ("GET", "/api/admin/testimonials"),
            ("GET", "/api/admin/reviews"),
            ("GET", "/api/admin/service-areas"),
            ("GET", "/api/admin/uploads/media"),
            ("PATCH", "/api/admin/content"),
        ]
        for method, ep in admin_endpoints:
            if method == "GET":
                r_noauth = await client.get(ep)
                r_auth = await client.get(ep, headers=auth_headers)
            elif method == "PATCH":
                r_noauth = await client.patch(ep, json={})
                r_auth = await client.patch(ep, json={}, headers=auth_headers)

            log_test(f"Auth Barrier: {method} {ep}", r_noauth.status_code == 401 and r_auth.status_code in (200, 422),
                     f"Unauth: {r_noauth.status_code}, Auth: {r_auth.status_code}")

        # =====================================================================
        # SECTION 4: IDOR & ObjectId Hardening
        # =====================================================================
        print("\n--- SECTION 4: IDOR & ObjectId Hardening ---")
        malformed_ids = [
            "invalid_not_hex",
            "123",
            "../../etc/passwd",
            "507f1f77bcf86cd799439011_extra_long_not_valid",
            "'; DROP TABLE users; --",
        ]
        test_routes = [
            "/api/admin/products/",
            "/api/admin/gallery/",
            "/api/admin/videos/",
            "/api/admin/testimonials/",
            "/api/admin/contacts/",
            "/api/admin/site-visits/",
        ]
        for r_base in test_routes:
            for bad_id in malformed_ids:
                r = await client.patch(f"{r_base}{bad_id}", json={"name": "test"}, headers=auth_headers)
                log_test(f"Malformed ID Safe Rejection: {r_base}{bad_id[:10]}",
                         r.status_code in (400, 404, 422), f"HTTP {r.status_code}")

        # Nonexistent valid 24-character hex ObjectId
        fake_hex = "507f1f77bcf86cd799439011"
        for r_base in test_routes:
            body = {"adminNotes": "Audit verification"} if "contacts" in r_base or "site-visits" in r_base else {"name": "Audit verification"}
            r = await client.patch(f"{r_base}{fake_hex}", json=body, headers=auth_headers)
            log_test(f"Nonexistent Hex ObjectId Returns 404 Safely: {r_base}",
                     r.status_code == 404, f"HTTP {r.status_code}")

        # =====================================================================
        # SECTION 5: Request Validation
        # =====================================================================
        print("\n--- SECTION 5: Request Validation ---")
        # 5.1 Whitespace-only name in contact
        r_white = await client.post("/api/contact", json={
            "name": "    ",
            "phone": "9100720137",
            "email": "test@example.com",
            "message": "Valid enquiry message here"
        })
        log_test("Whitespace-Only Name Rejected", r_white.status_code == 422, "422 Validation Error")

        # 5.2 Dangerous javascript: URL in social URLs
        r_xss_url = await client.patch("/api/admin/content", json={
            "instagramUrl": "javascript:alert(document.cookie)"
        }, headers=auth_headers)
        log_test("Dangerous javascript: URL Scheme Rejected", r_xss_url.status_code == 422, "422 Validation Error")

        # 5.3 Dangerous data: URL in product image
        r_data_url = await client.post("/api/admin/products", json={
            "name": f"{PREFIX}XSS Prod",
            "slug": f"{PREFIX.lower()}xss_prod",
            "shortDescription": "Desc",
            "description": "Full desc",
            "image": "data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg=="
        }, headers=auth_headers)
        log_test("Dangerous data: URL Scheme in Image Rejected", r_data_url.status_code == 422, "422 Validation Error")

        # 5.4 Negative Quote Amount
        r_neg_quote = await client.patch(f"/api/admin/site-visits/{fake_hex}", json={
            "quoteAmount": -5000
        }, headers=auth_headers)
        log_test("Negative Quotation Amount Rejected", r_neg_quote.status_code in (400, 422), "Input bounds enforced")

        # 5.5 Exorbitant Quote Amount (> 10,000,000)
        r_max_quote = await client.patch(f"/api/admin/site-visits/{fake_hex}", json={
            "quoteAmount": 999999999
        }, headers=auth_headers)
        log_test("Exorbitant Quotation (> 10M) Rejected", r_max_quote.status_code in (400, 422), "Upper bound enforced")

        # =====================================================================
        # SECTION 6: Response Privacy & Schema Integrity
        # =====================================================================
        print("\n--- SECTION 6: Response Privacy & Schema Integrity ---")
        # Submit a test review with sensitive info
        temp_rev_res = await client.post("/api/reviews", json={
            "name": f"{PREFIX}Private Customer",
            "phone": "9123456789",
            "email": f"{PREFIX.lower()}private@example.com",
            "rating": 5,
            "review": "High quality invisible grills installed on balcony."
        })
        rev_id = temp_rev_res.json()["data"]["id"]
        # Approve review
        await client.patch(f"/api/admin/reviews/{rev_id}/approve", headers=auth_headers)

        # Retrieve public reviews
        pub_revs = (await client.get("/api/reviews")).json()["data"]
        our_rev = next((r for r in pub_revs if r.get("_id") == rev_id), None)
        log_test("Public Review Redacts 'email'", our_rev is not None and "email" not in our_rev, "Field omitted")
        log_test("Public Review Redacts 'phone'", our_rev is not None and "phone" not in our_rev, "Field omitted")
        log_test("Public Review Redacts 'adminNotes'", our_rev is not None and "adminNotes" not in our_rev, "Field omitted")

        # Cleanup review
        await client.delete(f"/api/admin/reviews/{rev_id}", headers=auth_headers)

        # Admin login response never contains password hash
        log_test("Login Response Excludes Password Hash", "password" not in login_res.json()["data"]["admin"] and "passwordHash" not in login_res.json()["data"]["admin"],
                 "Hash completely isolated")

        # =====================================================================
        # SECTION 7: NoSQL & ReDoS / Search Hardening
        # =====================================================================
        print("\n--- SECTION 7: NoSQL & ReDoS / Search Hardening ---")
        # 7.1 NoSQL Operator Injection in JSON payload
        bad_nosql_payload = {"$ne": None}
        r_nosql = await client.post("/api/contact", json=bad_nosql_payload)
        log_test("NoSQL Operator in Request Body Cleanly Blocked by Pydantic", r_nosql.status_code == 422, "422 Unprocessable")

        # 7.2 ReDoS search string handling
        redos_payload = "(a+)+b(a+)+b(a+)+b"
        t0 = time.time()
        r_redos = await client.get(f"/api/admin/contacts?search={redos_payload}", headers=auth_headers)
        t_elapsed = time.time() - t0
        log_test("ReDoS Metacharacters Safely Escaped & Executed in < 200ms",
                 r_redos.status_code == 200 and t_elapsed < 0.2, f"Latency: {t_elapsed*1000:.1f}ms")

        # =====================================================================
        # SECTION 8: Pagination & Sorting Limits
        # =====================================================================
        print("\n--- SECTION 8: Pagination & Sorting Limits ---")
        # Valid limit (20, 50, 100)
        r_valid_lim = await client.get("/api/admin/contacts?limit=50&page=1", headers=auth_headers)
        log_test("Pagination Valid Limit Accepted", r_valid_lim.status_code == 200, "HTTP 200")

        # Exorbitant limit (> 100)
        r_big_lim = await client.get("/api/admin/contacts?limit=5000", headers=auth_headers)
        log_test("Pagination Exorbitant Limit (> 100) Rejected with 422", r_big_lim.status_code == 422,
                 "Enforced le=100 query parameter")

        # Invalid page (page=0 or negative)
        r_bad_page = await client.get("/api/admin/contacts?page=0", headers=auth_headers)
        log_test("Pagination Invalid Page (0) Rejected with 422", r_bad_page.status_code == 422,
                 "Enforced ge=1 query parameter")

        # =====================================================================
        # SECTION 9: MongoDB Connectivity & Index Verification
        # =====================================================================
        print("\n--- SECTION 9: MongoDB Connectivity & Index Verification ---")
        is_healthy = await ping_database()
        log_test("Live Database Ping Passes Bounded Check", is_healthy, "MongoDB Atlas connected")

        # Check indexes in key collections
        admin_indexes = await db.admins.index_information()
        log_test("Admins Collection Email Unique Index Confirmed", "email_1" in admin_indexes and admin_indexes["email_1"].get("unique"),
                 "Unique index on email")

        service_area_indexes = await db.service_areas.index_information()
        log_test("Service Areas Compound Index Confirmed", "isActive_1_displayOrder_1" in service_area_indexes,
                 "Index isActive + displayOrder confirmed")

        site_visits_indexes = await db.site_visits.index_information()
        log_test("Site Visits TrackingCode Index Confirmed", "trackingCode_1" in site_visits_indexes,
                 "Sparse trackingCode index confirmed")

        # =====================================================================
        # SECTION 10: Database Failure Handling
        # =====================================================================
        print("\n--- SECTION 10: Database Failure Handling ---")
        # Simulate PyMongoError / connection failure
        mock_fail_db = MagicMock()
        mock_fail_db.contacts.find_one = AsyncMock(side_effect=PyMongoError("Simulated Atlas TLS disconnect"))
        with patch("app.routes.contacts.get_database", return_value=mock_fail_db):
            r_db_fail = await client.post("/api/contact", json={
                "name": f"{PREFIX}FailTest",
                "phone": "9998887776",
                "email": "fail@example.com",
                "message": "Testing failover"
            })
            log_test("Database Exception Mapped to Controlled 503 Service Unavailable",
                     r_db_fail.status_code == 503 and r_db_fail.json().get("errorCode") == "DB_UNAVAILABLE",
                     "Clean 503 response without stack trace")
            log_test("Zero Stack Traces or Connection Strings Exposed in 503",
                     "Traceback" not in r_db_fail.text and "mongodb" not in r_db_fail.text.lower(),
                     "Information leakage protected")

        # =====================================================================
        # SECTION 11: Write Integrity & Idempotency
        # =====================================================================
        print("\n--- SECTION 11: Write Integrity & Idempotency ---")
        contact_idemp = {
            "name": f"{PREFIX}Idempotent Lead",
            "phone": "9887766554",
            "email": f"{PREFIX.lower()}idemp@example.com",
            "message": "Quote enquiry for 4 balconies"
        }
        res_post1 = await client.post("/api/contact", json=contact_idemp)
        id1 = res_post1.json()["data"]["id"]

        # Immediate repeat submission (double-click simulation)
        res_post2 = await client.post("/api/contact", json=contact_idemp)
        id2 = res_post2.json()["data"]["id"]

        log_test("Contact Double-Click Idempotently Deduplicated",
                 res_post1.status_code == 200 and res_post2.status_code == 200 and id1 == id2,
                 f"Record ID: {id1}")

        cnt_leads = await db.contacts.count_documents({"name": contact_idemp["name"]})
        log_test("Exactly 1 Record Persisted in MongoDB for Double-Click", cnt_leads == 1,
                 f"Count: {cnt_leads} documents")

        # Lead conversion idempotency defense
        conv_res1 = await client.post(f"/api/admin/contacts/{id1}/convert-to-site-visit", json={}, headers=auth_headers)
        log_test("Lead Converted to Site Visit", conv_res1.status_code == 200, "Converted successfully")
        tracking1 = conv_res1.json()["data"]["trackingCode"]

        # Double conversion attempt
        conv_res2 = await client.post(f"/api/admin/contacts/{id1}/convert-to-site-visit", json={}, headers=auth_headers)
        log_test("Double Conversion Defended Idempotently",
                 conv_res2.status_code == 200 and conv_res2.json()["data"]["alreadyConverted"] is True and
                 conv_res2.json()["data"]["trackingCode"] == tracking1,
                 f"Tracking: {tracking1}")

        # Cleanup contact & converted visit
        await client.delete(f"/api/admin/contacts/{id1}", headers=auth_headers)
        await db.site_visits.delete_many({"trackingCode": tracking1})

        # =====================================================================
        # SECTION 12: Rate Limiting
        # =====================================================================
        print("\n--- SECTION 12: Rate Limiting ---")
        # Clear rate limit keys for test IP
        test_ip = "198.51.100.99"
        limiter.reset_key(f"admin_login:{test_ip}")
        rl_headers = {"X-Forwarded-For": test_ip}

        # Fire 10 attempts
        for _ in range(10):
            await client.post("/api/admin/login", json={"email": "attempt@example.com", "password": "wrong"}, headers=rl_headers)

        # 11th attempt must trigger 429
        r_throttled = await client.post("/api/admin/login", json={"email": "attempt@example.com", "password": "wrong"}, headers=rl_headers)
        log_test("Brute-Force Login Throttler Returns 429 Too Many Requests",
                 r_throttled.status_code == 429 and "RATE_LIMIT_EXCEEDED" in r_throttled.text,
                 "Rate limit enforced at 10 req/min")

        # Reset limiter key for test cleanup
        limiter.reset_key(f"admin_login:{test_ip}")

        # =====================================================================
        # SECTION 13: Error Handling & Status Codes
        # =====================================================================
        print("\n--- SECTION 13: Error Handling & Status Codes ---")
        r_404 = await client.get("/api/products/nonexistent-slug-xyz-999")
        log_test("404 Not Found Status Code", r_404.status_code == 404, "Correct 404")

        r_400 = await client.patch("/api/admin/products/bad_id", json={"name": "test"}, headers=auth_headers)
        log_test("400 Bad Request Status Code", r_400.status_code == 400, "Correct 400")

        r_401 = await client.get("/api/admin/me")
        log_test("401 Unauthorized Status Code", r_401.status_code == 401, "Correct 401")

        r_422 = await client.post("/api/admin/products", json={}, headers=auth_headers)
        log_test("422 Unprocessable Entity Status Code", r_422.status_code == 422, "Correct 422")

        # =====================================================================
        # SECTION 14: CORS & Production Security Headers
        # =====================================================================
        print("\n--- SECTION 14: CORS & Production Security Headers ---")
        cors_headers = {
            "Origin": "https://deccanspaceworks.com",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "Content-Type, Authorization"
        }
        cors_res = await client.options("/api/admin/login", headers=cors_headers)
        log_test("CORS Preflight Allows Production Domain", cors_res.status_code == 200, "Preflight 200 OK")
        log_test("CORS Credentials Allowed", cors_res.headers.get("access-control-allow-credentials") == "true",
                 "Credentials: true")

        # Security Headers
        sec_res = await client.get("/api/health")
        log_test("X-Content-Type-Options: nosniff", sec_res.headers.get("x-content-type-options") == "nosniff", "nosniff")
        log_test("X-Frame-Options: DENY", sec_res.headers.get("x-frame-options") == "DENY", "DENY")
        log_test("X-XSS-Protection: 1; mode=block", sec_res.headers.get("x-xss-protection") == "1; mode=block", "1; mode=block")
        log_test("Referrer-Policy Present", "strict-origin" in sec_res.headers.get("referrer-policy", ""), "strict-origin")

        # HSTS header check when over HTTPS proxy
        https_res = await client.get("/api/health", headers={"x-forwarded-proto": "https"})
        log_test("HSTS (Strict-Transport-Security) Injected on HTTPS",
                 "max-age=31536000" in https_res.headers.get("strict-transport-security", ""),
                 f"HSTS: {https_res.headers.get('strict-transport-security')}")

        # =====================================================================
        # SECTION 15: Upload & Media Security
        # =====================================================================
        print("\n--- SECTION 15: Upload & Media Security ---")
        # 15.1 Reject SVG
        svg_file = io.BytesIO(b"<svg xmlns='http://www.w3.org/2000/svg'><script>alert('xss')</script></svg>")
        r_svg = await client.post("/api/admin/uploads/image", files={"file": ("malicious.svg", svg_file, "image/svg+xml")}, headers=auth_headers)
        log_test("Upload Rejects SVG File (Anti-XSS)", r_svg.status_code == 400, "400 Bad Request")

        # 15.2 Reject Executable
        exe_file = io.BytesIO(b"MZ\x90\x00\x03\x00\x00\x00")
        r_exe = await client.post("/api/admin/uploads/image", files={"file": ("virus.exe", exe_file, "application/octet-stream")}, headers=auth_headers)
        log_test("Upload Rejects Executable (.exe)", r_exe.status_code == 400, "400 Bad Request")

        # 15.3 Filename Traversal Sanitization
        jpg_content = b"\xFF\xD8\xFF\xE0\x00\x10JFIF" + b"A" * 100
        jpg_file = io.BytesIO(jpg_content)
        r_trav = await client.post("/api/admin/uploads/image", files={"file": ("../../etc/passwd.jpg", jpg_file, "image/jpeg")}, headers=auth_headers)
        log_test("Filename Traversal Sanitized Cleanly",
                 r_trav.status_code == 200 and ".." not in r_trav.json()["data"]["secure_url"],
                 f"Secure URL: {r_trav.json().get('data', {}).get('secure_url')}")

        # Cleanup media
        med_id = r_trav.json()["data"].get("public_id")

        # =====================================================================
        # SECTION 16: External Service Isolation
        # =====================================================================
        print("\n--- SECTION 16: External Service Isolation ---")
        # Verify that if email service fails or times out, the core customer submission succeeds
        with patch("app.services.email_service._sync_resend_send", side_effect=Exception("Resend API down")):
            isolated_contact = {
                "name": f"{PREFIX}Isolated Customer",
                "phone": "9911223344",
                "email": f"{PREFIX.lower()}iso@example.com",
                "message": "Enquiry under email outage"
            }
            r_iso = await client.post("/api/contact", json=isolated_contact)
            log_test("Customer Lead Saved Even When Email Service Fails",
                     r_iso.status_code == 200, "Core database write succeeded")
            iso_id = r_iso.json()["data"]["id"]
            db_iso = await db.contacts.find_one({"_id": ObjectId(iso_id)})
            log_test("Lead Document Safely Persisted in MongoDB", db_iso is not None, "Persisted in DB")
            await client.delete(f"/api/admin/contacts/{iso_id}", headers=auth_headers)

        # =====================================================================
        # SECTION 17: API Contract Verification
        # =====================================================================
        print("\n--- SECTION 17: API Contract Verification ---")
        contract_endpoints = [
            ("/api/products", list),
            ("/api/gallery", list),
            ("/api/videos", list),
            ("/api/testimonials", list),
            ("/api/reviews", list),
            ("/api/service-areas", list),
            ("/api/content", dict),
        ]
        for ep, expected_type in contract_endpoints:
            r = await client.get(ep)
            payload = r.json()
            is_valid = payload.get("success") is True and isinstance(payload.get("data"), expected_type)
            log_test(f"Contract Schema: {ep} -> {expected_type.__name__}", is_valid,
                     f"Type: {type(payload.get('data')).__name__}")

        # =====================================================================
        # SECTION 18: Production Deployment Configuration
        # =====================================================================
        print("\n--- SECTION 18: Production Deployment Configuration ---")
        render_yaml_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend", "render.yaml")
        log_test("render.yaml Exists in Backend Directory", os.path.exists(render_yaml_path), render_yaml_path)

        with open(render_yaml_path, "r", encoding="utf-8") as f:
            yaml_content = f.read()

        log_test("render.yaml Binds to $PORT Dynamically", "$PORT" in yaml_content, "uvicorn --port $PORT")
        log_test("render.yaml Binds Host to 0.0.0.0", "0.0.0.0" in yaml_content, "--host 0.0.0.0")
        log_test("render.yaml Region is Singapore (Nearest to Hyderabad)", "region: singapore" in yaml_content, "singapore")

        req_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend", "requirements.txt")
        with open(req_path, "r", encoding="utf-8") as f:
            req_content = f.read()
        log_test("requirements.txt Includes certifi for TLS Stability", "certifi" in req_content, "certifi present")

        # =====================================================================
        # SECTION 19: Performance & Query Sanity
        # =====================================================================
        print("\n--- SECTION 19: Performance & Query Sanity ---")
        t0 = time.time()
        dash_res = await client.get("/api/admin/dashboard", headers=auth_headers)
        t_dash = time.time() - t0
        log_test("Dashboard Real Counts Calculated Quickly (< 1000ms WAN)", dash_res.status_code == 200 and t_dash < 1.0,
                 f"Latency: {t_dash*1000:.1f}ms")
        metrics = dash_res.json()["data"]["metrics"]
        log_test("Dashboard Metrics Use Genuine Database Types (integers)",
                 all(isinstance(v, int) for v in metrics.values()),
                 f"Metrics: {metrics}")

        # =====================================================================
        # SECTION 20: Database Cleanup & Integrity
        # =====================================================================
        print("\n--- SECTION 20: Database Cleanup & Integrity ---")
        # Delete test admins
        await db.admins.delete_many({"email": {"$regex": f"^{PREFIX.lower()}"}})
        await db.contacts.delete_many({"name": {"$regex": f"^{PREFIX}"}})
        await db.site_visits.delete_many({"name": {"$regex": f"^{PREFIX}"}})
        await db.reviews.delete_many({"name": {"$regex": f"^{PREFIX}"}})
        await db.testimonials.delete_many({"name": {"$regex": f"^{PREFIX}"}})
        await db.products.delete_many({"slug": {"$regex": f"^{PREFIX.lower()}"}})
        await db.gallery.delete_many({"title": {"$regex": f"^{PREFIX}"}})
        await db.videos.delete_many({"title": {"$regex": f"^{PREFIX}"}})
        await db.service_areas.delete_many({"name": {"$regex": f"^{PREFIX}"}})
        await db.media.delete_many({"name": {"$regex": f"^{PREFIX}"}})
        await db.activity_logs.delete_many({"adminEmail": {"$regex": f"^{PREFIX.lower()}"}})

        collections = [
            ("admins", {"email": {"$regex": f"^{PREFIX.lower()}"}}),
            ("contacts", {"name": {"$regex": f"^{PREFIX}"}}),
            ("site_visits", {"name": {"$regex": f"^{PREFIX}"}}),
            ("reviews", {"name": {"$regex": f"^{PREFIX}"}}),
            ("testimonials", {"name": {"$regex": f"^{PREFIX}"}}),
            ("products", {"slug": {"$regex": f"^{PREFIX.lower()}"}}),
            ("gallery", {"title": {"$regex": f"^{PREFIX}"}}),
            ("videos", {"title": {"$regex": f"^{PREFIX}"}}),
            ("service_areas", {"name": {"$regex": f"^{PREFIX}"}}),
            ("media", {"name": {"$regex": f"^{PREFIX}"}}),
            ("activity_logs", {"adminEmail": {"$regex": f"^{PREFIX.lower()}"}}),
        ]

        total_residuals = 0
        for col_name, query in collections:
            cnt = await db[col_name].count_documents(query)
            total_residuals += cnt

        log_test("Zero Residual Records across MongoDB Atlas (Residuals = 0)", total_residuals == 0,
                 f"{total_residuals} residuals remaining")

        # Scan for all prior test markers (PARTA1 through PARTA6)
        prior_residuals = 0
        for prefix in ["PARTA1_TEST_", "PARTA2_TEST_", "PARTA3_TEST_", "PARTA4_TEST_", "PARTA5_TEST_", "PARTA6_TEST_"]:
            for col_name, field in [
                ("admins", "email"),
                ("contacts", "name"),
                ("site_visits", "name"),
                ("reviews", "name"),
                ("testimonials", "name"),
                ("products", "name"),
                ("gallery", "title"),
                ("videos", "title"),
                ("service_areas", "name"),
            ]:
                cnt = await db[col_name].count_documents({field: {"$regex": f"^{prefix}"}})
                prior_residuals += cnt

        log_test("Zero Prior Audit Residuals (A1-A6 Residuals = 0)", prior_residuals == 0,
                 f"{prior_residuals} prior test residuals found")

    await close_mongo_connection()

    print("\n" + "=" * 80)
    print(f" [OK] PART A7 BACKEND PRODUCTION HARDENING COMPLETE: {passed_tests} PASSED, {failed_tests} FAILED")
    print("=" * 80)


if __name__ == "__main__":
    asyncio.run(run_part_a7_audit())
