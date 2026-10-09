import asyncio
import os
import sys
from datetime import datetime, timezone
import httpx
from bson import ObjectId

# Ensure backend root is in python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.config import settings
from app.core.database import connect_to_mongo, close_mongo_connection, get_database
from app.core.security import hash_password, create_access_token
from app.main import app

PHASE4_ADMIN = "phase4_business_admin@deccanspaceworks.com"
PHASE4_PASS = "BusinessAdmin2026!"
PREFIX = "PHASE4_TEST_"

async def run_phase4_tests():
    print("=" * 75)
    print(" DECCAN SPACE WORKS — PHASE 4 COMPLETE CLIENT WORKFLOW & BUSINESS VERIFICATION")
    print("=" * 75)

    await connect_to_mongo()
    db = get_database()
    if db is None:
        print("[!] Cannot connect to MongoDB Atlas. Aborting business test suite.")
        sys.exit(1)

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        # Setup temporary test admin
        await db.admins.delete_many({"email": PHASE4_ADMIN})
        await db.admins.insert_one({
            "name": "Phase 4 Business Admin",
            "email": PHASE4_ADMIN,
            "passwordHash": hash_password(PHASE4_PASS),
            "isActive": True,
            "role": "admin",
            "createdAt": datetime.now(timezone.utc)
        })

        admin_token = create_access_token({"sub": PHASE4_ADMIN})
        auth_headers = {"Authorization": f"Bearer {admin_token}"}

        created_contacts = []
        created_visits = []
        created_reviews = []
        created_products = []
        created_service_areas = []
        created_testimonials = []
        created_gallery = []

        try:
            # -----------------------------------------------------------------
            # TEST 1: AUTHORIZATION CONTROLS ON ADMIN BUSINESS ENDPOINTS
            # -----------------------------------------------------------------
            print("\n[TEST 1] Authorization Controls on Admin Endpoints")
            
            # Unauthenticated requests must yield 401
            resp_no_auth = await client.get("/api/admin/contacts")
            assert resp_no_auth.status_code == 401, f"Expected 401, got {resp_no_auth.status_code}"
            
            resp_bad_auth = await client.get("/api/admin/site-visits", headers={"Authorization": "Bearer bad.token.here"})
            assert resp_bad_auth.status_code == 401, f"Expected 401, got {resp_bad_auth.status_code}"
            
            # Authenticated admin must succeed
            resp_auth = await client.get("/api/admin/contacts", headers=auth_headers)
            assert resp_auth.status_code == 200, f"Expected 200, got {resp_auth.status_code}"
            print("  [OK] Unauthenticated (401), invalid token (401), and valid admin (200) verified.")

            # -----------------------------------------------------------------
            # TEST 2: PUBLIC CONTACT / ENQUIRY WORKFLOW & LEAD MANAGEMENT
            # -----------------------------------------------------------------
            print("\n[TEST 2] Lead Management: Enquiry Creation, Status, Notes & Follow-up")
            
            contact_payload = {
                "name": f"{PREFIX}Customer Ravi",
                "phone": "9849012345",
                "email": "ravi.phase4@example.com",
                "city": "Banjara Hills",
                "message": "Looking for invisible grills for 3 balconies on 14th floor."
            }
            resp_contact = await client.post("/api/contact", json=contact_payload)
            assert resp_contact.status_code == 200, f"Expected 200, got {resp_contact.status_code}"
            contact_res = resp_contact.json()
            assert contact_res.get("success") is True
            contact_id = contact_res.get("data", {}).get("id") or contact_res.get("data", {}).get("docId")
            created_contacts.append(contact_id)
            print(f"  [OK] Public enquiry submitted and persisted (ID: {contact_id})")

            # Admin retrieves contact in list
            resp_list = await client.get(f"/api/admin/contacts?search={PREFIX}Customer", headers=auth_headers)
            assert resp_list.status_code == 200
            items = resp_list.json().get("data", {}).get("items", [])
            assert any(item["_id"] == contact_id for item in items), "Created contact not in admin list"

            # Admin updates lead status, leadQuality, followUpDate, notes
            update_payload = {
                "status": "contacted",
                "leadQuality": "hot",
                "adminNotes": "Spoke to customer. Interested in 3.0mm SS316. Balcony measurements needed.",
                "followUpDate": "2026-10-15",
                "followUpNotes": "Call after 6 PM to confirm site measurement time."
            }
            resp_update = await client.patch(f"/api/admin/contacts/{contact_id}", json=update_payload, headers=auth_headers)
            assert resp_update.status_code == 200, f"Update failed: {resp_update.text}"
            
            # Verify persistence in MongoDB
            doc_contact = await db.contacts.find_one({"_id": ObjectId(contact_id)})
            assert doc_contact["status"] == "contacted"
            assert doc_contact["leadQuality"] == "hot"
            assert doc_contact["followUpDate"] == "2026-10-15"
            assert doc_contact["adminNotes"] == update_payload["adminNotes"]
            assert len(doc_contact.get("history", [])) > 0, "History timeline entry was not created"
            print("  [OK] Lead status, quality, follow-up, admin notes, and timeline history persisted.")

            # -----------------------------------------------------------------
            # TEST 3: CONVERT ENQUIRY TO LINKED SITE VISIT
            # -----------------------------------------------------------------
            print("\n[TEST 3] Lead Conversion: Convert Enquiry to Linked Site Visit")
            convert_payload = {
                "preferredVisitDate": "2026-10-18",
                "preferredTime": "Morning (10 AM - 1 PM)",
                "propertyType": "Apartment",
                "windowType": "Balcony",
                "approximateWindows": "3 Balconies",
                "requirementDetails": "High-rise 14th floor SS316 tensioned grills"
            }
            resp_convert = await client.post(
                f"/api/admin/contacts/{contact_id}/convert-to-site-visit",
                json=convert_payload,
                headers=auth_headers
            )
            assert resp_convert.status_code == 200, f"Conversion failed: {resp_convert.text}"
            conv_data = resp_convert.json().get("data", {})
            visit_id = conv_data.get("siteVisitId")
            tracking_code = conv_data.get("trackingCode")
            created_visits.append(visit_id)
            assert tracking_code.startswith("DSW-HYD-")

            # Check cross-linking
            doc_contact_updated = await db.contacts.find_one({"_id": ObjectId(contact_id)})
            assert doc_contact_updated["linkedSiteVisitId"] == visit_id
            assert doc_contact_updated["linkedSiteVisitCode"] == tracking_code
            assert doc_contact_updated["status"] == "in-progress"

            doc_visit = await db.site_visits.find_one({"_id": ObjectId(visit_id)})
            assert doc_visit["linkedContactId"] == contact_id
            assert doc_visit["name"] == doc_contact["name"]
            assert doc_visit["phoneNumber"] == doc_contact["phone"]
            print(f"  [OK] Contact converted to Site Visit ({tracking_code}) with bidirectional cross-linking.")

            # -----------------------------------------------------------------
            # TEST 4: SITE VISIT MANAGEMENT, SCHEDULING, QUOTING & HISTORY
            # -----------------------------------------------------------------
            print("\n[TEST 4] Site Visit Workflow: Confirmed Scheduling, Technician & Quotation")
            visit_update = {
                "status": "scheduled",
                "scheduledDate": "2026-10-18",
                "scheduledTime": "11:00 AM",
                "assignedTechnician": "Ramesh Technical Lead",
                "quoteAmount": 28500.0,
                "sqftEstimated": 160.0,
                "adminNotes": "Confirmed appointment with Mr. Ravi. Technician dispatched on 18th Oct.",
                "followUpDate": "2026-10-19",
                "followUpNotes": "Review measurement report from Ramesh"
            }
            resp_visit_update = await client.patch(
                f"/api/admin/site-visits/{visit_id}",
                json=visit_update,
                headers=auth_headers
            )
            assert resp_visit_update.status_code == 200, f"Visit update failed: {resp_visit_update.text}"
            
            doc_visit_updated = await db.site_visits.find_one({"_id": ObjectId(visit_id)})
            assert doc_visit_updated["status"] == "scheduled"
            assert doc_visit_updated["scheduledDate"] == "2026-10-18"
            assert doc_visit_updated["scheduledTime"] == "11:00 AM"
            assert doc_visit_updated["assignedTechnician"] == "Ramesh Technical Lead"
            assert doc_visit_updated["quoteAmount"] == 28500.0
            assert doc_visit_updated["sqftEstimated"] == 160.0
            assert len(doc_visit_updated.get("history", [])) > 0
            print("  [OK] Confirmed scheduling, technician assignment, quote amount, and area saved in MongoDB.")

            # -----------------------------------------------------------------
            # TEST 5: ADMIN DASHBOARD METRICS & ATTENTION PANEL
            # -----------------------------------------------------------------
            print("\n[TEST 5] Admin Dashboard Real MongoDB Metrics & Action Priority Panel")
            resp_dash = await client.get("/api/admin/dashboard", headers=auth_headers)
            assert resp_dash.status_code == 200
            dash_data = resp_dash.json().get("data", {})
            metrics = dash_data.get("metrics", {})
            attention_items = dash_data.get("attentionItems", [])
            
            assert "totalSiteVisits" in metrics
            assert "totalContacts" in metrics
            assert "followUpsDue" in metrics
            assert metrics["followUpsDue"] > 0, "Expected follow-ups due count > 0"
            print(f"  [OK] Real dashboard counts returned: Visits={metrics['totalSiteVisits']}, Contacts={metrics['totalContacts']}, FollowUpsDue={metrics['followUpsDue']}")
            print(f"  [OK] Priority Attention Items: {len(attention_items)} active items detected.")

            # -----------------------------------------------------------------
            # TEST 6: CUSTOMER REVIEW SUBMISSION, PII PROTECTION & MODERATION
            # -----------------------------------------------------------------
            print("\n[TEST 6] Customer Reviews: Submission, PII Protection & Moderation Workflow")
            review_payload = {
                "name": f"{PREFIX}Priya Sharma",
                "email": "priya.phase4@example.com",
                "phone": "9876543210",
                "rating": 5,
                "review": "Excellent SS316 installation in Jubilee Hills apartment balcony.",
                "city": "Jubilee Hills"
            }
            resp_rev = await client.post("/api/reviews", json=review_payload)
            assert resp_rev.status_code == 200, f"Review post failed: {resp_rev.text}"
            rev_doc_id = resp_rev.json().get("data", {}).get("id") or resp_rev.json().get("data", {}).get("docId")
            created_reviews.append(rev_doc_id)

            # Public GET /api/reviews must NOT show pending review
            resp_pub_rev = await client.get("/api/reviews")
            assert resp_pub_rev.status_code == 200
            pub_reviews = resp_pub_rev.json().get("data", [])
            assert not any(r.get("name") == review_payload["name"] for r in pub_reviews), "Pending review leaked publicly!"

            # Admin approves review
            resp_approve = await client.patch(f"/api/admin/reviews/{rev_doc_id}/approve", headers=auth_headers)
            assert resp_approve.status_code == 200

            # Public GET /api/reviews now displays review WITHOUT phone (PII protection)
            resp_pub_rev2 = await client.get("/api/reviews")
            pub_reviews2 = resp_pub_rev2.json().get("data", [])
            approved_match = next((r for r in pub_reviews2 if r.get("name") == review_payload["name"]), None)
            assert approved_match is not None, "Approved review not visible on public API"
            assert "phone" not in approved_match, "CRITICAL: Phone number leaked in public review!"
            print("  [OK] Review approved and publicly visible; Phone number PII sanitized.")

            # -----------------------------------------------------------------
            # TEST 7: PRODUCT CATALOG MANAGEMENT & PUBLIC API REFLECTION
            # -----------------------------------------------------------------
            print("\n[TEST 7] Product Management: Create, Read, Update, Public Reflection & Deletion")
            prod_payload = {
                "name": f"{PREFIX}Commercial Heavy-Duty Grills",
                "slug": f"phase4-commercial-heavy-duty-{int(datetime.now().timestamp())}",
                "shortDescription": "3.5mm thick SS316 heavy tensioned cables",
                "description": "Engineered for high-wind commercial atriums and schools.",
                "features": ["3.5mm SS 316 Wire", "450kg Tensile Strength", "Anti-Corrosion 15yr"],
                "image": "/images/highrise_view.jpg",
                "status": "published",
                "displayOrder": 99
            }
            resp_prod = await client.post("/api/admin/products", json=prod_payload, headers=auth_headers)
            assert resp_prod.status_code == 200, f"Product create failed: {resp_prod.text}"
            prod_id = resp_prod.json().get("data", {}).get("_id")
            created_products.append(prod_id)

            # Verify public /api/products returns newly created published product
            resp_pub_prod = await client.get("/api/products")
            assert resp_pub_prod.status_code == 200
            pub_prods = resp_pub_prod.json().get("data", [])
            assert any(p.get("slug") == prod_payload["slug"] for p in pub_prods), "New product not visible on public API"

            # Update product
            resp_prod_upd = await client.patch(
                f"/api/admin/products/{prod_id}",
                json={**prod_payload, "shortDescription": "Updated 3.5mm SS316 specification"},
                headers=auth_headers
            )
            assert resp_prod_upd.status_code == 200
            
            # Delete product
            resp_prod_del = await client.delete(f"/api/admin/products/{prod_id}", headers=auth_headers)
            assert resp_prod_del.status_code == 200
            print("  [OK] Product created, verified on public API, updated, and deleted cleanly.")

            # -----------------------------------------------------------------
            # TEST 8: SERVICE AREA MANAGEMENT & PUBLIC REFLECTION
            # -----------------------------------------------------------------
            print("\n[TEST 8] Service Area Management & Public API Reflection")
            area_payload = {
                "name": f"{PREFIX}Kondapur Central",
                "pincodes": ["500084"],
                "active": True
            }
            resp_area = await client.post("/api/admin/service-areas", json=area_payload, headers=auth_headers)
            assert resp_area.status_code == 200, f"Service area create failed: {resp_area.text}"
            area_id = resp_area.json().get("data", {}).get("_id")
            created_service_areas.append(area_id)

            # Public API verification
            resp_pub_area = await client.get("/api/service-areas")
            assert resp_pub_area.status_code == 200
            pub_areas = resp_pub_area.json().get("data", [])
            assert any(a.get("name") == area_payload["name"] for a in pub_areas), "New service area not on public API"

            # Delete service area
            resp_area_del = await client.delete(f"/api/admin/service-areas/{area_id}", headers=auth_headers)
            assert resp_area_del.status_code == 200
            print("  [OK] Service area created, verified on public API, and removed cleanly.")

            # -----------------------------------------------------------------
            # TEST 9: TESTIMONIAL MANAGEMENT
            # -----------------------------------------------------------------
            print("\n[TEST 9] Testimonials Management & Public Reflection")
            testim_payload = {
                "name": f"{PREFIX}Dr. Srinivas Rao",
                "city": "Gandipet, Hyderabad",
                "property": "Villa Owner",
                "message": "Outstanding quality invisible grills installed on our double-height balcony.",
                "rating": 5,
                "status": "approved",
                "displayOrder": 1
            }
            resp_testim = await client.post("/api/admin/testimonials", json=testim_payload, headers=auth_headers)
            assert resp_testim.status_code == 200, f"Testimonial create failed: {resp_testim.text}"
            testim_id = resp_testim.json().get("data", {}).get("_id")
            created_testimonials.append(testim_id)

            # Public verification
            resp_pub_testim = await client.get("/api/testimonials")
            assert resp_pub_testim.status_code == 200
            pub_testims = resp_pub_testim.json().get("data", [])
            assert any(t.get("name") == testim_payload["name"] for t in pub_testims), "Testimonial not in public API"

            # Delete testimonial
            resp_testim_del = await client.delete(f"/api/admin/testimonials/{testim_id}", headers=auth_headers)
            assert resp_testim_del.status_code == 200
            print("  [OK] Testimonial created, verified on public API, and deleted cleanly.")

            # -----------------------------------------------------------------
            # TEST 10: GALLERY MANAGEMENT
            # -----------------------------------------------------------------
            print("\n[TEST 10] Gallery Item Management & Public Reflection")
            gallery_payload = {
                "title": f"{PREFIX}Luxury Highrise Balcony",
                "category": "Balconies",
                "imageUrl": "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00",
                "status": "active",
                "displayOrder": 1
            }
            resp_gal = await client.post("/api/admin/gallery", json=gallery_payload, headers=auth_headers)
            assert resp_gal.status_code == 200, f"Gallery item create failed: {resp_gal.text}"
            gal_id = resp_gal.json().get("data", {}).get("_id")
            created_gallery.append(gal_id)

            # Public verification
            resp_pub_gal = await client.get("/api/gallery")
            assert resp_pub_gal.status_code == 200
            pub_gal = resp_pub_gal.json().get("data", [])
            assert any(g.get("title") == gallery_payload["title"] for g in pub_gal), "Gallery item not in public API"

            # Delete gallery item
            resp_gal_del = await client.delete(f"/api/admin/gallery/{gal_id}", headers=auth_headers)
            assert resp_gal_del.status_code == 200
            print("  [OK] Gallery item created, verified on public API, and deleted cleanly.")

            # -----------------------------------------------------------------
            # TEST 11: WEBSITE CONTENT MANAGEMENT & ROLLBACK
            # -----------------------------------------------------------------
            print("\n[TEST 11] Website Content Management & Public Content Flow")
            resp_orig_content = await client.get("/api/content")
            orig_content = resp_orig_content.json().get("data", {})

            # Update content
            test_content = {
                "installationCount": "2,500+",
                "customerSatisfaction": "99.8%",
                "yearsExperience": "15+ Years"
            }
            resp_upd_content = await client.patch("/api/admin/content", json=test_content, headers=auth_headers)
            assert resp_upd_content.status_code == 200

            # Public verification
            resp_check_content = await client.get("/api/content")
            checked = resp_check_content.json().get("data", {})
            assert checked.get("installationCount") == "2,500+"

            # Roll back original content
            orig_rollback = {
                "installationCount": orig_content.get("installationCount", "8,000+"),
                "customerSatisfaction": orig_content.get("customerSatisfaction", "99.4%"),
                "yearsExperience": orig_content.get("yearsExperience", "10+ Years")
            }
            await client.patch("/api/admin/content", json=orig_rollback, headers=auth_headers)
            print("  [OK] Website content updated, verified on public endpoint, and safely rolled back.")

            print("\n" + "=" * 75)
            print(" ALL 11 PHASE 4 BUSINESS WORKFLOW & INTEGRATION TESTS PASSED (100%)")
            print("=" * 75)

        finally:
            # -----------------------------------------------------------------
            # RIGOROUS TEST CLEANUP
            # -----------------------------------------------------------------
            print("\nCleaning up temporary Phase 4 test records from MongoDB Atlas...")
            await db.admins.delete_many({"email": PHASE4_ADMIN})
            if created_contacts:
                await db.contacts.delete_many({"_id": {"$in": [ObjectId(cid) for cid in created_contacts if cid]}})
            if created_visits:
                await db.site_visits.delete_many({"_id": {"$in": [ObjectId(vid) for vid in created_visits if vid]}})
            if created_reviews:
                await db.reviews.delete_many({"_id": {"$in": [ObjectId(rid) for rid in created_reviews if rid]}})
            if created_products:
                await db.products.delete_many({"_id": {"$in": [ObjectId(pid) for pid in created_products if pid]}})
            if created_service_areas:
                await db.service_areas.delete_many({"_id": {"$in": [ObjectId(aid) for aid in created_service_areas if aid]}})
            if created_testimonials:
                await db.testimonials.delete_many({"_id": {"$in": [ObjectId(tid) for tid in created_testimonials if tid]}})
            if created_gallery:
                await db.gallery.delete_many({"_id": {"$in": [ObjectId(gid) for gid in created_gallery if gid]}})
            
            # Catch-all prefix cleanup
            await db.contacts.delete_many({"name": {"$regex": f"^{PREFIX}"}})
            await db.site_visits.delete_many({"name": {"$regex": f"^{PREFIX}"}})
            await db.reviews.delete_many({"name": {"$regex": f"^{PREFIX}"}})
            await db.products.delete_many({"name": {"$regex": f"^{PREFIX}"}})
            await db.service_areas.delete_many({"name": {"$regex": f"^{PREFIX}"}})
            await db.testimonials.delete_many({"name": {"$regex": f"^{PREFIX}"}})
            await db.gallery.delete_many({"title": {"$regex": f"^{PREFIX}"}})
            print("[OK] Test cleanup complete. No test artifacts remain in live database.")

    await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(run_phase4_tests())
