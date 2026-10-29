import os
import sys
import unittest
from unittest.mock import MagicMock, patch
from datetime import datetime, timezone, timedelta

# Ensure backend root is on sys.path
BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app.SLA import service as sla_service
from app.Utils.enums import (
    ComplaintPriority,
    ComplaintStatus,
    UserRole
)


class TestSlaModule(unittest.TestCase):
    """Unit tests for SLA deadline resolution, status calculations, and escalation runner."""

    def setUp(self):
        self.db = MagicMock()

    def test_get_applicable_sla_category_override(self):
        """Category-specific active rule overrides priority-based SLA target."""
        category_config = MagicMock()
        category_config.target_hours = 4
        category_config.warning_hours = 1
        category_config.is_active = True

        # DB query returns category_config
        self.db.query.return_value.filter.return_value.first.return_value = category_config

        target, warning = sla_service.get_applicable_sla(
            db=self.db,
            category_id=4,
            priority=ComplaintPriority.MEDIUM  # Medium default is 24h
        )

        self.assertEqual(target, 4)
        self.assertEqual(warning, 1)

    def test_get_applicable_sla_priority_fallback(self):
        """When category has no configuration, priority configuration is used."""
        priority_config = MagicMock()
        priority_config.target_hours = 12
        priority_config.warning_hours = 2
        priority_config.is_active = True

        # First call (category) returns None, second call (priority) returns priority_config
        self.db.query.return_value.filter.return_value.first.side_effect = [
            None,
            priority_config
        ]

        target, warning = sla_service.get_applicable_sla(
            db=self.db,
            category_id=99,
            priority=ComplaintPriority.HIGH
        )

        self.assertEqual(target, 12)
        self.assertEqual(warning, 2)

    def test_get_applicable_sla_system_defaults(self):
        """When database has no matching rule, system defaults apply."""
        self.db.query.return_value.filter.return_value.first.return_value = None

        target, warning = sla_service.get_applicable_sla(
            db=self.db,
            category_id=None,
            priority=ComplaintPriority.CRITICAL
        )

        self.assertEqual(target, 4)
        self.assertEqual(warning, 1)

    def test_calculate_deadline_adds_target_hours(self):
        """calculate_deadline adds target hours to start_time."""
        start = datetime(2026, 10, 29, 10, 0, 0, tzinfo=timezone.utc)

        with patch("app.SLA.service.get_applicable_sla", return_value=(4, 1)):
            deadline = sla_service.calculate_deadline(
                db=self.db,
                category_id=4,
                priority=ComplaintPriority.MEDIUM,
                start_time=start
            )

        expected = datetime(2026, 10, 29, 14, 0, 0, tzinfo=timezone.utc)
        self.assertEqual(deadline, expected)

    def test_compute_sla_status_resolved(self):
        """Resolved or closed complaints always return RESOLVED status."""
        complaint = MagicMock()
        complaint.status = ComplaintStatus.RESOLVED
        self.assertEqual(sla_service.compute_sla_status(complaint), "RESOLVED")

        complaint.status = ComplaintStatus.CLOSED
        self.assertEqual(sla_service.compute_sla_status(complaint), "RESOLVED")

    def test_compute_sla_status_overdue_when_deadline_passed(self):
        """Complaints whose deadline is in the past return OVERDUE."""
        now = datetime.now(timezone.utc)
        complaint = MagicMock()
        complaint.status = ComplaintStatus.ASSIGNED
        complaint.is_escalated = False
        complaint.sla_deadline = now - timedelta(hours=2)

        self.assertEqual(sla_service.compute_sla_status(complaint, current_time=now), "OVERDUE")

    def test_compute_sla_status_approaching_deadline(self):
        """Complaints within warning window return APPROACHING_DEADLINE."""
        now = datetime.now(timezone.utc)
        complaint = MagicMock()
        complaint.status = ComplaintStatus.IN_PROGRESS
        complaint.is_escalated = False
        complaint.category_id = 1
        complaint.priority = ComplaintPriority.MEDIUM  # Default warning is 4h
        complaint.sla_deadline = now + timedelta(hours=2)  # 2h remaining <= 4h warning

        self.assertEqual(sla_service.compute_sla_status(complaint, current_time=now), "APPROACHING_DEADLINE")

    def test_compute_sla_status_on_track(self):
        """Complaints with ample time remaining return ON_TRACK."""
        now = datetime.now(timezone.utc)
        complaint = MagicMock()
        complaint.status = ComplaintStatus.NEW
        complaint.is_escalated = False
        complaint.category_id = 1
        complaint.priority = ComplaintPriority.MEDIUM
        complaint.sla_deadline = now + timedelta(hours=20)  # 20h remaining > 4h warning

        self.assertEqual(sla_service.compute_sla_status(complaint, current_time=now), "ON_TRACK")

    @patch("app.SLA.service.create_notification")
    @patch("app.SLA.service.history_repository.create_history")
    def test_escalation_runner_escalates_overdue_complaint(self, mock_history, mock_notification):
        """Escalation runner marks overdue complaints as escalated, logs history, and notifies officer."""
        officer = MagicMock()
        officer.id = 5
        officer.role = UserRole.FACILITY_OFFICER
        officer.is_active = True

        overdue_complaint = MagicMock()
        overdue_complaint.id = 88
        overdue_complaint.title = "Water tap burst"
        overdue_complaint.status = ComplaintStatus.ASSIGNED
        overdue_complaint.is_grandfathered = False
        overdue_complaint.is_escalated = False
        overdue_complaint.sla_cycle = 1
        overdue_complaint.sla_deadline = datetime.now(timezone.utc) - timedelta(hours=3)

        # Mock query return values:
        # First query for facility officer
        # Second query for overdue complaints with with_for_update
        # Third query for existing_event (returns None)
        self.db.query.return_value.filter.return_value.first.side_effect = [
            officer,  # facility officer
            None      # existing escalation event
        ]
        self.db.query.return_value.filter.return_value.with_for_update.return_value.all.return_value = [
            overdue_complaint
        ]

        result = sla_service.check_and_escalate_overdue_complaints(self.db)

        self.assertEqual(result.overdue_detected, 1)
        self.assertEqual(result.escalated_count, 1)
        self.assertIn(88, result.escalated_complaints)
        self.assertTrue(overdue_complaint.is_escalated)
        self.assertEqual(overdue_complaint.escalation_level, 1)
        self.db.commit.assert_called_once()
        mock_history.assert_called_once()
        mock_notification.assert_called_once()


if __name__ == "__main__":
    unittest.main(verbosity=2)
