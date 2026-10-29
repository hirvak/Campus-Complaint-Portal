import os
import sys
import unittest
from unittest.mock import MagicMock, patch, AsyncMock
from datetime import datetime, timezone

# Ensure backend root is on sys.path
BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from fastapi import HTTPException
from app.Complaints import service
from app.Utils.enums import (
    UserRole,
    ComplaintStatus,
    ComplaintPriority,
    ComplaintHistoryAction,
    NotificationType
)


class TestComplaintModule(unittest.TestCase):
    """Unit tests for Complaint lifecycle, role access, status transitions, and SLAs."""

    def setUp(self):
        self.db = MagicMock()

        self.student = MagicMock()
        self.student.id = 10
        self.student.role = UserRole.STUDENT

        self.faculty = MagicMock()
        self.faculty.id = 11
        self.faculty.role = UserRole.FACULTY

        self.admin = MagicMock()
        self.admin.id = 1
        self.admin.role = UserRole.ADMIN

        self.facility_officer = MagicMock()
        self.facility_officer.id = 2
        self.facility_officer.role = UserRole.FACILITY_OFFICER

        self.maintenance = MagicMock()
        self.maintenance.id = 20
        self.maintenance.role = UserRole.MAINTENANCE_TEAM
        self.maintenance.full_name = "Ramesh Kumar"

    @patch("app.Complaints.service.get_facility_officer")
    @patch("app.Complaints.service.create_notification")
    @patch("app.Complaints.service.history_repository.create_history")
    @patch("app.Complaints.service.repository.create_complaint")
    @patch("app.Complaints.service.calculate_deadline")
    def test_valid_complaint_creation(
        self, mock_deadline, mock_create, mock_history,
        mock_notification, mock_officer
    ):
        """A student can create a complaint with a valid category and SLA deadline."""
        category = MagicMock()
        category.id = 4
        category.is_active = True
        category.department_id = 3

        self.db.query.return_value.filter.return_value.first.return_value = category

        deadline = datetime(2026, 10, 30, tzinfo=timezone.utc)
        mock_deadline.return_value = deadline

        complaint_data = MagicMock()
        complaint_data.title = "  Broken pipe  "
        complaint_data.description = "  Water is leaking  "
        complaint_data.category_id = 4
        complaint_data.location = "  C101  "
        complaint_data.image_url = None

        def save_complaint(db, complaint):
            complaint.id = 48
            return complaint

        mock_create.side_effect = save_complaint
        mock_officer.return_value = self.facility_officer

        result = service.create_complaint(self.db, complaint_data, self.student)

        self.assertEqual(result.id, 48)
        self.assertEqual(result.title, "Broken pipe")
        self.assertEqual(result.description, "Water is leaking")
        self.assertEqual(result.location, "C101")
        self.assertEqual(result.status, ComplaintStatus.NEW)
        self.assertEqual(result.priority.value, "Medium")
        self.assertEqual(result.department_id, 3)
        self.assertEqual(result.sla_deadline, deadline)

        mock_deadline.assert_called_once()
        mock_create.assert_called_once()
        mock_history.assert_called_once()
        mock_notification.assert_called_once()

    def test_admin_cannot_create_complaint(self):
        """Only students and faculty can create complaints; admin gets HTTP 403."""
        complaint_data = MagicMock()

        with self.assertRaises(HTTPException) as error:
            service.create_complaint(self.db, complaint_data, self.admin)

        self.assertEqual(error.exception.status_code, 403)
        self.assertEqual(
            error.exception.detail,
            "Only students and faculty can create complaints."
        )

    def test_inactive_or_missing_category_is_rejected(self):
        """A missing or inactive category must return HTTP 404."""
        self.db.query.return_value.filter.return_value.first.return_value = None

        complaint_data = MagicMock()
        complaint_data.category_id = 999

        with patch("app.Complaints.service.calculate_deadline") as mock_deadline:
            with self.assertRaises(HTTPException) as error:
                service.create_complaint(self.db, complaint_data, self.student)

        self.assertEqual(error.exception.status_code, 404)
        self.assertEqual(error.exception.detail, "Category not found or inactive.")
        mock_deadline.assert_not_called()

    def test_student_can_access_own_complaints(self):
        """Students can retrieve their own complaints."""
        complaint = MagicMock()
        complaint.created_by = self.student.id

        with patch("app.Complaints.service.repository.get_complaint_by_id", return_value=complaint):
            result = service.get_complaint(self.db, 48, self.student)

        self.assertIs(result, complaint)

    def test_student_cannot_access_another_users_complaint(self):
        """A student cannot view another student's complaint."""
        complaint = MagicMock()
        complaint.created_by = 999

        with patch("app.Complaints.service.repository.get_complaint_by_id", return_value=complaint):
            with self.assertRaises(HTTPException) as error:
                service.get_complaint(self.db, 48, self.student)

        self.assertEqual(error.exception.status_code, 403)

    def test_invalid_status_transition_is_rejected(self):
        """A complaint cannot jump directly from ASSIGNED to RESOLVED."""
        complaint = MagicMock()
        complaint.id = 48
        complaint.assigned_to = self.maintenance.id
        complaint.status = ComplaintStatus.ASSIGNED

        status_data = MagicMock()
        status_data.status = ComplaintStatus.RESOLVED

        with patch("app.Complaints.service.repository.get_complaint_by_id", return_value=complaint):
            with self.assertRaises(HTTPException) as error:
                service.update_complaint_status(self.db, 48, status_data, self.maintenance)

        self.assertEqual(error.exception.status_code, 400)
        self.assertEqual(error.exception.detail, "Invalid status transition.")

    @patch("app.Complaints.service.create_notification")
    @patch("app.Complaints.service.history_repository.create_history")
    @patch("app.Complaints.service.repository.update_complaint")
    @patch("app.Complaints.service.repository.get_complaint_by_id")
    def test_facility_officer_can_assign_complaint(
        self, mock_get_complaint, mock_update, mock_history, mock_notification
    ):
        """Facility Officer can assign a NEW complaint to an active maintenance member."""
        complaint = MagicMock()
        complaint.id = 50
        complaint.status = ComplaintStatus.NEW
        complaint.priority = ComplaintPriority.MEDIUM
        complaint.category_id = 4
        mock_get_complaint.return_value = complaint
        mock_update.return_value = complaint

        # Find maintenance member
        self.db.query.return_value.filter.return_value.first.return_value = self.maintenance

        assign_data = MagicMock()
        assign_data.assigned_to = self.maintenance.id
        assign_data.priority = ComplaintPriority.HIGH

        with patch("app.Complaints.service.calculate_deadline", return_value=datetime.now(timezone.utc)):
            result = service.assign_complaint(self.db, 50, assign_data, self.facility_officer)

        self.assertEqual(result.assigned_to, self.maintenance.id)
        self.assertEqual(result.status, ComplaintStatus.ASSIGNED)
        self.assertEqual(result.priority, ComplaintPriority.HIGH)
        mock_history.assert_called_once()
        mock_notification.assert_called_once()

    @patch("app.Complaints.service.get_facility_officer")
    @patch("app.Complaints.service.create_notification")
    @patch("app.Complaints.service.history_repository.create_history")
    @patch("app.Complaints.service.repository.update_complaint")
    @patch("app.Complaints.service.repository.get_complaint_by_id")
    @patch("app.Complaints.service.calculate_deadline")
    def test_reopen_complaint_increments_cycle_and_resets_escalation(
        self, mock_deadline, mock_get_complaint, mock_update, mock_history,
        mock_notification, mock_officer
    ):
        """Reopening a RESOLVED complaint increments sla_cycle and clears escalation."""
        complaint = MagicMock()
        complaint.id = 50
        complaint.created_by = self.student.id
        complaint.status = ComplaintStatus.RESOLVED
        complaint.sla_cycle = 1
        complaint.is_escalated = True
        complaint.is_grandfathered = True
        complaint.category_id = 4
        complaint.priority = ComplaintPriority.MEDIUM

        mock_get_complaint.return_value = complaint
        mock_update.return_value = complaint
        new_deadline = datetime(2026, 11, 1, tzinfo=timezone.utc)
        mock_deadline.return_value = new_deadline
        mock_officer.return_value = self.facility_officer

        result = service.reopen_complaint(self.db, 50, self.student)

        self.assertEqual(result.status, ComplaintStatus.REOPENED)
        self.assertEqual(result.sla_cycle, 2)
        self.assertFalse(result.is_grandfathered)
        self.assertFalse(result.is_escalated)
        self.assertEqual(result.escalation_level, 0)
        self.assertEqual(result.sla_deadline, new_deadline)
        mock_history.assert_called_once()

    @patch("app.Complaints.service.create_notification")
    @patch("app.Complaints.service.history_repository.create_history")
    @patch("app.Complaints.service.repository.update_complaint")
    @patch("app.Complaints.service.repository.get_complaint_by_id")
    def test_maintenance_can_resolve_in_progress_complaint(
        self, mock_get_complaint, mock_update, mock_history, mock_notification
    ):
        """Assigned maintenance member can resolve an IN_PROGRESS complaint."""
        complaint = MagicMock()
        complaint.id = 55
        complaint.created_by = self.student.id
        complaint.assigned_to = self.maintenance.id
        complaint.status = ComplaintStatus.IN_PROGRESS

        mock_get_complaint.return_value = complaint
        mock_update.return_value = complaint

        resolve_data = MagicMock()
        resolve_data.resolution_remarks = "Fixed pipe joint with new rubber gasket."
        resolve_data.completion_image = "/uploads/complaints/resolved_pipe.jpg"

        result = service.resolve_complaint(self.db, 55, resolve_data, self.maintenance)

        self.assertEqual(result.status, ComplaintStatus.RESOLVED)
        self.assertEqual(result.resolution_remarks, "Fixed pipe joint with new rubber gasket.")
        mock_history.assert_called_once()
        mock_notification.assert_called_once()

    @patch("app.Complaints.service.history_repository.create_history")
    @patch("app.Complaints.service.repository.update_complaint")
    @patch("app.Complaints.service.repository.get_complaint_by_id")
    def test_student_can_close_resolved_complaint(
        self, mock_get_complaint, mock_update, mock_history
    ):
        """Student can successfully close their own RESOLVED complaint."""
        complaint = MagicMock()
        complaint.id = 60
        complaint.created_by = self.student.id
        complaint.status = ComplaintStatus.RESOLVED

        mock_get_complaint.return_value = complaint
        mock_update.return_value = complaint

        result = service.close_complaint(self.db, 60, self.student)

        self.assertEqual(result.status, ComplaintStatus.CLOSED)
        mock_history.assert_called_once()

    @patch("app.Complaints.service.repository.get_complaint_by_id")
    def test_close_unresolved_complaint_rejected(self, mock_get_complaint):
        """Attempting to close a complaint that is not RESOLVED raises HTTP 400."""
        complaint = MagicMock()
        complaint.id = 61
        complaint.created_by = self.student.id
        complaint.status = ComplaintStatus.IN_PROGRESS  # Not resolved

        mock_get_complaint.return_value = complaint

        with self.assertRaises(HTTPException) as error:
            service.close_complaint(self.db, 61, self.student)

        self.assertEqual(error.exception.status_code, 400)
        self.assertIn("Only resolved complaints can be closed", error.exception.detail)


if __name__ == "__main__":
    unittest.main(verbosity=2)
