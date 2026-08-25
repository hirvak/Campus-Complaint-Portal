from enum import Enum


class UserRole(str, Enum):
    ADMIN = "Administrator"
    STUDENT = "Student"
    FACULTY = "Faculty"
    FACILITY_OFFICER = "Facility Officer"
    MAINTENANCE_TEAM = "Maintenance Team"


class StudentType(str, Enum):
    CAMPUS = "Campus"
    HOSTEL = "Hostel"


class ComplaintStatus(str, Enum):
    NEW = "New"
    ASSIGNED = "Assigned"
    IN_PROGRESS = "In Progress"
    RESOLVED = "Resolved"
    CLOSED = "Closed"
    REOPENED = "Reopened"


class ComplaintPriority(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    CRITICAL = "Critical"

class NotificationType(str, Enum):

    COMPLAINT_CREATED = "Complaint Created"

    COMPLAINT_ASSIGNED = "Complaint Assigned"

    COMPLAINT_RESOLVED = "Complaint Resolved"

    COMPLAINT_REOPENED = "Complaint Reopened"