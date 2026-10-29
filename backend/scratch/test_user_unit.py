import os
import sys
import unittest
from unittest.mock import MagicMock, patch

# Ensure backend root is on sys.path
BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from fastapi import HTTPException
from app.Users import services as user_service
from app.Utils.enums import UserRole


class TestUserModule(unittest.TestCase):
    """Unit tests for User management business rules and admin constraints."""

    def setUp(self):
        self.db = MagicMock()

        self.admin = MagicMock()
        self.admin.id = 1
        self.admin.role = UserRole.ADMIN

        self.student = MagicMock()
        self.student.id = 10
        self.student.role = UserRole.STUDENT

        self.facility_officer = MagicMock()
        self.facility_officer.id = 5
        self.facility_officer.role = UserRole.FACILITY_OFFICER

    @patch("app.Users.services.hash_password", return_value="hashed_secret")
    def test_admin_creates_facility_officer_success(self, mock_hash):
        """Admin can successfully create a new Facility Officer when none exists."""
        user_in = MagicMock()
        user_in.email = "officer@campus.com"
        user_in.full_name = "Chief Officer"
        user_in.department = "Estate"
        user_in.phone = "9876543210"
        user_in.password = "Password@123"
        user_in.role = UserRole.FACILITY_OFFICER

        # No facility officer exists, and email is not registered
        self.db.query.return_value.filter.return_value.first.return_value = None

        new_user = user_service.create_admin_user(user_in, self.db, self.admin)

        self.db.add.assert_called_once()
        self.db.commit.assert_called_once()
        self.assertEqual(new_user.email, "officer@campus.com")
        self.assertEqual(new_user.role, UserRole.FACILITY_OFFICER)
        self.assertTrue(new_user.is_active)

    def test_non_admin_cannot_create_users(self):
        """Non-admin users are rejected from creating users with HTTP 403."""
        user_in = MagicMock()

        with self.assertRaises(HTTPException) as ctx:
            user_service.create_admin_user(user_in, self.db, self.student)

        self.assertEqual(ctx.exception.status_code, 403)
        self.assertIn("Only administrators can create users", ctx.exception.detail)

    def test_only_one_facility_officer_permitted(self):
        """Creating a second Facility Officer raises HTTP 409 Conflict."""
        user_in = MagicMock()
        user_in.email = "second_officer@campus.com"
        user_in.full_name = "Second Officer"
        user_in.department = "Estate"
        user_in.phone = None
        user_in.role = UserRole.FACILITY_OFFICER

        # An active Facility Officer already exists in DB
        self.db.query.return_value.filter.return_value.first.return_value = MagicMock()

        with self.assertRaises(HTTPException) as ctx:
            user_service.create_admin_user(user_in, self.db, self.admin)

        self.assertEqual(ctx.exception.status_code, 409)
        self.assertIn("Only one Facility Officer is allowed", ctx.exception.detail)

    def test_disallowed_role_creation_by_admin(self):
        """Admin can only create Facility Officer or Maintenance Team via this service."""
        user_in = MagicMock()
        user_in.email = "student_direct@campus.com"
        user_in.full_name = "Direct Student"
        user_in.department = "CSE"
        user_in.phone = None
        user_in.role = UserRole.STUDENT

        with self.assertRaises(HTTPException) as ctx:
            user_service.create_admin_user(user_in, self.db, self.admin)

        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("Facility Officer or Maintenance Team", ctx.exception.detail)

    def test_admin_cannot_deactivate_own_account(self):
        """An administrator cannot deactivate their own user account."""
        target_user = MagicMock()
        target_user.id = self.admin.id  # Same as current user

        self.db.query.return_value.filter.return_value.first.return_value = target_user

        with self.assertRaises(HTTPException) as ctx:
            user_service.update_user_status(self.db, self.admin.id, False, self.admin)

        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("Administrator cannot deactivate their own account", ctx.exception.detail)

    def test_student_cannot_view_all_users(self):
        """Students attempting to access full user listing are denied with HTTP 403."""
        with self.assertRaises(HTTPException) as ctx:
            user_service.get_all_users(self.db, self.student)

        self.assertEqual(ctx.exception.status_code, 403)


if __name__ == "__main__":
    unittest.main(verbosity=2)
