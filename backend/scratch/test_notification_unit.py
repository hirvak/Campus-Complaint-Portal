import os
import sys
import unittest
from unittest.mock import MagicMock, patch

# Ensure backend root is on sys.path
BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from fastapi import HTTPException
from app.Notifications import service as notif_service
from app.Utils.enums import NotificationType


class TestNotificationModule(unittest.TestCase):
    """Unit tests for In-App Notifications, read statuses, and ownership protection."""

    def setUp(self):
        self.db = MagicMock()

        self.user = MagicMock()
        self.user.id = 15

        self.other_user = MagicMock()
        self.other_user.id = 99

    @patch("app.Notifications.service.repository.create_notification")
    def test_create_notification_success(self, mock_create):
        """Creating a notification initializes is_read=False and persists via repository."""
        mock_notif = MagicMock()
        mock_notif.id = 1
        mock_notif.is_read = False
        mock_create.return_value = mock_notif

        result = notif_service.create_notification(
            db=self.db,
            recipient_id=15,
            title="SLA Alert",
            message="Your complaint is approaching its SLA target.",
            notification_type=NotificationType.COMPLAINT_CREATED,
            complaint_id=42
        )

        mock_create.assert_called_once()
        saved_arg = mock_create.call_args[1]["notification"]
        self.assertEqual(saved_arg.recipient_id, 15)
        self.assertEqual(saved_arg.title, "SLA Alert")
        self.assertEqual(saved_arg.complaint_id, 42)
        self.assertFalse(saved_arg.is_read)
        self.assertIs(result, mock_notif)

    @patch("app.Notifications.service.repository.mark_notification_as_read")
    @patch("app.Notifications.service.repository.get_notification_by_id")
    def test_mark_as_read_success(self, mock_get_by_id, mock_mark):
        """Recipient can mark their own notification as read."""
        notif = MagicMock()
        notif.id = 10
        notif.recipient_id = self.user.id
        mock_get_by_id.return_value = notif
        mock_mark.return_value = notif

        result = notif_service.mark_as_read(self.db, 10, self.user)

        mock_mark.assert_called_once_with(db=self.db, notification=notif)
        self.assertIs(result, notif)

    @patch("app.Notifications.service.repository.get_notification_by_id")
    def test_mark_as_read_forbidden_for_other_user(self, mock_get_by_id):
        """User cannot mark another recipient's notification as read (HTTP 403)."""
        notif = MagicMock()
        notif.id = 10
        notif.recipient_id = self.other_user.id  # Belongs to user 99, not user 15
        mock_get_by_id.return_value = notif

        with self.assertRaises(HTTPException) as ctx:
            notif_service.mark_as_read(self.db, 10, self.user)

        self.assertEqual(ctx.exception.status_code, 403)
        self.assertIn("only access your own notifications", ctx.exception.detail)

    @patch("app.Notifications.service.repository.get_notification_by_id")
    def test_mark_as_read_missing_raises_404(self, mock_get_by_id):
        """Attempting to mark a nonexistent notification raises HTTP 404."""
        mock_get_by_id.return_value = None

        with self.assertRaises(HTTPException) as ctx:
            notif_service.mark_as_read(self.db, 999, self.user)

        self.assertEqual(ctx.exception.status_code, 404)
        self.assertIn("Notification not found", ctx.exception.detail)

    @patch("app.Notifications.service.repository.get_unread_notifications_by_user")
    def test_get_my_unread_notifications(self, mock_get_unread):
        """Retrieves unread notifications filtering by current user's ID."""
        mock_get_unread.return_value = [MagicMock(), MagicMock()]

        results = notif_service.get_my_unread_notifications(self.db, self.user)

        mock_get_unread.assert_called_once_with(db=self.db, user_id=self.user.id)
        self.assertEqual(len(results), 2)

    @patch("app.Notifications.service.repository.mark_all_notifications_as_read")
    def test_mark_all_as_read(self, mock_mark_all):
        """Marks all notifications as read for current user."""
        mock_mark_all.return_value = {"message": "All notifications marked as read."}

        res = notif_service.mark_all_as_read(self.db, self.user)

        mock_mark_all.assert_called_once_with(db=self.db, user_id=self.user.id)
        self.assertIn("message", res)


if __name__ == "__main__":
    unittest.main(verbosity=2)
