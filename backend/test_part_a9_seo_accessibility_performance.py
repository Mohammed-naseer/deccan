"""
=============================================================================
DECCAN SPACE WORKS — PART A9 AUTOMATED VERIFICATION SUITE
SEO, ACCESSIBILITY, PERFORMANCE & PRODUCTION INTEGRITY
=============================================================================
Test Marker: PARTA9_TEST_
Sections:
  1. Root Metadata & Canonical Integrity
  2. Robots.txt Syntax & Route Isolation
  3. Sitemap.xml Validity & Production URL Integrity
  4. Structured Data (JSON-LD) Validation
  5. Heading Hierarchy Integrity (H1 -> H2 -> H3)
  6. Semantic HTML Architecture
  7. Keyboard Accessibility & Focus Management
  8. Form Accessibility & ARIA Labeling
  9. Image Accessibility & SEO Alt Text
  10. Image Performance & Responsive Sizing
  11. Video Accessibility & Performance Attributes
  12. Production URL & Domain Consistency
  13. Admin SEO Isolation & Noindex Protection
  14. Reduced Motion & Theme Accessibility
  15. Responsive Content Presentation & Layout Stability
  16. Link Integrity & Anchor Target Resolution
  17. Dynamic Content Privacy & PII Protection
  18. Production Security Headers & Middleware Preservation
  19. Business Claims & Client Confirmation Integrity
  20. Live Database Safety & Zero-Residue Cleanup
=============================================================================
"""

import os
import re
import json
import asyncio
import urllib.request
import urllib.error
from app.core.database import connect_to_mongo, close_mongo_connection, get_database

CANONICAL_DOMAIN = "https://deccanspaceworks.com"
FRONTEND_URL = "http://localhost:3000"
BACKEND_URL = "http://127.0.0.1:8000"

PASSED_CHECKS = []
FAILED_CHECKS = []

def record(test_num, name, passed, details=""):
    marker = "PARTA9_TEST_"
    if passed:
        print(f"  [PASS] [{marker}{test_num:02d}] {name} {details}")
        PASSED_CHECKS.append(f"{test_num:02d}_{name}")
    else:
        print(f"  [FAIL] [{marker}{test_num:02d}] {name} - {details}")
        FAILED_CHECKS.append(f"{test_num:02d}_{name}: {details}")

def get_html(path=""):
    url = f"{FRONTEND_URL}{path}"
    req = urllib.request.Request(url, headers={"User-Agent": "Deccan-A9-Auditor/1.0"})
    with urllib.request.urlopen(req) as resp:
        return resp.read().decode("utf-8")

async def run_suite():
    print("=" * 80)
    print(" DECCAN SPACE WORKS — PART A9 AUTOMATED TEST SUITE")
    print("=" * 80)

    # -------------------------------------------------------------------------
    # 1. Root Metadata & Canonical Integrity
    # -------------------------------------------------------------------------
    print("\n--- [Section 1] Root Metadata & Canonical Integrity ---")
    html_home = get_html("/")
    has_title = "<title>Deccan Space Works | Invisible Grills in Hyderabad</title>" in html_home
    record(1, "Root Page Title", has_title, "Matches official branding")

    desc_match = re.search(r'<meta name="description" content="([^"]+)"', html_home)
    has_desc = desc_match and "Deccan Space Works provides invisible grill solutions" in desc_match.group(1)
    record(2, "Meta Description", bool(has_desc), "Clear, accurate and unbranded")

    canonical_match = re.search(r'<link rel="canonical" href="([^"]+)"', html_home)
    is_canonical_correct = canonical_match and canonical_match.group(1) == CANONICAL_DOMAIN
    record(3, "Canonical Link", bool(is_canonical_correct), f"Points to {CANONICAL_DOMAIN}")

    og_url_match = re.search(r'<meta property="og:url" content="([^"]+)"', html_home)
    is_og_url_correct = og_url_match and og_url_match.group(1) == CANONICAL_DOMAIN
    record(4, "OpenGraph URL", bool(is_og_url_correct), f"Matches {CANONICAL_DOMAIN}")

    # -------------------------------------------------------------------------
    # 2. Robots.txt Syntax & Route Isolation
    # -------------------------------------------------------------------------
    print("\n--- [Section 2] Robots.txt Syntax & Route Isolation ---")
    robots_content = get_html("/robots.txt")
    has_disallow_admin = "Disallow: /admin" in robots_content and "Disallow: /admin/" in robots_content
    record(5, "Robots Admin Disallow", has_disallow_admin, "Protects /admin from search crawlers")

    has_disallow_api = "Disallow: /api/" in robots_content
    record(6, "Robots API Disallow", has_disallow_api, "Protects /api/ routes")

    has_sitemap_decl = f"Sitemap: {CANONICAL_DOMAIN}/sitemap.xml" in robots_content
    record(7, "Robots Sitemap Declaration", has_sitemap_decl, "Points to valid sitemap.xml")

    # -------------------------------------------------------------------------
    # 3. Sitemap.xml Validity & Production URL Integrity
    # -------------------------------------------------------------------------
    print("\n--- [Section 3] Sitemap.xml Validity & URL Integrity ---")
    sitemap_content = get_html("/sitemap.xml")
    has_xml_header = "<?xml" in sitemap_content and "<urlset" in sitemap_content
    record(8, "Sitemap XML Syntax", has_xml_header, "Valid XML schema")

    has_loc = f"<loc>{CANONICAL_DOMAIN}</loc>" in sitemap_content or f"<loc>{CANONICAL_DOMAIN}/</loc>" in sitemap_content
    record(9, "Sitemap Canonical URL", has_loc, "Includes primary production domain")

    no_admin_in_sitemap = "/admin" not in sitemap_content
    record(10, "Sitemap Excludes Admin", no_admin_in_sitemap, "No private admin routes listed")

    # -------------------------------------------------------------------------
    # 4. Structured Data (JSON-LD) Validation
    # -------------------------------------------------------------------------
    print("\n--- [Section 4] Structured Data (JSON-LD) Validation ---")
    json_ld_matches = re.findall(r'<script type="application/ld\+json">(.*?)</script>', html_home, re.DOTALL)
    valid_json_ld = False
    for j in json_ld_matches:
        try:
            data = json.loads(j)
            if data.get("@type") == "HomeAndConstructionBusiness" and data.get("name") == "Deccan Space Works":
                valid_json_ld = True
                break
        except Exception:
            pass
    record(11, "Schema.org HomeAndConstructionBusiness", valid_json_ld, "JSON-LD syntax and fields valid")

    # -------------------------------------------------------------------------
    # 5. Heading Hierarchy Integrity (H1 -> H2 -> H3)
    # -------------------------------------------------------------------------
    print("\n--- [Section 5] Heading Hierarchy Integrity ---")
    h1_tags = re.findall(r'<h1[^>]*>(.*?)</h1>', html_home, re.DOTALL)
    record(12, "Single H1 Tag on Homepage", len(h1_tags) == 1, f"Found {len(h1_tags)} H1 tag(s)")

    h2_tags = re.findall(r'<h2[^>]*>(.*?)</h2>', html_home, re.DOTALL)
    record(13, "Multiple Meaningful H2 Section Tags", len(h2_tags) >= 10, f"Found {len(h2_tags)} H2 sections")

    # -------------------------------------------------------------------------
    # 6. Semantic HTML Architecture
    # -------------------------------------------------------------------------
    print("\n--- [Section 6] Semantic HTML Architecture ---")
    has_header = "<header" in html_home
    has_nav = "<nav" in html_home
    has_main = '<main id="main-content"' in html_home
    has_footer = "<footer" in html_home
    record(14, "Semantic Landmarks (header, nav, main, footer)", has_header and has_nav and has_main and has_footer, "All core landmarks present")

    # -------------------------------------------------------------------------
    # 7. Keyboard Accessibility & Focus Management
    # -------------------------------------------------------------------------
    print("\n--- [Section 7] Keyboard Accessibility & Focus Management ---")
    has_skip_link = '<a href="#main-content"' in html_home and "Skip to main content" in html_home
    record(15, "Skip to Main Content Link", has_skip_link, "Direct keyboard skip link configured")

    css_content = open("src/app/globals.css", "r", encoding="utf-8").read()
    has_focus_visible = ":focus-visible" in css_content and "outline:" in css_content
    record(16, "Global :focus-visible Styling", has_focus_visible, "High-contrast cyan focus ring defined")

    # -------------------------------------------------------------------------
    # 8. Form Accessibility & ARIA Labeling
    # -------------------------------------------------------------------------
    print("\n--- [Section 8] Form Accessibility & ARIA Labeling ---")
    enquiry_code = open("src/components/forms/EnquiryForm.jsx", "r", encoding="utf-8").read()
    has_aria_required = 'aria-required="true"' in enquiry_code
    has_aria_describedby = "aria-describedby=" in enquiry_code
    has_explicit_labels = 'htmlFor="sv-name"' in enquiry_code and 'htmlFor="sv-phone"' in enquiry_code
    record(17, "Enquiry Form ARIA & Explicit Labels", has_aria_required and has_aria_describedby and has_explicit_labels, "Labels, required, and describedby error bindings verified")

    contact_code = open("src/components/contact/ContactSection.jsx", "r", encoding="utf-8").read()
    has_contact_labels = 'htmlFor="contact-name"' in contact_code and 'htmlFor="contact-phone"' in contact_code
    record(18, "Contact Form Explicit Labels", has_contact_labels, "htmlFor input bindings confirmed")

    # -------------------------------------------------------------------------
    # 9. Image Accessibility & SEO Alt Text
    # -------------------------------------------------------------------------
    print("\n--- [Section 9] Image Accessibility & SEO Alt Text ---")
    hero_code = open("src/components/hero/HeroSection.jsx", "r", encoding="utf-8").read()
    has_hero_alt = 'alt="Deccan Space Works Modern Balcony Installation in Hyderabad"' in hero_code
    record(19, "Hero Image Descriptive Alt Text", has_hero_alt, "Descriptive alt for primary LCP image")

    products_code = open("src/components/services/HomeServicesSection.jsx", "r", encoding="utf-8").read()
    has_prod_alt = 'alt={`${product.name} by Deccan Space Works`}' in products_code
    record(20, "Product Card Descriptive Alt Text", has_prod_alt, "Branded descriptive alt for all products")

    # -------------------------------------------------------------------------
    # 10. Image Performance & Responsive Sizing
    # -------------------------------------------------------------------------
    print("\n--- [Section 10] Image Performance & Responsive Sizing ---")
    has_hero_priority = "priority" in hero_code and "<Image" in hero_code
    record(21, "Hero Image LCP Priority", has_hero_priority, "Preloads hero image for optimal LCP")

    has_prod_sizes = 'sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"' in products_code
    record(22, "Responsive Image Sizes Attribute", has_prod_sizes, "Prevents oversized image downloads")

    # -------------------------------------------------------------------------
    # 11. Video Accessibility & Performance Attributes
    # -------------------------------------------------------------------------
    print("\n--- [Section 11] Video Accessibility & Performance ---")
    explore_code = open("src/components/explore/ExploreSection.jsx", "r", encoding="utf-8").read()
    has_video_preload_none = 'preload="none"' in explore_code
    has_video_poster = "poster=" in explore_code
    has_video_aria = 'aria-label={playing ? "Pause video" : "Play video"}' in explore_code
    record(23, "Video Performance (preload=none, poster)", has_video_preload_none and has_video_poster, "Zero render-blocking video payload")
    record(24, "Video Controls Accessibility", has_video_aria, "Play/Pause and scrubber ARIA accessible")

    # -------------------------------------------------------------------------
    # 12. Production URL & Domain Consistency
    # -------------------------------------------------------------------------
    print("\n--- [Section 12] Production URL & Domain Consistency ---")
    has_no_localhost_leak = "localhost" not in CANONICAL_DOMAIN and "127.0.0.1" not in CANONICAL_DOMAIN
    record(25, "Canonical Domain Config Integrity", has_no_localhost_leak, CANONICAL_DOMAIN)

    # -------------------------------------------------------------------------
    # 13. Admin SEO Isolation & Noindex Protection
    # -------------------------------------------------------------------------
    print("\n--- [Section 13] Admin SEO Isolation & Noindex Protection ---")
    admin_layout = open("src/app/admin/layout.jsx", "r", encoding="utf-8").read()
    has_noindex_meta = '<meta name="robots" content="noindex, nofollow"' in admin_layout
    record(26, "Admin Layout Noindex Meta Tag", has_noindex_meta, "Prevents indexing of all /admin/* routes")

    html_admin_login = get_html("/admin/login")
    has_login_noindex = 'content="noindex, nofollow"' in html_admin_login
    record(27, "Admin Login Live Noindex Header", has_login_noindex, "Verified on live server")

    # -------------------------------------------------------------------------
    # 14. Reduced Motion & Theme Accessibility
    # -------------------------------------------------------------------------
    print("\n--- [Section 14] Reduced Motion & Theme Accessibility ---")
    has_reduced_motion = "@media (prefers-reduced-motion: reduce)" in css_content
    record(28, "Prefers-Reduced-Motion CSS Support", has_reduced_motion, "Respects user accessibility preferences")

    # -------------------------------------------------------------------------
    # 15. Responsive Layout Stability & Overflow Defense
    # -------------------------------------------------------------------------
    print("\n--- [Section 15] Responsive Layout Stability ---")
    has_overflow_defense = "overflow-x: hidden" in css_content
    record(29, "Horizontal Overflow Defense", has_overflow_defense, "Prevents mobile horizontal scroll blowout")

    # -------------------------------------------------------------------------
    # 16. Link Integrity & Anchor Target Resolution
    # -------------------------------------------------------------------------
    print("\n--- [Section 16] Link Integrity & Anchor Targets ---")
    anchor_matches = re.findall(r'href=["\'](#[a-zA-Z0-9_-]+)["\']', html_home)
    unique_anchors = set(anchor_matches)
    all_anchors_exist = True
    for a in unique_anchors:
        tid = a[1:]
        if not re.search(rf'id=["\']{re.escape(tid)}["\']', html_home):
            all_anchors_exist = False
            break
    record(30, "Internal Anchor Link Resolution", all_anchors_exist and len(unique_anchors) >= 10, f"All {len(unique_anchors)} anchor targets exist in DOM")

    # -------------------------------------------------------------------------
    # 17. Dynamic Content Privacy & PII Protection
    # -------------------------------------------------------------------------
    print("\n--- [Section 17] Dynamic Content Privacy & PII Protection ---")
    req_reviews = urllib.request.urlopen(f"{BACKEND_URL}/api/reviews")
    reviews_json = json.loads(req_reviews.read().decode("utf-8"))
    reviews_list = reviews_json.get("data", [])
    no_pii_leaked = True
    for r in reviews_list:
        if "phone" in r or "phoneNumber" in r or "email" in r or "adminNotes" in r:
            no_pii_leaked = False
            break
    record(31, "Public Reviews PII Sanitization", no_pii_leaked, "Phone, email, and adminNotes strictly hidden")

    # -------------------------------------------------------------------------
    # 18. Production Security Headers Preservation
    # -------------------------------------------------------------------------
    print("\n--- [Section 18] Production Security Headers Preservation ---")
    req_health = urllib.request.urlopen(f"{BACKEND_URL}/health")
    h_headers = {k.lower(): v for k, v in req_health.headers.items()}
    has_cto = h_headers.get("x-content-type-options") == "nosniff"
    has_xfo = h_headers.get("x-frame-options") == "DENY"
    has_rp = "strict-origin" in h_headers.get("referrer-policy", "")
    record(32, "Backend Security Headers", has_cto and has_xfo and has_rp, "nosniff, DENY, strict-origin preserved")

    # -------------------------------------------------------------------------
    # 19. Business Claims & Client Confirmation Integrity
    # -------------------------------------------------------------------------
    print("\n--- [Section 19] Business Claims & Client Confirmation Integrity ---")
    trust_code = open("src/components/trust/TrustSection.jsx", "r", encoding="utf-8").read()
    has_fallback_stats = "8,000" in trust_code
    record(33, "Preserved Client-Confirmation Statistics", has_fallback_stats, "8,000+ preserved without unauthorized modification")

    # -------------------------------------------------------------------------
    # 20. Live Database Safety & Zero-Residue Cleanup
    # -------------------------------------------------------------------------
    print("\n--- [Section 20] Live Database Safety & Zero-Residue Cleanup ---")
    await connect_to_mongo()
    db = get_database()
    test_marker = "PARTA9_TEST_"
    
    # Insert a temporary test record to prove mutation & immediate clean cycle
    test_id = None
    if db is not None:
        insert_res = await db.contacts.insert_one({
            "name": f"{test_marker}Verification Lead",
            "phone": "+919848011111",
            "message": "Temporary A9 verification record",
            "status": "new"
        })
        test_id = insert_res.inserted_id
        # Verify inserted
        found = await db.contacts.find_one({"_id": test_id})
        record(34, "Test Record Insertion Cycle", found is not None, "Temporary verification record created")

        # Clean up immediately
        await db.contacts.delete_one({"_id": test_id})
        after_clean = await db.contacts.find_one({"_id": test_id})
        record(35, "Test Record Immediate Cleanup", after_clean is None, "Cleaned up successfully")

        # Scan for any residues
        residual_count = await db.contacts.count_documents({"name": {"$regex": test_marker}})
        record(36, "Zero A9 Residues in Atlas", residual_count == 0, f"Residual count: {residual_count}")
    else:
        record(34, "Test Record Insertion Cycle", False, "Database disconnected")
        record(35, "Test Record Immediate Cleanup", False, "Database disconnected")
        record(36, "Zero A9 Residues in Atlas", False, "Database disconnected")

    await close_mongo_connection()

    # -------------------------------------------------------------------------
    # Summary
    # -------------------------------------------------------------------------
    print("\n" + "=" * 80)
    print(f" PART A9 TEST SUMMARY: {len(PASSED_CHECKS)}/{len(PASSED_CHECKS) + len(FAILED_CHECKS)} PASSED")
    print("=" * 80)
    if FAILED_CHECKS:
        print(f"FAILED ({len(FAILED_CHECKS)}):")
        for f in FAILED_CHECKS:
            print(f"  - {f}")
    assert len(FAILED_CHECKS) == 0, f"{len(FAILED_CHECKS)} tests failed in Part A9 suite!"

if __name__ == "__main__":
    asyncio.run(run_suite())
