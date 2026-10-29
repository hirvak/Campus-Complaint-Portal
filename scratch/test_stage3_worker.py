import asyncio
import os
import sys
import requests
import psycopg2
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath('backend'))
load_dotenv('backend/.env')

from app.Departments.models import Department
from app.Categories.models import Category
from app.Complaints.models import Complaint
from app.Users.models import User

DB_URL = os.getenv('DATABASE_URL', 'postgresql://postgres:1234@localhost:5432/campus_complaint_portal')
BASE_URL = "http://localhost:8000"

STUDENT_CREDS = {"email": "hirva@gmail.com", "password": "Password@123"}
FACILITY_CREDS = {"email": "facility@campus.com", "password": "Facility@123"}
MAINTENANCE_CREDS = {"email": "ramesh@campus.com", "password": "Ramesh@123"}
ADMIN_CREDS = {"email": "admin@gmail.com", "password": "Admin@123"}


def get_token(creds):
    res = requests.post(f"{BASE_URL}/auth/login", json=creds)
    if res.status_code != 200:
        raise Exception(f"Login failed: {res.text}")
    return res.json()["access_token"]


def auth_header(token):
    return {"Authorization": f"Bearer {token}"}


def run_stage3_tests():
    print("=" * 70)
    print("RUNNING CAMPUSCARE STAGE 3: BACKGROUND WORKER AUTOMATED TEST SUITE")
    print("=" * 70)
    passed = 0
    total = 0

    def assert_test(name, condition, msg=""):
        nonlocal passed, total
        total += 1
        if condition:
            passed += 1
            print(f"  [PASS] {name}")
        else:
            print(f"  [FAIL] {name}: {msg}")
            raise AssertionError(f"Test failed: {name} - {msg}")

    # 1. Authenticate users
    print("\n1. Authenticating test users...")
    student_token = get_token(STUDENT_CREDS)
    facility_token = get_token(FACILITY_CREDS)
    maint_token = get_token(MAINTENANCE_CREDS)
    admin_token = get_token(ADMIN_CREDS)
    assert_test("All users authenticated successfully", True)

    # -------------------------------------------------------------------------
    # TEST SUITE 1: Worker Status & Authorization Verification
    # -------------------------------------------------------------------------
    print("\n2. Testing /sla/worker-status authorization and runtime state...")
    
    # Non-admin rejected
    r_stud = requests.get(f"{BASE_URL}/sla/worker-status", headers=auth_header(student_token))
    assert_test("Student rejected from GET /sla/worker-status (HTTP 403)", r_stud.status_code == 403)

    r_fac = requests.get(f"{BASE_URL}/sla/worker-status", headers=auth_header(facility_token))
    assert_test("Facility Officer rejected from GET /sla/worker-status (HTTP 403)", r_fac.status_code == 403)

    # Admin accesses worker status
    r_admin = requests.get(f"{BASE_URL}/sla/worker-status", headers=auth_header(admin_token))
    assert_test("Admin accessed GET /sla/worker-status (HTTP 200)", r_admin.status_code == 200)
    w_status = r_admin.json()
    assert_test("Worker is_running is True in FastAPI application", w_status.get("is_running") is True)
    assert_test("Worker interval_seconds is configured (60s)", w_status.get("interval_seconds") == 60)
    assert_test("Worker run_count is >= 1", w_status.get("run_count") >= 1)
    assert_test("Worker error_count is 0", w_status.get("error_count") == 0)

    # -------------------------------------------------------------------------
    # TEST SUITE 2: Automatic Overdue Detection & Escalation
    # -------------------------------------------------------------------------
    print("\n3. Testing Automatic Overdue Detection & Escalation via Worker Service...")
    
    # Create fresh complaint via student
    r_comp = requests.post(
        f"{BASE_URL}/complaints/",
        headers=auth_header(student_token),
        json={
            "title": "Stage 3 Worker Overdue Test Complaint",
            "description": "Testing automatic background escalation",
            "category_id": 4, # Pipe Leakage (4h)
            "location": "Chemistry Wing, Room 301"
        }
    )
    assert_test("Created fresh complaint for worker testing", r_comp.status_code == 201)
    comp_id = r_comp.json()["id"]

    # Artificially set deadline to 20 minutes ago
    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()
    cur.execute("UPDATE complaints SET sla_deadline = NOW() - INTERVAL '20 minutes' WHERE id = %s", (comp_id,))
    conn.commit()

    # Import worker function and execute single worker tick
    from app.SLA.worker import run_sla_check_sync
    tick_result = run_sla_check_sync()

    assert_test("Worker tick executed successfully", tick_result.status == "success")
    assert_test(f"Worker tick escalated overdue complaint #{comp_id}", comp_id in tick_result.escalated_complaints)

    # Verify complaint record in DB
    cur.execute("SELECT is_escalated, escalation_level, sla_cycle FROM complaints WHERE id = %s", (comp_id,))
    row = cur.fetchone()
    assert_test("Complaint is_escalated is True", row[0] is True)
    assert_test("Complaint escalation_level is 1", row[1] == 1)
    assert_test("Complaint sla_cycle is 1", row[2] == 1)

    # -------------------------------------------------------------------------
    # TEST SUITE 3: Duplicate Prevention on Subsequent Worker Ticks
    # -------------------------------------------------------------------------
    print("\n4. Testing Duplicate Prevention on Subsequent Worker Ticks...")
    tick_result2 = run_sla_check_sync()
    assert_test("Subsequent worker tick does NOT re-escalate complaint", comp_id not in tick_result2.escalated_complaints)

    # -------------------------------------------------------------------------
    # TEST SUITE 4: Exclusion of Grandfathered Historical Complaints
    # -------------------------------------------------------------------------
    print("\n5. Testing Exclusion of Grandfathered Historical Complaints...")
    # Find a grandfathered complaint
    cur.execute("SELECT id FROM complaints WHERE is_grandfathered = true LIMIT 1")
    gf_row = cur.fetchone()
    if gf_row:
        gf_id = gf_row[0]
        assert_test(f"Grandfathered complaint #{gf_id} was NOT escalated by worker tick", gf_id not in tick_result.escalated_complaints)
    else:
        print("  [INFO] No grandfathered complaints found to test.")

    # -------------------------------------------------------------------------
    # TEST SUITE 5: Reopened Complaint Lifecycle Monitoring in Cycle 2
    # -------------------------------------------------------------------------
    print("\n6. Testing Reopened Complaint Lifecycle Monitoring in Cycle 2...")
    
    # Assign and resolve complaint
    requests.post(
        f"{BASE_URL}/complaints/{comp_id}/assign",
        headers=auth_header(facility_token),
        json={"assigned_to": 12, "priority": "Critical"}
    )
    requests.patch(
        f"{BASE_URL}/complaints/{comp_id}/status",
        headers=auth_header(maint_token),
        json={"status": "In Progress"}
    )
    requests.post(
        f"{BASE_URL}/complaints/{comp_id}/resolve",
        headers=auth_header(maint_token),
        json={"resolution_remarks": "Resolved for testing cycle 2"}
    )

    # Reopen
    r_reopen = requests.post(f"{BASE_URL}/complaints/{comp_id}/reopen", headers=auth_header(student_token))
    assert_test("Student reopened complaint", r_reopen.status_code == 200)
    reopen_data = r_reopen.json()
    assert_test("Complaint entered Cycle 2", reopen_data["sla_cycle"] == 2)
    assert_test("is_escalated was reset to False on reopen", reopen_data["is_escalated"] is False)

    # Artificially set Cycle 2 deadline to past
    cur.execute("UPDATE complaints SET sla_deadline = NOW() - INTERVAL '10 minutes' WHERE id = %s", (comp_id,))
    conn.commit()

    # Worker tick in Cycle 2
    tick_result_c2 = run_sla_check_sync()
    assert_test(f"Worker tick escalated complaint #{comp_id} in Cycle 2", comp_id in tick_result_c2.escalated_complaints)

    # Verify both Cycle 1 and Cycle 2 escalation events exist in DB
    cur.execute("SELECT sla_cycle, escalation_level FROM escalation_events WHERE complaint_id = %s ORDER BY sla_cycle ASC", (comp_id,))
    events = cur.fetchall()
    assert_test("Both Cycle 1 and Cycle 2 events coexist in database", len(events) == 2)
    assert_test("Event 1 is Cycle 1", events[0][0] == 1)
    assert_test("Event 2 is Cycle 2", events[1][0] == 2)

    # -------------------------------------------------------------------------
    # TEST SUITE 6: SLAWorker Lifecycle, Graceful Shutdown & Singleton Safety
    # -------------------------------------------------------------------------
    print("\n7. Testing SLAWorker Lifecycle, Graceful Shutdown & Singleton Safety...")

    async def test_worker_class():
        from app.SLA.worker import SLAWorker
        test_worker = SLAWorker(interval_seconds=1)
        
        # Test start
        test_worker.start()
        assert test_worker.is_running is True, "Worker should be running"
        
        # Duplicate start should be safely ignored
        test_worker.start()
        assert test_worker.is_running is True, "Worker should still be running"

        # Let it run 1 second
        await asyncio.sleep(1.2)
        assert test_worker._run_count >= 1, "Worker should have executed at least 1 run"

        # Test graceful stop
        await test_worker.stop()
        assert test_worker.is_running is False, "Worker should be stopped"
        assert test_worker._task is None, "Worker task should be None"

    asyncio.run(test_worker_class())
    assert_test("SLAWorker start, duplicate start prevention, and graceful stop verified", True)

    # -------------------------------------------------------------------------
    # TEST SUITE 7: Worker Fault Tolerance & Error Recovery
    # -------------------------------------------------------------------------
    print("\n8. Testing Worker Fault Tolerance & Error Recovery...")

    async def test_error_recovery():
        from app.SLA.worker import SLAWorker
        from unittest.mock import patch

        faulty_worker = SLAWorker(interval_seconds=1)
        
        # Simulate transient database failure during run_sla_check_sync
        call_count = 0
        def faulty_sync():
            nonlocal call_count
            call_count += 1
            if call_count == 1:
                raise psycopg2.OperationalError("Simulated transient PostgreSQL connection failure")
            return run_sla_check_sync()

        with patch("app.SLA.worker.run_sla_check_sync", side_effect=faulty_sync):
            faulty_worker.start()
            # Wait for 2 ticks (first fails, second succeeds)
            await asyncio.sleep(2.3)
            await faulty_worker.stop()

        assert faulty_worker._error_count >= 1, f"Expected error count >= 1, got {faulty_worker._error_count}"
        assert faulty_worker._consecutive_errors == 0, f"Consecutive errors should have reset on recovery, got {faulty_worker._consecutive_errors}"
        assert faulty_worker._run_count >= 1, f"Run count should be >= 1, got {faulty_worker._run_count}"

    asyncio.run(test_error_recovery())
    assert_test("Worker survived transient DB failure and recovered on next iteration", True)

    # -------------------------------------------------------------------------
    # TEST SUITE 8: Independent POST /sla/check-now
    # -------------------------------------------------------------------------
    print("\n9. Testing Independent POST /sla/check-now Endpoint...")
    r_manual = requests.post(f"{BASE_URL}/sla/check-now", headers=auth_header(admin_token))
    assert_test("Admin POST /sla/check-now succeeds independently (HTTP 200)", r_manual.status_code == 200)

    conn.close()

    print("\n" + "=" * 70)
    print(f"STAGE 3 ALL TESTS PASSED: {passed}/{total} tests completed successfully!")
    print("=" * 70)


if __name__ == "__main__":
    run_stage3_tests()
