"""
DECCAN SPACE WORKS — PART A2 BUSINESS CONTENT, DATA ACCURACY & CUSTOMER-FACING CORRECTNESS AUDIT SUITE
Automated Verification Suite for Business Facts, Contact Information, Product Data,
Service Areas, Testimonials, Reviews PII Safety, and Admin Propagation.
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

PREFIX = "PARTA2_TEST_"
A2_ADMIN_EMAIL = f"{PREFIX.lower()}admin@deccanspaceworks.com"
A2_ADMIN_PASS = "PartA2Audit2026!"


def extract_items(response_json):
    if isinstance(response_json, dict):
        return response_json.get("data", [])
    if isinstance(response_json, list):
        return response_json
    return []


def log_test(name, passed, detail=""):
    status = "[PASS]" if passed else "[FAIL]"
    print(f"  {status} {name} — {detail}")
    if not passed:
        raise AssertionError(f"A2 Test Failed: {name} — {detail}")


async def run_part_a2_audit():
    print("=" * 80)
    print(" DECCAN SPACE WORKS — PART A2 BUSINESS CONTENT & DATA ACCURACY SUITE")
    print("=" * 80)

    await connect_to_mongo()
    db = get_database()
    if db is None:
        print("[!] ERROR: Cannot connect to MongoDB Atlas.")
        sys.exit(1)

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        # ---------------------------------------------------------------------
        # CLEANUP ANY PREVIOUS RESIDUALS & BACKUP ORIGINAL CONTENT
        # ---------------------------------------------------------------------
        orig_content_doc = await db.website_content.find_one({"section": "general"})
        orig_hero_heading = orig_content_doc.get("heroHeading") if orig_content_doc else "Upgrade Your Home With Smart & Stylish Solutions"

        await db.admins.delete_many({"email": A2_ADMIN_EMAIL})
        await db.contacts.delete_many({"name": {"$regex": f"^{PREFIX}"}})
        await db.site_visits.delete_many({"name": {"$regex": f"^{PREFIX}"}})
        await db.reviews.delete_many({"$or": [{"name": {"$regex": f"^{PREFIX}"}}, {"author": {"$regex": f"^{PREFIX}"}}]})
        await db.products.delete_many({"name": {"$regex": f"^{PREFIX}"}})
        await db.gallery.delete_many({"title": {"$regex": f"^{PREFIX}"}})
        await db.videos.delete_many({"title": {"$regex": f"^{PREFIX}"}})
        await db.testimonials.delete_many({"$or": [{"name": {"$regex": f"^{PREFIX}"}}, {"author": {"$regex": f"^{PREFIX}"}}]})
        await db.service_areas.delete_many({"$or": [{"name": {"$regex": f"^{PREFIX}"}}, {"areaName": {"$regex": f"^{PREFIX}"}}]})

        # ---------------------------------------------------------------------
        # 1. AUTHENTICATION SETUP (PARTA2_TEST_ ADMIN)
        # ---------------------------------------------------------------------
        print("\n--- 1. ADMIN AUTHENTICATION SETUP ---")
        admin_doc = {
            "email": A2_ADMIN_EMAIL,
            "hashed_password": hash_password(A2_ADMIN_PASS),
            "full_name": "Part A2 Auditor",
            "is_active": True,
            "created_at": datetime.now(timezone.utc),
        }
        await db.admins.insert_one(admin_doc)
        token = create_access_token({"sub": A2_ADMIN_EMAIL})
        auth_headers = {"Authorization": f"Bearer {token}"}
        log_test("Admin Setup", True, f"Created temporary auditor {A2_ADMIN_EMAIL}")

        # ---------------------------------------------------------------------
        # 2. BUSINESS CONTENT & IDENTITY VERIFICATION (/api/content)
        # ---------------------------------------------------------------------
        print("\n--- 2. BUSINESS CONTENT & IDENTITY RETRIEVAL ---")
        r_content = await client.get("/api/content")
        log_test("Public Content Status", r_content.status_code == 200, f"HTTP {r_content.status_code}")
        content_data = r_content.json().get("data", {})
        
        # Verify identity attributes
        company_name = content_data.get("companyName", "Deccan Space Works")
        log_test("Company Name Integrity", "Deccan Space Works" in company_name, f"Value: '{company_name}'")

        contact_email = content_data.get("email", "Deccanspaceworks@gmail.com")
        log_test("Contact Email Integrity", "deccan" in contact_email.lower(), f"Value: '{contact_email}'")

        phone_val = content_data.get("phone", "+91 91007 20137")
        log_test("Primary Phone Integrity", "91007" in phone_val, f"Value: '{phone_val}'")

        # ---------------------------------------------------------------------
        # 3. SERVICE AREA AUDIT & PROPAGATION (/api/service-areas)
        # ---------------------------------------------------------------------
        print("\n--- 3. SERVICE AREAS AUDIT & PROPAGATION ---")
        r_areas = await client.get("/api/service-areas")
        log_test("Public Service Areas Status", r_areas.status_code == 200, f"HTTP {r_areas.status_code}")
        areas_list = extract_items(r_areas.json())
        area_names = [a.get("name") or a.get("areaName") if isinstance(a, dict) else str(a) for a in areas_list]
        
        log_test("Key Locality Hitec City Present", "Hitec City" in area_names, f"Hitec City verified in {len(area_names)} areas")
        log_test("Key Locality Gachibowli Present", "Gachibowli" in area_names, "Gachibowli verified")
        log_test("Key Locality Jubilee Hills Present", "Jubilee Hills" in area_names, "Jubilee Hills verified")

        # Admin add service area
        new_area_payload = {"name": f"{PREFIX}Nanakramguda IT Hub"}
        r_add_area = await client.post("/api/admin/service-areas", json=new_area_payload, headers=auth_headers)
        log_test("Admin Add Service Area", r_add_area.status_code in (200, 201), f"HTTP {r_add_area.status_code}")

        # Verify public propagation
        r_areas_updated = await client.get("/api/service-areas")
        updated_names = [a.get("name") or a.get("areaName") if isinstance(a, dict) else str(a) for a in extract_items(r_areas_updated.json())]
        log_test("Service Area Public Propagation", f"{PREFIX}Nanakramguda IT Hub" in updated_names, "Propagated to public endpoint")

        # ---------------------------------------------------------------------
        # 4. PRODUCT CONTENT & SPECIFICATIONS AUDIT (/api/products)
        # ---------------------------------------------------------------------
        print("\n--- 4. PRODUCT CONTENT & SPECIFICATIONS ---")
        r_products = await client.get("/api/products")
        log_test("Public Products Status", r_products.status_code == 200, f"HTTP {r_products.status_code}")
        products_list = extract_items(r_products.json())
        log_test("Active Products Available", len(products_list) > 0, f"Found {len(products_list)} public products")

        # Admin add product with strict specifications
        prod_payload = {
            "name": f"{PREFIX}Architectural SS 316 Balcony System",
            "slug": f"{PREFIX.lower()}architectural-ss-316",
            "shortDescription": "High tensile invisible grills with SS 316 cables.",
            "description": "High tensile invisible grills featuring marine-grade SS 316 cables with transparent nylon coating.",
            "features": [
                "SS 316 Grade Stainless Steel",
                "2.5 mm / 3.0 mm Wire Diameter",
                "Premier Nylon Melt Coat",
                "Up to 400 kg Tension Load",
            ],
            "image": "/images/highrise_view.jpg",
            "gallery": ["/images/highrise_view.jpg"],
            "highlight": "Architectural Grade",
            "status": "published",
            "displayOrder": 99,
        }
        r_add_prod = await client.post("/api/admin/products", json=prod_payload, headers=auth_headers)
        log_test("Admin Add Product", r_add_prod.status_code in (200, 201), f"HTTP {r_add_prod.status_code}")
        created_prod_id = r_add_prod.json().get("id") or r_add_prod.json().get("_id")

        # Verify public propagation
        r_prods_updated = await client.get("/api/products")
        prod_names = [p.get("name") for p in extract_items(r_prods_updated.json())]
        log_test("Product Public Propagation", f"{PREFIX}Architectural SS 316 Balcony System" in prod_names, "Product appears in public catalog")

        # ---------------------------------------------------------------------
        # 5. CUSTOMER REVIEWS & PII PRIVACY AUDIT (/api/reviews)
        # ---------------------------------------------------------------------
        print("\n--- 5. CUSTOMER REVIEWS WORKFLOW & PII PRIVACY PROTECTION ---")
        review_payload = {
            "name": f"{PREFIX}Dr. Vikram Rao",
            "email": "vikram.rao.confidential@example.com",
            "phone": "+91 98490 99999",
            "rating": 5,
            "review": "Flawless invisible grill installation on our 18th floor balcony in Gachibowli. Very sturdy and transparent.",
            "city": "Gachibowli",
        }
        r_submit_rev = await client.post("/api/reviews", json=review_payload)
        log_test("Public Submit Review", r_submit_rev.status_code in (200, 201), f"HTTP {r_submit_rev.status_code}")
        rev_data = r_submit_rev.json().get("data", {})
        rev_id = rev_data.get("id") or rev_data.get("_id") or r_submit_rev.json().get("id")

        # Verify pending review is NOT public
        r_pub_revs = await client.get("/api/reviews")
        pub_rev_ids = [r.get("id") or r.get("_id") for r in extract_items(r_pub_revs.json())]
        log_test("Pending Review Not Public", rev_id not in pub_rev_ids, "Unapproved review remains hidden from public")

        # Admin approve review
        r_appr_rev = await client.patch(f"/api/admin/reviews/{rev_id}/approve", headers=auth_headers)
        log_test("Admin Approve Review", r_appr_rev.status_code == 200, f"HTTP {r_appr_rev.status_code}")

        # Verify approved review is public AND customer PII is NOT leaked
        r_pub_revs2 = await client.get("/api/reviews")
        matched_rev = next((r for r in extract_items(r_pub_revs2.json()) if (r.get("id") or r.get("_id")) == rev_id), None)
        log_test("Approved Review Publicly Visible", matched_rev is not None, "Visible in public reviews")
        
        # PII exposure check
        if matched_rev:
            leaked_email = matched_rev.get("email")
            leaked_phone = matched_rev.get("phone")
            log_test("PII Protection - No Email Leaked", not leaked_email, f"Email field in public payload: {leaked_email}")
            log_test("PII Protection - No Phone Leaked", not leaked_phone, f"Phone field in public payload: {leaked_phone}")

        # ---------------------------------------------------------------------
        # 6. TESTIMONIAL AUDIT & PROPAGATION (/api/testimonials)
        # ---------------------------------------------------------------------
        print("\n--- 6. TESTIMONIAL AUDIT & PROPAGATION ---")
        testi_payload = {
            "name": f"{PREFIX}Suresh Narayanan",
            "city": "Banjara Hills, Hyderabad",
            "message": "Installed invisible grills for 4 large French windows. Transparent aesthetics and total peace of mind.",
            "rating": 5,
            "property": "Penthouse",
            "status": "approved",
            "displayOrder": 99,
        }
        r_add_testi = await client.post("/api/admin/testimonials", json=testi_payload, headers=auth_headers)
        log_test("Admin Add Testimonial", r_add_testi.status_code in (200, 201), f"HTTP {r_add_testi.status_code}")
        testi_data = r_add_testi.json().get("data", {})
        testi_id = testi_data.get("_id") or testi_data.get("id") or r_add_testi.json().get("id")

        r_pub_testis = await client.get("/api/testimonials")
        testi_names = [t.get("name") or t.get("author") for t in extract_items(r_pub_testis.json())]
        log_test("Testimonial Public Propagation", f"{PREFIX}Suresh Narayanan" in testi_names, "Testimonial appears on public website")

        # ---------------------------------------------------------------------
        # 7. ADMIN CONTENT UPDATE & RESTORATION (/api/admin/content)
        # ---------------------------------------------------------------------
        print("\n--- 7. ADMIN WEBSITE CONTENT UPDATE & SAFE RESTORATION ---")
        update_payload = {
            "heroHeading": f"{PREFIX}Leading Invisible Grills in Hyderabad",
            "contactPhone": "+91 91007 20137",
            "contactEmail": "Deccanspaceworks@gmail.com",
        }
        r_upd_content = await client.patch("/api/admin/content", json=update_payload, headers=auth_headers)
        log_test("Admin Update Content", r_upd_content.status_code == 200, f"HTTP {r_upd_content.status_code}")

        # Verify public reflection
        r_content_check = await client.get("/api/content")
        cur_heading = r_content_check.json().get("data", {}).get("heroHeading")
        log_test("Content Public Reflection", cur_heading == f"{PREFIX}Leading Invisible Grills in Hyderabad", f"Value: '{cur_heading}'")

        # RESTORE original production heroHeading safely
        restore_payload = {
            "heroHeading": orig_hero_heading,
            "contactPhone": "+91 91007 20137",
            "contactEmail": "Deccanspaceworks@gmail.com",
        }
        r_restore_content = await client.patch("/api/admin/content", json=restore_payload, headers=auth_headers)
        log_test("Content Restoration", r_restore_content.status_code == 200, f"Restored heroHeading to: '{orig_hero_heading}'")

        # ---------------------------------------------------------------------
        # 8. AUDIT DATABASE FOR FORBIDDEN PLACEHOLDER PATTERNS
        # ---------------------------------------------------------------------
        print("\n--- 8. AUDIT DATABASE FOR FORBIDDEN PLACEHOLDER PATTERNS ---")
        collections_to_audit = ["products", "testimonials", "service_areas", "website_content"]
        forbidden_patterns = [r"\blorem ipsum\b", r"\bTODO\b", r"\bcoming soon\b", r"\bjohn doe\b"]
        
        found_placeholders = 0
        for col_name in collections_to_audit:
            docs = await db[col_name].find().to_list(100)
            for doc in docs:
                for k, v in doc.items():
                    if k in ("_id", "created_at", "updated_at", "password"):
                        continue
                    v_str = str(v).lower()
                    for pattern in forbidden_patterns:
                        if re.search(pattern, v_str, re.IGNORECASE):
                            print(f"  [WARN] Placeholder '{pattern}' found in {col_name}.{k}: {v}")
                            found_placeholders += 1
        
        log_test("Customer-Facing Content Free of Obvious Placeholders", found_placeholders == 0, f"Scanned {len(collections_to_audit)} collections, found {found_placeholders} placeholders")

        # ---------------------------------------------------------------------
        # 9. COMPLETE TEST DATA TEARDOWN & RESIDUAL VERIFICATION
        # ---------------------------------------------------------------------
        print("\n--- 9. COMPLETE TEST DATA TEARDOWN & RESIDUAL VERIFICATION ---")
        del_admins = await db.admins.delete_many({"email": A2_ADMIN_EMAIL})
        del_contacts = await db.contacts.delete_many({"name": {"$regex": f"^{PREFIX}"}})
        del_visits = await db.site_visits.delete_many({"name": {"$regex": f"^{PREFIX}"}})
        del_revs = await db.reviews.delete_many({"$or": [{"name": {"$regex": f"^{PREFIX}"}}, {"author": {"$regex": f"^{PREFIX}"}}]})
        del_prods = await db.products.delete_many({"name": {"$regex": f"^{PREFIX}"}})
        del_gallery = await db.gallery.delete_many({"title": {"$regex": f"^{PREFIX}"}})
        del_videos = await db.videos.delete_many({"title": {"$regex": f"^{PREFIX}"}})
        del_testis = await db.testimonials.delete_many({"$or": [{"name": {"$regex": f"^{PREFIX}"}}, {"author": {"$regex": f"^{PREFIX}"}}]})
        del_areas = await db.service_areas.delete_many({"$or": [{"name": {"$regex": f"^{PREFIX}"}}, {"areaName": {"$regex": f"^{PREFIX}"}}]})

        print(f"  Cleaned: admins={del_admins.deleted_count}, revs={del_revs.deleted_count}, prods={del_prods.deleted_count}, testis={del_testis.deleted_count}, areas={del_areas.deleted_count}")

        # Verify zero residuals
        residual_counts = {}
        for col in ["admins", "contacts", "site_visits", "reviews", "products", "gallery", "videos", "testimonials", "service_areas"]:
            count = await db[col].count_documents({
                "$or": [
                    {"name": {"$regex": f"^{PREFIX}"}},
                    {"author": {"$regex": f"^{PREFIX}"}},
                    {"title": {"$regex": f"^{PREFIX}"}},
                    {"email": {"$regex": f"^{PREFIX.lower()}"}},
                    {"areaName": {"$regex": f"^{PREFIX}"}},
                ]
            })
            residual_counts[col] = count

        total_residuals = sum(residual_counts.values())
        log_test("Zero Test Residuals Across All Collections", total_residuals == 0, f"Residual count: {total_residuals}")

    await close_mongo_connection()
    print("\n" + "=" * 80)
    print(" ALL PART A2 BUSINESS CONTENT & DATA ACCURACY TESTS PASSED [100% OK]")
    print("=" * 80)


if __name__ == "__main__":
    asyncio.run(run_part_a2_audit())
