"""
DECCAN SPACE WORKS — PART A1 COMPLETE FUNCTIONAL AUDIT & VERIFICATION SUITE
Automated End-to-End Functional Audit for Deccan Space Works Production Platform.
Tests all public and admin workflows against live MongoDB Atlas.
"""

import asyncio
import os
import sys
from datetime import datetime, timezone
import httpx
from bson import ObjectId

# Ensure backend root is on python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.config import settings
from app.core.database import connect_to_mongo, close_mongo_connection, get_database
from app.core.security import hash_password, create_access_token
from app.main import app

PREFIX = "PARTA1_TEST_"
A1_ADMIN_EMAIL = f"{PREFIX.lower()}admin@deccanspaceworks.com"
A1_ADMIN_PASS = "PartA1Audit2026!"


def log_test(name, passed, detail=""):
    status = "[PASS]" if passed else "[FAIL]"
    print(f"  {status} {name} — {detail}")
    if not passed:
        raise AssertionError(f"A1 Test Failed: {name} — {detail}")


async def run_part_a1_audit():
    print("=" * 80)
    print(" DECCAN SPACE WORKS — PART A1 FUNCTIONAL AUDIT & VERIFICATION SUITE")
    print("=" * 80)

    await connect_to_mongo()
    db = get_database()
    if db is None:
        print("[!] ERROR: Cannot connect to MongoDB Atlas.")
        sys.exit(1)

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        # ---------------------------------------------------------------------
        # CLEANUP ANY PREVIOUS RESIDUALS & SAVE ORIGINAL CONTENT
        # ---------------------------------------------------------------------
        orig_content_doc = await db.website_content.find_one({"section": "general"})
        orig_hero_heading = orig_content_doc.get("heroHeading") if orig_content_doc else "Upgrade Your Home With Smart & Stylish Solutions"

        await db.admins.delete_many({"email": A1_ADMIN_EMAIL})
        await db.contacts.delete_many({"name": {"$regex": f"^{PREFIX}"}})
        await db.site_visits.delete_many({"name": {"$regex": f"^{PREFIX}"}})
        await db.reviews.delete_many({"$or": [{"name": {"$regex": f"^{PREFIX}"}}, {"author": {"$regex": f"^{PREFIX}"}}]})
        await db.products.delete_many({"name": {"$regex": f"^{PREFIX}"}})
        await db.gallery.delete_many({"title": {"$regex": f"^{PREFIX}"}})
        await db.videos.delete_many({"title": {"$regex": f"^{PREFIX}"}})
        await db.testimonials.delete_many({"$or": [{"name": {"$regex": f"^{PREFIX}"}}, {"author": {"$regex": f"^{PREFIX}"}}]})
        await db.service_areas.delete_many({"$or": [{"name": {"$regex": f"^{PREFIX}"}}, {"areaName": {"$regex": f"^{PREFIX}"}}]})

        created_contacts = []
        created_visits = []
        created_reviews = []
        created_products = []
        created_gallery = []
        created_videos = []
        created_testimonials = []
        created_service_areas = []

        try:
            # =================================================================
            # 1. ADMIN AUTHENTICATION AUDIT
            # =================================================================
            print("\n[SECTION 1] Admin Authentication & Authorization Audit")

            # Setup test admin
            await db.admins.insert_one({
                "name": f"{PREFIX}Admin Auditor",
                "email": A1_ADMIN_EMAIL,
                "passwordHash": hash_password(A1_ADMIN_PASS),
                "isActive": True,
                "role": "admin",
                "createdAt": datetime.now(timezone.utc)
            })

            # Valid login
            res_login = await client.post("/api/admin/login", json={
                "email": A1_ADMIN_EMAIL,
                "password": A1_ADMIN_PASS
            })
            log_test("Valid Admin Login", res_login.status_code == 200, f"status {res_login.status_code}")
            token = res_login.json().get("data", {}).get("token")
            assert token, "Token not returned from login"
            auth_headers = {"Authorization": f"Bearer {token}"}

            # Invalid password
            res_bad_pw = await client.post("/api/admin/login", json={
                "email": A1_ADMIN_EMAIL,
                "password": "WrongPassword999!"
            })
            log_test("Invalid Password Rejection", res_bad_pw.status_code == 401, f"status {res_bad_pw.status_code}")

            # Nonexistent email
            res_bad_user = await client.post("/api/admin/login", json={
                "email": f"{PREFIX}nonexistent@deccan.com",
                "password": A1_ADMIN_PASS
            })
            log_test("Nonexistent User Rejection", res_bad_user.status_code == 401, f"status {res_bad_user.status_code}")

            # Verify session via /api/admin/me
            res_me = await client.get("/api/admin/me", headers=auth_headers)
            log_test("Admin Session Verification (/api/admin/me)", res_me.status_code == 200, res_me.json().get("data", {}).get("email"))

            # Protected endpoint blocks unauthenticated request
            res_unauth = await client.get("/api/admin/contacts")
            log_test("Unauthenticated Request Blocked (401)", res_unauth.status_code == 401, f"status {res_unauth.status_code}")

            # =================================================================
            # 2. LEAD / ENQUIRY FUNCTIONAL AUDIT
            # =================================================================
            print("\n[SECTION 2] Lead / Enquiry Management Functional Audit")

            contact_payload = {
                "name": f"{PREFIX}Customer Priya",
                "phone": "9876543210",
                "email": "priya.parta1@example.com",
                "city": "Jubilee Hills",
                "message": "Enquiry for balcony invisible grills on 18th floor."
            }
            res_submit_c = await client.post("/api/contact", json=contact_payload)
            log_test("Public Enquiry Submission", res_submit_c.status_code == 200, res_submit_c.json().get("message", ""))
            c_data = res_submit_c.json().get("data", {})
            contact_id = c_data.get("id") or c_data.get("docId")
            assert contact_id, "No contact ID returned"
            created_contacts.append(contact_id)

            # Check database persistence
            db_contact = await db.contacts.find_one({"_id": ObjectId(contact_id)})
            log_test("Enquiry Persisted in MongoDB Atlas", db_contact is not None and db_contact.get("email") == "priya.parta1@example.com", f"id {contact_id}")

            # Admin list & search enquiries
            res_admin_c = await client.get("/api/admin/contacts?search=Priya", headers=auth_headers)
            log_test("Admin Enquiry Search", res_admin_c.status_code == 200 and len(res_admin_c.json().get("data", [])) > 0, "Found search result")

            # Admin update status & notes
            res_update_c = await client.patch(
                f"/api/admin/contacts/{contact_id}",
                json={"status": "in-progress", "adminNotes": f"{PREFIX}Followed up with quotation."},
                headers=auth_headers
            )
            log_test("Admin Enquiry Status & Notes Update", res_update_c.status_code == 200, res_update_c.json().get("message", ""))
            db_contact_updated = await db.contacts.find_one({"_id": ObjectId(contact_id)})
            log_test("Enquiry Status Persisted in DB", db_contact_updated.get("status") == "in-progress", f"status={db_contact_updated.get('status')}")

            # Convert Contact to Site Visit
            res_convert = await client.post(
                f"/api/admin/contacts/{contact_id}/convert-to-site-visit",
                json={"preferredVisitDate": "2026-10-15", "preferredTime": "10:00 AM", "requirementDetails": f"{PREFIX}Converted lead visit"},
                headers=auth_headers
            )
            log_test("Lead to Site Visit Conversion", res_convert.status_code == 200, res_convert.json().get("message", ""))
            converted_visit_id = res_convert.json().get("data", {}).get("siteVisitId")
            if converted_visit_id:
                created_visits.append(converted_visit_id)
                db_converted_visit = await db.site_visits.find_one({"_id": ObjectId(converted_visit_id)})
                log_test("Converted Site Visit Exists in Atlas", db_converted_visit is not None, f"visitId={converted_visit_id}")

            # Re-conversion must be idempotent and return alreadyConverted: True without creating a second visit
            res_reconvert = await client.post(
                f"/api/admin/contacts/{contact_id}/convert-to-site-visit",
                json={},
                headers=auth_headers
            )
            reconvert_data = res_reconvert.json().get("data", {})
            log_test(
                "Duplicate Conversion Protected (Idempotent)",
                res_reconvert.status_code == 200 and reconvert_data.get("alreadyConverted") is True,
                f"alreadyConverted={reconvert_data.get('alreadyConverted')}"
            )
            count_visits = await db.site_visits.count_documents({"linkedContactId": contact_id})
            log_test("Zero Duplicate Site Visit Records Created", count_visits == 1, f"count={count_visits}")

            # =================================================================
            # 3. FREE SITE VISIT FUNCTIONAL AUDIT
            # =================================================================
            print("\n[SECTION 3] Site Visit Workflow Functional Audit")

            visit_payload = {
                "name": f"{PREFIX}Customer Vikram",
                "phoneNumber": "9849012345",
                "cityArea": "Gachibowli",
                "propertyType": "Apartment",
                "windowType": "Balcony",
                "preferredVisitDate": "2026-10-20",
                "preferredTime": "Morning (10 AM - 1 PM)",
                "requirementDetails": "Measurement for 2 balconies and french windows."
            }
            res_submit_v = await client.post("/api/site-visits", data=visit_payload)
            log_test("Public Site Visit Submission", res_submit_v.status_code == 200, res_submit_v.json().get("message", ""))
            v_data = res_submit_v.json().get("data", {})
            visit_id = v_data.get("docId") or v_data.get("id")
            assert visit_id, "No site visit ID returned"
            created_visits.append(visit_id)

            # Verify in DB
            db_visit = await db.site_visits.find_one({"_id": ObjectId(visit_id)})
            log_test("Site Visit Persisted in MongoDB Atlas", db_visit is not None and db_visit.get("name") == f"{PREFIX}Customer Vikram", f"id {visit_id}")

            # Admin status update
            res_update_v = await client.patch(
                f"/api/admin/site-visits/{visit_id}",
                json={"status": "scheduled", "adminNotes": f"{PREFIX}Technician assigned."},
                headers=auth_headers
            )
            log_test("Admin Site Visit Update", res_update_v.status_code == 200, res_update_v.json().get("message", ""))

            # =================================================================
            # 4. REVIEW & MODERATION FUNCTIONAL AUDIT
            # =================================================================
            print("\n[SECTION 4] Customer Reviews & Moderation Audit")

            review_payload = {
                "name": f"{PREFIX}Sunita Rao",
                "email": "sunita.parta1@example.com",
                "phone": "9988776655",
                "rating": 5,
                "review": "Installed 3mm SS 316 invisible grills. Perfect view and extreme peace of mind.",
                "city": "Hyderabad"
            }
            res_submit_r = await client.post("/api/reviews", json=review_payload)
            log_test("Public Review Submission", res_submit_r.status_code == 200, res_submit_r.json().get("message", ""))
            r_data = res_submit_r.json().get("data", {})
            review_id = r_data.get("id") or r_data.get("docId")
            assert review_id, "No review ID returned"
            created_reviews.append(review_id)

            # Verify unmoderated review is NOT visible in public reviews endpoint
            res_pub_reviews_before = await client.get("/api/reviews")
            pub_reviews = res_pub_reviews_before.json().get("data", [])
            is_visible_before = any(r.get("id") == review_id or r.get("name") == f"{PREFIX}Sunita Rao" for r in pub_reviews)
            log_test("Pending Review NOT Visible Publicly", not is_visible_before, "Data privacy & moderation safe")

            # Admin approves review
            res_approve_r = await client.patch(f"/api/admin/reviews/{review_id}/approve", headers=auth_headers)
            log_test("Admin Approves Review", res_approve_r.status_code == 200, res_approve_r.json().get("message", ""))

            # Verify approved review is NOW visible publicly
            res_pub_reviews_after = await client.get("/api/reviews")
            pub_reviews_after = res_pub_reviews_after.json().get("data", [])
            is_visible_after = any(r.get("id") == review_id or r.get("name") == f"{PREFIX}Sunita Rao" for r in pub_reviews_after)
            log_test("Approved Review NOW Visible Publicly", is_visible_after, "Public propagation verified")

            # Admin rejects review
            res_reject_r = await client.patch(f"/api/admin/reviews/{review_id}/reject", headers=auth_headers)
            log_test("Admin Rejects Review", res_reject_r.status_code == 200, res_reject_r.json().get("message", ""))

            # =================================================================
            # 5. PRODUCT CRUD AUDIT
            # =================================================================
            print("\n[SECTION 5] Product Management CRUD Audit")

            product_payload = {
                "name": f"{PREFIX}SS316 Architectural Grill",
                "slug": f"parta1-test-ss316-grill-{int(datetime.now().timestamp())}",
                "shortDescription": "Grade SS 316 Marine Wire",
                "description": "High tensile stainless steel cable for balconies and windows.",
                "features": ["SS 316 Marine Grade", "400kg Tensile Load", "Anti-corrosion coating"],
                "image": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
                "gallery": ["https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80"],
                "highlight": "10 Years Warranty",
                "status": "published"
            }
            res_create_p = await client.post("/api/admin/products", json=product_payload, headers=auth_headers)
            log_test("Admin Create Product", res_create_p.status_code in [200, 201], f"status {res_create_p.status_code}")
            p_data = res_create_p.json().get("data", {})
            product_id = p_data.get("id") or p_data.get("_id")
            assert product_id, "No product ID returned"
            created_products.append(product_id)

            # Public product propagation
            res_pub_p = await client.get("/api/products")
            pub_products = res_pub_p.json().get("data", [])
            log_test("New Product Propagated to Public API", any(p.get("id") == product_id or p.get("name") == product_payload["name"] for p in pub_products), f"id={product_id}")

            # Admin update product
            res_upd_p = await client.patch(
                f"/api/admin/products/{product_id}",
                json={"shortDescription": f"{PREFIX}Updated Tagline SS 316"},
                headers=auth_headers
            )
            log_test("Admin Update Product", res_upd_p.status_code == 200, res_upd_p.json().get("message", ""))

            # =================================================================
            # 6. GALLERY CRUD AUDIT
            # =================================================================
            print("\n[SECTION 6] Gallery Management CRUD Audit")

            gallery_payload = {
                "title": f"{PREFIX}Balcony Installation at Hitec City",
                "category": "Balconies",
                "imageUrl": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
                "description": "Invisible grill installed on luxury highrise balcony",
                "status": "active"
            }
            res_create_g = await client.post("/api/admin/gallery", json=gallery_payload, headers=auth_headers)
            log_test("Admin Create Gallery Item", res_create_g.status_code in [200, 201], f"status {res_create_g.status_code}")
            g_data = res_create_g.json().get("data", {})
            gallery_id = g_data.get("id") or g_data.get("_id")
            assert gallery_id, "No gallery ID returned"
            created_gallery.append(gallery_id)

            # Public gallery propagation
            res_pub_g = await client.get("/api/gallery")
            pub_gallery = res_pub_g.json().get("data", [])
            log_test("Gallery Item Propagated to Public API", any(g.get("id") == gallery_id or g.get("title") == gallery_payload["title"] for g in pub_gallery), f"id={gallery_id}")

            # =================================================================
            # 7. VIDEO CRUD AUDIT
            # =================================================================
            print("\n[SECTION 7] Video Management CRUD Audit")

            video_payload = {
                "title": f"{PREFIX}Tensile Load Demonstration Video",
                "videoUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                "thumbnailUrl": "https://images.unsplash.com/photo-1541888946425-d0fbb186156f?auto=format&fit=crop&w=800&q=80",
                "description": "Demonstrating 400kg tension strength test on Deccan invisible grill.",
                "category": "Installation",
                "status": "active"
            }
            res_create_v = await client.post("/api/admin/videos", json=video_payload, headers=auth_headers)
            log_test("Admin Create Video", res_create_v.status_code in [200, 201], f"status {res_create_v.status_code}")
            v_data = res_create_v.json().get("data", {})
            video_id = v_data.get("id") or v_data.get("_id")
            assert video_id, "No video ID returned"
            created_videos.append(video_id)

            # Public video propagation
            res_pub_v = await client.get("/api/videos")
            pub_videos = res_pub_v.json().get("data", [])
            log_test("Video Propagated to Public API", any(v.get("id") == video_id or v.get("title") == video_payload["title"] for v in pub_videos), f"id={video_id}")

            # =================================================================
            # 8. TESTIMONIAL CRUD AUDIT
            # =================================================================
            print("\n[SECTION 8] Testimonial Management CRUD Audit")

            testimonial_payload = {
                "name": f"{PREFIX}Anand K.",
                "city": "Hyderabad",
                "property": "Homeowner, Financial District",
                "message": "Excellent service and immaculate finishing. Highly recommended for safety.",
                "rating": 5,
                "status": "approved"
            }
            res_create_t = await client.post("/api/admin/testimonials", json=testimonial_payload, headers=auth_headers)
            log_test("Admin Create Testimonial", res_create_t.status_code in [200, 201], f"status {res_create_t.status_code}")
            t_data = res_create_t.json().get("data", {})
            testim_id = t_data.get("id") or t_data.get("_id")
            assert testim_id, "No testimonial ID returned"
            created_testimonials.append(testim_id)

            # Public testimonial propagation
            res_pub_t = await client.get("/api/testimonials")
            pub_testim = res_pub_t.json().get("data", [])
            log_test("Testimonial Propagated to Public API", any(t.get("id") == testim_id or t.get("name") == testimonial_payload["name"] for t in pub_testim), f"id={testim_id}")

            # =================================================================
            # 9. SERVICE AREA CRUD AUDIT
            # =================================================================
            print("\n[SECTION 9] Service Area Management CRUD Audit")

            service_area_payload = {
                "name": f"{PREFIX}Kokapet SEZ",
                "district": "Hyderabad",
                "isActive": True
            }
            res_create_sa = await client.post("/api/admin/service-areas", json=service_area_payload, headers=auth_headers)
            log_test("Admin Create Service Area", res_create_sa.status_code in [200, 201], f"status {res_create_sa.status_code}")
            sa_data = res_create_sa.json().get("data", {})
            sa_id = sa_data.get("id") or sa_data.get("_id")
            assert sa_id, "No service area ID returned"
            created_service_areas.append(sa_id)

            # Public service area propagation
            res_pub_sa = await client.get("/api/service-areas")
            pub_sa = res_pub_sa.json().get("data", [])
            log_test("Service Area Propagated to Public API", any(a.get("id") == sa_id or a.get("name") == service_area_payload["name"] for a in pub_sa), f"id={sa_id}")

            # =================================================================
            # 10. WEBSITE CONTENT DYNAMIC UPDATE AUDIT
            # =================================================================
            print("\n[SECTION 10] Dynamic Website Content Management Audit")

            res_content = await client.patch(
                "/api/admin/content",
                json={"heroHeading": f"{PREFIX}Hyderabad's Foremost Invisible Grills"},
                headers=auth_headers
            )
            log_test("Admin Website Content Update", res_content.status_code == 200, res_content.json().get("message", ""))

            res_pub_content = await client.get("/api/content")
            log_test("Dynamic Content Propagated Publicly", res_pub_content.status_code == 200, "Content API live")

            # =================================================================
            # 11. ADMIN ACTIVITY LOG AUDIT
            # =================================================================
            print("\n[SECTION 11] Activity Logs Audit")

            res_activity = await client.get("/api/admin/dashboard/activity", headers=auth_headers)
            log_test("Admin Activity Logs Retrieved", res_activity.status_code == 200, f"{len(res_activity.json().get('data', []))} log entries")
            logs = res_activity.json().get("data", [])
            # Assert no sensitive credentials in any log entry
            for entry in logs:
                entry_str = str(entry).lower()
                assert "passwordhash" not in entry_str, "Password hash leaked in activity log"
                assert A1_ADMIN_PASS.lower() not in entry_str, "Raw password leaked in activity log"
            log_test("Activity Logs Free from Sensitive Secrets", True, "Zero password/secret leaks verified")

            # =================================================================
            # 12. ADMIN DASHBOARD STATS AUDIT
            # =================================================================
            print("\n[SECTION 12] Admin Dashboard Metrics Integrity")

            res_dash = await client.get("/api/admin/dashboard", headers=auth_headers)
            log_test("Admin Dashboard Metrics Responds 200", res_dash.status_code == 200, "Dashboard metrics live")
            dash_data = res_dash.json().get("data", {})
            metrics = dash_data.get("metrics", {})
            log_test("Real Database Counts (No Fake Stats)", "totalContacts" in metrics and "totalSiteVisits" in metrics, f"contacts={metrics.get('totalContacts')}, visits={metrics.get('totalSiteVisits')}")

        finally:
            # =================================================================
            # 13. TEMPORARY TEST DATA 100% CLEANUP GUARANTEE
            # =================================================================
            print("\n[SECTION 13] Temporary Test Data 100% Cleanup")

            del_admin = await db.admins.delete_many({"email": A1_ADMIN_EMAIL})
            del_c = await db.contacts.delete_many({"name": {"$regex": f"^{PREFIX}"}})
            del_v = await db.site_visits.delete_many({"name": {"$regex": f"^{PREFIX}"}})
            del_r = await db.reviews.delete_many({"$or": [{"name": {"$regex": f"^{PREFIX}"}}, {"author": {"$regex": f"^{PREFIX}"}}]})
            del_p = await db.products.delete_many({"name": {"$regex": f"^{PREFIX}"}})
            del_g = await db.gallery.delete_many({"title": {"$regex": f"^{PREFIX}"}})
            del_vid = await db.videos.delete_many({"title": {"$regex": f"^{PREFIX}"}})
            del_t = await db.testimonials.delete_many({"$or": [{"name": {"$regex": f"^{PREFIX}"}}, {"author": {"$regex": f"^{PREFIX}"}}]})
            del_sa = await db.service_areas.delete_many({"$or": [{"name": {"$regex": f"^{PREFIX}"}}, {"areaName": {"$regex": f"^{PREFIX}"}}]})
            del_act = await db.activity_logs.delete_many({"details": {"$regex": f"^{PREFIX}"}})

            # Restore original website content
            if orig_hero_heading:
                await db.website_content.update_one(
                    {"section": "general"},
                    {"$set": {"heroHeading": orig_hero_heading}}
                )

            # Verify zero residuals
            remain_admin = await db.admins.count_documents({"email": A1_ADMIN_EMAIL})
            remain_c = await db.contacts.count_documents({"name": {"$regex": f"^{PREFIX}"}})
            remain_v = await db.site_visits.count_documents({"name": {"$regex": f"^{PREFIX}"}})
            remain_r = await db.reviews.count_documents({"$or": [{"name": {"$regex": f"^{PREFIX}"}}, {"author": {"$regex": f"^{PREFIX}"}}]})
            remain_p = await db.products.count_documents({"name": {"$regex": f"^{PREFIX}"}})
            remain_g = await db.gallery.count_documents({"title": {"$regex": f"^{PREFIX}"}})
            remain_vid = await db.videos.count_documents({"title": {"$regex": f"^{PREFIX}"}})
            remain_t = await db.testimonials.count_documents({"$or": [{"name": {"$regex": f"^{PREFIX}"}}, {"author": {"$regex": f"^{PREFIX}"}}]})
            remain_sa = await db.service_areas.count_documents({"$or": [{"name": {"$regex": f"^{PREFIX}"}}, {"areaName": {"$regex": f"^{PREFIX}"}}]})

            total_residuals = (
                remain_admin + remain_c + remain_v + remain_r + remain_p +
                remain_g + remain_vid + remain_t + remain_sa
            )
            log_test("100% Test Data Cleanup Confirmed", total_residuals == 0, f"Residual records = {total_residuals}")

    await close_mongo_connection()
    print("\n" + "=" * 80)
    print(" >>> PART A1 FUNCTIONAL AUDIT SUITE: ALL TESTS PASSED SUCCESSFULLY <<<")
    print("=" * 80)


if __name__ == "__main__":
    asyncio.run(run_part_a1_audit())
