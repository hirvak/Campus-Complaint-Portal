import os
import sys
import unittest
from unittest.mock import MagicMock, patch

# Ensure backend root is on sys.path
BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from fastapi import HTTPException
from app.Departments import service as dept_service


class TestDepartmentModule(unittest.TestCase):
    """Unit tests for Department service logic and duplicate constraints."""

    def setUp(self):
        self.db = MagicMock()

    @patch("app.Departments.service.repository.create_department")
    @patch("app.Departments.service.repository.get_department_by_name")
    def test_create_department_success(self, mock_get_by_name, mock_create):
        """Creating a department strips whitespace, verifies uniqueness, and saves."""
        mock_get_by_name.return_value = None

        dept_in = MagicMock()
        dept_in.name = "  Facilities & Infrastructure  "
        dept_in.description = "Manages campus infrastructure"

        saved_dept = MagicMock()
        saved_dept.id = 1
        saved_dept.name = "Facilities & Infrastructure"
        mock_create.return_value = saved_dept

        result = dept_service.create_department(self.db, dept_in)

        self.assertEqual(result.name, "Facilities & Infrastructure")
        self.assertEqual(dept_in.name, "Facilities & Infrastructure")
        mock_create.assert_called_once_with(self.db, dept_in)

    @patch("app.Departments.service.repository.get_department_by_name")
    def test_create_department_duplicate_rejected(self, mock_get_by_name):
        """Creating a department with an existing name raises HTTP 409 Conflict."""
        mock_get_by_name.return_value = MagicMock()

        dept_in = MagicMock()
        dept_in.name = "Hostel Administration"

        with self.assertRaises(HTTPException) as ctx:
            dept_service.create_department(self.db, dept_in)

        self.assertEqual(ctx.exception.status_code, 409)
        self.assertIn("Department already exists", ctx.exception.detail)

    @patch("app.Departments.service.repository.get_department_by_id")
    def test_get_department_not_found_raises_404(self, mock_get_by_id):
        """Requesting a nonexistent department raises HTTP 404 Not Found."""
        mock_get_by_id.return_value = None

        with self.assertRaises(HTTPException) as ctx:
            dept_service.get_department(self.db, 999)

        self.assertEqual(ctx.exception.status_code, 404)
        self.assertIn("Department not found", ctx.exception.detail)

    @patch("app.Departments.service.repository.get_department_by_name")
    @patch("app.Departments.service.repository.get_department_by_id")
    def test_update_department_duplicate_name_rejected(self, mock_get_by_id, mock_get_by_name):
        """Updating department name to one already taken by another department raises HTTP 409."""
        curr_dept = MagicMock()
        curr_dept.id = 2
        mock_get_by_id.return_value = curr_dept

        other_dept = MagicMock()
        other_dept.id = 3
        mock_get_by_name.return_value = other_dept

        update_data = MagicMock()
        update_data.name = "Existing Dept Name"

        with self.assertRaises(HTTPException) as ctx:
            dept_service.update_department(self.db, 2, update_data)

        self.assertEqual(ctx.exception.status_code, 409)
        self.assertIn("Department name already exists", ctx.exception.detail)

    @patch("app.Departments.service.repository.delete_department")
    @patch("app.Departments.service.repository.get_department_by_id")
    def test_delete_department_success(self, mock_get_by_id, mock_delete):
        """Deleting an existing department removes it and returns confirmation."""
        mock_dept = MagicMock()
        mock_dept.id = 5
        mock_get_by_id.return_value = mock_dept

        result = dept_service.delete_department(self.db, 5)

        mock_delete.assert_called_once_with(self.db, mock_dept)
        self.assertEqual(result["message"], "Department deleted successfully.")


if __name__ == "__main__":
    unittest.main(verbosity=2)
