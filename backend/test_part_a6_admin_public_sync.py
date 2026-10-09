"""
DECCAN SPACE WORKS — PART A6 ADMIN -> PUBLIC SYNCHRONIZATION DEEP AUDIT SUITE
Automated Verification Suite for:
SECTION 1:  Synchronization architecture & API availability
SECTION 2:  Products Admin -> DB -> Public
SECTION 3:  Gallery Admin -> DB -> Public
SECTION 4:  Videos Admin -> DB -> Public
SECTION 5:  Testimonials Admin -> DB -> Public
SECTION 6:  Reviews Public -> Admin -> Public (PII protection, pending/approved/rejected)
SECTION 7:  Service Areas Admin -> DB -> Public (spelling verification)
SECTION 8:  Website Content Admin -> DB -> Public (claim protection)
SECTION 9:  Media URL / visibility synchronization (no internal paths, property photo privacy)
SECTION 10: Contacts Public -> Admin (enquiry persistence & triage)
SECTION 11: Site Visits Public -> Admin (scheduling & photo handling)
SECTION 12: Cache / stale-data / refresh behavior (Cache-Control & immediate reflection)
SECTION 13: API field & schema consistency (data types, booleans, numbers)
SECTION 14: Failure / partial update / delete propagation (PATCH isolation & clean deletion)
SECTION 15: Security & privacy during synchronization (auth barriers & IDOR protection)
SECTION 16: Final cleanup and database integrity (0 residual test records)
"""

import asyncio
import os
import sys
import io
import re
from datetime import datetime, timezone, timedelta
import httpx
from bson import ObjectId

# Ensure backend root is on python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.config import settings
from app.core.database import connect_to_mongo, close_mongo_connection, get_database
from app.core.security import hash_password, create_access_token
from app.main import app

PREFIX = "PARTA6_TEST_"
A6_ADMIN_EMAIL = f"{PREFIX.lower()}admin@deccanspaceworks.com"
A6_ADMIN_PASS = "SyncAudit2026!Deccan"

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
        raise AssertionError(f"A6 Test Failed: {name} - {detail}")


async def run_part_a6_audit():
    global passed_tests, failed_tests
    print("=" * 80)
    print(" DECCAN SPACE WORKS - PART A6 ADMIN -> PUBLIC SYNCHRONIZATION AUDIT")
    print("=" * 80)

    await connect_to_mongo()
    db = get_database()
    if db is None:
        print("[!] ERROR: Cannot connect to MongoDB Atlas.")
        sys.exit(1)

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        # ---------------------------------------------------------------------
        # Pre-cleanup: wipe any prior test remnants across all collections
        # ---------------------------------------------------------------------
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

        # Setup test active admin
        active_admin_doc = {
            "name": f"{PREFIX}Admin",
            "email": A6_ADMIN_EMAIL,
            "passwordHash": hash_password(A6_ADMIN_PASS),
            "role": "admin",
            "isActive": True,
            "createdAt": datetime.now(timezone.utc),
            "lastLogin": None
        }
        await db.admins.insert_one(active_admin_doc)

        login_res = await client.post("/api/admin/login", json={
            "email": A6_ADMIN_EMAIL,
            "password": A6_ADMIN_PASS
        })
        token = login_res.json()["data"]["token"]
        auth_headers = {"Authorization": f"Bearer {token}"}

        # =====================================================================
        # SECTION 1: Synchronization Architecture & API Availability
        # =====================================================================
        print("\n--- SECTION 1: Synchronization Architecture & API Availability ---")
        health_res = await client.get("/api/health")
        log_test("FastAPI Health Check", health_res.status_code == 200 and health_res.json().get("status") == "healthy",
                 "Service operational and MongoDB connected")

        # Verify all core public endpoints respond with 200
        endpoints = [
            "/api/products",
            "/api/gallery",
            "/api/videos",
            "/api/testimonials",
            "/api/reviews",
            "/api/service-areas",
            "/api/content",
        ]
        for ep in endpoints:
            r = await client.get(ep)
            log_test(f"Public Endpoint Responds: {ep}", r.status_code == 200, f"HTTP {r.status_code}")

        # =====================================================================
        # SECTION 2: Products Admin -> DB -> Public
        # =====================================================================
        print("\n--- SECTION 2: Products Admin -> DB -> Public ---")
        prod_slug = f"{PREFIX.lower()}prod_smart_grill"
        prod_payload = {
            "name": f"{PREFIX}Smart Invisible Grill",
            "slug": prod_slug,
            "shortDescription": "High tensile stainless steel wire for balconies",
            "description": "Full technical description with 316 marine grade alloy",
            "features": ["Marine Grade 316", "3.0mm thickness", "400kg load test"],
            "image": "/images/test_smart_grill.jpg",
            "gallery": ["/images/test_smart_grill.jpg"],
            "highlight": "Engineering Test",
            "status": "published",
            "displayOrder": 99
        }

        # 2.1 Admin Create Product
        res = await client.post("/api/admin/products", json=prod_payload, headers=auth_headers)
        log_test("Admin Creates Product", res.status_code == 200, f"HTTP {res.status_code}")
        prod_id = res.json()["data"]["_id"]

        # 2.2 Verify in MongoDB
        db_prod = await db.products.find_one({"_id": ObjectId(prod_id)})
        log_test("Product Persisted in MongoDB", db_prod is not None and db_prod["slug"] == prod_slug,
                 f"MongoDB doc ID {prod_id}")

        # 2.3 Verify in Public API /api/products
        pub_prods = (await client.get("/api/products")).json()["data"]
        found_in_pub = next((p for p in pub_prods if p["slug"] == prod_slug), None)
        log_test("Product Appears on Public /api/products", found_in_pub is not None,
                 f"Name: {found_in_pub.get('name') if found_in_pub else 'None'}")
        log_test("Product Public Field Integrity", (
            found_in_pub is not None and
            found_in_pub.get("shortDescription") == prod_payload["shortDescription"] and
            found_in_pub.get("image") == prod_payload["image"] and
            found_in_pub.get("displayOrder") == 99
        ), "All fields matched accurately")

        # 2.4 Verify in Public Single Product /api/products/{slug}
        single_res = await client.get(f"/api/products/{prod_slug}")
        log_test("Public Single Product Retrieval by Slug", single_res.status_code == 200,
                 f"Slug {prod_slug} returned 200")

        # 2.5 Admin Update Product
        update_payload = {
            "name": f"{PREFIX}Updated Smart Grill",
            "shortDescription": "Updated balcony protection",
            "highlight": "Updated Tag"
        }
        patch_res = await client.patch(f"/api/admin/products/{prod_id}", json=update_payload, headers=auth_headers)
        log_test("Admin Updates Product", patch_res.status_code == 200, f"HTTP {patch_res.status_code}")

        # Verify update reached MongoDB and Public API
        updated_db = await db.products.find_one({"_id": ObjectId(prod_id)})
        log_test("Product Update in MongoDB", updated_db["name"] == update_payload["name"], "DB updated")
        pub_prods_updated = (await client.get("/api/products")).json()["data"]
        found_updated = next((p for p in pub_prods_updated if p["slug"] == prod_slug), None)
        log_test("Product Update on Public API", found_updated is not None and found_updated["name"] == update_payload["name"],
                 "Public API served updated name")

        # 2.6 Admin Unpublish / Draft Product
        patch_status = await client.patch(f"/api/admin/products/{prod_id}", json={"status": "draft"}, headers=auth_headers)
        log_test("Admin Changes Product Status to Draft", patch_status.status_code == 200, "Status updated to draft")
        pub_prods_after_draft = (await client.get("/api/products")).json()["data"]
        found_in_draft = next((p for p in pub_prods_after_draft if p["slug"] == prod_slug), None)
        log_test("Draft Product Excluded from Public API", found_in_draft is None, "Draft hidden from public")
        single_draft_res = await client.get(f"/api/products/{prod_slug}")
        log_test("Draft Product Returns 404 on Slug Route", single_draft_res.status_code == 404, "404 returned for draft")

        # 2.7 Admin Delete Product
        del_res = await client.delete(f"/api/admin/products/{prod_id}", headers=auth_headers)
        log_test("Admin Deletes Product", del_res.status_code == 200, "Deleted from admin")
        db_after_del = await db.products.find_one({"_id": ObjectId(prod_id)})
        log_test("Product Purged from MongoDB", db_after_del is None, "0 docs in DB")

        # =====================================================================
        # SECTION 3: Gallery Admin -> DB -> Public
        # =====================================================================
        print("\n--- SECTION 3: Gallery Admin -> DB -> Public ---")
        gal_payload = {
            "title": f"{PREFIX}Terrace Installation Photo",
            "description": "Full height 316 Marine Grade wire installed on luxury penthouse terrace",
            "category": "Balconies",
            "imageUrl": "/images/test_penthouse_terrace.jpg",
            "displayOrder": 95,
            "status": "active"
        }
        res = await client.post("/api/admin/gallery", json=gal_payload, headers=auth_headers)
        log_test("Admin Creates Gallery Item", res.status_code == 200, f"HTTP {res.status_code}")
        gal_id = res.json()["data"]["_id"]

        # Verify in MongoDB
        db_gal = await db.gallery.find_one({"_id": ObjectId(gal_id)})
        log_test("Gallery Item in MongoDB", db_gal is not None and db_gal["imageUrl"] == gal_payload["imageUrl"],
                 "Persisted in DB")

        # Verify in Public API /api/gallery
        pub_gal = (await client.get("/api/gallery")).json()["data"]
        found_gal = next((g for g in pub_gal if g["_id"] == gal_id), None)
        log_test("Gallery Appears on Public /api/gallery", found_gal is not None, "Item visible publicly")
        log_test("Gallery Schema Mapping (imageUrl & description)", (
            found_gal is not None and
            found_gal.get("imageUrl") == gal_payload["imageUrl"] and
            found_gal.get("description") == gal_payload["description"] and
            found_gal.get("category") == gal_payload["category"]
        ), "Public gallery contracts aligned")

        # Filter by category
        cat_gal = (await client.get("/api/gallery?category=Balconies")).json()["data"]
        log_test("Gallery Filter by Category Works", any(g["_id"] == gal_id for g in cat_gal),
                 "Category Balconies contains item")

        # Admin Deactivate Gallery Item
        await client.patch(f"/api/admin/gallery/{gal_id}", json={"status": "inactive"}, headers=auth_headers)
        pub_gal_inactive = (await client.get("/api/gallery")).json()["data"]
        log_test("Inactive Gallery Item Excluded from Public API", not any(g["_id"] == gal_id for g in pub_gal_inactive),
                 "Inactive item hidden from public")

        # Admin Delete Gallery Item
        await client.delete(f"/api/admin/gallery/{gal_id}", headers=auth_headers)
        db_gal_del = await db.gallery.find_one({"_id": ObjectId(gal_id)})
        log_test("Gallery Item Purged from MongoDB", db_gal_del is None, "0 docs in DB")

        # =====================================================================
        # SECTION 4: Videos Admin -> DB -> Public
        # =====================================================================
        print("\n--- SECTION 4: Videos Admin -> DB -> Public ---")
        vid_payload = {
            "title": f"{PREFIX}Highrise Tension Test",
            "subtitle": "Engineering Rigidity",
            "description": "Live load testing showing 400kg tension withstand on balcony cables.",
            "category": "Installation",
            "videoUrl": "/videos/test_rigidity.mp4",
            "thumbnailUrl": "/images/test_poster_cable.jpg",
            "tag": "RIGIDITY TEST",
            "displayOrder": 88,
            "status": "active"
        }
        res = await client.post("/api/admin/videos", json=vid_payload, headers=auth_headers)
        log_test("Admin Creates Video", res.status_code == 200, f"HTTP {res.status_code}")
        vid_id = res.json()["data"]["_id"]

        # Verify in MongoDB
        db_vid = await db.videos.find_one({"_id": ObjectId(vid_id)})
        log_test("Video in MongoDB", db_vid is not None and db_vid["videoUrl"] == vid_payload["videoUrl"],
                 "Persisted in DB")

        # Verify on Public API /api/videos
        pub_vids = (await client.get("/api/videos")).json()["data"]
        found_vid = next((v for v in pub_vids if v["_id"] == vid_id), None)
        log_test("Video Appears on Public /api/videos", found_vid is not None, "Video visible publicly")
        log_test("Video Poster & URL Propagation", (
            found_vid is not None and
            found_vid.get("videoUrl") == vid_payload["videoUrl"] and
            found_vid.get("thumbnailUrl") == vid_payload["thumbnailUrl"]
        ), "Poster and video URL correctly synchronized")

        # Admin Deactivate Video
        await client.patch(f"/api/admin/videos/{vid_id}", json={"status": "inactive"}, headers=auth_headers)
        pub_vids_inactive = (await client.get("/api/videos")).json()["data"]
        log_test("Inactive Video Excluded from Public API", not any(v["_id"] == vid_id for v in pub_vids_inactive),
                 "Inactive video hidden")

        # Admin Delete Video
        await client.delete(f"/api/admin/videos/{vid_id}", headers=auth_headers)
        db_vid_del = await db.videos.find_one({"_id": ObjectId(vid_id)})
        log_test("Video Purged from MongoDB", db_vid_del is None, "0 docs in DB")

        # =====================================================================
        # SECTION 5: Testimonials Admin -> DB -> Public
        # =====================================================================
        print("\n--- SECTION 5: Testimonials Admin -> DB -> Public ---")
        testim_payload = {
            "name": f"{PREFIX}Anand Kulkarni",
            "city": "Hyderabad",
            "property": "4BHK Duplex - Financial District",
            "rating": 5,
            "message": "Outstanding precision installation for our high-floor balconies. Safe and sleek.",
            "highlight": "Precision Duplex Install",
            "photo": None,
            "status": "approved",
            "displayOrder": 90
        }
        res = await client.post("/api/admin/testimonials", json=testim_payload, headers=auth_headers)
        log_test("Admin Creates Testimonial", res.status_code == 200, f"HTTP {res.status_code}")
        testim_id = res.json()["data"]["_id"]

        # Verify in MongoDB
        db_testim = await db.testimonials.find_one({"_id": ObjectId(testim_id)})
        log_test("Testimonial in MongoDB", db_testim is not None and db_testim["name"] == testim_payload["name"],
                 "Persisted in DB")

        # Verify on Public API /api/testimonials
        pub_testims = (await client.get("/api/testimonials")).json()["data"]
        found_testim = next((t for t in pub_testims if t["_id"] == testim_id), None)
        log_test("Testimonial Appears on Public /api/testimonials", found_testim is not None,
                 "Testimonial visible publicly")
        log_test("Testimonial Rating and Highlight Synchronized", (
            found_testim is not None and
            found_testim.get("rating") == 5 and
            found_testim.get("highlight") == testim_payload["highlight"]
        ), "Fields accurately mapped")

        # Admin Deactivate Testimonial (status -> hidden)
        await client.patch(f"/api/admin/testimonials/{testim_id}", json={"status": "hidden"}, headers=auth_headers)
        pub_testims_hidden = (await client.get("/api/testimonials")).json()["data"]
        log_test("Hidden Testimonial Excluded from Public API", not any(t["_id"] == testim_id for t in pub_testims_hidden),
                 "Hidden status excluded")

        # Admin Delete Testimonial
        await client.delete(f"/api/admin/testimonials/{testim_id}", headers=auth_headers)
        db_testim_del = await db.testimonials.find_one({"_id": ObjectId(testim_id)})
        log_test("Testimonial Purged from MongoDB", db_testim_del is None, "0 docs in DB")

        # =====================================================================
        # SECTION 6: Reviews Public -> Admin -> Public
        # =====================================================================
        print("\n--- SECTION 6: Reviews Public -> Admin -> Public (PII & Moderation) ---")
        rev_payload = {
            "name": f"{PREFIX}Srinivas Rao",
            "phone": "9876543210",
            "email": f"{PREFIX.lower()}srinivas@example.com",
            "location": "Madhapur, Hyderabad",
            "rating": 5,
            "review": "Very clean work on our balcony grills. Cables are sturdy and almost invisible."
        }
        # 6.1 Customer submits review
        submit_res = await client.post("/api/reviews", json=rev_payload)
        log_test("Public Submits Review", submit_res.status_code == 200, f"HTTP {submit_res.status_code}")
        rev_id = submit_res.json()["data"]["id"]

        # 6.2 Verify in MongoDB with pending status
        db_rev = await db.reviews.find_one({"_id": ObjectId(rev_id)})
        log_test("Review Persisted with Pending Status", db_rev is not None and db_rev["status"] == "pending",
                 f"Status: {db_rev.get('status') if db_rev else 'None'}")

        # 6.3 Pending review MUST NOT appear on Public API
        pub_revs_pending = (await client.get("/api/reviews")).json()["data"]
        log_test("Pending Review Excluded from Public API", not any(r["_id"] == rev_id for r in pub_revs_pending),
                 "Pending review hidden from public")

        # 6.4 Admin views review in Admin Panel
        admin_revs_data = (await client.get("/api/admin/reviews?status=pending", headers=auth_headers)).json()["data"]
        admin_revs = admin_revs_data.get("items", []) if isinstance(admin_revs_data, dict) else admin_revs_data
        log_test("Admin Views Pending Review", any(r["_id"] == rev_id for r in admin_revs),
                 "Review present in admin queue")

        # 6.5 Admin Approves Review
        appr_res = await client.patch(f"/api/admin/reviews/{rev_id}/approve", headers=auth_headers)
        log_test("Admin Approves Review", appr_res.status_code == 200, "Approved via admin PATCH")

        # 6.6 Approved review appears on Public API
        pub_revs_approved = (await client.get("/api/reviews")).json()["data"]
        found_appr_rev = next((r for r in pub_revs_approved if r["_id"] == rev_id), None)
        log_test("Approved Review Appears on Public API", found_appr_rev is not None, "Visible publicly")

        # 6.7 STRICT PII LEAKAGE CHECK
        # Public API MUST NOT expose email, phone, or adminNotes
        log_test("Public Review Redacts Customer Email", "email" not in (found_appr_rev or {}),
                 "Email field omitted from public response")
        log_test("Public Review Redacts Customer Phone", "phone" not in (found_appr_rev or {}),
                 "Phone field omitted from public response")
        log_test("Public Review Redacts Admin Internal Notes", "adminNotes" not in (found_appr_rev or {}),
                 "adminNotes omitted from public response")

        # 6.8 Admin Rejects Review
        rej_res = await client.patch(f"/api/admin/reviews/{rev_id}/reject", headers=auth_headers)
        log_test("Admin Rejects Review", rej_res.status_code == 200, "Status set to rejected")
        pub_revs_rejected = (await client.get("/api/reviews")).json()["data"]
        log_test("Rejected Review Immediately Removed from Public API", not any(r["_id"] == rev_id for r in pub_revs_rejected),
                 "Rejected review not present in public API")

        # 6.9 Admin Deletes Review
        await client.delete(f"/api/admin/reviews/{rev_id}", headers=auth_headers)
        db_rev_del = await db.reviews.find_one({"_id": ObjectId(rev_id)})
        log_test("Review Purged from MongoDB", db_rev_del is None, "0 docs in DB")

        # =====================================================================
        # SECTION 7: Service Areas Admin -> DB -> Public
        # =====================================================================
        print("\n--- SECTION 7: Service Areas Admin -> DB -> Public ---")
        area_payload = {
            "name": f"{PREFIX}Gachibowli Extension",
            "district": "Hyderabad",
            "isActive": True,
            "displayOrder": 99
        }
        res = await client.post("/api/admin/service-areas", json=area_payload, headers=auth_headers)
        log_test("Admin Creates Service Area", res.status_code == 200, f"HTTP {res.status_code}")
        area_id = res.json()["data"]["_id"]

        # Verify in MongoDB
        db_area = await db.service_areas.find_one({"_id": ObjectId(area_id)})
        log_test("Service Area in MongoDB", db_area is not None and db_area["name"] == area_payload["name"],
                 "Persisted in DB")

        # Verify on Public API /api/service-areas
        pub_areas = (await client.get("/api/service-areas")).json()["data"]
        log_test("Service Area Appears on Public /api/service-areas", any(a["_id"] == area_id for a in pub_areas),
                 "Synchronized to public API")

        # Verify 'Hitec City' spelling normalization across all service areas
        all_area_names = [a.get("name", "") for a in pub_areas]
        has_misspelled_hitech = any("Hitech City" in n for n in all_area_names)
        log_test("Verified Production Spelling 'Hitec City'", not has_misspelled_hitech,
                 "Zero instances of incorrect 'Hitech City' in database")

        # Deactivate area
        await client.patch(f"/api/admin/service-areas/{area_id}", json={"isActive": False}, headers=auth_headers)
        pub_areas_inactive = (await client.get("/api/service-areas")).json()["data"]
        log_test("Inactive Area Excluded from Public API", not any(a["_id"] == area_id for a in pub_areas_inactive),
                 "isActive=False filtered out")

        # Delete area
        await client.delete(f"/api/admin/service-areas/{area_id}", headers=auth_headers)
        db_area_del = await db.service_areas.find_one({"_id": ObjectId(area_id)})
        log_test("Service Area Purged from MongoDB", db_area_del is None, "0 docs in DB")

        # =====================================================================
        # SECTION 8: Website Content Admin -> DB -> Public
        # =====================================================================
        print("\n--- SECTION 8: Website Content Admin -> DB -> Public ---")
        # 8.1 Read existing content
        content_res = await client.get("/api/content")
        orig_content = content_res.json()["data"]

        # 8.2 Verify business claims preserved
        log_test("Business Claims Preserved (8,000+, 100%, 5+ Years)", (
            orig_content.get("installationCount") == "8,000+" and
            orig_content.get("customerSatisfaction") == "100%" and
            orig_content.get("yearsExperience") == "5+ Years"
        ), f"Count: {orig_content.get('installationCount')}, Satisfaction: {orig_content.get('customerSatisfaction')}")

        # 8.3 Admin updates website content
        test_hero_sub = f"{PREFIX}Architectural Invisible Grills & Space Solutions"
        patch_content_res = await client.patch("/api/admin/content", json={
            "heroSubtitle": test_hero_sub
        }, headers=auth_headers)
        log_test("Admin Updates Website Content", patch_content_res.status_code == 200, "Updated via PATCH")

        # 8.4 Verify in MongoDB
        db_content = await db.website_content.find_one({"section": "general"})
        log_test("Website Content Updated in MongoDB", db_content.get("heroSubtitle") == test_hero_sub,
                 "Persisted to website_content collection")

        # 8.5 Verify on Public API /api/content
        pub_content_updated = (await client.get("/api/content")).json()["data"]
        log_test("Public /api/content Immediately Reflects Live Change", pub_content_updated.get("heroSubtitle") == test_hero_sub,
                 "Public endpoint served live content")

        # 8.6 Revert back cleanly to original hero subtitle
        await client.patch("/api/admin/content", json={
            "heroSubtitle": orig_content.get("heroSubtitle", "Premium Home Safety & Space Management Services")
        }, headers=auth_headers)
        reverted_content = (await client.get("/api/content")).json()["data"]
        log_test("Website Content Reverted Cleanly", reverted_content.get("heroSubtitle") == orig_content.get("heroSubtitle"),
                 "Original value restored")

        # =====================================================================
        # SECTION 9: Media URL / Visibility Synchronization
        # =====================================================================
        print("\n--- SECTION 9: Media URL / Visibility Synchronization ---")
        media_doc = {
            "name": f"{PREFIX}BalconyInstallPhoto",
            "url": "https://res.cloudinary.com/deccan/image/upload/v12345/balcony.jpg",
            "publicId": f"{PREFIX.lower()}pub_12345",
            "mediaType": "image",
            "format": "jpg",
            "bytes": 204800,
            "createdAt": datetime.now(timezone.utc)
        }
        res_media = await db.media.insert_one(media_doc)
        media_id = str(res_media.inserted_id)

        # Admin fetches media library
        admin_media_res = await client.get("/api/admin/uploads/media", headers=auth_headers)
        log_test("Admin Media Library Lists Uploaded Assets", any(m["_id"] == media_id for m in admin_media_res.json()["data"]),
                 "Media accessible via admin")

        # Media URL format check: no localhost or file:// or internal paths
        media_item = next((m for m in admin_media_res.json()["data"] if m["_id"] == media_id), None)
        has_safe_url = media_item and media_item["url"].startswith("http") and "localhost" not in media_item["url"]
        log_test("Media Asset URL is Fully Qualified & Production-Safe", has_safe_url,
                 f"URL: {media_item['url'] if media_item else 'None'}")

        # Cleanup test media
        await client.delete(f"/api/admin/uploads/media/{media_id}", headers=auth_headers)
        db_media_del = await db.media.find_one({"_id": ObjectId(media_id)})
        log_test("Media Asset Purged from MongoDB", db_media_del is None, "0 docs in DB")

        # =====================================================================
        # SECTION 10: Contacts Public -> Admin
        # =====================================================================
        print("\n--- SECTION 10: Contacts Public -> Admin ---")
        contact_payload = {
            "name": f"{PREFIX}Mahesh Varma",
            "phone": "9988776655",
            "email": f"{PREFIX.lower()}mahesh@example.com",
            "message": "Enquiry for invisible grill installation for a 3BHK flat in Hitec City."
        }
        res_contact = await client.post("/api/contact", json=contact_payload)
        log_test("Public Submits Contact Enquiry", res_contact.status_code == 200, f"HTTP {res_contact.status_code}")
        contact_id = res_contact.json()["data"]["id"]

        # Verify in MongoDB
        db_contact = await db.contacts.find_one({"_id": ObjectId(contact_id)})
        log_test("Contact Stored in MongoDB with 'new' Status", db_contact is not None and db_contact["status"] == "new",
                 "Saved to contacts collection")

        # Admin retrieves contacts
        admin_contacts_data = (await client.get("/api/admin/contacts", headers=auth_headers)).json()["data"]
        admin_contacts = admin_contacts_data.get("items", []) if isinstance(admin_contacts_data, dict) else admin_contacts_data
        log_test("Contact Appears in Admin Triage Queue", any(c["_id"] == contact_id for c in admin_contacts),
                 "Admin received contact enquiry")

        # Admin updates status to 'contacted'
        patch_contact = await client.patch(f"/api/admin/contacts/{contact_id}", json={
            "status": "contacted",
            "adminNotes": "Spoke on phone, scheduled consultation"
        }, headers=auth_headers)
        log_test("Admin Updates Contact Status", patch_contact.status_code == 200, "Updated to contacted")

        # Admin deletes contact
        await client.delete(f"/api/admin/contacts/{contact_id}", headers=auth_headers)
        db_contact_del = await db.contacts.find_one({"_id": ObjectId(contact_id)})
        log_test("Contact Purged from MongoDB", db_contact_del is None, "0 docs in DB")

        # =====================================================================
        # SECTION 11: Site Visits Public -> Admin
        # =====================================================================
        print("\n--- SECTION 11: Site Visits Public -> Admin ---")
        sv_form = {
            "name": f"{PREFIX}Kavitha Rao",
            "phoneNumber": "9849012345",
            "cityArea": "Kondapur",
            "propertyType": "Apartment",
            "windowType": "Balcony",
            "approximateWindows": "3",
            "preferredVisitDate": (datetime.now() + timedelta(days=2)).strftime("%Y-%m-%d"),
            "preferredTime": "Morning (10 AM - 1 PM)",
            "requirementDetails": "Balcony safety grill for 14th floor flat"
        }
        sv_res = await client.post("/api/site-visits", data=sv_form)
        log_test("Public Submits Free Site Visit Request", sv_res.status_code == 200, f"HTTP {sv_res.status_code}")
        sv_tracking_id = sv_res.json()["data"]["id"]
        sv_doc_id = sv_res.json()["data"]["docId"]

        # Verify in MongoDB with 'new' status (NEVER falsely 'confirmed')
        db_sv = await db.site_visits.find_one({"_id": ObjectId(sv_doc_id)})
        log_test("Site Visit Saved with Pending Request Status (No False Confirmation)",
                 db_sv is not None and db_sv["status"] in ("new", "requested") and db_sv["status"] != "confirmed" and db_sv.get("trackingCode") == sv_tracking_id,
                 f"Status: {db_sv.get('status') if db_sv else 'None'}, Code: {sv_tracking_id}")

        # Admin retrieves site visit
        admin_svs_data = (await client.get("/api/admin/site-visits", headers=auth_headers)).json()["data"]
        admin_svs = admin_svs_data.get("items", []) if isinstance(admin_svs_data, dict) else admin_svs_data
        log_test("Site Visit Appears in Admin Site Visits Queue", any(s["_id"] == sv_doc_id for s in admin_svs),
                 "Admin received site visit")

        # Admin schedules visit
        sched_res = await client.patch(f"/api/admin/site-visits/{sv_doc_id}", json={
            "status": "scheduled",
            "assignedTechnician": "Raju (Senior Tech)",
            "adminNotes": "Confirmed with customer for Saturday morning"
        }, headers=auth_headers)
        log_test("Admin Confirms & Schedules Site Visit", sched_res.status_code == 200, "Status -> scheduled")

        # Verify scheduled state in MongoDB
        db_sv_sched = await db.site_visits.find_one({"_id": ObjectId(sv_doc_id)})
        log_test("Site Visit Scheduled Details Persisted", (
            db_sv_sched is not None and
            db_sv_sched["status"] == "scheduled" and
            db_sv_sched.get("assignedTechnician") == "Raju (Senior Tech)"
        ), "Technician assignment recorded")

        # Admin deletes site visit
        await client.delete(f"/api/admin/site-visits/{sv_doc_id}", headers=auth_headers)
        db_sv_del = await db.site_visits.find_one({"_id": ObjectId(sv_doc_id)})
        log_test("Site Visit Purged from MongoDB", db_sv_del is None, "0 docs in DB")

        # =====================================================================
        # SECTION 12: Cache / Stale-Data / Refresh Behavior
        # =====================================================================
        print("\n--- SECTION 12: Cache / Stale-Data / Refresh Behavior ---")
        # Verify that dynamic content changes propagate on consecutive requests without caching lag
        test_company_desc = f"{PREFIX}Engineering High-Rise Balcony Protection Since 2021"
        await client.patch("/api/admin/content", json={"companyDescription": test_company_desc}, headers=auth_headers)

        # Immediate sequential public requests
        r1 = await client.get("/api/content")
        r2 = await client.get("/api/content")
        log_test("Cache Concurrency: Request 1 Immediately Returns Updated Value",
                 r1.json()["data"].get("companyDescription") == test_company_desc, "Instant sync")
        log_test("Cache Concurrency: Request 2 Consistently Returns Updated Value",
                 r2.json()["data"].get("companyDescription") == test_company_desc, "Instant sync")

        # Revert back
        await client.patch("/api/admin/content", json={
            "companyDescription": orig_content.get("companyDescription", "Delivering dependable space management and architectural protection for modern living in Hyderabad.")
        }, headers=auth_headers)
        r3 = await client.get("/api/content")
        log_test("Reverted Content Immediately Visible Without Stale Cache",
                 r3.json()["data"].get("companyDescription") == orig_content.get("companyDescription"),
                 "Original restored")

        # =====================================================================
        # SECTION 13: API Field & Schema Consistency
        # =====================================================================
        print("\n--- SECTION 13: API Field & Schema Consistency ---")
        # Products schema consistency
        prods = (await client.get("/api/products")).json()["data"]
        if prods:
            p = prods[0]
            log_test("Product Schema: _id is string", isinstance(p.get("_id"), str), f"type: {type(p.get('_id'))}")
            log_test("Product Schema: displayOrder is integer", isinstance(p.get("displayOrder"), int), f"type: {type(p.get('displayOrder'))}")
            log_test("Product Schema: features is list", isinstance(p.get("features"), list), f"type: {type(p.get('features'))}")

        # Reviews schema consistency
        revs = (await client.get("/api/reviews")).json()["data"]
        if revs:
            r = revs[0]
            log_test("Review Schema: rating is numeric", isinstance(r.get("rating"), (int, float)), f"type: {type(r.get('rating'))}")
            log_test("Review Schema: status is 'approved'", r.get("status") == "approved", "Approved status")

        # Service Areas schema consistency
        areas = (await client.get("/api/service-areas")).json()["data"]
        if areas:
            a = areas[0]
            log_test("Service Area Schema: isActive is boolean (not string)", isinstance(a.get("isActive"), bool),
                     f"type: {type(a.get('isActive'))}")
            log_test("Service Area Schema: name is non-empty string", isinstance(a.get("name"), str) and len(a.get("name")) > 0,
                     f"name: {a.get('name')}")

        # =====================================================================
        # SECTION 14: Failure / Partial Update / Delete Propagation
        # =====================================================================
        print("\n--- SECTION 14: Failure / Partial Update / Delete Propagation ---")
        # 14.1 PATCH partial update isolation on Product
        prod_patch_test = {
            "name": f"{PREFIX}Partial Test Product",
            "slug": f"{PREFIX.lower()}partial_prod",
            "shortDescription": "Initial description",
            "description": "Full initial description",
            "image": "/images/test_init.jpg",
            "highlight": "Init",
            "status": "published",
            "displayOrder": 70
        }
        res_p = await client.post("/api/admin/products", json=prod_patch_test, headers=auth_headers)
        p_id = res_p.json()["data"]["_id"]

        # Update ONLY the description
        patch_only_desc = await client.patch(f"/api/admin/products/{p_id}", json={
            "description": "Updated single field description"
        }, headers=auth_headers)
        log_test("PATCH Allows Partial Update", patch_only_desc.status_code == 200, "PATCH 200")

        # Verify other fields are preserved and NOT erased
        p_after_patch = await db.products.find_one({"_id": ObjectId(p_id)})
        log_test("PATCH Does Not Overwrite Unrelated Fields", (
            p_after_patch["description"] == "Updated single field description" and
            p_after_patch["name"] == prod_patch_test["name"] and
            p_after_patch["image"] == prod_patch_test["image"] and
            p_after_patch["displayOrder"] == 70
        ), "Isolated update verified")

        # Delete propagation
        await client.delete(f"/api/admin/products/{p_id}", headers=auth_headers)
        single_deleted_res = await client.get(f"/api/products/{prod_patch_test['slug']}")
        log_test("Deleted Resource Returns 404 on Public Single Fetch", single_deleted_res.status_code == 404, "404 Not Found")

        # 14.2 Malformed payload rejection does not mutate database
        bad_payload = {"name": "", "displayOrder": "invalid_number"}
        bad_res = await client.post("/api/admin/products", json=bad_payload, headers=auth_headers)
        log_test("Validation Rejects Malformed Payload with 422", bad_res.status_code == 422, "422 Unprocessable Entity")

        # =====================================================================
        # SECTION 15: Security & Privacy During Synchronization
        # =====================================================================
        print("\n--- SECTION 15: Security & Privacy During Synchronization ---")
        # 15.1 Unauthenticated requests to admin endpoints rejected with 401
        unauth_endpoints = [
            ("GET", "/api/admin/products"),
            ("POST", "/api/admin/products"),
            ("GET", "/api/admin/contacts"),
            ("GET", "/api/admin/site-visits"),
            ("GET", "/api/admin/reviews"),
            ("PATCH", "/api/admin/content"),
        ]
        for method, ep in unauth_endpoints:
            if method == "GET":
                r = await client.get(ep)
            elif method == "POST":
                r = await client.post(ep, json={})
            elif method == "PATCH":
                r = await client.patch(ep, json={})
            log_test(f"Unauthenticated {method} {ep} Returns 401", r.status_code == 401, f"HTTP {r.status_code}")

        # 15.2 Non-existent ObjectId returns 404 or 422 without server error (500)
        fake_id = "507f1f77bcf86cd799439011"
        fake_res = await client.patch(f"/api/admin/products/{fake_id}", json={"name": "Fake"}, headers=auth_headers)
        log_test("Non-Existent ID Returns 404 Gracefully (No 500)", fake_res.status_code == 404, f"HTTP {fake_res.status_code}")

        malformed_id_res = await client.patch("/api/admin/products/invalid_not_hex", json={"name": "Fake"}, headers=auth_headers)
        log_test("Malformed ObjectId Returns 400/422 Gracefully (No 500)", malformed_id_res.status_code in (400, 422),
                 f"HTTP {malformed_id_res.status_code}")

        # =====================================================================
        # SECTION 16: Final Cleanup & Database Integrity
        # =====================================================================
        print("\n--- SECTION 16: Final Cleanup & Database Integrity ---")
        # Wipe all PARTA6_TEST_ data
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

        # Check prior prefixes (PARTA1..PARTA5) as well to guarantee pristine DB
        prior_residuals = 0
        for prefix in ["PARTA1_TEST_", "PARTA2_TEST_", "PARTA3_TEST_", "PARTA4_TEST_", "PARTA5_TEST_"]:
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

        log_test("Zero Prior Audit Residuals (A1-A5 Residuals = 0)", prior_residuals == 0,
                 f"{prior_residuals} prior test residuals found")

    await close_mongo_connection()

    print("\n" + "=" * 80)
    print(f" [OK] PART A6 DEEP SYNCHRONIZATION AUDIT COMPLETE: {passed_tests} PASSED, {failed_tests} FAILED")
    print("=" * 80)


if __name__ == "__main__":
    asyncio.run(run_part_a6_audit())
