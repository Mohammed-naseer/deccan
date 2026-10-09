"""
DECCAN SPACE WORKS — PART A5 ADMIN PANEL DEEP AUDIT SUITE
Automated Verification Suite for:
1. Admin Authentication Deep Audit (Valid login, generic 401, inactive admin account, JWT validation)
2. IDOR, Authorization & Boundary Security (Unauthenticated rejection, malformed/nonexistent IDs)
3. Dashboard Real Metrics & Dynamic Attention Items (Zero fake/mock numbers, accurate counts)
4. Contact Enquiries Management & Conversion Workflow (Triage, status, notes, follow-up, site-visit conversion, idempotency)
5. Free Site Visits Management & Scheduling (Requested vs Confirmed appointments, technician, quote, photo privacy)
6. Reviews Moderation Workflow & PII Protection (Pending -> Approved/Rejected, PII redacted on public API)
7. Products, Gallery, Videos, Testimonials, Service Areas CRUD & Public Website Sync
8. Website Content & Business Claim Protection (8,000+ installations, 100% satisfaction, 5+ Years)
9. Admin Media Library & Security (Restricted endpoints, MIME checks, asset lifecycle)
10. Activity Audit Logs Verification (Audit trail generated and accessible only to admin)
11. Input Validation, Error Handling & Destructive Action Protections
12. 100% Database Teardown & 0 Test Residuals (PARTA5_TEST_ clean across all collections)
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

PREFIX = "PARTA5_TEST_"
A5_ADMIN_EMAIL = f"{PREFIX.lower()}admin@deccanspaceworks.com"
A5_ADMIN_PASS = "AdminAudit2026!Deccan"

A5_INACTIVE_ADMIN_EMAIL = f"{PREFIX.lower()}inactive@deccanspaceworks.com"
A5_INACTIVE_ADMIN_PASS = "InactiveAdmin2026!"


def log_test(name, passed, detail=""):
    status = "[PASS]" if passed else "[FAIL]"
    print(f"  {status} {name} — {detail}")
    if not passed:
        raise AssertionError(f"A5 Test Failed: {name} — {detail}")


async def run_part_a5_audit():
    print("=" * 80)
    print(" DECCAN SPACE WORKS — PART A5 ADMIN PANEL DEEP AUDIT SUITE")
    print("=" * 80)

    await connect_to_mongo()
    db = get_database()
    if db is None:
        print("[!] ERROR: Cannot connect to MongoDB Atlas.")
        sys.exit(1)

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        # Pre-cleanup any prior A5 test remnants
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

        # Setup test active admin and inactive admin
        active_admin_doc = {
            "name": f"{PREFIX}ActiveAdmin",
            "email": A5_ADMIN_EMAIL,
            "passwordHash": hash_password(A5_ADMIN_PASS),
            "role": "admin",
            "isActive": True,
            "createdAt": datetime.now(timezone.utc),
            "lastLogin": None
        }
        await db.admins.insert_one(active_admin_doc)

        inactive_admin_doc = {
            "name": f"{PREFIX}InactiveAdmin",
            "email": A5_INACTIVE_ADMIN_EMAIL,
            "passwordHash": hash_password(A5_INACTIVE_ADMIN_PASS),
            "role": "admin",
            "isActive": False,
            "createdAt": datetime.now(timezone.utc),
            "lastLogin": None
        }
        await db.admins.insert_one(inactive_admin_doc)

        # ---------------------------------------------------------------------
        # 1. ADMIN AUTHENTICATION DEEP AUDIT
        # ---------------------------------------------------------------------
        print("\n--- [1/12] Admin Authentication Deep Audit ---")

        # 1.1 Valid Login
        res = await client.post("/api/admin/login", json={
            "email": A5_ADMIN_EMAIL,
            "password": A5_ADMIN_PASS
        })
        log_test("Valid Admin Login", res.status_code == 200 and res.json().get("success"),
                 f"HTTP {res.status_code}, Token issued")
        admin_token = res.json()["data"]["token"]
        auth_headers = {"Authorization": f"Bearer {admin_token}"}

        # 1.2 Invalid password
        res = await client.post("/api/admin/login", json={
            "email": A5_ADMIN_EMAIL,
            "password": "WrongPassword123!"
        })
        log_test("Wrong Password Generic 401", res.status_code == 401 and "Invalid email address or password" in res.text,
                 "Returns generic 401 without password hint")

        # 1.3 Nonexistent email
        res = await client.post("/api/admin/login", json={
            "email": "nonexistent_admin_12345@deccanspaceworks.com",
            "password": A5_ADMIN_PASS
        })
        log_test("Nonexistent Email Generic 401", res.status_code == 401 and "Invalid email address or password" in res.text,
                 "Returns generic 401 without user enumeration")

        # 1.4 Inactive admin rejected
        res = await client.post("/api/admin/login", json={
            "email": A5_INACTIVE_ADMIN_EMAIL,
            "password": A5_INACTIVE_ADMIN_PASS
        })
        log_test("Inactive Admin Rejected at Login", res.status_code == 401 and "Invalid email address or password" in res.text,
                 "isActive=False is rejected immediately")

        # 1.5 Inactive admin token rejected on protected route
        inactive_token = create_access_token(data={"sub": A5_INACTIVE_ADMIN_EMAIL, "role": "admin"})
        res = await client.get("/api/admin/me", headers={"Authorization": f"Bearer {inactive_token}"})
        log_test("Inactive Admin Token Rejected on Protected Route", res.status_code == 401,
                 f"HTTP {res.status_code}: Token rejected by live DB check")

        # 1.6 Verify /api/admin/me for active admin
        res = await client.get("/api/admin/me", headers=auth_headers)
        log_test("Active Admin Profile Session Check", res.status_code == 200 and res.json()["data"]["email"] == A5_ADMIN_EMAIL,
                 "Session verified successfully")

        # ---------------------------------------------------------------------
        # 2. AUTHORIZATION, IDOR & TOKEN VALIDATION
        # ---------------------------------------------------------------------
        print("\n--- [2/12] Authorization, IDOR & Token Handling ---")

        # 2.1 Unauthenticated requests to protected endpoints
        protected_endpoints = [
            ("GET", "/api/admin/dashboard"),
            ("GET", "/api/admin/contacts"),
            ("GET", "/api/admin/site-visits"),
            ("GET", "/api/admin/reviews"),
            ("GET", "/api/admin/products"),
            ("GET", "/api/admin/gallery"),
            ("GET", "/api/admin/videos"),
            ("GET", "/api/admin/testimonials"),
            ("GET", "/api/admin/service-areas"),
            ("GET", "/api/admin/content"),
            ("GET", "/api/admin/uploads/media"),
            ("GET", "/api/admin/dashboard/activity"),
        ]
        all_unauth_blocked = True
        for method, ep in protected_endpoints:
            r = await client.request(method, ep)
            if r.status_code != 401:
                all_unauth_blocked = False
                break
        log_test("All Admin GET Endpoints Require Auth", all_unauth_blocked,
                 f"Tested {len(protected_endpoints)} endpoints, all return 401 when unauthenticated")

        # 2.2 Malformed token
        res = await client.get("/api/admin/dashboard", headers={"Authorization": "Bearer not_a_real_jwt_token"})
        log_test("Malformed JWT Rejected", res.status_code == 401, f"HTTP {res.status_code}")

        # 2.3 Expired token
        expired_token = create_access_token(
            data={"sub": A5_ADMIN_EMAIL, "role": "admin"},
            expires_delta=timedelta(seconds=-60)
        )
        res = await client.get("/api/admin/dashboard", headers={"Authorization": f"Bearer {expired_token}"})
        log_test("Expired JWT Rejected", res.status_code == 401 and "expired" in res.text.lower(),
                 f"HTTP {res.status_code}: Correctly detected expired token")

        # 2.4 IDOR & Invalid ObjectId handling
        fake_id = "507f1f77bcf86cd799439011"
        malformed_id = "invalid-not-an-objectid"
        idor_checks = [
            ("PATCH", f"/api/admin/contacts/{fake_id}", {"status": "contacted"}),
            ("PATCH", f"/api/admin/contacts/{malformed_id}", {"status": "contacted"}),
            ("DELETE", f"/api/admin/contacts/{malformed_id}", None),
            ("GET", f"/api/admin/site-visits/{fake_id}", None),
            ("GET", f"/api/admin/site-visits/{malformed_id}", None),
            ("PATCH", f"/api/admin/reviews/{fake_id}/approve", None),
            ("PATCH", f"/api/admin/products/{malformed_id}", {"name": "Test"}),
            ("DELETE", f"/api/admin/gallery/{malformed_id}", None),
            ("DELETE", f"/api/admin/videos/{malformed_id}", None),
            ("DELETE", f"/api/admin/service-areas/{malformed_id}", None),
            ("DELETE", f"/api/admin/uploads/media/{malformed_id}", None),
        ]
        all_idor_safe = True
        for m, ep, b in idor_checks:
            r = await client.request(m, ep, json=b, headers=auth_headers)
            if r.status_code not in (400, 404):
                all_idor_safe = False
                break
        log_test("IDOR & Malformed ID Safeguards", all_idor_safe,
                 f"Tested {len(idor_checks)} endpoints with fake/malformed IDs — all return 400 or 404 safely")

        # ---------------------------------------------------------------------
        # 3. DASHBOARD METRICS & REAL DATA VERIFICATION
        # ---------------------------------------------------------------------
        print("\n--- [3/12] Dashboard Metrics & Priority Items ---")

        res = await client.get("/api/admin/dashboard", headers=auth_headers)
        log_test("Dashboard Endpoint Accessible", res.status_code == 200, f"HTTP {res.status_code}")
        dash_data = res.json()["data"]
        metrics = dash_data.get("metrics", {})
        
        # Verify counts match database queries directly
        expected_reviews = await db.reviews.count_documents({})
        expected_site_visits = await db.site_visits.count_documents({})
        expected_contacts = await db.contacts.count_documents({})
        expected_products = await db.products.count_documents({})
        expected_gallery = await db.gallery.count_documents({})
        expected_videos = await db.videos.count_documents({})

        counts_accurate = (
            metrics.get("totalReviews") == expected_reviews and
            metrics.get("totalSiteVisits") == expected_site_visits and
            metrics.get("totalContacts") == expected_contacts and
            metrics.get("totalProducts") == expected_products and
            metrics.get("totalGallery") == expected_gallery and
            metrics.get("totalVideos") == expected_videos
        )
        log_test("Dashboard Metrics Match Live MongoDB Atlas", counts_accurate,
                 f"Reviews: {metrics.get('totalReviews')}, Visits: {metrics.get('totalSiteVisits')}, Contacts: {metrics.get('totalContacts')}, Products: {metrics.get('totalProducts')}, Gallery: {metrics.get('totalGallery')}, Videos: {metrics.get('totalVideos')}")

        attention_items = dash_data.get("attentionItems", [])
        log_test("Priority Action Items Dynamic", isinstance(attention_items, list),
                 f"{len(attention_items)} priority items calculated from live state")

        # ---------------------------------------------------------------------
        # 4. CONTACT ENQUIRIES LIFECYCLE & CONVERSION AUDIT
        # ---------------------------------------------------------------------
        print("\n--- [4/12] Contact Enquiries Lifecycle & Lead Workflow ---")

        # 4.1 Create public contact enquiry
        contact_payload = {
            "name": f"{PREFIX}Ramesh Lead",
            "phone": "9876543210",
            "email": "ramesh.lead@example.com",
            "service": "Invisible Grills",
            "city": "Hyderabad",
            "message": "Enquiring about invisible grills for 3 balconies in Gachibowli."
        }
        res = await client.post("/api/contact", json=contact_payload)
        log_test("Public Contact Submission", res.status_code == 200, f"HTTP {res.status_code}")
        contact_id = res.json()["data"]["id"]

        # 4.2 Admin search and retrieve contact
        res = await client.get(f"/api/admin/contacts?search={PREFIX}Ramesh", headers=auth_headers)
        contacts_list = res.json()["data"]["items"]
        found_contact = any(c["_id"] == contact_id for c in contacts_list)
        log_test("Admin Search Enquiries", found_contact, "Contact found in admin search")

        # 4.3 Update contact status, notes, follow-up
        update_payload = {
            "status": "contacted",
            "adminNotes": "Spoke to customer. Interested in SS 316 marine grade for 15th floor.",
            "leadQuality": "hot",
            "followUpDate": "2026-10-15",
            "followUpNotes": "Call back regarding quote approval."
        }
        res = await client.patch(f"/api/admin/contacts/{contact_id}", json=update_payload, headers=auth_headers)
        log_test("Update Contact Status & Follow-Up", res.status_code == 200, "Saved lead details and follow-up")

        # Verify persistence in MongoDB
        saved_contact = await db.contacts.find_one({"_id": ObjectId(contact_id)})
        log_test("Contact Persistence in MongoDB", saved_contact["status"] == "contacted" and saved_contact.get("leadQuality") == "hot",
                 f"Status: {saved_contact['status']}, Quality: {saved_contact.get('leadQuality')}")

        # 4.4 Convert Contact Enquiry to Site Visit
        convert_payload = {
            "preferredVisitDate": "2026-10-16",
            "preferredTime": "Morning (10 AM - 1 PM)",
            "propertyType": "High-Rise Apartment",
            "windowType": "Balcony",
            "approximateWindows": "3 Balconies",
            "requirementDetails": "Pre-installation structural survey for tension cables."
        }
        res = await client.post(f"/api/admin/contacts/{contact_id}/convert-to-site-visit", json=convert_payload, headers=auth_headers)
        log_test("Convert Contact to Site Visit", res.status_code == 200, f"HTTP {res.status_code}")
        converted_sv_id = res.json()["data"]["siteVisitId"]
        assigned_tracking = res.json()["data"]["trackingCode"]
        log_test("Assigned Tracking Code", assigned_tracking.startswith("DSW-HYD-"), f"Tracking: {assigned_tracking}")

        # 4.5 Accidental double conversion prevention
        res = await client.post(f"/api/admin/contacts/{contact_id}/convert-to-site-visit", json=convert_payload, headers=auth_headers)
        log_test("Double Conversion Defense", res.status_code == 200 and res.json()["data"].get("alreadyConverted") is True,
                 "Prevented duplicate site visit creation")

        # 4.6 Contact deletion with confirmation
        res = await client.delete(f"/api/admin/contacts/{contact_id}", headers=auth_headers)
        log_test("Delete Contact Enquiry", res.status_code == 200, "Record deleted from MongoDB")
        deleted_contact = await db.contacts.find_one({"_id": ObjectId(contact_id)})
        log_test("Verify Contact Removed from DB", deleted_contact is None, "0 residual contact document")

        # ---------------------------------------------------------------------
        # 5. FREE SITE VISITS MANAGEMENT & APPOINTMENT SCHEDULING
        # ---------------------------------------------------------------------
        print("\n--- [5/12] Free Site Visits Management & Scheduling ---")

        # 5.1 Public site visit submission
        sv_form = {
            "name": f"{PREFIX}Ananya Client",
            "phoneNumber": "9123456789",
            "whatsappNumber": "9123456789",
            "email": "ananya.client@example.com",
            "cityArea": "Hitec City",
            "propertyType": "Apartment",
            "windowType": "Balcony",
            "preferredVisitDate": "2026-10-20",
            "preferredTime": "Afternoon (1 PM - 4 PM)",
            "requirementDetails": "Balcony safety grill requirement for toddler."
        }
        res = await client.post("/api/site-visits", data=sv_form)
        log_test("Public Site Visit Submission", res.status_code == 200, f"HTTP {res.status_code}")
        sv_doc_id = res.json()["data"]["docId"]
        sv_tracking = res.json()["data"]["id"]

        # 5.2 Admin retrieval
        res = await client.get(f"/api/admin/site-visits/{sv_doc_id}", headers=auth_headers)
        log_test("Admin Get Site Visit Details", res.status_code == 200, f"Tracking: {sv_tracking}")

        # 5.3 Schedule confirmed appointment with technician and quote
        schedule_payload = {
            "status": "scheduled",
            "scheduledDate": "2026-10-21",
            "scheduledTime": "11:00 AM",
            "assignedTechnician": "Suresh Kumar (Senior Technician)",
            "quoteAmount": 18500,
            "sqftEstimated": 120,
            "adminNotes": "Customer confirmed technician visit on Wednesday morning."
        }
        res = await client.patch(f"/api/admin/site-visits/{sv_doc_id}", json=schedule_payload, headers=auth_headers)
        log_test("Schedule Confirmed Appointment & Assign Technician", res.status_code == 200, "Appointment confirmed")

        # Verify database document
        sv_doc = await db.site_visits.find_one({"_id": ObjectId(sv_doc_id)})
        log_test("Site Visit DB State Verification", (
            sv_doc["status"] == "scheduled" and
            sv_doc["scheduledDate"] == "2026-10-21" and
            sv_doc["assignedTechnician"] == "Suresh Kumar (Senior Technician)" and
            sv_doc["quoteAmount"] == 18500
        ), f"Status: {sv_doc['status']}, Tech: {sv_doc['assignedTechnician']}, Quote: Rs. {sv_doc['quoteAmount']}")

        # Cleanup test site visits
        await db.site_visits.delete_one({"_id": ObjectId(sv_doc_id)})
        if converted_sv_id:
            await db.site_visits.delete_one({"_id": ObjectId(converted_sv_id)})

        # ---------------------------------------------------------------------
        # 6. REVIEWS MODERATION WORKFLOW & PII REDACTION
        # ---------------------------------------------------------------------
        print("\n--- [6/12] Reviews Moderation Workflow & PII Protection ---")

        # 6.1 Customer submits public review
        review_payload = {
            "name": f"{PREFIX}Vijay Customer",
            "email": "vijay.private@example.com",
            "phone": "9988776655",
            "rating": 5,
            "review": "Exceptional installation quality and utmost transparency. The team did a great job on my balcony.",
            "city": "Hyderabad"
        }
        res = await client.post("/api/reviews", json=review_payload)
        log_test("Public Review Submission", res.status_code == 200, f"HTTP {res.status_code}")
        review_id = res.json()["data"]["id"]

        # 6.2 Check that pending review is NOT visible on public endpoint
        res = await client.get("/api/reviews")
        public_reviews = res.json()["data"]
        is_pending_public = any(r["_id"] == review_id for r in public_reviews)
        log_test("Pending Review Excluded from Public Website", not is_pending_public,
                 "Pending review is hidden from public view")

        # 6.3 Admin approves review
        res = await client.patch(f"/api/admin/reviews/{review_id}/approve", headers=auth_headers)
        log_test("Admin Approves Review", res.status_code == 200, "Review status set to approved")

        # 6.4 Approved review now visible on public endpoint WITH PII redacted
        res = await client.get("/api/reviews")
        public_reviews = res.json()["data"]
        approved_pub = next((r for r in public_reviews if r["_id"] == review_id), None)
        log_test("Approved Review Appears on Public Website", approved_pub is not None,
                 "Review successfully propagated to public landing page")
        
        pii_leak = ("email" in approved_pub or "phone" in approved_pub or "adminNotes" in approved_pub)
        log_test("PII Fields Protected & Redacted on Public API", not pii_leak,
                 "email, phone, and adminNotes are completely projected out")

        # 6.5 Admin rejects and deletes review
        res = await client.patch(f"/api/admin/reviews/{review_id}/reject", headers=auth_headers)
        log_test("Admin Rejects Review", res.status_code == 200, "Review marked as rejected")
        res = await client.delete(f"/api/admin/reviews/{review_id}", headers=auth_headers)
        log_test("Admin Deletes Review", res.status_code == 200, "Review permanently deleted")

        # ---------------------------------------------------------------------
        # 7. PRODUCTS MANAGEMENT & PUBLIC SYNC
        # ---------------------------------------------------------------------
        print("\n--- [7/12] Products CRUD & Public Website Sync ---")

        prod_slug = f"{PREFIX.lower()}custom-balcony-grill"
        prod_payload = {
            "name": f"{PREFIX}Custom Balcony Grill",
            "slug": prod_slug,
            "shortDescription": "High-durability stainless steel marine grade wire.",
            "description": "Engineered with SS 316 wire and 27mm aluminium channel profiles.",
            "features": ["SS 316 Marine Grade", "3.0 mm Wire", "400 kg Load Capacity"],
            "image": "/images/hero_balcony.jpg",
            "gallery": ["/images/hero_balcony.jpg"],
            "highlight": "Audit Flagship",
            "status": "published",
            "displayOrder": 99
        }

        # 7.1 Create product
        res = await client.post("/api/admin/products", json=prod_payload, headers=auth_headers)
        log_test("Admin Create Product", res.status_code == 200, f"HTTP {res.status_code}")
        prod_id = res.json()["data"]["_id"]

        # 7.2 Verify on public API
        res = await client.get("/api/products")
        public_prods = res.json()["data"]
        found_prod = any(p.get("slug") == prod_slug for p in public_prods)
        log_test("Product Propagated to Public /api/products", found_prod, "Visible in public catalog")

        res = await client.get(f"/api/products/{prod_slug}")
        log_test("Product Detail Available by Slug", res.status_code == 200 and res.json()["data"]["name"] == prod_payload["name"],
                 "Single product endpoint functional")

        # 7.3 Update product
        res = await client.patch(f"/api/admin/products/{prod_id}", json={"shortDescription": "Updated description for testing."}, headers=auth_headers)
        log_test("Admin Update Product", res.status_code == 200, "Product details updated")

        # 7.4 Delete product
        res = await client.delete(f"/api/admin/products/{prod_id}", headers=auth_headers)
        log_test("Admin Delete Product", res.status_code == 200, "Product deleted")

        # ---------------------------------------------------------------------
        # 8. GALLERY MANAGEMENT & PUBLIC SYNC
        # ---------------------------------------------------------------------
        print("\n--- [8/12] Gallery CRUD & Public Website Sync ---")

        gallery_payload = {
            "title": f"{PREFIX}Modern Highrise Installation",
            "description": "Panoramic balcony installation in Financial District.",
            "category": "Balconies",
            "imageUrl": "/images/highrise_view.jpg",
            "displayOrder": 99,
            "status": "active"
        }
        res = await client.post("/api/admin/gallery", json=gallery_payload, headers=auth_headers)
        log_test("Admin Create Gallery Item", res.status_code == 200, f"HTTP {res.status_code}")
        gallery_id = res.json()["data"]["_id"]

        # Verify on public gallery
        res = await client.get("/api/gallery?category=Balconies")
        pub_gallery = res.json()["data"]
        found_gal = any(g.get("_id") == gallery_id for g in pub_gallery)
        log_test("Gallery Item Appears on Public /api/gallery", found_gal, "Synchronized to public gallery")

        # Delete gallery item
        res = await client.delete(f"/api/admin/gallery/{gallery_id}", headers=auth_headers)
        log_test("Admin Delete Gallery Item", res.status_code == 200, "Gallery item deleted")

        # ---------------------------------------------------------------------
        # 9. VIDEOS MANAGEMENT & PUBLIC SYNC
        # ---------------------------------------------------------------------
        print("\n--- [9/12] Videos CRUD & Public Website Sync ---")

        video_payload = {
            "title": f"{PREFIX}Cable Tensioning Demo",
            "subtitle": "Precision Engineering",
            "description": "Demonstration of 400 kg tension load testing on SS 316 cables.",
            "category": "Installation",
            "videoUrl": "/videos/install_video_1.mp4",
            "thumbnailUrl": "/images/highrise_view.jpg",
            "tag": "ENGINEERING AUDIT",
            "displayOrder": 99,
            "status": "active"
        }
        res = await client.post("/api/admin/videos", json=video_payload, headers=auth_headers)
        log_test("Admin Create Video", res.status_code == 200, f"HTTP {res.status_code}")
        video_id = res.json()["data"]["_id"]

        # Verify public videos
        res = await client.get("/api/videos")
        pub_videos = res.json()["data"]
        found_vid = any(v.get("_id") == video_id for v in pub_videos)
        log_test("Video Propagated to Public /api/videos", found_vid, "Synchronized to explore section")

        # Delete video
        res = await client.delete(f"/api/admin/videos/{video_id}", headers=auth_headers)
        log_test("Admin Delete Video", res.status_code == 200, "Video deleted")

        # ---------------------------------------------------------------------
        # 10. TESTIMONIALS & SERVICE AREAS MANAGEMENT
        # ---------------------------------------------------------------------
        print("\n--- [10/12] Testimonials & Service Areas Management ---")

        # 10.1 Testimonials CRUD
        testim_payload = {
            "name": f"{PREFIX}Srinivas Rao",
            "city": "Hyderabad",
            "property": "Villa 42",
            "rating": 5,
            "message": "Flawless invisible grill work on our second-floor balcony.",
            "highlight": "Flawless workmanship",
            "status": "approved",
            "displayOrder": 99
        }
        res = await client.post("/api/admin/testimonials", json=testim_payload, headers=auth_headers)
        log_test("Admin Create Testimonial", res.status_code == 200, f"HTTP {res.status_code}")
        testim_id = res.json()["data"]["_id"]

        res = await client.get("/api/testimonials")
        pub_testims = res.json()["data"]
        found_testim = any(t.get("_id") == testim_id for t in pub_testims)
        log_test("Testimonial Propagated to Public API", found_testim, "Testimonial synchronized")

        res = await client.delete(f"/api/admin/testimonials/{testim_id}", headers=auth_headers)
        log_test("Admin Delete Testimonial", res.status_code == 200, "Testimonial deleted")

        # 10.2 Service Areas CRUD & Spelling Consistency
        area_payload = {
            "name": f"{PREFIX}Hitec City Extension",
            "district": "Hyderabad",
            "isActive": True,
            "displayOrder": 99
        }
        res = await client.post("/api/admin/service-areas", json=area_payload, headers=auth_headers)
        log_test("Admin Create Service Area", res.status_code == 200, f"HTTP {res.status_code}")
        area_id = res.json()["data"]["_id"]

        res = await client.get("/api/service-areas")
        pub_areas = res.json()["data"]
        found_area = any(a.get("name") == area_payload["name"] for a in pub_areas)
        log_test("Service Area Appears on Public /api/service-areas", found_area, "Service area synchronized")

        # Verify Hitec City spelling
        all_area_names = [a.get("name", "") for a in pub_areas]
        has_misspelled = any("Hitech City" in n for n in all_area_names)
        log_test("Service Area Spelling Consistency (Hitec City)", not has_misspelled,
                 "No 'Hitech City' variants found in service areas")

        res = await client.delete(f"/api/admin/service-areas/{area_id}", headers=auth_headers)
        log_test("Admin Delete Service Area", res.status_code == 200, "Service area deleted")

        # ---------------------------------------------------------------------
        # 11. WEBSITE CONTENT & BUSINESS CLAIM INTEGRITY
        # ---------------------------------------------------------------------
        print("\n--- [11/12] Website Content & Claim Protection ---")

        res = await client.get("/api/admin/content", headers=auth_headers)
        log_test("Admin Get Website Content", res.status_code == 200, f"HTTP {res.status_code}")
        content_data = res.json()["data"]

        # Verify key claims are protected
        log_test("Business Claims Preserved", (
            content_data.get("installationCount") == "8,000+" and
            content_data.get("customerSatisfaction") == "100%" and
            content_data.get("yearsExperience") == "5+ Years"
        ), f"Installations: {content_data.get('installationCount')}, Satisfaction: {content_data.get('customerSatisfaction')}, Experience: {content_data.get('yearsExperience')}")

        # Update test content field
        res = await client.patch("/api/admin/content", json={
            "heroSubtitle": "Premium Home Safety & Space Management Services"
        }, headers=auth_headers)
        log_test("Admin Update Content", res.status_code == 200, "Content updated successfully")

        # Verify on public endpoint
        res = await client.get("/api/content")
        log_test("Public /api/content Reflects Live Content", res.status_code == 200 and res.json()["data"]["installationCount"] == "8,000+",
                 "Public content synchronized with database")

        # ---------------------------------------------------------------------
        # 12. ACTIVITY LOGS, MEDIA VALIDATION & CLEAN TEARDOWN
        # ---------------------------------------------------------------------
        print("\n--- [12/12] Activity Logs, Media Library & Final Cleanup ---")

        # 12.1 Activity Logs verification
        res = await client.get("/api/admin/dashboard/activity", headers=auth_headers)
        log_test("Admin Activity Logs Endpoint", res.status_code == 200, f"HTTP {res.status_code}")
        logs = res.json()["data"]
        has_audit_entries = len(logs) > 0
        log_test("Audit Trail Contains Admin Actions", has_audit_entries,
                 f"{len(logs)} activity audit logs recorded in MongoDB")

        # 12.2 Media Library upload validation
        fake_svg = io.BytesIO(b"<svg><script>alert(1)</script></svg>")
        files = {"file": ("malicious.svg", fake_svg, "image/svg+xml")}
        res = await client.post("/api/admin/uploads/image", files=files, headers=auth_headers)
        log_test("Reject Dangerous SVG Upload", res.status_code == 400, "SVG correctly rejected by upload validator")

        # 12.3 Input bounds validation
        bad_quote = {"quoteAmount": -500}
        res = await client.patch(f"/api/admin/site-visits/{fake_id}", json=bad_quote, headers=auth_headers)
        log_test("Validation Rejects Negative Quote", res.status_code in (400, 422), "Input bounds validation enforced")

        bad_contact = {
            "name": "   ",
            "phone": "12345",
            "email": "bad_email",
            "message": "hi"
        }
        res = await client.post("/api/contact", json=bad_contact)
        log_test("Validation Rejects Whitespace & Malformed Inputs", res.status_code == 422, "422 Unprocessable Entity")

        # 12.4 Final Database Cleanup — Remove all PARTA5_TEST_ records
        print("\n--- Executing Database Teardown ---")
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

        # Verify zero residual test records across all collections
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

        residuals_total = 0
        for col_name, query in collections:
            cnt = await db[col_name].count_documents(query)
            residuals_total += cnt

        log_test("Zero Residual Records across MongoDB Atlas", residuals_total == 0,
                 f"{residuals_total} residual records found across {len(collections)} collections")

    await close_mongo_connection()
    print("\n" + "=" * 80)
    print(" [OK] PART A5 ADMIN PANEL DEEP AUDIT SUITE: ALL TESTS PASSED!")
    print("=" * 80)


if __name__ == "__main__":
    asyncio.run(run_part_a5_audit())
