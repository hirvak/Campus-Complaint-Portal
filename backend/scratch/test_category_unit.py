import os
import sys
import unittest
from unittest.mock import MagicMock, patch

# Ensure backend root is on sys.path
BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from fastapi import HTTPException
from app.Categories import service as category_service


class TestCategoryModule(unittest.TestCase):
    """Unit tests for Category management service and validation."""

    def setUp(self):
        self.db = MagicMock()

    @patch("app.Categories.service.repository.create_category")
    @patch("app.Categories.service.department_repository.get_department_by_id")
    @patch("app.Categories.service.repository.get_category_by_name")
    def test_create_category_success(self, mock_get_by_name, mock_get_dept, mock_create):
        """Creating a new category validates uniqueness, confirms department, and trims name."""
        mock_get_by_name.return_value = None
        mock_dept = MagicMock()
        mock_dept.id = 1
        mock_dept.is_active = True
        mock_get_dept.return_value = mock_dept

        cat_in = MagicMock()
        cat_in.name = "  Electricity & Power  "
        cat_in.description = "Power issues"
        cat_in.department_id = 1

        created_cat = MagicMock()
        created_cat.id = 10
        created_cat.name = "Electricity & Power"
        mock_create.return_value = created_cat

        result = category_service.create_category(self.db, cat_in)

        self.assertEqual(result.id, 10)
        self.assertEqual(cat_in.name, "Electricity & Power")
        mock_create.assert_called_once_with(self.db, cat_in)

    @patch("app.Categories.service.repository.get_category_by_name")
    def test_create_category_duplicate_name_rejected(self, mock_get_by_name):
        """Creating a category with an existing name raises HTTP 409 Conflict."""
        mock_get_by_name.return_value = MagicMock()

        cat_in = MagicMock()
        cat_in.name = "Plumbing"
        cat_in.department_id = 1

        with self.assertRaises(HTTPException) as ctx:
            category_service.create_category(self.db, cat_in)

        self.assertEqual(ctx.exception.status_code, 409)
        self.assertIn("Category already exists", ctx.exception.detail)

    @patch("app.Categories.service.department_repository.get_department_by_id")
    @patch("app.Categories.service.repository.get_category_by_name")
    def test_create_category_inactive_department_rejected(self, mock_get_by_name, mock_get_dept):
        """Creating a category under a missing or inactive department raises HTTP 404."""
        mock_get_by_name.return_value = None
        mock_get_dept.return_value = None

        cat_in = MagicMock()
        cat_in.name = "HVAC"
        cat_in.department_id = 999

        with self.assertRaises(HTTPException) as ctx:
            category_service.create_category(self.db, cat_in)

        self.assertEqual(ctx.exception.status_code, 404)
        self.assertIn("Department not found", ctx.exception.detail)

    @patch("app.Categories.service.repository.get_category_by_id")
    def test_get_category_by_id_success(self, mock_get_by_id):
        """Retrieving an existing category by ID returns the category model."""
        mock_cat = MagicMock()
        mock_cat.id = 5
        mock_get_by_id.return_value = mock_cat

        result = category_service.get_category(self.db, 5)
        self.assertIs(result, mock_cat)

    @patch("app.Categories.service.repository.get_category_by_id")
    def test_get_category_not_found_raises_404(self, mock_get_by_id):
        """Requesting a missing category raises HTTP 404 Not Found."""
        mock_get_by_id.return_value = None

        with self.assertRaises(HTTPException) as ctx:
            category_service.get_category(self.db, 999)

        self.assertEqual(ctx.exception.status_code, 404)
        self.assertIn("Category not found", ctx.exception.detail)

    @patch("app.Categories.service.repository.get_category_by_name")
    @patch("app.Categories.service.repository.get_category_by_id")
    def test_update_category_duplicate_name_rejected(self, mock_get_by_id, mock_get_by_name):
        """Updating a category name to another existing category's name raises HTTP 409."""
        cat_to_update = MagicMock()
        cat_to_update.id = 2
        mock_get_by_id.return_value = cat_to_update

        other_cat = MagicMock()
        other_cat.id = 3  # different category ID with same name
        mock_get_by_name.return_value = other_cat

        update_data = MagicMock()
        update_data.name = "Duplicate Name"

        with self.assertRaises(HTTPException) as ctx:
            category_service.update_category(self.db, 2, update_data)

        self.assertEqual(ctx.exception.status_code, 409)
        self.assertIn("Category name already exists", ctx.exception.detail)


if __name__ == "__main__":
    unittest.main(verbosity=2)
