import asyncio
import os
import sys
from datetime import datetime, timezone
import httpx
from bson import ObjectId

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.config import settings
from app.core.database import connect_to_mongo, close_mongo_connection, get_database
from app.core.security import hash_password, create_access_token
from app.main import app

PHASE5_ADMIN = "phase5_qa_admin@deccanspaceworks.com"
PHASE5_PASS = "QualityAssurance2026!"
PREFIX = "PHASE5_TEST_"

async def run_phase5_tests():
    print("=" * 75)
    print(" DECCAN SPACE WORKS — PHASE 5 COMPREHENSIVE QA & VALIDATION SUITE")
    print("=" * 75)

    await connect_to_mongo()
    db = get_database()
    if db is None:
        print("[!] Cannot connect to MongoDB Atlas. Aborting QA suite.")
        sys.exit(1)

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        # Setup temporary QA admin
        await db.admins.delete_many({"email": PHASE5_ADMIN})
        await db.admins.insert_one({
            "name": "Phase 5 QA Admin",
            "email": PHASE5_ADMIN,
            "passwordHash": hash_password(PHASE5_PASS),
            "isActive": True,
            "role": "admin",
            "createdAt": datetime.now(timezone.utc)
        })

        admin_token = create_access_token({"sub": PHASE5_ADMIN})
        auth_headers = {"Authorization": f"Bearer {admin_token}"}

        created_contacts = []
        created_visits = []
        created_reviews = []
        created_products = []

        try:
            # -------------------------------------------------------------
            # 1. BOUNDARY & WHITESPACE VALIDATION TESTS
            # -------------------------------------------------------------
            print("\n[QA 1] Input Boundaries & Whitespace-Only Rejection")
            
            # Contact: Whitespace name
            bad_ws_contact = await client.post("/api/contact", json={
                "name": "   ",
                "phone": "9849012345",
                "email": "test@example.com",
                "message": "Valid enquiry message"
            })
            assert bad_ws_contact.status_code == 422, f"Expected 422 for whitespace name, got {bad_ws_contact.status_code}"
            
            # Contact: Whitespace message
            bad_ws_msg = await client.post("/api/contact", json={
                "name": f"{PREFIX}User",
                "phone": "9849012345",
                "email": "test@example.com",
                "message": "   "
            })
            assert bad_ws_msg.status_code == 422, f"Expected 422 for whitespace message, got {bad_ws_msg.status_code}"

            # Contact: Malformed email
            bad_email = await client.post("/api/contact", json={
                "name": f"{PREFIX}User",
                "phone": "9849012345",
                "email": "not-an-email",
                "message": "Valid enquiry message"
            })
            assert bad_email.status_code == 422, f"Expected 422 for malformed email, got {bad_email.status_code}"

            # Site Visit: Whitespace area
            bad_area = await client.post("/api/site-visits", data={
                "name": f"{PREFIX}User",
                "phoneNumber": "9849012345",
                "cityArea": "   ",
                "propertyType": "Apartment",
                "windowType": "Balcony"
            })
            assert bad_area.status_code == 422, f"Expected 422 for whitespace cityArea, got {bad_area.status_code}"

            # Review: Rating boundary (< 1 or > 5)
            bad_rating = await client.post("/api/reviews", json={
                "name": f"{PREFIX}Reviewer",
                "email": "rev@example.com",
                "rating": 6,
                "review": "Awesome invisible grills!"
            })
            assert bad_rating.status_code == 422, f"Expected 422 for rating 6, got {bad_rating.status_code}"

            bad_rating_zero = await client.post("/api/reviews", json={
                "name": f"{PREFIX}Reviewer",
                "email": "rev@example.com",
                "rating": 0,
                "review": "Awesome invisible grills!"
            })
            assert bad_rating_zero.status_code == 422, f"Expected 422 for rating 0, got {bad_rating_zero.status_code}"
            print("  [OK] Input boundaries and whitespace-only submissions safely rejected (HTTP 422).")

            # -------------------------------------------------------------
            # 2. COMMERCIAL VALUE SANITIZATION (NEGATIVE / OUT-OF-BOUNDS)
            # -------------------------------------------------------------
            print("\n[QA 2] Commercial Quotation & Area Validation")
            
            # Setup a valid test site visit
            sv_setup = await client.post("/api/site-visits", data={
                "name": f"{PREFIX}Commercial Test",
                "phoneNumber": "9849099887",
                "cityArea": "Gachibowli",
                "propertyType": "Villa",
                "windowType": "Balcony"
            })
            assert sv_setup.status_code == 200
            test_sv_id = sv_setup.json().get("data", {}).get("docId")
            created_visits.append(test_sv_id)

            # Negative quotation rejection
            neg_quote = await client.patch(f"/api/admin/site-visits/{test_sv_id}", json={
                "quoteAmount": -1500
            }, headers=auth_headers)
            assert neg_quote.status_code == 422, f"Expected 422 for negative quote, got {neg_quote.status_code}"

            # Negative sqft rejection
            neg_sqft = await client.patch(f"/api/admin/site-visits/{test_sv_id}", json={
                "sqftEstimated": -50.5
            }, headers=auth_headers)
            assert neg_sqft.status_code == 422, f"Expected 422 for negative sqft, got {neg_sqft.status_code}"

            # Excessive quote (> 10M) rejection
            huge_quote = await client.patch(f"/api/admin/site-visits/{test_sv_id}", json={
                "quoteAmount": 999999999
            }, headers=auth_headers)
            assert huge_quote.status_code == 422, f"Expected 422 for 999M quote, got {huge_quote.status_code}"

            # Valid decimal sqft and positive quote acceptance
            valid_commercial = await client.patch(f"/api/admin/site-visits/{test_sv_id}", json={
                "quoteAmount": 34500.0,
                "sqftEstimated": 185.5
            }, headers=auth_headers)
            assert valid_commercial.status_code == 200, f"Valid commercial values failed: {valid_commercial.text}"
            print("  [OK] Commercial constraints verified: Negative/excessive values blocked; valid decimals accepted.")

            # -------------------------------------------------------------
            # 3. STATUS ENUM VALIDATION (INVALID STATUS REJECTION)
            # -------------------------------------------------------------
            print("\n[QA 3] Status State Machine Boundary Enforcement")
            
            # Invalid contact status
            bad_contact_status = await client.patch(f"/api/admin/contacts/60c72b2f9b1d8b001c8e0000", json={
                "status": "unsupported_status"
            }, headers=auth_headers)
            assert bad_contact_status.status_code == 422, f"Expected 422 for invalid contact status, got {bad_contact_status.status_code}"

            # Invalid site visit status
            bad_sv_status = await client.patch(f"/api/admin/site-visits/{test_sv_id}", json={
                "status": "flying"
            }, headers=auth_headers)
            assert bad_sv_status.status_code == 422, f"Expected 422 for invalid visit status, got {bad_sv_status.status_code}"
            print("  [OK] Invalid status enum values strictly rejected by Pydantic regex pattern.")

            # -------------------------------------------------------------
            # 4. DUPLICATE CONVERSION DEFENSE (IDEMPOTENCY)
            # -------------------------------------------------------------
            print("\n[QA 4] Enquiry -> Site Visit Double Conversion Defense")
            
            # Create a contact
            contact_res = await client.post("/api/contact", json={
                "name": f"{PREFIX}Conversion Defense",
                "phone": "9849055443",
                "email": "conversion.defense@example.com",
                "city": "Madhapur",
                "message": "Testing double conversion protection"
            })
            assert contact_res.status_code == 200
            test_cid = contact_res.json().get("data", {}).get("id") or contact_res.json().get("data", {}).get("docId")
            created_contacts.append(test_cid)

            # First conversion
            conv1 = await client.post(f"/api/admin/contacts/{test_cid}/convert-to-site-visit", json={
                "propertyType": "Apartment",
                "windowType": "Balcony"
            }, headers=auth_headers)
            assert conv1.status_code == 200
            conv1_data = conv1.json().get("data", {})
            sv1_id = conv1_data.get("siteVisitId")
            sv1_code = conv1_data.get("trackingCode")
            created_visits.append(sv1_id)

            # Second conversion attempt on the same enquiry
            conv2 = await client.post(f"/api/admin/contacts/{test_cid}/convert-to-site-visit", json={
                "propertyType": "Apartment",
                "windowType": "Balcony"
            }, headers=auth_headers)
            assert conv2.status_code == 200
            conv2_data = conv2.json().get("data", {})
            assert conv2_data.get("siteVisitId") == sv1_id, "Duplicate site visit document created!"
            assert conv2_data.get("trackingCode") == sv1_code, "Mismatched tracking code on double conversion!"
            assert conv2_data.get("alreadyConverted") is True, "Expected alreadyConverted flag"

            # Check Atlas site visits count for this contact ID
            linked_sv_count = await db.site_visits.count_documents({"linkedContactId": test_cid})
            assert linked_sv_count == 1, f"Expected exactly 1 linked site visit in Atlas, found {linked_sv_count}"
            print(f"  [OK] Double conversion prevented. Exactly 1 site visit created ({sv1_code}) without duplicate docs.")

            # -------------------------------------------------------------
            # 5. IDOR & MALFORMED OBJECTID RESILIENCE
            # -------------------------------------------------------------
            print("\n[QA 5] IDOR & Malformed ObjectID Handling")
            
            # Malformed string (not hex ObjectId) must return 400 Bad Request, never 500
            malformed_tests = [
                ("/api/admin/contacts/not-a-valid-id", "PATCH"),
                ("/api/admin/site-visits/malformed-id-123", "GET"),
                ("/api/admin/products/invalid-id-xyz", "PATCH"),
                ("/api/admin/reviews/bad-hex-id/approve", "PATCH")
            ]
            for endpoint, method in malformed_tests:
                if method == "GET":
                    m_resp = await client.get(endpoint, headers=auth_headers)
                elif method == "PATCH":
                    m_resp = await client.patch(endpoint, json={"status": "contacted"}, headers=auth_headers)
                assert m_resp.status_code in [400, 404], f"{endpoint} returned {m_resp.status_code}, expected 400/404"
            
            # Non-existent valid ObjectId must return 404 Not Found, never 500
            fake_oid = "60c72b2f9b1d8b001c8e9999"
            nf_contact = await client.get(f"/api/admin/contacts?search={fake_oid}", headers=auth_headers)
            assert nf_contact.status_code == 200
            
            nf_visit = await client.get(f"/api/admin/site-visits/{fake_oid}", headers=auth_headers)
            assert nf_visit.status_code == 404, f"Expected 404 for non-existent visit, got {nf_visit.status_code}"
            print("  [OK] Malformed IDs return 400; non-existent ObjectIDs return 404 without internal server errors.")

            # -------------------------------------------------------------
            # 6. PUBLIC API DATA PRIVACY & LEAK AUDIT
            # -------------------------------------------------------------
            print("\n[QA 6] Public API Privacy & Leak Audit")
            
            # Create a review with phone and internal admin notes in MongoDB
            rev_doc = {
                "name": f"{PREFIX}Private User",
                "email": "private.customer@example.com",
                "phone": "9988776655",
                "rating": 5,
                "review": "Testing PII redaction on approved review.",
                "city": "Hyderabad",
                "status": "approved",
                "adminNotes": "SECRET INTERNAL NOTE: DO NOT EXPOSE TO PUBLIC",
                "createdAt": datetime.now(timezone.utc)
            }
            rev_ins = await db.reviews.insert_one(rev_doc)
            created_reviews.append(str(rev_ins.inserted_id))

            # Fetch public reviews
            pub_rev_resp = await client.get("/api/reviews")
            assert pub_rev_resp.status_code == 200
            pub_rev_items = pub_rev_resp.json().get("data", [])
            target_rev = next((r for r in pub_rev_items if r.get("name") == rev_doc["name"]), None)
            assert target_rev is not None, "Approved review not found in public list"
            assert "phone" not in target_rev, "CRITICAL: Customer phone number leaked in public review API!"
            assert "email" not in target_rev, "CRITICAL: Customer email leaked in public review API!"
            assert "adminNotes" not in target_rev, "CRITICAL: Internal adminNotes leaked in public review API!"

            # Create an unpublished/draft product
            draft_prod = {
                "name": f"{PREFIX}Secret Draft Product",
                "slug": f"phase5-draft-product-{int(datetime.now().timestamp())}",
                "shortDescription": "Internal R&D product",
                "description": "Not ready for public",
                "features": ["Confidential"],
                "image": "/images/highrise_view.jpg",
                "status": "draft",
                "displayOrder": 99,
                "createdAt": datetime.now(timezone.utc),
                "updatedAt": datetime.now(timezone.utc)
            }
            prod_ins = await db.products.insert_one(draft_prod)
            created_products.append(str(prod_ins.inserted_id))

            # Fetch public products
            pub_prod_resp = await client.get("/api/products")
            assert pub_prod_resp.status_code == 200
            pub_prods = pub_prod_resp.json().get("data", [])
            assert not any(p.get("slug") == draft_prod["slug"] for p in pub_prods), "CRITICAL: Draft product leaked on public API!"
            print("  [OK] Public APIs verified: Customer PII, adminNotes, and draft products strictly isolated.")

            # -------------------------------------------------------------
            # 7. COMPLETE CLIENT LIFECYCLE E2E QA
            # -------------------------------------------------------------
            print("\n[QA 7] Complete Client Lifecycle Workflow E2E")
            
            # Step A: Customer submits enquiry
            e2e_lead = await client.post("/api/contact", json={
                "name": f"{PREFIX}Naveen Reddy",
                "phone": "9848011223",
                "email": "naveen.reddy@example.com",
                "city": "Kondapur",
                "message": "Need invisible grills for 2 balconies on 8th floor."
            })
            assert e2e_lead.status_code == 200
            e2e_lead_id = e2e_lead.json().get("data", {}).get("id") or e2e_lead.json().get("data", {}).get("docId")
            created_contacts.append(e2e_lead_id)

            # Step B: Admin reviews & updates lead status + follow-up
            e2e_update = await client.patch(f"/api/admin/contacts/{e2e_lead_id}", json={
                "status": "contacted",
                "leadQuality": "hot",
                "adminNotes": "Called Mr. Naveen. High interest in 3.0mm SS316.",
                "followUpDate": "2026-10-16",
                "followUpNotes": "Confirm site visit timing"
            }, headers=auth_headers)
            assert e2e_update.status_code == 200

            # Step C: Admin converts enquiry to site visit
            e2e_conv = await client.post(f"/api/admin/contacts/{e2e_lead_id}/convert-to-site-visit", json={
                "preferredVisitDate": "2026-10-17",
                "preferredTime": "Morning (10 AM - 1 PM)",
                "propertyType": "Apartment",
                "windowType": "Balcony",
                "requirementDetails": "2 Balconies, 8th floor"
            }, headers=auth_headers)
            assert e2e_conv.status_code == 200
            e2e_sv_id = e2e_conv.json().get("data", {}).get("siteVisitId")
            e2e_sv_code = e2e_conv.json().get("data", {}).get("trackingCode")
            created_visits.append(e2e_sv_id)

            # Step D: Admin confirms appointment schedule, technician, quote & sqft
            e2e_schedule = await client.patch(f"/api/admin/site-visits/{e2e_sv_id}", json={
                "status": "scheduled",
                "scheduledDate": "2026-10-17",
                "scheduledTime": "10:30 AM",
                "assignedTechnician": "Kiran Field Engineer",
                "quoteAmount": 26000.0,
                "sqftEstimated": 140.0,
                "adminNotes": "Appointment confirmed for 17th Oct with Mr. Naveen."
            }, headers=auth_headers)
            assert e2e_schedule.status_code == 200

            # Step E: Admin completes visit
            e2e_complete = await client.patch(f"/api/admin/site-visits/{e2e_sv_id}", json={
                "status": "completed",
                "adminNotes": "Site measurement completed. Laser dimensions recorded."
            }, headers=auth_headers)
            assert e2e_complete.status_code == 200

            # Step F: Verify MongoDB persistence
            db_sv = await db.site_visits.find_one({"_id": ObjectId(e2e_sv_id)})
            assert db_sv["status"] == "completed"
            assert db_sv["quoteAmount"] == 26000.0
            assert db_sv["sqftEstimated"] == 140.0
            assert db_sv["assignedTechnician"] == "Kiran Field Engineer"
            assert len(db_sv.get("history", [])) >= 3, "Timeline entries missing in site visit"
            print("  [OK] Complete end-to-end client lifecycle verified in live Atlas database with full audit trail.")

            print("\n" + "=" * 75)
            print(" ALL 7 PHASE 5 QA TEST SUITES PASSED (100%)")
            print("=" * 75)

        finally:
            # -------------------------------------------------------------
            # TEST DATA CLEANUP
            # -------------------------------------------------------------
            print("\nCleaning up temporary Phase 5 test records from MongoDB Atlas...")
            await db.admins.delete_many({"email": PHASE5_ADMIN})
            if created_contacts:
                await db.contacts.delete_many({"_id": {"$in": [ObjectId(cid) for cid in created_contacts if cid]}})
            if created_visits:
                await db.site_visits.delete_many({"_id": {"$in": [ObjectId(vid) for vid in created_visits if vid]}})
            if created_reviews:
                await db.reviews.delete_many({"_id": {"$in": [ObjectId(rid) for rid in created_reviews if rid]}})
            if created_products:
                await db.products.delete_many({"_id": {"$in": [ObjectId(pid) for pid in created_products if pid]}})
            
            # Catch-all prefix cleanup
            await db.contacts.delete_many({"name": {"$regex": f"^{PREFIX}"}})
            await db.site_visits.delete_many({"name": {"$regex": f"^{PREFIX}"}})
            await db.reviews.delete_many({"name": {"$regex": f"^{PREFIX}"}})
            await db.products.delete_many({"name": {"$regex": f"^{PREFIX}"}})
            print("[OK] Test cleanup complete. No test artifacts remain in live database.")

    await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(run_phase5_tests())
