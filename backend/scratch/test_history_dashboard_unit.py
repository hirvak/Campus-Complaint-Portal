import os
import sys
import unittest
from unittest.mock import MagicMock, patch

# Ensure backend root is on sys.path
BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from fastapi import HTTPException
from app.ComplaintHistory import service as history_service
from app.Dashboard import service as dashboard_service
from app.Reports import service as report_service
from app.Utils.enums import UserRole


class TestHistoryDashboardReportsModule(unittest.TestCase):
    """Unit tests for History tracking, Dashboard role scoping, and Reports filtering."""

    def setUp(self):
        self.db = MagicMock()

        self.student = MagicMock()
        self.student.id = 10
        self.student.role = UserRole.STUDENT

        self.maintenance = MagicMock()
        self.maintenance.id = 20
        self.maintenance.role = UserRole.MAINTENANCE_TEAM

        self.admin = MagicMock()
        self.admin.id = 1
        self.admin.role = UserRole.ADMIN

    @patch("app.ComplaintHistory.service.repository.get_complaint_history")
    def test_history_student_forbidden_for_other_users_complaint(self, mock_get_history):
        """Students attempting to view history of another user's complaint receive HTTP 403."""
        complaint = MagicMock()
        complaint.id = 5
        complaint.created_by = 999  # Not self.student.id

        self.db.query.return_value.filter.return_value.first.return_value = complaint

        with self.assertRaises(HTTPException) as ctx:
            history_service.get_complaint_history(self.db, 5, self.student)

        self.assertEqual(ctx.exception.status_code, 403)
        self.assertIn("own complaints", ctx.exception.detail)
        mock_get_history.assert_not_called()

    @patch("app.ComplaintHistory.service.repository.get_complaint_history")
    def test_history_maintenance_only_assigned_complaints(self, mock_get_history):
        """Maintenance team can only view history of complaints assigned to them."""
        complaint = MagicMock()
        complaint.id = 6
        complaint.assigned_to = 999  # Not self.maintenance.id

        self.db.query.return_value.filter.return_value.first.return_value = complaint

        with self.assertRaises(HTTPException) as ctx:
            history_service.get_complaint_history(self.db, 6, self.maintenance)

        self.assertEqual(ctx.exception.status_code, 403)
        self.assertIn("assigned to you", ctx.exception.detail)
        mock_get_history.assert_not_called()

    @patch("app.ComplaintHistory.service.repository.get_complaint_history")
    def test_history_admin_can_access_any_complaint(self, mock_get_history):
        """Admin is authorized to view audit history of any complaint."""
        complaint = MagicMock()
        complaint.id = 7
        complaint.created_by = 50
        complaint.assigned_to = 60

        self.db.query.return_value.filter.return_value.first.return_value = complaint
        mock_get_history.return_value = [MagicMock()]

        res = history_service.get_complaint_history(self.db, 7, self.admin)

        mock_get_history.assert_called_once_with(db=self.db, complaint_id=7)
        self.assertEqual(len(res), 1)

    def test_dashboard_unauthorized_role_rejected(self):
        """Users with invalid or unmapped roles are rejected from dashboard with HTTP 403."""
        guest_user = MagicMock()
        guest_user.role = "Guest"

        with self.assertRaises(HTTPException) as ctx:
            dashboard_service.get_dashboard(self.db, guest_user)

        self.assertEqual(ctx.exception.status_code, 403)

    def test_report_scope_student_filters_by_created_by(self):
        """Report scope for student restricts query to created_by = student.id."""
        scope = report_service.get_report_scope(self.student)
        self.assertEqual(scope["created_by"], self.student.id)
        self.assertIsNone(scope["assigned_to"])

    def test_report_scope_maintenance_filters_by_assigned_to(self):
        """Report scope for maintenance restricts query to assigned_to = maintenance.id."""
        scope = report_service.get_report_scope(self.maintenance)
        self.assertIsNone(scope["created_by"])
        self.assertEqual(scope["assigned_to"], self.maintenance.id)

    def test_report_scope_admin_unrestricted(self):
        """Report scope for admin has no user restrictions (campus-wide)."""
        scope = report_service.get_report_scope(self.admin)
        self.assertIsNone(scope["created_by"])
        self.assertIsNone(scope["assigned_to"])


if __name__ == "__main__":
    unittest.main(verbosity=2)
