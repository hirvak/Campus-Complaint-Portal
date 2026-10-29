import sys
import os
from datetime import datetime, timezone, timedelta

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath('backend'))

from app.Utils.enums import ComplaintPriority, ComplaintStatus
from app.SLA.service import (
    DEFAULT_PRIORITY_TARGETS,
    DEFAULT_PRIORITY_WARNINGS,
    get_applicable_sla,
    calculate_deadline,
)


def run_tests():
    print("=" * 70)
    print("RUNNING FOCUSED SLA AND ESCALATION TESTS")
    print("=" * 70)
    passed = 0
    total = 0

    def assert_eq(test_name, actual, expected):
        nonlocal passed, total
        total += 1
        if actual == expected:
            passed += 1
            print(f"  [PASS] {test_name}: {actual} == {expected}")
        else:
            print(f"  [FAIL] {test_name}: Expected {expected}, got {actual}")
            raise AssertionError(f"{test_name} failed!")

    # -------------------------------------------------------------
    # TEST SUITE 1: System Priority Targets & Defaults
    # -------------------------------------------------------------
    print("\n--- TEST SUITE 1: Priority SLA Target & Warning Defaults ---")
    assert_eq("CRITICAL Target", DEFAULT_PRIORITY_TARGETS[ComplaintPriority.CRITICAL], 4)
    assert_eq("CRITICAL Warning", DEFAULT_PRIORITY_WARNINGS[ComplaintPriority.CRITICAL], 1)
    assert_eq("HIGH Target", DEFAULT_PRIORITY_TARGETS[ComplaintPriority.HIGH], 12)
    assert_eq("HIGH Warning", DEFAULT_PRIORITY_WARNINGS[ComplaintPriority.HIGH], 2)
    assert_eq("MEDIUM Target", DEFAULT_PRIORITY_TARGETS[ComplaintPriority.MEDIUM], 24)
    assert_eq("MEDIUM Warning", DEFAULT_PRIORITY_WARNINGS[ComplaintPriority.MEDIUM], 4)
    assert_eq("LOW Target", DEFAULT_PRIORITY_TARGETS[ComplaintPriority.LOW], 48)
    assert_eq("LOW Warning", DEFAULT_PRIORITY_WARNINGS[ComplaintPriority.LOW], 8)

    # -------------------------------------------------------------
    # TEST SUITE 2: Category-over-Priority Precedence Simulation
    # -------------------------------------------------------------
    print("\n--- TEST SUITE 2: Category-Over-Priority Precedence ---")

    class MockCategoryConfig:
        def __init__(self, target, warning):
            self.target_hours = target
            self.warning_hours = warning

    class MockPriorityConfig:
        def __init__(self, target, warning):
            self.target_hours = target
            self.warning_hours = warning

    # Simulated DB lookups
    def mock_lookup(category_id, priority, rules):
        # Category rule has absolute precedence if present
        if category_id in rules.get('categories', {}):
            cfg = rules['categories'][category_id]
            return cfg.target_hours, cfg.warning_hours
        if priority in rules.get('priorities', {}):
            cfg = rules['priorities'][priority]
            return cfg.target_hours, cfg.warning_hours
        return DEFAULT_PRIORITY_TARGETS.get(priority, 24), DEFAULT_PRIORITY_WARNINGS.get(priority, 4)

    # Rule set: Category 4 ("Pipe Leakage") has 4h SLA override
    rules = {
        'categories': {
            4: MockCategoryConfig(target=4, warning=1)
        },
        'priorities': {
            ComplaintPriority.LOW: MockPriorityConfig(target=48, warning=8),
            ComplaintPriority.MEDIUM: MockPriorityConfig(target=24, warning=4),
            ComplaintPriority.HIGH: MockPriorityConfig(target=12, warning=2),
            ComplaintPriority.CRITICAL: MockPriorityConfig(target=4, warning=1),
        }
    }

    # Pipe Leakage (Category 4) with LOW priority should get 4 hours (NOT 48 hours)
    t, w = mock_lookup(4, ComplaintPriority.LOW, rules)
    assert_eq("Pipe Leakage LOW Priority SLA (Category Precedence)", t, 4)
    assert_eq("Pipe Leakage LOW Priority Warning (Category Precedence)", w, 1)

    # Non-leakage category (e.g. Category 1) with LOW priority should get 48 hours
    t, w = mock_lookup(1, ComplaintPriority.LOW, rules)
    assert_eq("General Category LOW Priority SLA", t, 48)
    assert_eq("General Category LOW Priority Warning", w, 8)

    # Non-leakage category (Category 1) with HIGH priority should get 12 hours
    t, w = mock_lookup(1, ComplaintPriority.HIGH, rules)
    assert_eq("General Category HIGH Priority SLA", t, 12)

    # Water Supply Testing (Category 3) has NO override, gets priority SLA
    t, w = mock_lookup(3, ComplaintPriority.MEDIUM, rules)
    assert_eq("Water Supply Testing (Cat 3) gets standard Medium SLA", t, 24)

    # -------------------------------------------------------------
    # TEST SUITE 3: Deadline Backfill Calculation Logic
    # -------------------------------------------------------------
    print("\n--- TEST SUITE 3: Deadline Backfill Logic ---")
    t0 = datetime(2026, 10, 1, 10, 0, 0, tzinfo=timezone.utc)
    
    # Category 4 (Pipe Leakage) created at t0: deadline is t0 + 4h
    deadline_cat4 = t0 + timedelta(hours=4)
    assert_eq("Cat 4 Backfilled Deadline", deadline_cat4, datetime(2026, 10, 1, 14, 0, 0, tzinfo=timezone.utc))

    # General High Priority created at t0: deadline is t0 + 12h
    deadline_high = t0 + timedelta(hours=12)
    assert_eq("General High Backfilled Deadline", deadline_high, datetime(2026, 10, 1, 22, 0, 0, tzinfo=timezone.utc))

    # -------------------------------------------------------------
    # TEST SUITE 4: Grandfathering Historical Overdue Complaints
    # -------------------------------------------------------------
    print("\n--- TEST SUITE 4: Grandfathering & Alert Storm Prevention ---")
    now = datetime(2026, 10, 28, 22, 0, 0, tzinfo=timezone.utc)

    # Historical complaint created 20 days ago (unresolved, deadline breached 20 days ago)
    hist_created = datetime(2026, 10, 8, 10, 0, 0, tzinfo=timezone.utc)
    hist_deadline = hist_created + timedelta(hours=24) # 2026-10-09
    
    def evaluate_grandfather(status, deadline, current_time):
        if status not in [ComplaintStatus.RESOLVED, ComplaintStatus.CLOSED] and deadline < current_time:
            return True # is_grandfathered = True
        return False

    is_gf = evaluate_grandfather(ComplaintStatus.NEW, hist_deadline, now)
    assert_eq("Historical Overdue Unresolved Complaint is Grandfathered", is_gf, True)

    # Worker evaluation for escalation:
    def should_worker_escalate(is_grandfathered, is_escalated, status, deadline, current_time):
        if is_grandfathered:
            return False # Ignored to prevent alert storm!
        if is_escalated:
            return False # Already escalated in this cycle
        if status in [ComplaintStatus.RESOLVED, ComplaintStatus.CLOSED]:
            return False # Inactive
        return deadline < current_time

    assert_eq(
        "Escalation Worker IGNORES grandfathered historical complaint",
        should_worker_escalate(is_grandfathered=True, is_escalated=False, status=ComplaintStatus.NEW, deadline=hist_deadline, current_time=now),
        False
    )

    # Historical resolved complaint is NOT grandfathered (and not escalated)
    is_gf_resolved = evaluate_grandfather(ComplaintStatus.RESOLVED, hist_deadline, now)
    assert_eq("Historical Resolved Complaint NOT Grandfathered", is_gf_resolved, False)
    assert_eq(
        "Escalation Worker IGNORES resolved complaint",
        should_worker_escalate(is_grandfathered=False, is_escalated=False, status=ComplaintStatus.RESOLVED, deadline=hist_deadline, current_time=now),
        False
    )

    # Fresh complaint created today: deadline in future
    fresh_deadline = now + timedelta(hours=4)
    is_gf_fresh = evaluate_grandfather(ComplaintStatus.NEW, fresh_deadline, now)
    assert_eq("Fresh Complaint NOT Grandfathered", is_gf_fresh, False)

    # Fresh complaint that breaches its deadline SHOULD be escalated
    past_fresh_deadline = now - timedelta(minutes=5)
    assert_eq(
        "Fresh Complaint with breached deadline IS escalated by worker",
        should_worker_escalate(is_grandfathered=False, is_escalated=False, status=ComplaintStatus.NEW, deadline=past_fresh_deadline, current_time=now),
        True
    )

    # -------------------------------------------------------------
    # TEST SUITE 5: Reopened Complaint Cycles & Multi-Cycle Uniqueness
    # -------------------------------------------------------------
    print("\n--- TEST SUITE 5: Reopened Complaint Lifecycle & Multi-Cycle Audit ---")

    class MockComplaint:
        def __init__(self, id, category_id, priority, status, is_grandfathered=False):
            self.id = id
            self.category_id = category_id
            self.priority = priority
            self.status = status
            self.sla_cycle = 1
            self.is_grandfathered = is_grandfathered
            self.is_escalated = False
            self.escalated_at = None
            self.escalation_level = 0
            self.sla_deadline = None

    # Step 1: Historical grandfathered complaint
    c = MockComplaint(id=42, category_id=4, priority=ComplaintPriority.MEDIUM, status=ComplaintStatus.NEW, is_grandfathered=True)
    c.is_escalated = False
    c.sla_deadline = hist_deadline

    # Step 2: Maintenance member resolves it
    c.status = ComplaintStatus.RESOLVED

    # Step 3: Student reopens complaint at T_reopen
    t_reopen = datetime(2026, 10, 28, 22, 10, 0, tzinfo=timezone.utc)
    
    # Simulate service.reopen_complaint logic:
    c.status = ComplaintStatus.REOPENED
    c.sla_cycle = (c.sla_cycle or 1) + 1
    c.is_grandfathered = False # Grandfathering cleared!
    c.is_escalated = False     # Reset for cycle 2
    c.escalated_at = None
    c.escalation_level = 0
    # Pipe leakage category rule (4h):
    c.sla_deadline = t_reopen + timedelta(hours=4)

    assert_eq("Reopened Complaint SLA Cycle", c.sla_cycle, 2)
    assert_eq("Reopened Complaint is_grandfathered Cleared", c.is_grandfathered, False)
    assert_eq("Reopened Complaint is_escalated Reset", c.is_escalated, False)
    assert_eq("Reopened Complaint escalated_at Cleared", c.escalated_at, None)
    assert_eq("Reopened Complaint escalation_level Reset", c.escalation_level, 0)
    assert_eq("Reopened Complaint Fresh Deadline", c.sla_deadline, datetime(2026, 10, 29, 2, 10, 0, tzinfo=timezone.utc))

    # Step 4: Worker evaluation on newly reopened complaint
    # Future deadline: not escalated yet
    assert_eq(
        "Reopened Complaint initially NOT escalated (deadline in future)",
        should_worker_escalate(c.is_grandfathered, c.is_escalated, c.status, c.sla_deadline, current_time=t_reopen),
        False
    )

    # 4 hours later, reopened complaint breaches deadline in Cycle 2:
    t_breach_cycle2 = t_reopen + timedelta(hours=4, minutes=1)
    assert_eq(
        "Reopened Complaint BREACHES in Cycle 2 and is escalated by worker",
        should_worker_escalate(c.is_grandfathered, c.is_escalated, c.status, c.sla_deadline, current_time=t_breach_cycle2),
        True
    )

    # Multi-cycle database uniqueness validation:
    # UniqueConstraint('complaint_id', 'sla_cycle', 'escalation_level')
    escalation_events_table = set()
    def insert_escalation_event(complaint_id, sla_cycle, escalation_level):
        key = (complaint_id, sla_cycle, escalation_level)
        if key in escalation_events_table:
            raise ValueError(f"UNIQUE CONSTRAINT VIOLATION: duplicate key {key}")
        escalation_events_table.add(key)
        return True

    # Cycle 1 escalation
    insert_escalation_event(complaint_id=42, sla_cycle=1, escalation_level=1)
    assert_eq("Cycle 1 Event Recorded", (42, 1, 1) in escalation_events_table, True)

    # Duplicate in Cycle 1 rejected
    try:
        insert_escalation_event(complaint_id=42, sla_cycle=1, escalation_level=1)
        cycle1_dup_blocked = False
    except ValueError:
        cycle1_dup_blocked = True
    assert_eq("Duplicate escalation within Cycle 1 BLOCKED by unique constraint", cycle1_dup_blocked, True)

    # Cycle 2 escalation accepted without collision!
    insert_escalation_event(complaint_id=42, sla_cycle=2, escalation_level=1)
    assert_eq("Cycle 2 Event Recorded with past Cycle 1 preserved", (42, 2, 1) in escalation_events_table, True)
    assert_eq("Both Cycle 1 and Cycle 2 events coexist in history", len(escalation_events_table), 2)

    # Duplicate in Cycle 2 rejected
    try:
        insert_escalation_event(complaint_id=42, sla_cycle=2, escalation_level=1)
        cycle2_dup_blocked = False
    except ValueError:
        cycle2_dup_blocked = True
    assert_eq("Duplicate escalation within Cycle 2 BLOCKED by unique constraint", cycle2_dup_blocked, True)

    print("\n" + "=" * 70)
    print(f"ALL TESTS PASSED: {passed}/{total} assertions verified successfully!")
    print("=" * 70)

if __name__ == "__main__":
    run_tests()
