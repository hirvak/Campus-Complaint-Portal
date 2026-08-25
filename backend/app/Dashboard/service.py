from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.Dashboard import repository
from app.Dashboard.schemas import (
    DashboardResponse,
    ComplaintStatistics,
    ComplaintPriorityStatistics,
)
from app.Users.models import User
from app.Utils.enums import (
    UserRole,
    ComplaintStatus,
    ComplaintPriority,
)


def get_dashboard(
    db: Session,
    current_user: User
):
    # =====================================================
    # ADMIN / FACILITY OFFICER
    # Full dashboard
    # =====================================================

    if current_user.role in [
        UserRole.ADMIN,
        UserRole.FACILITY_OFFICER
    ]:

        total_complaints = repository.get_total_complaints(db)

        new_complaints = repository.get_complaint_count_by_status(
            db,
            ComplaintStatus.NEW
        )

        assigned_complaints = repository.get_complaint_count_by_status(
            db,
            ComplaintStatus.ASSIGNED
        )

        in_progress_complaints = repository.get_complaint_count_by_status(
            db,
            ComplaintStatus.IN_PROGRESS
        )

        resolved_complaints = repository.get_complaint_count_by_status(
            db,
            ComplaintStatus.RESOLVED
        )

        closed_complaints = repository.get_complaint_count_by_status(
            db,
            ComplaintStatus.CLOSED
        )

        reopened_complaints = repository.get_complaint_count_by_status(
            db,
            ComplaintStatus.REOPENED
        )

        low = repository.get_complaint_count_by_priority(
            db,
            ComplaintPriority.LOW
        )

        medium = repository.get_complaint_count_by_priority(
            db,
            ComplaintPriority.MEDIUM
        )

        high = repository.get_complaint_count_by_priority(
            db,
            ComplaintPriority.HIGH
        )

        critical = repository.get_complaint_count_by_priority(
            db,
            ComplaintPriority.CRITICAL
        )

        category_statistics = repository.get_complaints_by_category(
            db
        )

        department_statistics = repository.get_complaints_by_department(
            db
        )

        return DashboardResponse(
            complaint_statistics=ComplaintStatistics(
                total_complaints=total_complaints,
                new_complaints=new_complaints,
                assigned_complaints=assigned_complaints,
                in_progress_complaints=in_progress_complaints,
                resolved_complaints=resolved_complaints,
                closed_complaints=closed_complaints,
                reopened_complaints=reopened_complaints,
            ),
            priority_statistics=ComplaintPriorityStatistics(
                low=low,
                medium=medium,
                high=high,
                critical=critical,
            ),
            category_statistics=category_statistics,
            department_statistics=department_statistics,
        )

    # =====================================================
    # MAINTENANCE TEAM
    # Only assigned complaints
    # =====================================================

    if current_user.role == UserRole.MAINTENANCE_TEAM:

        complaints = repository.get_complaints_by_assigned_user(
            db,
            current_user.id
        )

    # =====================================================
    # STUDENT / FACULTY
    # Only their own complaints
    # =====================================================

    elif current_user.role in [
        UserRole.STUDENT,
        UserRole.FACULTY
    ]:

        complaints = repository.get_complaints_by_user(
            db,
            current_user.id
        )

    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to access the dashboard."
        )

    # =====================================================
    # ROLE-SPECIFIC STATISTICS
    # =====================================================

    total_complaints = len(complaints)

    new_complaints = sum(
        1 for complaint in complaints
        if complaint.status == ComplaintStatus.NEW
    )

    assigned_complaints = sum(
        1 for complaint in complaints
        if complaint.status == ComplaintStatus.ASSIGNED
    )

    in_progress_complaints = sum(
        1 for complaint in complaints
        if complaint.status == ComplaintStatus.IN_PROGRESS
    )

    resolved_complaints = sum(
        1 for complaint in complaints
        if complaint.status == ComplaintStatus.RESOLVED
    )

    closed_complaints = sum(
        1 for complaint in complaints
        if complaint.status == ComplaintStatus.CLOSED
    )

    reopened_complaints = sum(
        1 for complaint in complaints
        if complaint.status == ComplaintStatus.REOPENED
    )

    low = sum(
        1 for complaint in complaints
        if complaint.priority == ComplaintPriority.LOW
    )

    medium = sum(
        1 for complaint in complaints
        if complaint.priority == ComplaintPriority.MEDIUM
    )

    high = sum(
        1 for complaint in complaints
        if complaint.priority == ComplaintPriority.HIGH
    )

    critical = sum(
        1 for complaint in complaints
        if complaint.priority == ComplaintPriority.CRITICAL
    )

    category_statistics = {}

    for complaint in complaints:
        category_name = repository.get_category_name(
            db,
            complaint.category_id
        )

        category_statistics[category_name] = (
            category_statistics.get(category_name, 0) + 1
        )

    department_statistics = {}

    for complaint in complaints:
        department_name = repository.get_department_name(
            db,
            complaint.department_id
        )

        department_statistics[department_name] = (
            department_statistics.get(department_name, 0) + 1
        )

    return DashboardResponse(
        complaint_statistics=ComplaintStatistics(
            total_complaints=total_complaints,
            new_complaints=new_complaints,
            assigned_complaints=assigned_complaints,
            in_progress_complaints=in_progress_complaints,
            resolved_complaints=resolved_complaints,
            closed_complaints=closed_complaints,
            reopened_complaints=reopened_complaints,
        ),
        priority_statistics=ComplaintPriorityStatistics(
            low=low,
            medium=medium,
            high=high,
            critical=critical,
        ),
        category_statistics=category_statistics,
        department_statistics=department_statistics,
    )