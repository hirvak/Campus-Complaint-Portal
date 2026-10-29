import requests
import json
from datetime import datetime, timezone, timedelta

BASE_URL = "http://localhost:8000"

# Verified project test credentials
STUDENT_CREDS = {"email": "hirva@gmail.com", "password": "Password@123"}
FACILITY_CREDS = {"email": "facility@campus.com", "password": "Facility@123"}
MAINTENANCE_CREDS = {"email": "ramesh@campus.com", "password": "Ramesh@123"}
ADMIN_CREDS = {"email": "admin@gmail.com", "password": "Admin@123"}


def get_token(creds):
    res = requests.post(f"{BASE_URL}/auth/login", json=creds)
    if res.status_code != 200:
        raise Exception(f"Login failed for {creds['email']}: {res.status_code} {res.text}")
    return res.json()["access_token"]


def auth_header(token):
    return {"Authorization": f"Bearer {token}"}


def run_stage2_tests():
    print("=" * 70)
    print("RUNNING CAMPUSCARE STAGE 2: SLA BUSINESS LOGIC & API ENDPOINT TESTS")
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

    # Step 1: Login all roles
    print("\n1. Authenticating all user roles...")
    student_token = get_token(STUDENT_CREDS)
    facility_token = get_token(FACILITY_CREDS)
    maint_token = get_token(MAINTENANCE_CREDS)
    admin_token = get_token(ADMIN_CREDS)
    assert_test("Authentication for Student, Facility Officer, Maintenance, and Admin", True)

    # -------------------------------------------------------------------------
    # TEST SUITE 1: Role-Based Authorization on SLA Config Endpoints
    # -------------------------------------------------------------------------
    print("\n2. Testing Admin-Only Authorization on /sla/* endpoints...")
    
    # Student cannot access /sla/configs
    r_stud = requests.get(f"{BASE_URL}/sla/configs", headers=auth_header(student_token))
    assert_test("Student rejected from GET /sla/configs (HTTP 403)", r_stud.status_code == 403, f"Got {r_stud.status_code}")

    # Facility Officer cannot access /sla/configs
    r_fac = requests.get(f"{BASE_URL}/sla/configs", headers=auth_header(facility_token))
    assert_test("Facility Officer rejected from GET /sla/configs (HTTP 403)", r_fac.status_code == 403, f"Got {r_fac.status_code}")

    # Maintenance Team cannot access /sla/configs
    r_maint = requests.get(f"{BASE_URL}/sla/configs", headers=auth_header(maint_token))
    assert_test("Maintenance Team rejected from GET /sla/configs (HTTP 403)", r_maint.status_code == 403, f"Got {r_maint.status_code}")

    # Student cannot call /sla/check-now
    r_check_stud = requests.post(f"{BASE_URL}/sla/check-now", headers=auth_header(student_token))
    assert_test("Student rejected from POST /sla/check-now (HTTP 403)", r_check_stud.status_code == 403, f"Got {r_check_stud.status_code}")

    # Admin CAN access /sla/configs
    r_admin = requests.get(f"{BASE_URL}/sla/configs", headers=auth_header(admin_token))
    assert_test("Admin successfully accessed GET /sla/configs (HTTP 200)", r_admin.status_code == 200, f"Got {r_admin.status_code}")
    configs = r_admin.json()
    assert_test("Admin retrieved seeded configs list", len(configs) >= 5, f"Configs count: {len(configs)}")

    # Verify seeded Pipe Leakage category override
    pipe_cfg = next((c for c in configs if c.get("category_id") == 4), None)
    assert_test("Seeded Pipe Leakage (Category 4) SLA rule exists", pipe_cfg is not None)
    if pipe_cfg:
        assert_test("Pipe Leakage target_hours is 4", pipe_cfg["target_hours"] == 4, f"Got {pipe_cfg['target_hours']}")
        assert_test("Pipe Leakage warning_hours is 1", pipe_cfg["warning_hours"] == 1, f"Got {pipe_cfg['warning_hours']}")

    # -------------------------------------------------------------------------
    # TEST SUITE 2: Configuration Validation on POST /sla/configs
    # -------------------------------------------------------------------------
    print("\n3. Testing Configuration Validation on POST /sla/configs...")

    # Both category_id and priority -> Error
    r_both = requests.post(
        f"{BASE_URL}/sla/configs",
        headers=auth_header(admin_token),
        json={"category_id": 1, "priority": "Low", "target_hours": 10, "warning_hours": 2}
    )
    assert_test("Rejects both category_id and priority (HTTP 422)", r_both.status_code == 422, f"Got {r_both.status_code}")

    # Neither category_id nor priority -> Error
    r_neither = requests.post(
        f"{BASE_URL}/sla/configs",
        headers=auth_header(admin_token),
        json={"target_hours": 10, "warning_hours": 2}
    )
    assert_test("Rejects neither category_id nor priority (HTTP 422)", r_neither.status_code == 422, f"Got {r_neither.status_code}")

    # warning_hours >= target_hours -> Error
    r_warn = requests.post(
        f"{BASE_URL}/sla/configs",
        headers=auth_header(admin_token),
        json={"category_id": 1, "target_hours": 5, "warning_hours": 5}
    )
    assert_test("Rejects warning_hours >= target_hours (HTTP 422)", r_warn.status_code == 422, f"Got {r_warn.status_code}")

    # Duplicate category config -> Error
    r_dup = requests.post(
        f"{BASE_URL}/sla/configs",
        headers=auth_header(admin_token),
        json={"category_id": 4, "target_hours": 6, "warning_hours": 2}
    )
    assert_test("Rejects duplicate category config (HTTP 400)", r_dup.status_code == 400, f"Got {r_dup.status_code}")

    # Non-existent category -> Error
    r_nocat = requests.post(
        f"{BASE_URL}/sla/configs",
        headers=auth_header(admin_token),
        json={"category_id": 99999, "target_hours": 10, "warning_hours": 2}
    )
    assert_test("Rejects non-existent category (HTTP 404)", r_nocat.status_code == 404, f"Got {r_nocat.status_code}")

    # Valid new category SLA rule (e.g. Category 1)
    # Check if category 1 has config
    cat1_cfg = next((c for c in configs if c.get("category_id") == 1), None)
    if not cat1_cfg:
        r_create = requests.post(
            f"{BASE_URL}/sla/configs",
            headers=auth_header(admin_token),
            json={"category_id": 1, "target_hours": 8, "warning_hours": 2}
        )
        assert_test("Admin successfully created new category SLA config (HTTP 201)", r_create.status_code == 201, f"Got {r_create.status_code}")
        created_id = r_create.json()["id"]
    else:
        created_id = cat1_cfg["id"]

    # -------------------------------------------------------------------------
    # TEST SUITE 3: PUT /sla/configs/{id}
    # -------------------------------------------------------------------------
    print("\n4. Testing PUT /sla/configs/{id}...")
    r_put = requests.put(
        f"{BASE_URL}/sla/configs/{created_id}",
        headers=auth_header(admin_token),
        json={"target_hours": 10, "warning_hours": 3}
    )
    assert_test("Admin successfully updated SLA config (HTTP 200)", r_put.status_code == 200, f"Got {r_put.status_code}")
    assert_test("target_hours updated to 10", r_put.json()["target_hours"] == 10)
    assert_test("warning_hours updated to 3", r_put.json()["warning_hours"] == 3)

    # -------------------------------------------------------------------------
    # TEST SUITE 4: Complaint Creation & SLA Deadline Calculation
    # -------------------------------------------------------------------------
    print("\n5. Testing Complaint Creation and SLA Deadline Calculation...")
    # Create complaint with Pipe Leakage (Category 4)
    # Pipe Leakage has 4h target
    create_payload = {
        "title": "Pipe Leakage in Lab 202",
        "description": "Urgent pipe burst leaking water on floor",
        "category_id": 4,
        "location": "Academic Block A, Lab 202"
    }
    r_c4 = requests.post(f"{BASE_URL}/complaints/", headers=auth_header(student_token), json=create_payload)
    assert_test("Created Pipe Leakage complaint (HTTP 201)", r_c4.status_code == 201, f"Got {r_c4.status_code}")
    c4_data = r_c4.json()
    c4_id = c4_data["id"]

    assert_test("Complaint response has sla_deadline", c4_data.get("sla_deadline") is not None)
    assert_test("Complaint sla_cycle is initialized to 1", c4_data.get("sla_cycle") == 1)
    assert_test("Complaint is_escalated is False", c4_data.get("is_escalated") is False)
    assert_test("Complaint is_grandfathered is False", c4_data.get("is_grandfathered") is False)
    assert_test("Complaint sla_status is ON_TRACK", c4_data.get("sla_status") == "ON_TRACK", f"Got {c4_data.get('sla_status')}")

    # Verify deadline is ~4 hours from created_at
    created_dt = datetime.fromisoformat(c4_data["created_at"].replace("Z", "+00:00"))
    deadline_dt = datetime.fromisoformat(c4_data["sla_deadline"].replace("Z", "+00:00"))
    diff_hours = (deadline_dt - created_dt).total_seconds() / 3600.0
    assert_test("Pipe Leakage deadline is 4.0 hours from created_at", abs(diff_hours - 4.0) < 0.05, f"Diff: {diff_hours}h")

    # -------------------------------------------------------------------------
    # TEST SUITE 5: Assignment & Priority Reprioritization Deadline Update
    # -------------------------------------------------------------------------
    print("\n6. Testing Assignment and Priority Deadline Recalculation...")
    
    # Create a general complaint (Category 3 Water Supply Testing - no category override)
    r_c3 = requests.post(
        f"{BASE_URL}/complaints/",
        headers=auth_header(student_token),
        json={
            "title": "Water Tap Noise in Cafeteria",
            "description": "Tap vibration and noise",
            "category_id": 3,
            "location": "Cafeteria"
        }
    )
    assert_test("Created Category 3 complaint", r_c3.status_code == 201)
    c3_data = r_c3.json()
    c3_id = c3_data["id"]

    # Initial priority is Medium -> 24 hours target
    c3_created = datetime.fromisoformat(c3_data["created_at"].replace("Z", "+00:00"))
    c3_deadline = datetime.fromisoformat(c3_data["sla_deadline"].replace("Z", "+00:00"))
    c3_initial_diff = (c3_deadline - c3_created).total_seconds() / 3600.0
    assert_test("Category 3 initial Medium SLA deadline is 24h", abs(c3_initial_diff - 24.0) < 0.05)

    # Facility Officer assigns to Maintenance Member and bumps priority to CRITICAL (4h target)
    r_assign = requests.post(
        f"{BASE_URL}/complaints/{c3_id}/assign",
        headers=auth_header(facility_token),
        json={"assigned_to": 12, "priority": "Critical"}
    )
    assert_test("Facility Officer assigned and reprioritized to CRITICAL (HTTP 200)", r_assign.status_code == 200)
    c3_assigned_data = r_assign.json()
    
    # Verify deadline was updated to 4 hours from creation
    c3_new_deadline = datetime.fromisoformat(c3_assigned_data["sla_deadline"].replace("Z", "+00:00"))
    c3_new_diff = (c3_new_deadline - c3_created).total_seconds() / 3600.0
    assert_test("Reprioritized to CRITICAL updated deadline to 4h from created_at", abs(c3_new_diff - 4.0) < 0.05, f"Diff: {c3_new_diff}h")

    # -------------------------------------------------------------------------
    # TEST SUITE 6: Resolution, Closure, and Reopen Multi-Cycle Reset
    # -------------------------------------------------------------------------
    print("\n7. Testing Resolution, Closure, and Reopening Multi-Cycle Behavior...")
    
    # Maintenance team moves complaint to IN_PROGRESS
    r_prog = requests.patch(
        f"{BASE_URL}/complaints/{c3_id}/status",
        headers=auth_header(maint_token),
        json={"status": "In Progress"}
    )
    assert_test("Maintenance moved complaint to IN_PROGRESS (HTTP 200)", r_prog.status_code == 200)

    # Maintenance team resolves complaint #c3
    r_res = requests.post(
        f"{BASE_URL}/complaints/{c3_id}/resolve",
        headers=auth_header(maint_token),
        json={"resolution_remarks": "Vibration dampened and valve replaced successfully."}
    )
    assert_test("Maintenance resolved complaint (HTTP 200)", r_res.status_code == 200)
    c3_res_data = r_res.json()
    assert_test("Resolved complaint sla_status is RESOLVED", c3_res_data.get("sla_status") == "RESOLVED", f"Got {c3_res_data.get('sla_status')}")

    # Student reopens the complaint
    r_reopen = requests.post(
        f"{BASE_URL}/complaints/{c3_id}/reopen",
        headers=auth_header(student_token)
    )
    assert_test("Student reopened complaint (HTTP 200)", r_reopen.status_code == 200)
    c3_reopen_data = r_reopen.json()

    assert_test("Reopened complaint status is Reopened", c3_reopen_data["status"] == "Reopened")
    assert_test("Reopened complaint sla_cycle incremented from 1 to 2", c3_reopen_data["sla_cycle"] == 2)
    assert_test("Reopened complaint is_grandfathered is False", c3_reopen_data["is_grandfathered"] is False)
    assert_test("Reopened complaint is_escalated is False", c3_reopen_data["is_escalated"] is False)
    assert_test("Reopened complaint escalation_level is 0", c3_reopen_data["escalation_level"] == 0)
    assert_test("Reopened complaint sla_status is ON_TRACK", c3_reopen_data["sla_status"] == "ON_TRACK")

    # Verify fresh deadline was calculated from reopen timestamp (not initial created_at)
    c3_reopen_deadline = datetime.fromisoformat(c3_reopen_data["sla_deadline"].replace("Z", "+00:00"))
    now_utc = datetime.now(timezone.utc)
    reopen_diff_hours = (c3_reopen_deadline - now_utc).total_seconds() / 3600.0
    # Priority is Critical (4 hours)
    assert_test("Reopen deadline calculated from current reopen moment (~4h from now)", abs(reopen_diff_hours - 4.0) < 0.1, f"Diff: {reopen_diff_hours}h")

    # -------------------------------------------------------------------------
    # TEST SUITE 7: On-Demand SLA Escalation Check & Duplicate Protection
    # -------------------------------------------------------------------------
    print("\n8. Testing On-Demand Escalation Check (POST /sla/check-now)...")

    r_check = requests.post(f"{BASE_URL}/sla/check-now", headers=auth_header(admin_token))
    assert_test("Admin triggered POST /sla/check-now (HTTP 200)", r_check.status_code == 200, f"Got {r_check.status_code}")
    check_result = r_check.json()
    assert_test("Escalation check returned success status", check_result["status"] == "success")
    print(f"     Check Result: detected={check_result['overdue_detected']}, escalated={check_result['escalated_count']}")

    # Second check immediately afterwards: duplicate protection
    r_check2 = requests.post(f"{BASE_URL}/sla/check-now", headers=auth_header(admin_token))
    assert_test("Second POST /sla/check-now succeeds without error (HTTP 200)", r_check2.status_code == 200)
    check_result2 = r_check2.json()
    assert_test("Second check escalates 0 duplicate complaints", check_result2["escalated_count"] == 0)

    # -------------------------------------------------------------------------
    # TEST SUITE 8: In-App Notifications Verification
    # -------------------------------------------------------------------------
    print("\n9. Testing In-App Notifications for Facility Officer...")
    r_notif = requests.get(f"{BASE_URL}/notifications/", headers=auth_header(facility_token))
    assert_test("Facility Officer retrieved notifications (HTTP 200)", r_notif.status_code == 200)
    notifs = r_notif.json()
    assert_test("Facility Officer has notifications", len(notifs) > 0)
    
    # Check for COMPLAINT_REOPENED or COMPLAINT_CREATED notification
    reopened_notif = next((n for n in notifs if n.get("notification_type") == "Complaint Reopened"), None)
    assert_test("Facility Officer received 'Complaint Reopened' notification", reopened_notif is not None)

    print("\n" + "=" * 70)
    print(f"STAGE 2 ALL TESTS PASSED: {passed}/{total} tests completed successfully!")
    print("=" * 70)


if __name__ == "__main__":
    run_stage2_tests()
