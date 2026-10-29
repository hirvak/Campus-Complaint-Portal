import os
import sys
import unittest
from datetime import datetime, timezone, timedelta

# Configure environment variables before importing app modules
os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["SECRET_KEY"] = "test_integration_secret_key_1234567890"
os.environ["ALGORITHM"] = "HS256"
os.environ["ACCESS_TOKEN_EXPIRE_MINUTES"] = "30"

# Ensure backend root is on sys.path
BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.Database.base import Base

# Import all models to ensure complete schema creation
import app.Users.models
import app.Departments.models
import app.Categories.models
import app.Complaints.models
import app.ComplaintHistory.models
import app.Notifications.models
import app.SLA.models

from app.Users.models import User
from app.Departments.models import Department
from app.Categories.models import Category
from app.Complaints.models import Complaint
from app.ComplaintHistory.models import ComplaintHistory
from app.Notifications.models import Notification
from app.SLA.models import SLAConfig, EscalationEvent

from app.Security.password import hash_password
from app.Security.jwt_handler import verify_access_token

from app.Auth import routes as auth_routes
from app.Users.schemas import UserRegister, UserLogin
from app.Complaints import routes as complaint_routes
from app.Complaints import service as complaint_service
from app.Complaints.schemas import (
    ComplaintCreate,
    ComplaintAssign,
    ComplaintStatusUpdate,
    ComplaintResolve,
)
from app.Notifications import routes as notif_routes
from app.SLA import service as sla_service
from app.SLA.schemas import SLAConfigCreate, SLAConfigUpdate
from app.Utils.enums import (
    UserRole,
    StudentType,
    ComplaintStatus,
    ComplaintPriority,
    NotificationType,
    ComplaintHistoryAction,
)


class TestCampusCareIntegrationWorkflows(unittest.TestCase):
    """
    Integration test suite verifying multi-module interactions across Routes,
    Services, Repositories, and an isolated SQLite Test Database.
    
    Guarantees:
      - 100% database isolation using an in-memory SQLite engine with StaticPool.
      - Zero connections, writes, or deletions against the live PostgreSQL database.
      - Real database queries, transactions, foreign keys, and status updates.
    """

    def setUp(self):
        # Create an isolated in-memory database per test case
        self.engine = create_engine(
            "sqlite:///:memory:",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool
        )
        Base.metadata.create_all(bind=self.engine)
        self.SessionLocal = sessionmaker(bind=self.engine)
        self.db = self.SessionLocal()

        # Seed essential role accounts
        self.admin = User(
            full_name="Admin User",
            email="admin@campus.com",
            password_hash=hash_password("Admin@123"),
            role=UserRole.ADMIN,
            department="Administration",
            is_active=True
        )
        self.facility_officer = User(
            full_name="Facility Officer",
            email="facility@campus.com",
            password_hash=hash_password("Facility@123"),
            role=UserRole.FACILITY_OFFICER,
            department="Estate Office",
            is_active=True
        )
        self.maintenance = User(
            full_name="Ramesh Maintenance",
            email="ramesh@campus.com",
            password_hash=hash_password("Maintenance@123"),
            role=UserRole.MAINTENANCE_TEAM,
            department="Plumbing Dept",
            is_active=True
        )
        self.student = User(
            full_name="Jane Student",
            email="student@campus.com",
            password_hash=hash_password("Student@123"),
            role=UserRole.STUDENT,
            department="Computer Science",
            student_type=StudentType.HOSTEL,
            is_active=True
        )

        self.db.add_all([self.admin, self.facility_officer, self.maintenance, self.student])
        self.db.commit()

        # Seed department and categories
        self.dept = Department(
            name="Estate & Facilities",
            description="Infrastructure and campus upkeep",
            is_active=True
        )
        self.db.add(self.dept)
        self.db.commit()

        self.cat_pipe = Category(
            name="Pipe Leakage",
            description="Water pipe bursts and leakages",
            department_id=self.dept.id,
            is_active=True
        )
        self.cat_general = Category(
            name="General Maintenance",
            description="General campus maintenance",
            department_id=self.dept.id,
            is_active=True
        )
        self.db.add_all([self.cat_pipe, self.cat_general])
        self.db.commit()

        # Seed default SLA configurations
        self.sla_pipe = SLAConfig(
            category_id=self.cat_pipe.id,
            priority=None,
            target_hours=4,
            warning_hours=1,
            is_active=True
        )
        self.sla_medium = SLAConfig(
            category_id=None,
            priority=ComplaintPriority.MEDIUM,
            target_hours=24,
            warning_hours=4,
            is_active=True
        )
        self.sla_high = SLAConfig(
            category_id=None,
            priority=ComplaintPriority.HIGH,
            target_hours=12,
            warning_hours=2,
            is_active=True
        )
        self.db.add_all([self.sla_pipe, self.sla_medium, self.sla_high])
        self.db.commit()

    def tearDown(self):
        self.db.close()
        self.engine.dispose()

    # =========================================================
    # WORKFLOW 1: AUTHENTICATION & TOKEN ISSUANCE
    # =========================================================
    def test_auth_registration_and_login_workflow(self):
        """Workflow: Public user registration -> password hashing -> login -> JWT claim verification."""
        reg_payload = UserRegister(
            full_name="Aayushi Sharma",
            email="aayushi.sharma@campus.com",
            password="StrongPassword@123",
            role=UserRole.STUDENT,
            department="Information Technology",
            student_type=StudentType.HOSTEL
        )

        # 1. Register through auth route
        created_user = auth_routes.register(user=reg_payload, db=self.db)
        self.assertIsNotNone(created_user.id)
        self.assertEqual(created_user.email, "aayushi.sharma@campus.com")

        # Verify persisted user in test database
        persisted = self.db.query(User).filter(User.email == "aayushi.sharma@campus.com").first()
        self.assertIsNotNone(persisted)
        self.assertNotEqual(persisted.password_hash, "StrongPassword@123")

        # 2. Login with newly created credentials
        login_payload = UserLogin(
            email="aayushi.sharma@campus.com",
            password="StrongPassword@123"
        )
        token_resp = auth_routes.login(user=login_payload, db=self.db)
        self.assertEqual(token_resp["token_type"], "bearer")
        self.assertIn("access_token", token_resp)

        # 3. Verify decoded JWT payload
        claims = verify_access_token(token_resp["access_token"])
        self.assertIsNotNone(claims)
        self.assertEqual(claims["sub"], "aayushi.sharma@campus.com")
        self.assertEqual(claims["role"], UserRole.STUDENT.value)

    # =========================================================
    # WORKFLOW 2: COMPLAINT CREATION & AUTOMATIC NOTIFICATION
    # =========================================================
    def test_complaint_creation_and_automatic_notification_workflow(self):
        """Workflow: Student creates complaint -> SLA calculated -> History created -> Officer notified."""
        complaint_in = ComplaintCreate(
            title="Broken tap in washroom",
            description="Water overflowing continuously from loose pipe fitting",
            category_id=self.cat_pipe.id,
            location="Hostel Block B, Floor 2"
        )

        complaint = complaint_service.create_complaint(
            db=self.db,
            complaint_data=complaint_in,
            current_user=self.student
        )

        # 1. Verify complaint record in isolated database
        self.assertIsNotNone(complaint.id)
        self.assertEqual(complaint.status, ComplaintStatus.NEW)
        self.assertEqual(complaint.priority, ComplaintPriority.MEDIUM)
        self.assertEqual(complaint.sla_cycle, 1)
        self.assertFalse(complaint.is_escalated)

        # 2. Verify SLA deadline calculation based on Pipe Leakage (4h target)
        self.assertIsNotNone(complaint.sla_deadline)
        duration_hours = (complaint.sla_deadline - complaint.created_at).total_seconds() / 3600.0
        self.assertAlmostEqual(duration_hours, 4.0, delta=0.1)

        # 3. Verify ComplaintHistory audit log
        history_entry = self.db.query(ComplaintHistory).filter(
            ComplaintHistory.complaint_id == complaint.id
        ).first()
        self.assertIsNotNone(history_entry)
        self.assertEqual(history_entry.action, ComplaintHistoryAction.CREATED)
        self.assertEqual(history_entry.performed_by, self.student.id)

        # 4. Verify in-app Notification dispatched to Facility Officer
        notif = self.db.query(Notification).filter(
            Notification.complaint_id == complaint.id,
            Notification.recipient_id == self.facility_officer.id
        ).first()
        self.assertIsNotNone(notif)
        self.assertEqual(notif.notification_type, NotificationType.COMPLAINT_CREATED)
        self.assertFalse(notif.is_read)

    # =========================================================
    # WORKFLOW 3: COMPLAINT ASSIGNMENT & SLA RECALCULATION
    # =========================================================
    def test_complaint_assignment_and_sla_recalculation_workflow(self):
        """Workflow: Facility Officer assigns complaint to Maintenance -> Priority updated -> SLA recalculated -> Notification dispatched."""
        complaint_in = ComplaintCreate(
            title="Leaking flush valve",
            description="Continuous leakage in hostel rest room",
            category_id=self.cat_general.id,  # General maintenance category
            location="Room 101"
        )
        c = complaint_service.create_complaint(self.db, complaint_in, self.student)
        initial_deadline = c.sla_deadline

        # Facility Officer assigns complaint and upgrades priority to HIGH
        assign_data = ComplaintAssign(
            assigned_to=self.maintenance.id,
            priority=ComplaintPriority.HIGH
        )
        assigned = complaint_routes.assign_complaint(
            complaint_id=c.id,
            assignment=assign_data,
            db=self.db,
            current_user=self.facility_officer
        )

        # 1. Verify updated complaint state
        self.assertEqual(assigned.status, ComplaintStatus.ASSIGNED)
        self.assertEqual(assigned.assigned_to, self.maintenance.id)
        self.assertEqual(assigned.priority, ComplaintPriority.HIGH)

        # 2. Verify SLA deadline was recalculated for HIGH priority (12h vs original 24h)
        self.assertNotEqual(assigned.sla_deadline, initial_deadline)
        duration_hours = (assigned.sla_deadline - assigned.created_at).total_seconds() / 3600.0
        self.assertAlmostEqual(duration_hours, 12.0, delta=0.1)

        # 3. Verify notification to assigned maintenance team member
        notif = self.db.query(Notification).filter(
            Notification.complaint_id == c.id,
            Notification.recipient_id == self.maintenance.id
        ).first()
        self.assertIsNotNone(notif)
        self.assertEqual(notif.notification_type, NotificationType.COMPLAINT_ASSIGNED)

    # =========================================================
    # WORKFLOW 4: MAINTENANCE WORK PROGRESSION
    # =========================================================
    def test_maintenance_work_progression_workflow(self):
        """Workflow: Maintenance member transitions complaint status from ASSIGNED to IN_PROGRESS."""
        complaint = Complaint(
            title="Electrical board sparking",
            description="Power socket sparking",
            category_id=self.cat_general.id,
            department_id=self.dept.id,
            location="Room 202",
            created_by=self.student.id,
            assigned_to=self.maintenance.id,
            status=ComplaintStatus.ASSIGNED,
            priority=ComplaintPriority.HIGH
        )
        self.db.add(complaint)
        self.db.commit()

        status_payload = ComplaintStatusUpdate(status=ComplaintStatus.IN_PROGRESS)
        updated = complaint_routes.update_complaint_status(
            complaint_id=complaint.id,
            status_data=status_payload,
            db=self.db,
            current_user=self.maintenance
        )

        # 1. Verify status updated in database
        self.assertEqual(updated.status, ComplaintStatus.IN_PROGRESS)

        # 2. Verify history entry
        hist = self.db.query(ComplaintHistory).filter(
            ComplaintHistory.complaint_id == complaint.id,
            ComplaintHistory.action == ComplaintHistoryAction.IN_PROGRESS
        ).first()
        self.assertIsNotNone(hist)
        self.assertEqual(hist.performed_by, self.maintenance.id)

    # =========================================================
    # WORKFLOW 5: COMPLAINT RESOLUTION
    # =========================================================
    def test_complaint_resolution_workflow(self):
        """Workflow: Maintenance member resolves complaint with remarks -> Student notified."""
        complaint = Complaint(
            title="Faulty door lock",
            description="Lock mechanism jammed",
            category_id=self.cat_general.id,
            department_id=self.dept.id,
            location="Lab 3",
            created_by=self.student.id,
            assigned_to=self.maintenance.id,
            status=ComplaintStatus.IN_PROGRESS,
            priority=ComplaintPriority.MEDIUM
        )
        self.db.add(complaint)
        self.db.commit()

        resolve_payload = ComplaintResolve(
            resolution_remarks="Replaced lock cylinder with a new brass unit.",
            completion_image="/uploads/complaints/door_fixed.jpg"
        )
        resolved = complaint_routes.resolve_complaint(
            complaint_id=complaint.id,
            resolution=resolve_payload,
            db=self.db,
            current_user=self.maintenance
        )

        # 1. Verify resolution in database
        self.assertEqual(resolved.status, ComplaintStatus.RESOLVED)
        self.assertEqual(resolved.resolution_remarks, "Replaced lock cylinder with a new brass unit.")
        self.assertEqual(resolved.completion_image, "/uploads/complaints/door_fixed.jpg")

        # 2. Verify student receives resolution notification
        notif = self.db.query(Notification).filter(
            Notification.complaint_id == complaint.id,
            Notification.recipient_id == self.student.id,
            Notification.notification_type == NotificationType.COMPLAINT_RESOLVED
        ).first()
        self.assertIsNotNone(notif)
        self.assertIn("resolved", notif.message.lower())

    # =========================================================
    # WORKFLOW 6: STUDENT REOPENING & MULTI-CYCLE SLA RESET
    # =========================================================
    def test_student_reopen_and_multi_cycle_sla_workflow(self):
        """Workflow: Student reopens resolved complaint -> SLA cycle incremented -> Fresh deadline set -> Officer notified."""
        complaint = Complaint(
            title="Leaking pipe in cafeteria",
            description="Water still dripping after initial repair",
            category_id=self.cat_pipe.id,
            department_id=self.dept.id,
            location="Cafeteria",
            created_by=self.student.id,
            assigned_to=self.maintenance.id,
            status=ComplaintStatus.RESOLVED,
            priority=ComplaintPriority.MEDIUM,
            sla_cycle=1,
            is_escalated=True,
            is_grandfathered=True,
            escalation_level=1
        )
        self.db.add(complaint)
        self.db.commit()

        reopened = complaint_routes.reopen_complaint(
            complaint_id=complaint.id,
            db=self.db,
            current_user=self.student
        )

        # 1. Verify lifecycle and cycle increment
        self.assertEqual(reopened.status, ComplaintStatus.REOPENED)
        self.assertEqual(reopened.sla_cycle, 2)
        self.assertFalse(reopened.is_grandfathered)
        self.assertFalse(reopened.is_escalated)
        self.assertEqual(reopened.escalation_level, 0)

        # 2. Verify new SLA deadline was set starting from reopen moment (Pipe Leakage 4h)
        self.assertIsNotNone(reopened.sla_deadline)
        deadline = reopened.sla_deadline
        if deadline.tzinfo is None:
            deadline = deadline.replace(tzinfo=timezone.utc)
        now = datetime.now(timezone.utc)
        diff_from_now = (deadline - now).total_seconds() / 3600.0
        self.assertAlmostEqual(diff_from_now, 4.0, delta=0.2)

        # 3. Verify notification to Facility Officer
        notif = self.db.query(Notification).filter(
            Notification.complaint_id == complaint.id,
            Notification.recipient_id == self.facility_officer.id,
            Notification.notification_type == NotificationType.COMPLAINT_REOPENED
        ).first()
        self.assertIsNotNone(notif)

    # =========================================================
    # WORKFLOW 7: SLA ESCALATION ENGINE EXECUTION
    # =========================================================
    def test_sla_escalation_engine_execution_workflow(self):
        """Workflow: Overdue complaint detected -> EscalationEvent logged -> Complaint escalated -> Officer alerted."""
        past_deadline = datetime.now(timezone.utc) - timedelta(hours=3)
        overdue_complaint = Complaint(
            title="Severe main pipe burst",
            description="Flooding hallway in main building",
            category_id=self.cat_pipe.id,
            department_id=self.dept.id,
            location="Main Hallway",
            created_by=self.student.id,
            status=ComplaintStatus.ASSIGNED,
            priority=ComplaintPriority.HIGH,
            sla_deadline=past_deadline,
            is_grandfathered=False,
            is_escalated=False,
            sla_cycle=1
        )
        self.db.add(overdue_complaint)
        self.db.commit()

        # Run escalation scanner
        result = sla_service.check_and_escalate_overdue_complaints(
            db=self.db,
            triggered_by_user=self.admin
        )

        self.assertEqual(result.status, "success")
        self.assertEqual(result.overdue_detected, 1)
        self.assertEqual(result.escalated_count, 1)
        self.assertIn(overdue_complaint.id, result.escalated_complaints)

        # 1. Verify complaint escalation flags in DB
        self.db.refresh(overdue_complaint)
        self.assertTrue(overdue_complaint.is_escalated)
        self.assertEqual(overdue_complaint.escalation_level, 1)
        self.assertIsNotNone(overdue_complaint.escalated_at)

        # 2. Verify EscalationEvent audit table row
        event = self.db.query(EscalationEvent).filter(
            EscalationEvent.complaint_id == overdue_complaint.id,
            EscalationEvent.sla_cycle == 1,
            EscalationEvent.escalation_level == 1
        ).first()
        self.assertIsNotNone(event)
        self.assertEqual(event.escalated_to, self.facility_officer.id)

        # 3. Verify in-app escalation notification
        notif = self.db.query(Notification).filter(
            Notification.complaint_id == overdue_complaint.id,
            Notification.recipient_id == self.facility_officer.id,
            Notification.notification_type == NotificationType.COMPLAINT_ESCALATED
        ).first()
        self.assertIsNotNone(notif)

    # =========================================================
    # WORKFLOW 8: NOTIFICATION CONSUMPTION & READ STATUS
    # =========================================================
    def test_notification_consumption_and_read_status_workflow(self):
        """Workflow: User receives notifications -> fetches list -> marks as read -> DB updated."""
        notif = Notification(
            recipient_id=self.facility_officer.id,
            complaint_id=1,
            title="Urgent Complaint",
            message="Please review high priority complaint",
            notification_type=NotificationType.COMPLAINT_CREATED,
            is_read=False
        )
        self.db.add(notif)
        self.db.commit()

        # 1. Retrieve notifications via route
        notifs = notif_routes.get_my_notifications(db=self.db, current_user=self.facility_officer)
        self.assertEqual(len(notifs), 1)
        self.assertFalse(notifs[0].is_read)

        # 2. Mark notification as read
        updated_notif = notif_routes.mark_notification_as_read(
            notification_id=notif.id,
            db=self.db,
            current_user=self.facility_officer
        )
        self.assertTrue(updated_notif.is_read)

        # Verify persisted read status
        self.db.refresh(notif)
        self.assertTrue(notif.is_read)

    # =========================================================
    # WORKFLOW 9: STUDENT COMPLAINT CLOSURE
    # =========================================================
    def test_student_complaint_closure_workflow(self):
        """Workflow: Student closes a RESOLVED complaint -> Status transitions to CLOSED."""
        complaint = Complaint(
            title="Broken chair in study room",
            description="Replaced with new ergonomic chair",
            category_id=self.cat_general.id,
            department_id=self.dept.id,
            location="Library 2F",
            created_by=self.student.id,
            status=ComplaintStatus.RESOLVED,
            priority=ComplaintPriority.LOW
        )
        self.db.add(complaint)
        self.db.commit()

        closed = complaint_routes.close_complaint(
            complaint_id=complaint.id,
            db=self.db,
            current_user=self.student
        )

        self.assertEqual(closed.status, ComplaintStatus.CLOSED)

        # Verify database history
        hist = self.db.query(ComplaintHistory).filter(
            ComplaintHistory.complaint_id == complaint.id,
            ComplaintHistory.action == ComplaintHistoryAction.CLOSED
        ).first()
        self.assertIsNotNone(hist)
        self.assertEqual(hist.performed_by, self.student.id)

    # =========================================================
    # WORKFLOW 10: SLA CONFIG CRUD & CATEGORY OVERRIDE PRECEDENCE
    # =========================================================
    def test_sla_config_crud_and_precedence_workflow(self):
        """Workflow: Admin creates category SLA rule -> Precedence engine confirms category overrides priority."""
        new_cat = Category(
            name="HVAC & AC",
            description="Air conditioning issues",
            department_id=self.dept.id,
            is_active=True
        )
        self.db.add(new_cat)
        self.db.commit()

        # 1. Create Category SLA rule (8h target, 2h warning)
        config_in = SLAConfigCreate(
            category_id=new_cat.id,
            target_hours=8,
            warning_hours=2,
            is_active=True
        )
        created_rule = sla_service.create_sla_config(db=self.db, config_data=config_in)
        self.assertEqual(created_rule.target_hours, 8)
        self.assertEqual(created_rule.warning_hours, 2)

        # 2. Verify Category override precedence over priority
        # Priority is CRITICAL (default target is 4h), but Category override has 8h target
        target, warning = sla_service.get_applicable_sla(
            db=self.db,
            category_id=new_cat.id,
            priority=ComplaintPriority.CRITICAL
        )
        self.assertEqual(target, 8)
        self.assertEqual(warning, 2)

        # 3. Update SLA configuration
        update_in = SLAConfigUpdate(target_hours=6, warning_hours=1)
        updated_rule = sla_service.update_sla_config(
            db=self.db,
            config_id=created_rule.id,
            update_data=update_in
        )
        self.assertEqual(updated_rule.target_hours, 6)
        self.assertEqual(updated_rule.warning_hours, 1)


if __name__ == "__main__":
    unittest.main(verbosity=2)
