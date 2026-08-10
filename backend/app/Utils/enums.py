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