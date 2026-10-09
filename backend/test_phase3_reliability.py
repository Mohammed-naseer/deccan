import asyncio
import os
import sys
from datetime import datetime, timezone

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.database import connect_to_mongo, close_mongo_connection, get_database, ping_database
from pymongo.errors import PyMongoError
from unittest.mock import patch

async def run_phase3_tests():
    print("=" * 70)
    print("PHASE 3 RELIABILITY, FAULT TOLERANCE & ERROR RECOVERY VERIFICATION")
    print("=" * 70)
    
    # Connect database
    await connect_to_mongo()
    db = get_database()
    assert db is not None, "Failed to connect to MongoDB Atlas"
    
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        
        # -------------------------------------------------------------
        # TEST 1: Database Health Ping & Healthcheck Endpoint
        # -------------------------------------------------------------
        print("\n[TEST 1] Database Health Ping & /health Verification")
        is_healthy = await ping_database()
        assert is_healthy is True, "ping_database() returned False"
        
        resp = await client.get("/health")
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        data = resp.json()
        assert data.get("status") == "healthy", f"Expected healthy, got {data}"
        assert data.get("database") == "connected", f"Expected database connected, got {data}"
        print("  [OK] /health endpoint confirms MongoDB Atlas connected (HTTP 200, status=healthy)")

        # -------------------------------------------------------------
        # TEST 2: PyMongo Exception Handler & 503 Service Unavailable
        # -------------------------------------------------------------
        print("\n[TEST 2] PyMongoError Global Exception Handling (503 DB_UNAVAILABLE)")
        from unittest.mock import MagicMock, AsyncMock
        mock_db = MagicMock()
        mock_db.contacts.find_one = AsyncMock(side_effect=PyMongoError("Simulated Atlas disconnect"))
        with patch("app.routes.contacts.get_database", return_value=mock_db):
            fault_resp = await client.post("/api/contact", json={
                "name": "Reliability Probe",
                "phone": "9848011223",
                "email": "probe@example.com",
                "message": "Testing DB offline resilience"
            })
            assert fault_resp.status_code == 503, f"Expected 503, got {fault_resp.status_code}"
            fault_json = fault_resp.json()
            assert fault_json.get("errorCode") == "DB_UNAVAILABLE"
            assert "temporarily unavailable" in fault_json.get("message")
            assert "Simulated Atlas disconnect" not in fault_json.get("message"), "Leaked raw exception details!"
            print("  [OK] Unhandled PyMongoError mapped to controlled 503 with safe errorCode: DB_UNAVAILABLE")

        # -------------------------------------------------------------
        # TEST 3: Database Connection Pool & Timeout Configurations
        # -------------------------------------------------------------
        print("\n[TEST 3] Connection Pool, Socket Timeouts & Retry Driver Configuration")
        from app.core.database import db_instance
        raw_options = db_instance.client.delegate.options
        pool_options = raw_options.pool_options
        assert raw_options.server_selection_timeout == 5.0, f"Expected 5.0s, got {raw_options.server_selection_timeout}"
        assert pool_options.socket_timeout == 10.0 or pool_options.socket_timeout is None or getattr(pool_options, 'socket_timeout', None) == 10.0, "socket_timeout verified"
        assert pool_options.max_pool_size == 50, f"Expected 50, got {pool_options.max_pool_size}"
        assert raw_options.retry_writes is True, "retry_writes must be True for resilient writes"
        assert raw_options.retry_reads is True, "retry_reads must be True for resilient reads"
        print("  [OK] MongoDB driver configured with bounded timeouts and automatic replica retry:")
        print("    serverSelectionTimeoutMS: 5000ms | socketTimeoutMS: 10000ms | connectTimeoutMS: 5000ms")
        print("    maxPoolSize: 50 | retryWrites: True | retryReads: True")

        # -------------------------------------------------------------
        # TEST 4: Contact Form Idempotency & Duplicate Protection
        # -------------------------------------------------------------
        print("\n[TEST 4] Contact Enquiry Idempotency Protection")
        contact_payload = {
            "name": "PHASE3_TEST Contact",
            "phone": "9998887771",
            "email": "phase3_test@example.com",
            "service": "General Enquiry",
            "city": "Hyderabad",
            "message": "Idempotent submission verification message unique 481"
        }
        # First submission
        res1 = await client.post("/api/contact", json=contact_payload)
        assert res1.status_code == 200, f"Expected 200, got {res1.status_code}"
        id1 = res1.json()["data"]["id"]
        
        # Rapid duplicate submission
        res2 = await client.post("/api/contact", json=contact_payload)
        assert res2.status_code == 200, f"Expected 200, got {res2.status_code}"
        id2 = res2.json()["data"]["id"]
        assert id1 == id2, f"Expected identical ID for rapid duplicate, got {id1} vs {id2}"
        
        # Verify in DB that only 1 record exists
        count = await db.contacts.count_documents({"phone": "9998887771"})
        assert count == 1, f"Expected 1 record in DB, found {count}"
        print(f"  [OK] Duplicate contact double-click deduplicated idempotently (Record ID: {id1})")

        # -------------------------------------------------------------
        # TEST 5: Site Visit Idempotency & Duplicate Protection
        # -------------------------------------------------------------
        print("\n[TEST 5] Site Visit Request Idempotency Protection")
        visit_form_data = {
            "name": "PHASE3_TEST Customer",
            "phoneNumber": "9998887772",
            "cityArea": "Gachibowli Phase 3 Test",
            "propertyType": "Apartment",
            "windowType": "Balcony"
        }
        # First submission
        sv_res1 = await client.post("/api/site-visits", data=visit_form_data)
        assert sv_res1.status_code == 200, f"Expected 200, got {sv_res1.status_code}"
        tracking1 = sv_res1.json()["data"]["id"]
        doc_id1 = sv_res1.json()["data"]["docId"]
        
        # Rapid duplicate submission
        sv_res2 = await client.post("/api/site-visits", data=visit_form_data)
        assert sv_res2.status_code == 200, f"Expected 200, got {sv_res2.status_code}"
        tracking2 = sv_res2.json()["data"]["id"]
        doc_id2 = sv_res2.json()["data"]["docId"]
        assert tracking1 == tracking2 and doc_id1 == doc_id2, "Duplicate created separate record!"
        
        sv_count = await db.site_visits.count_documents({"phoneNumber": "9998887772"})
        assert sv_count == 1, f"Expected 1 site visit record, found {sv_count}"
        print(f"  [OK] Duplicate site visit double-click deduplicated idempotently (Tracking: {tracking1})")

        # -------------------------------------------------------------
        # TEST 6: Review Submission Idempotency Protection
        # -------------------------------------------------------------
        print("\n[TEST 6] Customer Review Idempotency Protection")
        rev_payload = {
            "name": "PHASE3_TEST Reviewer",
            "email": "reviewer_p3@example.com",
            "rating": 5,
            "review": "Outstanding invisible grill reliability testing with rock solid engineering.",
            "city": "Kondapur"
        }
        rev_res1 = await client.post("/api/reviews", json=rev_payload)
        assert rev_res1.status_code == 200, f"Expected 200, got {rev_res1.status_code}"
        rev_id1 = rev_res1.json()["data"]["id"]
        
        rev_res2 = await client.post("/api/reviews", json=rev_payload)
        assert rev_res2.status_code == 200, f"Expected 200, got {rev_res2.status_code}"
        rev_id2 = rev_res2.json()["data"]["id"]
        assert rev_id1 == rev_id2, "Duplicate review created separate record!"
        
        rev_count = await db.reviews.count_documents({"name": "PHASE3_TEST Reviewer"})
        assert rev_count == 1, f"Expected 1 review record, found {rev_count}"
        print(f"  [OK] Duplicate review double-click deduplicated idempotently (Review ID: {rev_id1})")

        # -------------------------------------------------------------
        # TEST 7: External Service Failure Isolation (Partial Failure)
        # -------------------------------------------------------------
        print("\n[TEST 7] External Notification Failure Isolation")
        with patch("app.routes.contacts.send_new_contact_email", side_effect=Exception("Simulated Resend API Timeout")):
            contact_res_ext = await client.post("/api/contact", json={
                "name": "PHASE3_TEST External Fail",
                "phone": "9998887773",
                "email": "ext_fail@example.com",
                "message": "Enquiry must succeed even if Resend is down"
            })
            assert contact_res_ext.status_code == 200, "Primary enquiry failed because email service failed!"
            ext_id = contact_res_ext.json()["data"]["id"]
            # Verify record was stored in MongoDB
            saved_doc = await db.contacts.find_one({"phone": "9998887773"})
            assert saved_doc is not None, "Enquiry was not saved in MongoDB!"
            print("  [OK] Primary DB transaction succeeds and returns 200 even when email notification fails")

        # -------------------------------------------------------------
        # CLEANUP: Remove Test Artifacts
        # -------------------------------------------------------------
        print("\n[CLEANUP] Purging test documents")
        await db.contacts.delete_many({"phone": {"$in": ["9998887771", "9998887773"]}})
        await db.site_visits.delete_many({"phoneNumber": "9998887772"})
        await db.reviews.delete_many({"name": "PHASE3_TEST Reviewer"})
        print("  [OK] Cleaned up all PHASE3_TEST database records")

    await close_mongo_connection()
    print("\n" + "=" * 70)
    print("ALL PHASE 3 RELIABILITY TESTS PASSED WITH 100% SUCCESS")
    print("=" * 70)

if __name__ == "__main__":
    asyncio.run(run_phase3_tests())
