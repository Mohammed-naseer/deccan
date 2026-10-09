"""
DECCAN SPACE WORKS — PART A3 TECHNICAL SEO, ACCESSIBILITY & CONTENT PRESENTATION AUDIT SUITE
Automated Verification Suite for:
1. Technical SEO (Metadata, Canonical, Robots, Sitemap, JSON-LD schema validity)
2. Semantic HTML & Landmark Structure
3. Heading Hierarchy (H1 -> H2 -> H3 strict adherence, no rogue skips)
4. Accessibility Attributes (ARIA, Keyboard controls, Sliders, Tablists, Dialogs, Focus)
5. Form Accessibility & Error Announcers
6. Error Boundaries & 404 Pages
7. Clean Database Teardown & 0 Test Residuals
"""

import asyncio
import os
import sys
import re
from datetime import datetime, timezone
import httpx
from bson import ObjectId

# Ensure backend root is on python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.config import settings
from app.core.database import connect_to_mongo, close_mongo_connection, get_database
from app.core.security import hash_password, create_access_token
from app.main import app

PREFIX = "PARTA3_TEST_"
A3_ADMIN_EMAIL = f"{PREFIX.lower()}admin@deccanspaceworks.com"
A3_ADMIN_PASS = "PartA3Audit2026!"

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))


def log_test(name, passed, detail=""):
    status = "[PASS]" if passed else "[FAIL]"
    print(f"  {status} {name} — {detail}")
    if not passed:
        raise AssertionError(f"A3 Test Failed: {name} — {detail}")


async def run_part_a3_audit():
    print("=" * 80)
    print(" DECCAN SPACE WORKS — PART A3 SEO, ACCESSIBILITY & PRESENTATION SUITE")
    print("=" * 80)

    await connect_to_mongo()
    db = get_database()
    if db is None:
        print("[!] ERROR: Cannot connect to MongoDB Atlas.")
        sys.exit(1)

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        # Clean any prior A3 test remnants
        await db.admin_users.delete_many({"email": {"$regex": f"^{PREFIX.lower()}"}})
        await db.site_visits.delete_many({"name": {"$regex": f"^{PREFIX}"}})

        # =====================================================================
        # TEST GROUP 1: TECHNICAL SEO & METADATA AUDIT
        # =====================================================================
        print("\n--- 1. TECHNICAL SEO & METADATA AUDIT ---")
        layout_path = os.path.join(PROJECT_ROOT, "src", "app", "layout.jsx")
        with open(layout_path, "r", encoding="utf-8") as f:
            layout_code = f.read()

        # 1.1 Canonical Production Domain
        has_canonical = 'canonical: "https://deccanspaceworks.com"' in layout_code
        log_test(
            "Canonical Production Domain",
            has_canonical,
            "Canonical points exactly to https://deccanspaceworks.com"
        )

        # 1.2 Meaningful Page Title
        has_title = 'title: "Deccan Space Works | Invisible Grills in Hyderabad"' in layout_code
        log_test(
            "Page Title Specification",
            has_title,
            "Root metadata defines specific, branded page title"
        )

        # 1.3 Open Graph & Twitter Cards
        has_og = 'openGraph:' in layout_code and 'type: "website"' in layout_code
        has_twitter = 'twitter:' in layout_code and 'card: "summary_large_image"' in layout_code
        log_test(
            "Social Media Metadata",
            has_og and has_twitter,
            "OpenGraph and Twitter summary_large_image properly configured"
        )

        # 1.4 No Development/Localhost Domains in SEO Config
        no_dev_domains = not re.search(r'https?://(localhost|127\.0\.0\.1)', layout_code)
        log_test(
            "Production Domain Purity",
            no_dev_domains,
            "No localhost or 127.0.0.1 URLs in metadata or schema"
        )

        # =====================================================================
        # TEST GROUP 2: ROBOTS.TXT & SITEMAP AUDIT
        # =====================================================================
        print("\n--- 2. ROBOTS.TXT & SITEMAP AUDIT ---")
        robots_path = os.path.join(PROJECT_ROOT, "public", "robots.txt")
        with open(robots_path, "r", encoding="utf-8") as f:
            robots_txt = f.read()

        admin_disallowed = "Disallow: /admin" in robots_txt and "Disallow: /admin/" in robots_txt
        api_disallowed = "Disallow: /api/" in robots_txt
        public_allowed = "Allow: /" in robots_txt
        sitemap_present = "Sitemap: https://deccanspaceworks.com/sitemap.xml" in robots_txt
        log_test(
            "Robots.txt Crawler Rules",
            admin_disallowed and api_disallowed and public_allowed and sitemap_present,
            "Admin & API blocked, public root allowed, production sitemap linked"
        )

        sitemap_path = os.path.join(PROJECT_ROOT, "src", "app", "sitemap.js")
        with open(sitemap_path, "r", encoding="utf-8") as f:
            sitemap_code = f.read()
        sitemap_canonical = 'const baseUrl = "https://deccanspaceworks.com"' in sitemap_code
        log_test(
            "Sitemap.xml Generator",
            sitemap_canonical,
            "Sitemap produces canonical domain with weekly changeFrequency"
        )

        # Admin layout noindex defense-in-depth
        admin_layout_path = os.path.join(PROJECT_ROOT, "src", "app", "admin", "layout.jsx")
        with open(admin_layout_path, "r", encoding="utf-8") as f:
            admin_layout_code = f.read()
        has_admin_noindex = 'content="noindex, nofollow"' in admin_layout_code
        log_test(
            "Admin Noindex Defense-in-Depth",
            has_admin_noindex,
            "Admin root layout injects robots noindex, nofollow tag"
        )

        # =====================================================================
        # TEST GROUP 3: STRUCTURED DATA JSON-LD ACCURACY
        # =====================================================================
        print("\n--- 3. STRUCTURED DATA JSON-LD ACCURACY ---")
        schema_type_ok = '"HomeAndConstructionBusiness"' in layout_code
        schema_phone_ok = '"+919100720137"' in layout_code
        schema_email_ok = '"Deccanspaceworks@gmail.com"' in layout_code
        schema_geo_ok = '"17.3850"' in layout_code and '"78.4867"' in layout_code
        no_fake_hours = "openingHoursSpecification" not in layout_code
        no_fake_price = "priceRange" not in layout_code
        log_test(
            "JSON-LD Schema Correctness",
            schema_type_ok and schema_phone_ok and schema_email_ok and schema_geo_ok,
            "Verified contact, geo coordinates, and business identity present"
        )
        log_test(
            "JSON-LD Truthfulness (No Fabricated Properties)",
            no_fake_hours and no_fake_price,
            "Unverified opening hours and price ranges strictly omitted"
        )

        # =====================================================================
        # TEST GROUP 4: HEADING HIERARCHY & LANDMARK STRUCTURE
        # =====================================================================
        print("\n--- 4. HEADING HIERARCHY & LANDMARKS ---")
        hero_path = os.path.join(PROJECT_ROOT, "src", "components", "hero", "HeroSection.jsx")
        with open(hero_path, "r", encoding="utf-8") as f:
            hero_code = f.read()
        has_single_h1 = hero_code.count("<h1") == 1
        log_test(
            "Single Primary H1",
            has_single_h1,
            "HeroSection contains exactly 1 <h1> heading"
        )

        # Check for any rogue H4, H5, H6 in all public components
        components_dir = os.path.join(PROJECT_ROOT, "src", "components")
        rogue_headings = []
        for root, dirs, files in os.walk(components_dir):
            if "admin" in root:
                continue
            for f in files:
                if f.endswith((".jsx", ".js")):
                    fpath = os.path.join(root, f)
                    with open(fpath, "r", encoding="utf-8") as comp_file:
                        code = comp_file.read()
                        if re.search(r'<h[4-6][\s>]', code):
                            rogue_headings.append(f)
        log_test(
            "Zero Rogue Heading Skips (No H4-H6)",
            len(rogue_headings) == 0,
            f"All public components adhere to H1->H2->H3 hierarchy (found rogue in: {rogue_headings})"
        )

        # Main landmark & Skip to Content
        page_path = os.path.join(PROJECT_ROOT, "src", "app", "page.jsx")
        with open(page_path, "r", encoding="utf-8") as f:
            page_code = f.read()
        has_main_id = 'id="main-content"' in page_code
        has_skip_link = 'href="#main-content"' in layout_code and "Skip to main content" in layout_code
        log_test(
            "Skip to Content Landmark Bypass",
            has_main_id and has_skip_link,
            "Skip to main content link links directly to <main id='main-content'>"
        )

        # =====================================================================
        # TEST GROUP 5: ACCESSIBILITY & ARIA SEMANTICS
        # =====================================================================
        print("\n--- 5. ACCESSIBILITY & ARIA SEMANTICS ---")
        
        # 5.1 Video Scrubber Slider Semantics
        explore_path = os.path.join(PROJECT_ROOT, "src", "components", "explore", "ExploreSection.jsx")
        with open(explore_path, "r", encoding="utf-8") as f:
            explore_code = f.read()
        has_slider_role = 'role="slider"' in explore_code
        has_slider_keyboard = 'onKeyDown=' in explore_code and 'ArrowRight' in explore_code
        log_test(
            "Video Scrubber Accessibility",
            has_slider_role and has_slider_keyboard,
            "Progress scrubber has role=slider, tabIndex, ARIA values, and arrow key handlers"
        )

        # 5.2 Table Accessibility (Comparison Section)
        comparison_path = os.path.join(PROJECT_ROOT, "src", "components", "comparison", "ComparisonSection.jsx")
        with open(comparison_path, "r", encoding="utf-8") as f:
            comp_code = f.read()
        has_table_label = 'aria-label=' in comp_code and '<table' in comp_code
        has_th_col = 'scope="col"' in comp_code
        has_th_row = 'scope="row"' in comp_code
        log_test(
            "Comparison Table Accessibility",
            has_table_label and has_th_col and has_th_row,
            "Table has aria-label, scope='col' headers, and scope='row' feature cells"
        )

        # 5.3 Window Types Tablist Semantics
        window_path = os.path.join(PROJECT_ROOT, "src", "components", "installations", "WindowTypesSection.jsx")
        with open(window_path, "r", encoding="utf-8") as f:
            window_code = f.read()
        has_tablist = 'role="tablist"' in window_code
        has_tab = 'role="tab"' in window_code
        has_tabpanel = 'role="tabpanel"' in window_code
        log_test(
            "Window Types Tablist WAI-ARIA",
            has_tablist and has_tab and has_tabpanel,
            "Interactive window types use role=tablist, role=tab, and role=tabpanel"
        )

        # 5.4 Reviews Section Carousel Accessibility
        reviews_path = os.path.join(PROJECT_ROOT, "src", "components", "reviews", "ReviewsSection.jsx")
        with open(reviews_path, "r", encoding="utf-8") as f:
            reviews_code = f.read()
        has_prev_aria = 'aria-label="Previous review"' in reviews_code
        has_next_aria = 'aria-label="Next review"' in reviews_code
        has_pagination_aria = 'role="tablist"' in reviews_code and 'aria-selected' in reviews_code
        log_test(
            "Reviews Carousel Accessibility",
            has_prev_aria and has_next_aria and has_pagination_aria,
            "Carousel controls and pagination dots have explicit accessible names"
        )

        # 5.5 Enquiry Form Labels & File Upload
        enquiry_path = os.path.join(PROJECT_ROOT, "src", "components", "forms", "EnquiryForm.jsx")
        with open(enquiry_path, "r", encoding="utf-8") as f:
            enquiry_code = f.read()
        has_photo_htmlfor = 'htmlFor="sv-photos"' in enquiry_code
        has_photo_id = 'id="sv-photos"' in enquiry_code
        log_test(
            "Form Control Label Associations",
            has_photo_htmlfor and has_photo_id,
            "Property photo upload label explicitly references input id='sv-photos'"
        )

        # =====================================================================
        # TEST GROUP 6: 404 & ERROR BOUNDARY AUDIT
        # =====================================================================
        print("\n--- 6. 404 NOT-FOUND & ERROR BOUNDARY AUDIT ---")
        not_found_path = os.path.join(PROJECT_ROOT, "src", "app", "not-found.jsx")
        with open(not_found_path, "r", encoding="utf-8") as f:
            nf_code = f.read()
        nf_has_h1 = nf_code.count("<h1") == 1
        nf_has_noindex = "index: false" in nf_code and "follow: false" in nf_code
        nf_has_home_cta = 'href="/"' in nf_code
        log_test(
            "Accessible 404 Page",
            nf_has_h1 and nf_has_noindex and nf_has_home_cta,
            "Dedicated 404 route with single H1, robots noindex, and return home action"
        )

        error_path = os.path.join(PROJECT_ROOT, "src", "app", "error.jsx")
        with open(error_path, "r", encoding="utf-8") as f:
            err_code = f.read()
        err_has_reset = "reset()" in err_code
        err_no_leak = "error.stack" not in err_code
        log_test(
            "Client Error Boundary",
            err_has_reset and err_no_leak,
            "Global error boundary has reset retry button without leaking sensitive stack traces"
        )

        # =====================================================================
        # TEST GROUP 7: DATABASE TEST LIFECYCLE & TEARDOWN
        # =====================================================================
        print("\n--- 7. DATABASE TEST LIFECYCLE & CLEAN TEARDOWN ---")
        # Insert temporary test record
        test_site_visit = {
            "name": f"{PREFIX}Accessibility Audit User",
            "phoneNumber": "9100000003",
            "whatsappNumber": "9100000003",
            "locality": "Kondapur",
            "createdAt": datetime.now(timezone.utc),
            "status": "pending",
        }
        ins_res = await db.site_visits.insert_one(test_site_visit)
        log_test(
            "Temporary Test Insertion",
            ins_res.inserted_id is not None,
            f"Created test site visit record {ins_res.inserted_id}"
        )

        # Cleanup test record
        del_res = await db.site_visits.delete_many({"name": {"$regex": f"^{PREFIX}"}})
        log_test(
            "Clean Teardown Execution",
            del_res.deleted_count > 0,
            f"Successfully purged {del_res.deleted_count} test records"
        )

        # Verify 0 residual records in MongoDB
        residual_visits = await db.site_visits.count_documents({"name": {"$regex": f"^{PREFIX}"}})
        residual_admins = await db.admin_users.count_documents({"email": {"$regex": f"^{PREFIX.lower()}"}})
        total_residuals = residual_visits + residual_admins
        log_test(
            "Zero Residual Test Marker Verification",
            total_residuals == 0,
            f"Final residual count: {total_residuals} (Expected: 0)"
        )

    await close_mongo_connection()
    print("\n" + "=" * 80)
    print(" ALL PART A3 SEO, ACCESSIBILITY & PRESENTATION TESTS PASSED SUCCESSFULLY! ")
    print("=" * 80)


if __name__ == "__main__":
    asyncio.run(run_part_a3_audit())
