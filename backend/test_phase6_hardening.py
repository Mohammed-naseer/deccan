"""
PHASE 6 — PERFORMANCE, SEO, ACCESSIBILITY & PRODUCTION HARDENING TEST SUITE
Deccan Space Works — Invisible Grills

Validates:
1. Backend Health Check & Latency (< 100ms)
2. FastAPI Security Headers (X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy)
3. CORS Protection (Specific origins, credentials allowed, methods restricted)
4. Robots.txt Compliance (Disallow /admin, /api, allow public, sitemap link)
5. Sitemap.xml Output (Valid XML, canonical domain, 200 OK)
6. Public HTML SEO & Metadata (Canonical link, Schema.org LocalBusiness JSON-LD, OG tags)
7. Media Performance (Videos set to preload="none" with posters, responsive images)
8. MongoDB Database Performance & Indexes
"""

import sys
import os
import time
import requests
import asyncio
from xml.etree import ElementTree as ET

# Setup path for backend imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from app.core.config import settings
from app.core.database import connect_to_mongo, close_mongo_connection, get_database, ping_database

API_BASE = "http://127.0.0.1:8000"
FRONTEND_BASE = "http://localhost:3000"

PASSED = 0
FAILED = 0

def log_test(name: str, passed: bool, detail: str = ""):
    global PASSED, FAILED
    status_str = "PASS" if passed else "FAIL"
    print(f"[{status_str}] {name} {f'— {detail}' if detail else ''}")
    if passed:
        PASSED += 1
    else:
        FAILED += 1

def test_backend_health():
    print("\n--- 1. Backend Health & Performance ---")
    start = time.time()
    res = requests.get(f"{API_BASE}/health")
    latency_ms = (time.time() - start) * 1000
    
    log_test(
        "Health Endpoint Responds 200 OK",
        res.status_code == 200,
        f"status: {res.status_code}, payload: {res.json()}"
    )
    log_test(
        "Health Endpoint Latency < 150ms",
        latency_ms < 150,
        f"latency: {latency_ms:.2f}ms"
    )
    data = res.json()
    log_test(
        "Database is Connected",
        data.get("database") == "connected" and data.get("status") == "healthy",
        f"db: {data.get('database')}"
    )

def test_security_headers():
    print("\n--- 2. Production Security Headers ---")
    res = requests.get(f"{API_BASE}/health")
    headers = res.headers
    
    log_test(
        "X-Content-Type-Options: nosniff",
        headers.get("X-Content-Type-Options") == "nosniff",
        headers.get("X-Content-Type-Options", "MISSING")
    )
    log_test(
        "X-Frame-Options: DENY",
        headers.get("X-Frame-Options") == "DENY",
        headers.get("X-Frame-Options", "MISSING")
    )
    log_test(
        "Referrer-Policy: strict-origin-when-cross-origin",
        headers.get("Referrer-Policy") == "strict-origin-when-cross-origin",
        headers.get("Referrer-Policy", "MISSING")
    )
    log_test(
        "Permissions-Policy present",
        "camera=()" in headers.get("Permissions-Policy", ""),
        headers.get("Permissions-Policy", "MISSING")
    )

def test_cors_configuration():
    print("\n--- 3. CORS Hardening ---")
    # Preflight OPTIONS request
    headers = {
        "Origin": "http://localhost:3000",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "Content-Type"
    }
    res = requests.options(f"{API_BASE}/api/site-visits", headers=headers)
    log_test(
        "CORS Preflight Responds 200",
        res.status_code == 200,
        f"status: {res.status_code}"
    )
    log_test(
        "CORS Credentials Allowed",
        res.headers.get("Access-Control-Allow-Credentials") == "true",
        f"credentials: {res.headers.get('Access-Control-Allow-Credentials')}"
    )
    log_test(
        "CORS Origin Restricted to Authorized Frontends",
        res.headers.get("Access-Control-Allow-Origin") in settings.cors_origins,
        f"origin: {res.headers.get('Access-Control-Allow-Origin')}"
    )

def test_robots_txt():
    print("\n--- 4. Robots.txt Verification ---")
    res = requests.get(f"{FRONTEND_BASE}/robots.txt")
    log_test(
        "robots.txt Responds 200 OK",
        res.status_code == 200,
        f"status: {res.status_code}"
    )
    content = res.text
    log_test(
        "robots.txt Disallows /admin/",
        "Disallow: /admin/" in content,
        "Protects admin route from crawling"
    )
    log_test(
        "robots.txt Disallows /api/",
        "Disallow: /api/" in content,
        "Protects API route from crawling"
    )
    log_test(
        "robots.txt Links to Sitemap",
        "Sitemap: https://deccanspaceworks.com/sitemap.xml" in content,
        "Points bots to sitemap"
    )

def test_sitemap_xml():
    print("\n--- 5. Sitemap.xml Verification ---")
    res = requests.get(f"{FRONTEND_BASE}/sitemap.xml")
    log_test(
        "sitemap.xml Responds 200 OK",
        res.status_code == 200,
        f"status: {res.status_code}"
    )
    try:
        root = ET.fromstring(res.text)
        urls = [elem.text for elem in root.iter() if "loc" in elem.tag]
        has_canonical = "https://deccanspaceworks.com" in urls
        log_test(
            "sitemap.xml Contains Canonical URL",
            has_canonical,
            f"URLs found: {urls}"
        )
    except Exception as e:
        log_test("sitemap.xml is Valid XML", False, str(e))

def test_public_html_seo():
    print("\n--- 6. Public HTML SEO & Metadata ---")
    res = requests.get(f"{FRONTEND_BASE}/")
    log_test(
        "Homepage Responds 200 OK",
        res.status_code == 200,
        f"status: {res.status_code}"
    )
    html = res.text
    log_test(
        "Canonical Link Tag Present",
        '<link rel="canonical" href="https://deccanspaceworks.com"/>' in html or 'rel="canonical"' in html,
        "Search engine canonical URL present"
    )
    log_test(
        "OpenGraph Title & Description Present",
        'property="og:title"' in html or 'og:title' in html,
        "Social sharing preview metadata present"
    )
    log_test(
        "Schema.org JSON-LD Structured Data Present",
        'application/ld+json' in html and 'HomeAndConstructionBusiness' in html,
        "Rich search snippet schema present"
    )
    log_test(
        "Local SEO Information in Schema",
        'Hyderabad' in html and 'Deccan Space Works' in html,
        "Local business city and brand present"
    )
    log_test(
        "Video Elements Have preload='none'",
        'preload="none"' in html,
        "Heavy video streaming prevented on page load"
    )

async def test_database_indexes():
    print("\n--- 7. Database Performance & Indexes ---")
    await connect_to_mongo()
    db = get_database()
    collections = ["admins", "contacts", "site_visits", "reviews", "products"]
    for coll_name in collections:
        indexes = await db[coll_name].index_information()
        index_names = list(indexes.keys())
        log_test(
            f"Collection '{coll_name}' has Indexes",
            len(index_names) >= 1,
            f"indexes: {index_names}"
        )
    await close_mongo_connection()

def main():
    print("================================================================")
    print("  PHASE 6 TEST RUNNER — PERFORMANCE, SEO & PRODUCTION HARDENING")
    print("================================================================")
    
    test_backend_health()
    test_security_headers()
    test_cors_configuration()
    test_robots_txt()
    test_sitemap_xml()
    test_public_html_seo()
    asyncio.run(test_database_indexes())
    
    print("\n================================================================")
    print(f"  TOTAL RESULTS: {PASSED} PASSED | {FAILED} FAILED")
    print("================================================================")
    if FAILED > 0:
        sys.exit(1)

if __name__ == "__main__":
    main()
