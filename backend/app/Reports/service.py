from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.Reports import repository
from app.Reports.schemas import (
    ReportSummary,
    StatusReport,
    PriorityReport,
    CategoryReport,
    DepartmentReport,
    CompleteReportResponse,
)

from app.Users.models import User
from app.Utils.enums import (
    UserRole,
    ComplaintStatus,
    ComplaintPriority,
)


# =========================================================
# HELPER — GET REPORT SCOPE
# =========================================================

def get_report_scope(
    current_user: User
):
    """
    Determines which complaints the current user
    is allowed to include in reports.
    """

    # Admin and Facility Officer
    # can view campus-wide reports
    if current_user.role in [
        UserRole.ADMIN,
        UserRole.FACILITY_OFFICER
    ]:
        return {
            "created_by": None,
            "assigned_to": None
        }

    # Student / Faculty
    # can view reports only for their own complaints
    if current_user.role in [
        UserRole.STUDENT,
        UserRole.FACULTY
    ]:
        return {
            "created_by": current_user.id,
            "assigned_to": None
        }

    # Maintenance Team
    # can view reports only for complaints assigned to them
    if current_user.role == UserRole.MAINTENANCE_TEAM:
        return {
            "created_by": None,
            "assigned_to": current_user.id
        }

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="You are not authorized to view reports."
    )


# =========================================================
# GET REPORT SUMMARY
# =========================================================

def get_report_summary(
    db: Session,
    current_user: User
):
    scope = get_report_scope(current_user)

    total = repository.get_total_complaints(
        db=db,
        created_by=scope["created_by"],
        assigned_to=scope["assigned_to"]
    )

    new = repository.count_by_status(
        db=db,
        complaint_status=ComplaintStatus.NEW,
        created_by=scope["created_by"],
        assigned_to=scope["assigned_to"]
    )

    assigned = repository.count_by_status(
        db=db,
        complaint_status=ComplaintStatus.ASSIGNED,
        created_by=scope["created_by"],
        assigned_to=scope["assigned_to"]
    )

    in_progress = repository.count_by_status(
        db=db,
        complaint_status=ComplaintStatus.IN_PROGRESS,
        created_by=scope["created_by"],
        assigned_to=scope["assigned_to"]
    )

    resolved = repository.count_by_status(
        db=db,
        complaint_status=ComplaintStatus.RESOLVED,
        created_by=scope["created_by"],
        assigned_to=scope["assigned_to"]
    )

    closed = repository.count_by_status(
        db=db,
        complaint_status=ComplaintStatus.CLOSED,
        created_by=scope["created_by"],
        assigned_to=scope["assigned_to"]
    )

    reopened = repository.count_by_status(
        db=db,
        complaint_status=ComplaintStatus.REOPENED,
        created_by=scope["created_by"],
        assigned_to=scope["assigned_to"]
    )

    low = repository.count_by_priority(
        db=db,
        priority=ComplaintPriority.LOW,
        created_by=scope["created_by"],
        assigned_to=scope["assigned_to"]
    )

    medium = repository.count_by_priority(
        db=db,
        priority=ComplaintPriority.MEDIUM,
        created_by=scope["created_by"],
        assigned_to=scope["assigned_to"]
    )

    high = repository.count_by_priority(
        db=db,
        priority=ComplaintPriority.HIGH,
        created_by=scope["created_by"],
        assigned_to=scope["assigned_to"]
    )

    return ReportSummary(
        total_complaints=total,
        new_complaints=new,
        assigned_complaints=assigned,
        in_progress_complaints=in_progress,
        resolved_complaints=resolved,
        closed_complaints=closed,
        reopened_complaints=reopened,
        low_priority=low,
        medium_priority=medium,
        high_priority=high,
    )


# =========================================================
# GET STATUS REPORT
# =========================================================

def get_status_report(
    db: Session,
    current_user: User
):
    scope = get_report_scope(current_user)

    rows = repository.get_complaints_by_status(
        db=db,
        created_by=scope["created_by"],
        assigned_to=scope["assigned_to"]
    )

    return [
        StatusReport(
            status=status.value,
            count=count
        )
        for status, count in rows
    ]


# =========================================================
# GET PRIORITY REPORT
# =========================================================

def get_priority_report(
    db: Session,
    current_user: User
):
    scope = get_report_scope(current_user)

    rows = repository.get_complaints_by_priority(
        db=db,
        created_by=scope["created_by"],
        assigned_to=scope["assigned_to"]
    )

    return [
        PriorityReport(
            priority=priority.value,
            count=count
        )
        for priority, count in rows
    ]


# =========================================================
# GET CATEGORY REPORT
# =========================================================

def get_category_report(
    db: Session,
    current_user: User
):
    scope = get_report_scope(current_user)

    rows = repository.get_complaints_by_category(
        db=db,
        created_by=scope["created_by"],
        assigned_to=scope["assigned_to"]
    )

    return [
        CategoryReport(
            category_id=category_id,
            category_name=category_name,
            count=count
        )
        for category_id, category_name, count in rows
    ]


# =========================================================
# GET DEPARTMENT REPORT
# =========================================================

def get_department_report(
    db: Session,
    current_user: User
):
    scope = get_report_scope(current_user)

    rows = repository.get_complaints_by_department(
        db=db,
        created_by=scope["created_by"],
        assigned_to=scope["assigned_to"]
    )

    return [
        DepartmentReport(
            department_id=department_id,
            department_name=department_name,
            count=count
        )
        for department_id, department_name, count in rows
    ]


# =========================================================
# GET COMPLETE REPORT
# =========================================================

def get_complete_report(
    db: Session,
    current_user: User
):
    return CompleteReportResponse(
        summary=get_report_summary(
            db=db,
            current_user=current_user
        ),

        status_report=get_status_report(
            db=db,
            current_user=current_user
        ),

        priority_report=get_priority_report(
            db=db,
            current_user=current_user
        ),

        category_report=get_category_report(
            db=db,
            current_user=current_user
        ),

        department_report=get_department_report(
            db=db,
            current_user=current_user
        )
    )