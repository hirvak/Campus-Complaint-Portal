import requests
import psycopg2
import os
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv

load_dotenv('backend/.env')
DB_URL = os.getenv('DATABASE_URL', 'postgresql://postgres:1234@localhost:5432/campus_complaint_portal')

BASE_URL = "http://localhost:8000"
STUDENT_CREDS = {"email": "hirva@gmail.com", "password": "Password@123"}
FACILITY_CREDS = {"email": "facility@campus.com", "password": "Facility@123"}
MAINTENANCE_CREDS = {"email": "ramesh@campus.com", "password": "Ramesh@123"}
ADMIN_CREDS = {"email": "admin@gmail.com", "password": "Admin@123"}


def get_token(creds):
    res = requests.post(f"{BASE_URL}/auth/login", json=creds)
    return res.json()["access_token"]


def auth_header(token):
    return {"Authorization": f"Bearer {token}"}


def run_escalation_lifecycle_test():
    print("=" * 70)
    print("TESTING FULL ESCALATION TRIGGER & MULTI-CYCLE AUDIT PRESERVATION")
    print("=" * 70)

    student_token = get_token(STUDENT_CREDS)
    facility_token = get_token(FACILITY_CREDS)
    maint_token = get_token(MAINTENANCE_CREDS)
    admin_token = get_token(ADMIN_CREDS)

    # 1. Create a test complaint
    r_create = requests.post(
        f"{BASE_URL}/complaints/",
        headers=auth_header(student_token),
        json={
            "title": "Severe Water Leakage Near Electrical Panel",
            "description": "Pipe leaking right beside fuse box",
            "category_id": 4, # Pipe Leakage (4h target)
            "location": "Main Substation, Basement"
        }
    )
    assert r_create.status_code == 201, f"Create failed: {r_create.text}"
    comp_id = r_create.json()["id"]
    print(f"1. Created test complaint #{comp_id} (Cycle 1, Pipe Leakage)")

    # 2. Simulate deadline breach by setting sla_deadline to 30 minutes in the past
    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()
    cur.execute(
        "UPDATE complaints SET sla_deadline = NOW() - INTERVAL '30 minutes' WHERE id = %s",
        (comp_id,)
    )
    conn.commit()
    print(f"2. Artificially set complaint #{comp_id} deadline to 30 mins ago.")

    # 3. Check complaint via API -> sla_status should now report OVERDUE
    r_get = requests.get(f"{BASE_URL}/complaints/{comp_id}", headers=auth_header(student_token))
    comp_data = r_get.json()
    assert comp_data["sla_status"] == "OVERDUE", f"Expected OVERDUE, got {comp_data['sla_status']}"
    assert comp_data["time_remaining_seconds"] < 0, f"Expected negative remaining seconds, got {comp_data['time_remaining_seconds']}"
    print(f"3. Verified SLA status: {comp_data['sla_status']} (Remaining: {comp_data['time_remaining_seconds']}s)")

    # 4. Trigger on-demand escalation check as Admin
    r_check = requests.post(f"{BASE_URL}/sla/check-now", headers=auth_header(admin_token))
    assert r_check.status_code == 200
    res = r_check.json()
    assert comp_id in res["escalated_complaints"], f"Expected {comp_id} in escalated list: {res}"
    print(f"4. Escalation check triggered: complaint #{comp_id} escalated in Cycle 1.")

    # 5. Verify database records for Cycle 1 escalation
    cur.execute(
        "SELECT sla_cycle, escalation_level, reason, escalated_to FROM escalation_events WHERE complaint_id = %s",
        (comp_id,)
    )
    events_c1 = cur.fetchall()
    assert len(events_c1) == 1, f"Expected 1 escalation event, got {len(events_c1)}"
    assert events_c1[0][0] == 1, f"Expected cycle 1, got {events_c1[0][0]}"
    assert events_c1[0][1] == 1, f"Expected level 1, got {events_c1[0][1]}"
    print(f"5. DB EscalationEvent verified: cycle={events_c1[0][0]}, level={events_c1[0][1]}")

    # Verify history record
    cur.execute(
        "SELECT action, description FROM complaint_history WHERE complaint_id = %s ORDER BY id DESC LIMIT 1",
        (comp_id,)
    )
    hist_record = cur.fetchone()
    assert hist_record[0] == "Escalated", f"Expected action 'Escalated', got {hist_record[0]}"
    print(f"   DB ComplaintHistory verified: action={hist_record[0]}, desc={hist_record[1][:60]}...")

    # 6. Verify duplicate escalation prevention on second run
    r_check_dup = requests.post(f"{BASE_URL}/sla/check-now", headers=auth_header(admin_token))
    res_dup = r_check_dup.json()
    assert comp_id not in res_dup["escalated_complaints"], f"Duplicate escalation occurred: {res_dup}"
    print("6. Duplicate protection verified: second check did NOT re-escalate.")

    # 7. Facility Officer assigns to Maintenance Ramesh
    r_assign = requests.post(
        f"{BASE_URL}/complaints/{comp_id}/assign",
        headers=auth_header(facility_token),
        json={"assigned_to": 12, "priority": "Critical"}
    )
    assert r_assign.status_code == 200

    # Maintenance moves to In Progress then resolves
    requests.patch(
        f"{BASE_URL}/complaints/{comp_id}/status",
        headers=auth_header(maint_token),
        json={"status": "In Progress"}
    )
    r_res = requests.post(
        f"{BASE_URL}/complaints/{comp_id}/resolve",
        headers=auth_header(maint_token),
        json={"resolution_remarks": "Temporary pipe clamp installed."}
    )
    assert r_res.status_code == 200
    print("7. Complaint assigned and resolved.")

    # 8. Student reopens the complaint -> Starts SLA Cycle 2!
    r_reopen = requests.post(f"{BASE_URL}/complaints/{comp_id}/reopen", headers=auth_header(student_token))
    assert r_reopen.status_code == 200
    reopen_data = r_reopen.json()
    assert reopen_data["sla_cycle"] == 2, f"Expected cycle 2, got {reopen_data['sla_cycle']}"
    assert reopen_data["is_escalated"] is False
    assert reopen_data["escalation_level"] == 0
    assert reopen_data["sla_status"] == "ON_TRACK"
    print(f"8. Reopened: sla_cycle={reopen_data['sla_cycle']}, is_escalated={reopen_data['is_escalated']}, sla_status={reopen_data['sla_status']}")

    # 9. Simulate breach in Cycle 2
    cur.execute(
        "UPDATE complaints SET sla_deadline = NOW() - INTERVAL '15 minutes' WHERE id = %s",
        (comp_id,)
    )
    conn.commit()
    print("9. Set Cycle 2 deadline to 15 mins ago.")

    # 10. Trigger escalation check in Cycle 2
    r_check_c2 = requests.post(f"{BASE_URL}/sla/check-now", headers=auth_header(admin_token))
    res_c2 = r_check_c2.json()
    assert comp_id in res_c2["escalated_complaints"], f"Cycle 2 escalation failed: {res_c2}"
    print(f"10. Cycle 2 escalation triggered: complaint #{comp_id} escalated again.")

    # 11. Verify BOTH Cycle 1 and Cycle 2 escalation events exist in database!
    cur.execute(
        "SELECT sla_cycle, escalation_level, reason FROM escalation_events WHERE complaint_id = %s ORDER BY sla_cycle ASC",
        (comp_id,)
    )
    all_events = cur.fetchall()
    assert len(all_events) == 2, f"Expected 2 escalation events, got {len(all_events)}"
    assert all_events[0][0] == 1, "Cycle 1 event missing"
    assert all_events[1][0] == 2, "Cycle 2 event missing"
    print("11. SUCCESS: Both Cycle 1 and Cycle 2 escalation events co-exist in audit history!")
    for ev in all_events:
        print(f"     Event: Cycle {ev[0]}, Level {ev[1]}, Reason: {ev[2][:50]}...")

    conn.close()
    print("\n" + "=" * 70)
    print("ALL ESCALATION TRIGGER & MULTI-CYCLE TESTS COMPLETED 100% SUCCESSFULLY!")
    print("=" * 70)


if __name__ == "__main__":
    run_escalation_lifecycle_test()
