"""
DECCAN SPACE WORKS — PART A4 IMAGES & MEDIA AUDIT SUITE
Automated Verification Suite for:
1. Media API Retrieval (Gallery, Products, Videos, Public propagation)
2. Admin Media CRUD (Gallery & Video CRUD lifecycle with PARTA4_TEST_ markers)
3. Upload Security & Validation (MIME, Extension, SVG rejection, Size limit, Traversal sanitization)
4. Customer Site-Visit Photo Upload Safeguards (Max files, type validation, privacy)
5. Database Media Purity (Reachability, 0 binary blobs, 0 localhost/dev URLs)
6. Clean Database Teardown & 0 Test Residuals
"""

import asyncio
import os
import sys
import io
import re
from datetime import datetime, timezone
import httpx
from bson import ObjectId

# Ensure backend root is on python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.config import settings
from app.core.database import connect_to_mongo, close_mongo_connection, get_database
from app.core.security import hash_password, create_access_token
from app.services.cloudinary_service import _sanitize_filename
from app.main import app

PREFIX = "PARTA4_TEST_"
A4_ADMIN_EMAIL = f"{PREFIX.lower()}admin@deccanspaceworks.com"
A4_ADMIN_PASS = "PartA4Audit2026!"

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
PUBLIC_DIR = os.path.join(PROJECT_ROOT, "public")


def log_test(name, passed, detail=""):
    status = "[PASS]" if passed else "[FAIL]"
    print(f"  {status} {name} — {detail}")
    if not passed:
        raise AssertionError(f"A4 Test Failed: {name} — {detail}")


async def run_part_a4_audit():
    print("=" * 80)
    print(" DECCAN SPACE WORKS — PART A4 IMAGES & MEDIA AUDIT SUITE")
    print("=" * 80)

    await connect_to_mongo()
    db = get_database()
    if db is None:
        print("[!] ERROR: Cannot connect to MongoDB Atlas.")
        sys.exit(1)

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        # Pre-cleanup any prior A4 test remnants
        await db.admins.delete_many({"email": {"$regex": f"^{PREFIX.lower()}"}})
        await db.gallery.delete_many({"title": {"$regex": f"^{PREFIX}"}})
        await db.videos.delete_many({"title": {"$regex": f"^{PREFIX}"}})
        await db.media.delete_many({"name": {"$regex": f"^{PREFIX}"}})
        await db.products.delete_many({"name": {"$regex": f"^{PREFIX}"}})
        await db.site_visits.delete_many({"name": {"$regex": f"^{PREFIX}"}})

        # Create temporary authenticated admin for CRUD testing
        admin_doc = {
            "name": "Part A4 Audit Admin",
            "email": A4_ADMIN_EMAIL,
            "hashed_password": hash_password(A4_ADMIN_PASS),
            "role": "superadmin",
            "is_active": True,
            "created_at": datetime.now(timezone.utc)
        }
        res_admin = await db.admins.insert_one(admin_doc)
        token = create_access_token({"sub": A4_ADMIN_EMAIL, "role": "superadmin"})
        auth_headers = {"Authorization": f"Bearer {token}"}

        # =====================================================================
        # TEST GROUP 1: PUBLIC MEDIA API RETRIEVAL
        # =====================================================================
        print("\n--- 1. PUBLIC MEDIA API RETRIEVAL ---")

        # 1.1 Gallery API
        res_gal = await client.get("/api/gallery")
        log_test("Gallery API Status", res_gal.status_code == 200, f"Status: {res_gal.status_code}")
        gal_data = res_gal.json().get("data", [])
        log_test("Gallery Has Items", len(gal_data) >= 8, f"Found {len(gal_data)} items")
        for item in gal_data:
            img_url = item.get("imageUrl")
            log_test(
                f"Gallery Item Image Reachable ({item.get('title')[:25]})",
                bool(img_url and (img_url.startswith("/images/") or img_url.startswith("http"))),
                f"URL: {img_url}"
            )
            if img_url and img_url.startswith("/images/"):
                local_path = os.path.join(PUBLIC_DIR, img_url.lstrip("/"))
                log_test(f"  Physical File Exists ({os.path.basename(local_path)})", os.path.isfile(local_path), local_path)

        # 1.2 Category Filtering in Gallery API
        res_balcony = await client.get("/api/gallery?category=Balconies")
        balcony_data = res_balcony.json().get("data", [])
        all_balconies = all(i.get("category") == "Balconies" for i in balcony_data)
        log_test("Gallery Category Filter", all_balconies and len(balcony_data) > 0, f"{len(balcony_data)} Balconies items")

        # 1.3 Products Media API
        res_prod = await client.get("/api/products")
        log_test("Products API Status", res_prod.status_code == 200, f"Status: {res_prod.status_code}")
        prod_data = res_prod.json().get("data", [])
        log_test("Products Has Items", len(prod_data) >= 6, f"Found {len(prod_data)} products")
        for p in prod_data:
            p_img = p.get("image")
            log_test(
                f"Product Image Path ({p.get('name')[:20]})",
                bool(p_img and (p_img.startswith("/images/") or p_img.startswith("http"))),
                f"Image: {p_img}"
            )
            if p_img and p_img.startswith("/images/"):
                local_path = os.path.join(PUBLIC_DIR, p_img.lstrip("/"))
                log_test(f"  Physical File Exists ({os.path.basename(local_path)})", os.path.isfile(local_path), local_path)

        # 1.4 Videos Media API
        res_vid = await client.get("/api/videos")
        log_test("Videos API Status", res_vid.status_code == 200, f"Status: {res_vid.status_code}")
        vid_data = res_vid.json().get("data", [])
        log_test("Videos Has Items", len(vid_data) >= 2, f"Found {len(vid_data)} videos")
        for v in vid_data:
            v_url = v.get("videoUrl")
            t_url = v.get("thumbnailUrl")
            log_test(
                f"Video URLs Valid ({v.get('title')[:25]})",
                bool(v_url and t_url),
                f"Video: {v_url}, Poster: {t_url}"
            )
            if v_url and v_url.startswith("/videos/"):
                local_vid = os.path.join(PUBLIC_DIR, v_url.lstrip("/"))
                log_test(f"  Physical Video Exists ({os.path.basename(local_vid)})", os.path.isfile(local_vid), local_vid)
            if t_url and t_url.startswith("/images/"):
                local_thumb = os.path.join(PUBLIC_DIR, t_url.lstrip("/"))
                log_test(f"  Physical Poster Exists ({os.path.basename(local_thumb)})", os.path.isfile(local_thumb), local_thumb)

        # =====================================================================
        # TEST GROUP 2: ADMIN MEDIA CRUD LIFECYCLE
        # =====================================================================
        print("\n--- 2. ADMIN MEDIA CRUD LIFECYCLE ---")

        # 2.1 Create Gallery Item
        gal_payload = {
            "title": f"{PREFIX}Gallery Item",
            "description": "High tensile invisible grill sample installation photo for A4 test",
            "category": "Balconies",
            "imageUrl": "/images/hero_balcony.jpg",
            "displayOrder": 99,
            "status": "active"
        }
        res_create_gal = await client.post("/api/admin/gallery", json=gal_payload, headers=auth_headers)
        log_test("Create Gallery Item", res_create_gal.status_code == 200, f"Status: {res_create_gal.status_code}")
        created_gal_id = res_create_gal.json()["data"]["_id"]

        # Verify in DB
        db_gal = await db.gallery.find_one({"_id": ObjectId(created_gal_id)})
        log_test("Gallery Item Persisted in MongoDB", db_gal is not None and db_gal["title"] == gal_payload["title"], f"ID: {created_gal_id}")

        # 2.2 Update Gallery Item
        res_update_gal = await client.patch(
            f"/api/admin/gallery/{created_gal_id}",
            json={"title": f"{PREFIX}Updated Gallery Item", "category": "Windows"},
            headers=auth_headers
        )
        log_test("Update Gallery Item", res_update_gal.status_code == 200, f"Status: {res_update_gal.status_code}")
        db_gal_updated = await db.gallery.find_one({"_id": ObjectId(created_gal_id)})
        log_test("Gallery Update Persisted in MongoDB", db_gal_updated["title"] == f"{PREFIX}Updated Gallery Item", db_gal_updated["category"])

        # 2.3 Delete Gallery Item
        res_del_gal = await client.delete(f"/api/admin/gallery/{created_gal_id}", headers=auth_headers)
        log_test("Delete Gallery Item", res_del_gal.status_code == 200, f"Status: {res_del_gal.status_code}")
        db_gal_deleted = await db.gallery.find_one({"_id": ObjectId(created_gal_id)})
        log_test("Gallery Item Removed from MongoDB", db_gal_deleted is None, "Confirmed deletion")

        # 2.4 Create & Delete Video Item
        vid_payload = {
            "title": f"{PREFIX}Video Item",
            "subtitle": "Test Video Subtitle",
            "description": "Walkthrough video description for A4 audit",
            "category": "Installation",
            "videoUrl": "/videos/install_video_1.mp4",
            "thumbnailUrl": "/images/highrise_view.jpg",
            "tag": "TEST TAG",
            "displayOrder": 99,
            "status": "active"
        }
        res_create_vid = await client.post("/api/admin/videos", json=vid_payload, headers=auth_headers)
        log_test("Create Video Item", res_create_vid.status_code == 200, f"Status: {res_create_vid.status_code}")
        created_vid_id = res_create_vid.json()["data"]["_id"]

        res_del_vid = await client.delete(f"/api/admin/videos/{created_vid_id}", headers=auth_headers)
        log_test("Delete Video Item", res_del_vid.status_code == 200, f"Status: {res_del_vid.status_code}")
        db_vid_deleted = await db.videos.find_one({"_id": ObjectId(created_vid_id)})
        log_test("Video Item Removed from MongoDB", db_vid_deleted is None, "Confirmed deletion")

        # 2.5 Admin Media Library Endpoint
        res_media_lib = await client.get("/api/admin/uploads/media", headers=auth_headers)
        log_test("Admin Media Library Access", res_media_lib.status_code == 200, f"Status: {res_media_lib.status_code}")

        # =====================================================================
        # TEST GROUP 3: MEDIA UPLOAD SECURITY & VALIDATION
        # =====================================================================
        print("\n--- 3. MEDIA UPLOAD SECURITY & VALIDATION ---")

        # 3.1 Reject SVG Uploads (Security against Stored XSS)
        svg_content = b"<svg xmlns='http://www.w3.org/2000/svg'><script>alert(1)</script></svg>"
        res_svg = await client.post(
            "/api/admin/uploads/image",
            files={"file": ("test.svg", svg_content, "image/svg+xml")},
            headers=auth_headers
        )
        log_test("Reject SVG Upload", res_svg.status_code == 400, f"Status: {res_svg.status_code}")

        # 3.2 Reject Dangerous Executable Uploads
        exe_content = b"MZ\x90\x00\x03\x00\x00\x00"
        res_exe = await client.post(
            "/api/admin/uploads/image",
            files={"file": ("malicious.exe", exe_content, "application/octet-stream")},
            headers=auth_headers
        )
        log_test("Reject Executable Upload", res_exe.status_code == 400, f"Status: {res_exe.status_code}")

        # 3.3 Reject Extension / MIME Mismatch
        res_mismatch = await client.post(
            "/api/admin/uploads/image",
            files={"file": ("script.js", b"console.log(1)", "image/jpeg")},
            headers=auth_headers
        )
        log_test("Reject Extension Mismatch (.js as image/jpeg)", res_mismatch.status_code == 400, f"Status: {res_mismatch.status_code}")

        # 3.4 Reject Oversized Image (> 10MB)
        # Simulate oversized payload check via header/mock
        oversized_data = b"X" * (10 * 1024 * 1024 + 1024)
        res_oversized = await client.post(
            "/api/admin/uploads/image",
            files={"file": ("huge.jpg", oversized_data, "image/jpeg")},
            headers=auth_headers
        )
        log_test("Reject Oversized Image (>10MB)", res_oversized.status_code == 400, f"Status: {res_oversized.status_code}")

        # 3.5 Reject Empty File (0 bytes)
        res_empty = await client.post(
            "/api/admin/uploads/image",
            files={"file": ("empty.jpg", b"", "image/jpeg")},
            headers=auth_headers
        )
        log_test("Reject Empty File (0 bytes)", res_empty.status_code == 400, f"Status: {res_empty.status_code}")

        # 3.6 Filename Sanitization & Directory Traversal Defense
        sanitized_traversal = _sanitize_filename("../../etc/passwd.jpg")
        log_test(
            "Filename Traversal Sanitization",
            ".." not in sanitized_traversal and "/" not in sanitized_traversal and "\\" not in sanitized_traversal,
            f"Result: {sanitized_traversal}"
        )
        sanitized_chars = _sanitize_filename("photo;rm -rf;`test`.png")
        log_test(
            "Special Character Sanitization",
            ";" not in sanitized_chars and "`" not in sanitized_chars,
            f"Result: {sanitized_chars}"
        )

        # 3.7 Valid Image Upload (JPG)
        valid_jpg_content = b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00\xff\xdb\x00C\x00" + b"\x00" * 100
        res_valid_upload = await client.post(
            "/api/admin/uploads/image",
            files={"file": (f"{PREFIX}valid.jpg", valid_jpg_content, "image/jpeg")},
            headers=auth_headers
        )
        log_test("Valid JPG Upload Success", res_valid_upload.status_code == 200, f"Status: {res_valid_upload.status_code}")
        uploaded_media_url = res_valid_upload.json()["data"]["secure_url"]
        log_test("Uploaded Media Returns Secure URL", bool(uploaded_media_url), f"URL: {uploaded_media_url}")

        # Cleanup media record from db
        await db.media.delete_many({"name": f"{PREFIX}valid.jpg"})

        # =====================================================================
        # TEST GROUP 4: CUSTOMER SITE-VISIT PHOTO SAFEGUARDS
        # =====================================================================
        print("\n--- 4. CUSTOMER SITE-VISIT PHOTO SAFEGUARDS ---")

        # 4.1 Reject Excessive Upload Count (> 5 photos)
        six_images = [
            ("images", (f"photo_{i}.jpg", valid_jpg_content, "image/jpeg")) for i in range(6)
        ]
        res_too_many = await client.post(
            "/api/site-visits",
            data={
                "name": f"{PREFIX}Customer",
                "phoneNumber": "9876543210",
                "cityArea": "Gachibowli",
                "propertyType": "Apartment",
            },
            files=six_images
        )
        log_test("Reject > 5 Customer Photos", res_too_many.status_code == 400, f"Status: {res_too_many.status_code}")

        # 4.2 Reject Disallowed MIME Type in Customer Upload (e.g. PDF)
        pdf_image = [("images", ("plans.pdf", b"%PDF-1.4...", "application/pdf"))]
        res_bad_mime = await client.post(
            "/api/site-visits",
            data={
                "name": f"{PREFIX}Customer",
                "phoneNumber": "9876543210",
                "cityArea": "Gachibowli",
                "propertyType": "Apartment",
            },
            files=pdf_image
        )
        log_test("Reject PDF in Site Visit Upload", res_bad_mime.status_code == 400, f"Status: {res_bad_mime.status_code}")

        # 4.3 Reject Disallowed Extension in Customer Upload (e.g. .exe disguised)
        exe_image = [("images", ("dangerous.exe", valid_jpg_content, "image/jpeg"))]
        res_bad_ext = await client.post(
            "/api/site-visits",
            data={
                "name": f"{PREFIX}Customer",
                "phoneNumber": "9876543210",
                "cityArea": "Gachibowli",
                "propertyType": "Apartment",
            },
            files=exe_image
        )
        log_test("Reject .exe Extension in Customer Upload", res_bad_ext.status_code == 400, f"Status: {res_bad_ext.status_code}")

        # 4.4 Valid Customer Submission with 1 photo
        one_image = [("images", (f"{PREFIX}balcony.jpg", valid_jpg_content, "image/jpeg"))]
        res_valid_sv = await client.post(
            "/api/site-visits",
            data={
                "name": f"{PREFIX}Customer Valid",
                "phoneNumber": "9876543211",
                "cityArea": "Financial District",
                "propertyType": "Villa",
            },
            files=one_image
        )
        log_test("Valid Site Visit with Photo Accepted", res_valid_sv.status_code == 200, f"Status: {res_valid_sv.status_code}")

        # 4.5 Customer Photos Protected (Not Publicly Exposed)
        # Check that public response does not leak private customer URLs
        sv_resp_data = res_valid_sv.json().get("data", {})
        log_test("Customer Photos Not Leaked in Public Response", "imageUrls" not in sv_resp_data, f"Keys: {list(sv_resp_data.keys())}")

        # Verify Admin Can View Customer Photos
        res_admin_sv = await client.get("/api/admin/site-visits", headers=auth_headers)
        log_test("Admin Can Access Customer Site Visits", res_admin_sv.status_code == 200, f"Status: {res_admin_sv.status_code}")
        admin_sv_items = res_admin_sv.json()["data"]["items"]
        created_sv = next((item for item in admin_sv_items if item.get("name") == f"{PREFIX}Customer Valid"), None)
        log_test("Admin Can View Customer Photo Records", created_sv is not None and "imageUrls" in created_sv, f"Found: {created_sv is not None}")

        # Clean site visit record
        if created_sv:
            await db.site_visits.delete_one({"_id": ObjectId(created_sv["_id"])})

        # =====================================================================
        # TEST GROUP 5: DATABASE MEDIA PURITY & INTEGRITY
        # =====================================================================
        print("\n--- 5. DATABASE MEDIA PURITY & INTEGRITY ---")

        # 5.1 No Binary Blobs or Base64 in Products
        async for prod in db.products.find():
            img = prod.get("image", "")
            log_test(
                f"Product Image Clean ({prod.get('name')[:20]})",
                not img.startswith("data:image") and len(img) < 500,
                f"Len: {len(img)}"
            )

        # 5.2 No Binary Blobs or Base64 in Gallery
        async for gal in db.gallery.find():
            img = gal.get("imageUrl", "")
            log_test(
                f"Gallery Image Clean ({gal.get('title')[:25]})",
                not img.startswith("data:image") and len(img) < 500,
                f"Len: {len(img)}"
            )

        # 5.3 No Binary Blobs in Videos
        async for vid in db.videos.find():
            v_url = vid.get("videoUrl", "")
            t_url = vid.get("thumbnailUrl", "")
            log_test(
                f"Video URLs Clean ({vid.get('title')[:25]})",
                not v_url.startswith("data:") and not t_url.startswith("data:"),
                f"Video len: {len(v_url)}, Thumb len: {len(t_url)}"
            )

        # 5.4 No Localhost or File:// URLs in Database Media Fields
        disallowed_regex = re.compile(r"^(file://|https?://(localhost|127\.0\.0\.1))", re.IGNORECASE)
        for collection_name in ["products", "gallery", "videos", "media"]:
            async for doc in db[collection_name].find():
                for field in ["image", "imageUrl", "videoUrl", "thumbnailUrl", "url"]:
                    val = doc.get(field)
                    if isinstance(val, str):
                        log_test(
                            f"No Dev URLs in {collection_name}.{field}",
                            not disallowed_regex.match(val),
                            f"Value: {val}"
                        )

        # =====================================================================
        # TEST GROUP 6: DATABASE TEARDOWN & ZERO RESIDUAL AUDIT
        # =====================================================================
        print("\n--- 6. DATABASE TEARDOWN & RESIDUAL CLEANUP ---")

        # Delete all test admin users and test entities
        await db.admins.delete_many({"email": {"$regex": f"^{PREFIX.lower()}"}})
        await db.gallery.delete_many({"title": {"$regex": f"^{PREFIX}"}})
        await db.videos.delete_many({"title": {"$regex": f"^{PREFIX}"}})
        await db.media.delete_many({"name": {"$regex": f"^{PREFIX}"}})
        await db.products.delete_many({"name": {"$regex": f"^{PREFIX}"}})
        await db.site_visits.delete_many({"name": {"$regex": f"^{PREFIX}"}})

        # Verify 0 residual test records in all collections
        collections = await db.list_collection_names()
        for c in collections:
            count = await db[c].count_documents({
                "$or": [
                    {"title": {"$regex": f"^{PREFIX}"}},
                    {"name": {"$regex": f"^{PREFIX}"}},
                    {"email": {"$regex": f"^{PREFIX.lower()}"}},
                ]
            })
            log_test(f"Zero Test Residuals in '{c}'", count == 0, f"Residual count: {count}")

    await close_mongo_connection()
    print("\n" + "=" * 80)
    print(" ALL PART A4 IMAGES & MEDIA TESTS PASSED (100%)")
    print("=" * 80)


if __name__ == "__main__":
    asyncio.run(run_part_a4_audit())
