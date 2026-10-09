"""
Deccan Space Works — Phase 1B Live MongoDB Atlas E2E Verification Suite
Executes real end-to-end database tests against the configured MongoDB database.
Does NOT mock responses. Directly verifies MongoDB physical documents.
Cleans up all test artifacts upon completion.
"""

import asyncio
import os
import sys
from datetime import datetime, timezone
import httpx

# Ensure backend root is in python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.config import settings
from app.core.database import connect_to_mongo, close_mongo_connection, get_database, db_instance
from app.core.security import hash_password
from app.main import app

TEST_ADMIN_EMAIL = "phase1b_verify_admin@deccanspaceworks.com"
TEST_ADMIN_PASS = "DeccanTest123!Secure"

async def run_phase1b_suite():
    results = {}
    print("=" * 70)
    print(" DECCAN SPACE WORKS — PHASE 1B LIVE MONGODB ATLAS E2E TEST SUITE")
    print("=" * 70)

    # 1. Config Check
    is_placeholder = (
        not settings.MONGODB_URI
        or "<username>" in settings.MONGODB_URI
        or "<password>" in settings.MONGODB_URI
        or "cluster0.mongodb.net" in settings.MONGODB_URI
    )
    
    print(f"[*] Checking configuration in backend/.env...")
    print(f"    - MONGODB_DATABASE: {settings.MONGODB_DATABASE}")
    print(f"    - MONGODB_URI configured: {'YES' if settings.MONGODB_URI else 'NO'}")
    print(f"    - Contains placeholder tokens: {'YES' if is_placeholder else 'NO'}")
    
    if is_placeholder:
        print("\n[!] CRITICAL: backend/.env contains placeholder credentials (<username>:<password>@cluster0.mongodb.net).")
        print("    A genuine MongoDB Atlas connection string is required to perform live E2E verification.")
        return {"status": "BLOCKED_PLACEHOLDER_URI", "reason": "Placeholder credentials present in backend/.env"}

    # 2. Database Connection Test
    print("\n[*] Connecting to MongoDB Atlas...")
    await connect_to_mongo()
    db = get_database()
    
    if db is None:
        print("[!] Connection failed: MongoDB client could not connect or ping failed.")
        return {"status": "CONNECTION_FAILED", "reason": "Failed to connect to MongoDB cluster"}

    try:
        await db.command("ping")
        print("[+] MongoDB Atlas Ping: PASS")
        results["mongo_ping"] = "PASS"
    except Exception as e:
        print(f"[!] MongoDB Atlas Ping FAILED: {e}")
        return {"status": "PING_FAILED", "reason": str(e)}

    # 3. Collection Inspection
    try:
        collections = await db.list_collection_names()
        print(f"[+] Existing Collections in '{settings.MONGODB_DATABASE}': {collections}")
        results["collections"] = collections
    except Exception as e:
        print(f"[!] Failed to list collections: {e}")
        return {"status": "COLLECTION_INSPECTION_FAILED", "reason": str(e)}

    # We will test using httpx ASGI client against FastAPI app
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        
        # 4. Admin Authentication Test
        print("\n[*] Testing Admin Authentication...")
        created_temp_admin = False
        admin_doc = await db.admins.find_one({"email": TEST_ADMIN_EMAIL})
        if not admin_doc:
            test_admin = {
                "name": "Phase 1B Test Admin",
                "email": TEST_ADMIN_EMAIL,
                "passwordHash": hash_password(TEST_ADMIN_PASS),
                "role": "superadmin",
                "createdAt": datetime.now(timezone.utc),
                "lastLogin": None
            }
            await db.admins.insert_one(test_admin)
            created_temp_admin = True
            print(f"    - Inserted temporary test admin: {TEST_ADMIN_EMAIL}")

        # 4a. Valid Login
        login_res = await client.post("/api/admin/login", json={
            "email": TEST_ADMIN_EMAIL,
            "password": TEST_ADMIN_PASS
        })
        if login_res.status_code == 200 and login_res.json().get("success"):
            token = login_res.json()["data"]["token"]
            print("    [+] Valid Login: PASS (JWT obtained)")
            results["admin_valid_login"] = "PASS"
        else:
            print(f"    [!] Valid Login FAILED: {login_res.status_code} - {login_res.text}")
            results["admin_valid_login"] = "FAIL"
            token = None

        # 4b. Invalid Login
        bad_login_res = await client.post("/api/admin/login", json={
            "email": TEST_ADMIN_EMAIL,
            "password": "WrongPassword999!"
        })
        if bad_login_res.status_code == 401:
            print("    [+] Invalid Credentials Rejection: PASS (401 Unauthorized)")
            results["admin_invalid_rejection"] = "PASS"
        else:
            print(f"    [!] Invalid Credentials Rejection FAILED: {bad_login_res.status_code}")
            results["admin_invalid_rejection"] = "FAIL"

        # 4c. Protected Endpoints
        headers = {"Authorization": f"Bearer {token}"} if token else {}
        no_auth_res = await client.get("/api/admin/contacts")
        if no_auth_res.status_code == 401:
            print("    [+] Protected Endpoint Without Token Rejection: PASS (401)")
            results["protected_no_token"] = "PASS"
        else:
            print(f"    [!] Protected Endpoint Without Token FAILED: {no_auth_res.status_code}")
            results["protected_no_token"] = "FAIL"

        invalid_auth_res = await client.get("/api/admin/contacts", headers={"Authorization": "Bearer bad_token_12345"})
        if invalid_auth_res.status_code == 401:
            print("    [+] Protected Endpoint Invalid Token Rejection: PASS (401)")
            results["protected_invalid_token"] = "PASS"
        else:
            print(f"    [!] Protected Endpoint Invalid Token FAILED: {invalid_auth_res.status_code}")
            results["protected_invalid_token"] = "FAIL"

        valid_auth_res = await client.get("/api/admin/contacts", headers=headers)
        if valid_auth_res.status_code == 200:
            print("    [+] Protected Endpoint Valid Token Access: PASS (200)")
            results["protected_valid_token"] = "PASS"
        else:
            print(f"    [!] Protected Endpoint Valid Token FAILED: {valid_auth_res.status_code}")
            results["protected_valid_token"] = "FAIL"

        # 5. Product CRUD E2E
        print("\n[*] Testing Product CRUD E2E against MongoDB Atlas...")
        test_prod_slug = "phase1b-test-product"
        # Ensure clean slate
        await db.products.delete_many({"slug": test_prod_slug})

        # CREATE
        prod_payload = {
            "name": "PHASE1B_TEST_PRODUCT",
            "slug": test_prod_slug,
            "shortDescription": "Phase 1B Test Product Description",
            "description": "Full details for Phase 1B test product",
            "features": ["Feature A", "Feature B"],
            "image": "/images/test.jpg",
            "highlight": "Original Highlight",
            "status": "published",
            "displayOrder": 99
        }
        create_prod_res = await client.post("/api/admin/products", json=prod_payload, headers=headers)
        if create_prod_res.status_code == 200:
            prod_id = create_prod_res.json()["data"]["_id"]
            # Verify in MongoDB directly
            prod_db = await db.products.find_one({"slug": test_prod_slug})
            if prod_db and prod_db.get("name") == "PHASE1B_TEST_PRODUCT":
                print("    [+] Product CREATE & MongoDB Physical Verification: PASS")
                results["product_create"] = "PASS"
            else:
                print("    [!] Product CREATE FAILED: Document not found in MongoDB")
                results["product_create"] = "FAIL"
        else:
            print(f"    [!] Product CREATE FAILED: {create_prod_res.status_code} - {create_prod_res.text}")
            results["product_create"] = "FAIL"
            prod_id = None

        # READ via Public API
        pub_prod_res = await client.get("/api/products")
        if pub_prod_res.status_code == 200:
            prods = pub_prod_res.json().get("data", [])
            found_in_pub = any(p.get("slug") == test_prod_slug for p in prods)
            if found_in_pub:
                print("    [+] Product Public API Retrieval: PASS")
                results["product_public_read"] = "PASS"
            else:
                print("    [!] Product Public API Retrieval FAILED: Not found in public response")
                results["product_public_read"] = "FAIL"
        else:
            results["product_public_read"] = "FAIL"

        # UPDATE
        if prod_id:
            update_prod_res = await client.patch(f"/api/admin/products/{prod_id}", json={
                "highlight": "Updated Phase 1B Highlight"
            }, headers=headers)
            if update_prod_res.status_code == 200:
                # Verify in MongoDB directly
                prod_db_after = await db.products.find_one({"slug": test_prod_slug})
                if prod_db_after and prod_db_after.get("highlight") == "Updated Phase 1B Highlight":
                    print("    [+] Product UPDATE & MongoDB Physical Verification: PASS")
                    results["product_update"] = "PASS"
                else:
                    print("    [!] Product UPDATE FAILED in MongoDB")
                    results["product_update"] = "FAIL"
            else:
                print(f"    [!] Product UPDATE FAILED: {update_prod_res.status_code}")
                results["product_update"] = "FAIL"

            # DELETE
            del_prod_res = await client.delete(f"/api/admin/products/{prod_id}", headers=headers)
            if del_prod_res.status_code == 200:
                prod_db_del = await db.products.find_one({"slug": test_prod_slug})
                if prod_db_del is None:
                    print("    [+] Product DELETE & MongoDB Verification: PASS (Document successfully removed)")
                    results["product_delete"] = "PASS"
                else:
                    print("    [!] Product DELETE FAILED: Document still exists in MongoDB")
                    results["product_delete"] = "FAIL"
            else:
                results["product_delete"] = "FAIL"

        # 6. Service Area CRUD E2E
        print("\n[*] Testing Service Area CRUD E2E against MongoDB Atlas...")
        test_area_name = "PHASE1B_TEST_AREA"
        await db.service_areas.delete_many({"name": test_area_name})

        # CREATE
        area_payload = {
            "name": test_area_name,
            "district": "Hyderabad",
            "isActive": True,
            "displayOrder": 999
        }
        create_area_res = await client.post("/api/admin/service-areas", json=area_payload, headers=headers)
        if create_area_res.status_code == 200:
            area_id = create_area_res.json()["data"]["_id"]
            area_db = await db.service_areas.find_one({"name": test_area_name})
            if area_db and area_db.get("district") == "Hyderabad":
                print("    [+] Service Area CREATE & MongoDB Verification: PASS")
                results["service_area_create"] = "PASS"
            else:
                results["service_area_create"] = "FAIL"
        else:
            results["service_area_create"] = "FAIL"
            area_id = None

        # READ Public
        pub_area_res = await client.get("/api/service-areas")
        if pub_area_res.status_code == 200:
            areas = pub_area_res.json().get("data", [])
            if any(a.get("name") == test_area_name for a in areas):
                print("    [+] Service Area Public Retrieval: PASS")
                results["service_area_public_read"] = "PASS"
            else:
                results["service_area_public_read"] = "FAIL"
        else:
            results["service_area_public_read"] = "FAIL"

        # UPDATE & DELETE
        if area_id:
            update_area_res = await client.patch(f"/api/admin/service-areas/{area_id}", json={
                "district": "Secunderabad"
            }, headers=headers)
            if update_area_res.status_code == 200:
                area_db_up = await db.service_areas.find_one({"name": test_area_name})
                if area_db_up and area_db_up.get("district") == "Secunderabad":
                    print("    [+] Service Area UPDATE & MongoDB Verification: PASS")
                    results["service_area_update"] = "PASS"
                else:
                    results["service_area_update"] = "FAIL"
            else:
                results["service_area_update"] = "FAIL"

            del_area_res = await client.delete(f"/api/admin/service-areas/{area_id}", headers=headers)
            if del_area_res.status_code == 200:
                area_db_del = await db.service_areas.find_one({"name": test_area_name})
                if area_db_del is None:
                    print("    [+] Service Area DELETE & MongoDB Verification: PASS (Document successfully removed)")
                    results["service_area_delete"] = "PASS"
                else:
                    results["service_area_delete"] = "FAIL"
            else:
                results["service_area_delete"] = "FAIL"

        # 7. Website Content E2E
        print("\n[*] Testing Website Content E2E against MongoDB Atlas...")
        # Get existing general content
        orig_content_res = await client.get("/api/content")
        orig_heading = orig_content_res.json()["data"].get("heroHeading", "Default Heading") if orig_content_res.status_code == 200 else "Upgrade Your Home With Smart & Stylish Solutions"
        
        # Modify heroHeading via PATCH /api/admin/content
        test_heading = f"PHASE1B_TEST_HEADING_{int(datetime.now().timestamp())}"
        patch_content_res = await client.patch("/api/admin/content", json={"heroHeading": test_heading}, headers=headers)
        if patch_content_res.status_code == 200:
            # Query MongoDB directly
            content_db = await db.website_content.find_one({"section": "general"})
            if content_db and content_db.get("heroHeading") == test_heading:
                print("    [+] Website Content UPDATE & MongoDB Physical Verification: PASS")
                results["content_update"] = "PASS"
            else:
                print("    [!] Website Content UPDATE physical verification failed")
                results["content_update"] = "FAIL"

            # Fresh public API read
            fresh_pub = await client.get("/api/content")
            if fresh_pub.status_code == 200 and fresh_pub.json()["data"].get("heroHeading") == test_heading:
                print("    [+] Website Content Public API Verification: PASS")
                results["content_public_read"] = "PASS"
            else:
                print("    [!] Website Content Public API read verification failed")
                results["content_public_read"] = "FAIL"

            # Restore original
            await client.patch("/api/admin/content", json={"heroHeading": orig_heading}, headers=headers)
            content_restored = await db.website_content.find_one({"section": "general"})
            if content_restored and content_restored.get("heroHeading") == orig_heading:
                print("    [+] Website Content Original Value Restored: PASS")
                results["content_restore"] = "PASS"
            else:
                print("    [!] Website Content restoration failed")
                results["content_restore"] = "FAIL"
        else:
            print(f"    [!] Website Content PATCH failed: {patch_content_res.status_code} - {patch_content_res.text}")
            results["content_update"] = "FAIL"

        # 8. Public Enquiry E2E (Contact)
        print("\n[*] Testing Public Enquiry Submission (POST /api/contact)...")
        contact_payload = {
            "name": "PHASE1B_TEST_ENQUIRY",
            "phone": "9876543210",
            "email": "phase1b_enquiry@test.com",
            "service": "Invisible Grills",
            "city": "Hyderabad",
            "message": "Automated Phase 1B test enquiry message"
        }
        contact_res = await client.post("/api/contact", json=contact_payload)
        if contact_res.status_code == 200 and contact_res.json().get("success"):
            contact_id = contact_res.json()["data"]["id"]
            # Directly verify in MongoDB
            contact_db = await db.contacts.find_one({"name": "PHASE1B_TEST_ENQUIRY"})
            if contact_db and str(contact_db["_id"]) == contact_id:
                print(f"    [+] Enquiry Stored in MongoDB 'contacts': PASS (id={contact_id})")
                results["contact_db_verified"] = "PASS"

                # Verify admin can view it
                admin_contacts_res = await client.get(f"/api/admin/contacts?search=PHASE1B_TEST_ENQUIRY", headers=headers)
                if admin_contacts_res.status_code == 200:
                    found_in_admin = any(c.get("name") == "PHASE1B_TEST_ENQUIRY" for c in admin_contacts_res.json().get("data", {}).get("items", []))
                    if found_in_admin:
                        print("    [+] Enquiry Retrieved via Admin API: PASS")
                        results["contact_admin_view"] = "PASS"
                    else:
                        results["contact_admin_view"] = "FAIL"
                else:
                    results["contact_admin_view"] = "FAIL"

                # Clean up
                await db.contacts.delete_one({"_id": contact_db["_id"]})
                del_check = await db.contacts.find_one({"name": "PHASE1B_TEST_ENQUIRY"})
                if del_check is None:
                    print("    [+] Enquiry Temporary Document Cleaned & Verified Removed: PASS")
                    results["contact_cleanup"] = "PASS"
                else:
                    results["contact_cleanup"] = "FAIL"
            else:
                print("    [!] Enquiry not found in MongoDB!")
                results["contact_db_verified"] = "FAIL"
        else:
            print(f"    [!] Contact submission FAILED: {contact_res.status_code} - {contact_res.text}")
            results["contact_db_verified"] = "FAIL"

        # 9. Site Visit E2E
        print("\n[*] Testing Site Visit Submission (POST /api/site-visits)...")
        # Clean any old test site visit first
        await db.site_visits.delete_many({"name": "PHASE1B_TEST_SITE_VISIT"})

        site_visit_data = {
            "name": "PHASE1B_TEST_SITE_VISIT",
            "phoneNumber": "9876543210",
            "cityArea": "Kondapur",
            "propertyType": "Apartment",
            "windowType": "Balcony",
            "preferredTime": "Morning (10 AM - 1 PM)",
            "requirementDetails": "Phase 1B test site visit details"
        }
        sv_res = await client.post("/api/site-visits", data=site_visit_data)
        if sv_res.status_code == 200 and sv_res.json().get("success"):
            sv_doc_id = sv_res.json()["data"]["docId"]
            sv_tracking_id = sv_res.json()["data"]["id"]
            sv_db = await db.site_visits.find_one({"name": "PHASE1B_TEST_SITE_VISIT"})
            if sv_db and str(sv_db["_id"]) == sv_doc_id:
                print(f"    [+] Site Visit Stored in MongoDB 'site_visits': PASS (id={sv_doc_id}, code={sv_tracking_id})")
                results["site_visit_db_verified"] = "PASS"

                # Admin view
                admin_sv_res = await client.get("/api/admin/site-visits?search=PHASE1B_TEST_SITE_VISIT", headers=headers)
                if admin_sv_res.status_code == 200:
                    found_sv_admin = any(s.get("name") == "PHASE1B_TEST_SITE_VISIT" for s in admin_sv_res.json().get("data", {}).get("items", []))
                    if found_sv_admin:
                        print("    [+] Site Visit Retrieved via Admin API: PASS")
                        results["site_visit_admin_view"] = "PASS"
                    else:
                        results["site_visit_admin_view"] = "FAIL"
                else:
                    results["site_visit_admin_view"] = "FAIL"

                # Clean up
                await db.site_visits.delete_one({"_id": sv_db["_id"]})
                del_sv_check = await db.site_visits.find_one({"name": "PHASE1B_TEST_SITE_VISIT"})
                if del_sv_check is None:
                    print("    [+] Site Visit Temporary Document Cleaned & Verified Removed: PASS")
                    results["site_visit_cleanup"] = "PASS"
                else:
                    results["site_visit_cleanup"] = "FAIL"
            else:
                print("    [!] Site Visit not found in MongoDB!")
                results["site_visit_db_verified"] = "FAIL"
        else:
            print(f"    [!] Site Visit submission FAILED: {sv_res.status_code} - {sv_res.text}")
            results["site_visit_db_verified"] = "FAIL"

        # 10. Review E2E
        print("\n[*] Testing Customer Review Submission (POST /api/reviews)...")
        review_payload = {
            "name": "PHASE1B_TEST_REVIEW",
            "email": "phase1b_reviewer@test.com",
            "phone": "9876543210",
            "rating": 5,
            "city": "Hyderabad",
            "review": "Outstanding invisible grill installation and professional service during Phase 1B testing."
        }
        rev_res = await client.post("/api/reviews", json=review_payload)
        if rev_res.status_code == 200 and rev_res.json().get("success"):
            rev_id = rev_res.json()["data"]["id"]
            rev_db = await db.reviews.find_one({"name": "PHASE1B_TEST_REVIEW"})
            if rev_db and str(rev_db["_id"]) == rev_id and rev_db.get("status") == "pending":
                print(f"    [+] Review Stored in MongoDB 'reviews': PASS (id={rev_id}, status=pending)")
                results["review_db_verified"] = "PASS"

                # Moderation/Admin view
                admin_rev_res = await client.get("/api/admin/reviews?search=PHASE1B_TEST_REVIEW", headers=headers)
                if admin_rev_res.status_code == 200:
                    found_rev_admin = any(r.get("name") == "PHASE1B_TEST_REVIEW" for r in admin_rev_res.json().get("data", {}).get("items", []))
                    if found_rev_admin:
                        print("    [+] Review Moderation/Admin View: PASS")
                        results["review_admin_view"] = "PASS"
                    else:
                        results["review_admin_view"] = "FAIL"
                else:
                    results["review_admin_view"] = "FAIL"

                # Clean up
                await db.reviews.delete_one({"_id": rev_db["_id"]})
                del_rev_check = await db.reviews.find_one({"name": "PHASE1B_TEST_REVIEW"})
                if del_rev_check is None:
                    print("    [+] Review Temporary Document Cleaned & Verified Removed: PASS")
                    results["review_cleanup"] = "PASS"
                else:
                    results["review_cleanup"] = "FAIL"
            else:
                print("    [!] Review not found in MongoDB!")
                results["review_db_verified"] = "FAIL"
        else:
            print(f"    [!] Review submission FAILED: {rev_res.status_code} - {rev_res.text}")
            results["review_db_verified"] = "FAIL"

        # Clean up temporary test admin if created
        if created_temp_admin:
            await db.admins.delete_one({"email": TEST_ADMIN_EMAIL})
            print(f"\n[+] Cleaned up temporary test admin: {TEST_ADMIN_EMAIL}")

    await close_mongo_connection()
    print("\n" + "=" * 70)
    print(" ALL PHASE 1B VERIFICATION TESTS EXECUTED")
    print("=" * 70)
    return results

if __name__ == "__main__":
    result = asyncio.run(run_phase1b_suite())
    sys.exit(0 if result.get("status") != "BLOCKED_PLACEHOLDER_URI" else 1)
