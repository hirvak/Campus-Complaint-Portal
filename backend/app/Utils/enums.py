import enum

class UserRole(enum.Enum):
    STUDENT = "Student"
    FACULTY = "Faculty"
    FACILITY_OFFICER = "Facility Officer"
    MAINTENANCE_TEAM = "Maintenance Team"
    ADMIN = "Administrator"