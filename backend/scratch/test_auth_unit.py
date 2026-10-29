import os
import sys
import unittest
from unittest.mock import MagicMock, patch

# Ensure backend root is on sys.path
BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from fastapi import HTTPException
from app.Auth import service as auth_service
from app.Auth.permissions import require_admin, require_student
from app.Security.password import hash_password, verify_password
from app.Security.jwt_handler import create_access_token, verify_access_token
from app.Utils.enums import UserRole, StudentType


class TestAuthModule(unittest.TestCase):
    """Unit tests for Authentication, Authorization, and Security utilities."""

    def setUp(self):
        self.db = MagicMock()

    def test_student_registration_success(self):
        """A valid student registration adds user to database with hashed password."""
        user_data = MagicMock()
        user_data.email = "student@campus.com"
        user_data.full_name = "Jane Student"
        user_data.department = "Computer Science"
        user_data.phone = "9876543210"
        user_data.password = "StrongPassword@123"
        user_data.role = UserRole.STUDENT
        user_data.student_type = StudentType.HOSTEL

        # No duplicate user exists
        self.db.query.return_value.filter.return_value.first.return_value = None

        new_user = auth_service.register_user(user_data, self.db)

        self.db.add.assert_called_once()
        self.db.commit.assert_called_once()
        self.assertEqual(new_user.email, "student@campus.com")
        self.assertEqual(new_user.role, UserRole.STUDENT)
        self.assertEqual(new_user.student_type, StudentType.HOSTEL)

    def test_registration_fails_on_duplicate_email(self):
        """Registering with an already existing email raises HTTP 409 Conflict."""
        user_data = MagicMock()
        user_data.email = "duplicate@campus.com"
        user_data.full_name = "Duplicate User"
        user_data.department = "IT"
        user_data.phone = None
        user_data.role = UserRole.STUDENT
        user_data.student_type = StudentType.HOSTEL

        # Existing user found in DB
        self.db.query.return_value.filter.return_value.first.return_value = MagicMock()

        with self.assertRaises(HTTPException) as ctx:
            auth_service.register_user(user_data, self.db)

        self.assertEqual(ctx.exception.status_code, 409)
        self.assertIn("Email already registered", ctx.exception.detail)

    def test_registration_fails_for_disallowed_role(self):
        """Public registration fails with HTTP 403 for administrative roles."""
        user_data = MagicMock()
        user_data.email = "admin_attempt@campus.com"
        user_data.full_name = "Fake Admin"
        user_data.department = "Administration"
        user_data.phone = None
        user_data.role = UserRole.ADMIN

        self.db.query.return_value.filter.return_value.first.return_value = None

        with self.assertRaises(HTTPException) as ctx:
            auth_service.register_user(user_data, self.db)

        self.assertEqual(ctx.exception.status_code, 403)
        self.assertIn("Only Student and Faculty can register", ctx.exception.detail)

    def test_student_registration_requires_student_type(self):
        """Student registration without a student_type raises HTTP 400."""
        user_data = MagicMock()
        user_data.email = "student@campus.com"
        user_data.full_name = "Student No Type"
        user_data.department = "Civil"
        user_data.phone = None
        user_data.role = UserRole.STUDENT
        user_data.student_type = None

        self.db.query.return_value.filter.return_value.first.return_value = None

        with self.assertRaises(HTTPException) as ctx:
            auth_service.register_user(user_data, self.db)

        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("Student type is required for students", ctx.exception.detail)

    def test_faculty_registration_rejects_student_type(self):
        """Faculty registration with a student_type raises HTTP 400."""
        user_data = MagicMock()
        user_data.email = "faculty@campus.com"
        user_data.full_name = "Dr. Professor"
        user_data.department = "Mechanical"
        user_data.phone = None
        user_data.role = UserRole.FACULTY
        user_data.student_type = StudentType.CAMPUS

        self.db.query.return_value.filter.return_value.first.return_value = None

        with self.assertRaises(HTTPException) as ctx:
            auth_service.register_user(user_data, self.db)

        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("Student type is only applicable to students", ctx.exception.detail)

    def test_login_success_returns_jwt_token(self):
        """Valid credentials return a bearer access token."""
        login_data = MagicMock()
        login_data.email = "valid@campus.com"
        login_data.password = "PlainPassword123"

        mock_user = MagicMock()
        mock_user.email = "valid@campus.com"
        mock_user.is_active = True
        mock_user.role = UserRole.STUDENT
        mock_user.password_hash = "mocked_hash"

        self.db.query.return_value.filter.return_value.first.return_value = mock_user

        with patch("app.Auth.service.verify_password", return_value=True), \
             patch("app.Auth.service.create_access_token", return_value="jwt.token.string"):
            result = auth_service.login_user(login_data, self.db)

        self.assertIsNotNone(result)
        self.assertEqual(result["access_token"], "jwt.token.string")
        self.assertEqual(result["token_type"], "bearer")

    def test_login_nonexistent_user_returns_none(self):
        """Login returns None when user email is not found in database."""
        login_data = MagicMock()
        login_data.email = "unknown@campus.com"

        self.db.query.return_value.filter.return_value.first.return_value = None

        result = auth_service.login_user(login_data, self.db)
        self.assertIsNone(result)

    def test_login_deactivated_user_raises_http_403(self):
        """Attempting to log into a deactivated account raises HTTP 403 Forbidden."""
        login_data = MagicMock()
        login_data.email = "deactivated@campus.com"

        mock_user = MagicMock()
        mock_user.is_active = False

        self.db.query.return_value.filter.return_value.first.return_value = mock_user

        with self.assertRaises(HTTPException) as ctx:
            auth_service.login_user(login_data, self.db)

        self.assertEqual(ctx.exception.status_code, 403)
        self.assertIn("deactivated", ctx.exception.detail)

    def test_login_wrong_password_returns_none(self):
        """Login returns None when password verification fails."""
        login_data = MagicMock()
        login_data.email = "user@campus.com"
        login_data.password = "WrongPassword"

        mock_user = MagicMock()
        mock_user.is_active = True
        mock_user.password_hash = "correct_hash"

        self.db.query.return_value.filter.return_value.first.return_value = mock_user

        with patch("app.Auth.service.verify_password", return_value=False):
            result = auth_service.login_user(login_data, self.db)

        self.assertIsNone(result)

    def test_password_hash_and_verify(self):
        """Password hashing generates distinct hashes and verifies correctly."""
        plain = "MySecretPass@123"
        hashed = hash_password(plain)

        self.assertNotEqual(plain, hashed)
        self.assertTrue(verify_password(plain, hashed))
        self.assertFalse(verify_password("IncorrectPass", hashed))

    def test_jwt_create_and_verify_token(self):
        """JWT handler generates a valid token and successfully decodes claims."""
        claims = {"sub": "test@campus.com", "role": "Student"}
        token = create_access_token(claims)

        decoded = verify_access_token(token)
        self.assertIsNotNone(decoded)
        self.assertEqual(decoded["sub"], "test@campus.com")
        self.assertEqual(decoded["role"], "Student")

    def test_require_admin_permission_check(self):
        """Permission checker allows Admin and rejects non-Admin users."""
        admin_user = MagicMock()
        admin_user.role = UserRole.ADMIN

        student_user = MagicMock()
        student_user.role = UserRole.STUDENT

        # Admin passes
        self.assertEqual(require_admin(admin_user), admin_user)

        # Student is rejected
        with self.assertRaises(HTTPException) as ctx:
            require_admin(student_user)
        self.assertEqual(ctx.exception.status_code, 403)


if __name__ == "__main__":
    unittest.main(verbosity=2)
