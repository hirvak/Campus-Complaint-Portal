from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.ComplaintHistory import repository as history_repository
from app.Complaints import repository
from app.Complaints.models import Complaint
from app.Complaints.schemas import (
    ComplaintCreate,
    ComplaintAssign,
    ComplaintStatusUpdate,
    ComplaintResolve,
    ComplaintListResponse,
)

from app.Categories.models import Category
from app.Users.models import User
from app.Notifications.service import create_notification

from app.Utils.enums import (
    UserRole,
    ComplaintStatus,
    ComplaintPriority,
    NotificationType,
    ComplaintHistoryAction,
)

import math


# =========================================================
# HELPER — GET FACILITY OFFICER
# =========================================================

def get_facility_officer(
    db: Session
):
    return (
        db.query(User)
        .filter(
            User.role == UserRole.FACILITY_OFFICER,
            User.is_active == True
        )
        .first()
    )


# =========================================================
# CREATE COMPLAINT
# Student / Faculty
# =========================================================

def create_complaint(
    db: Session,
    complaint_data: ComplaintCreate,
    current_user: User
):
    # Only Student and Faculty can create complaints
    if current_user.role not in [
        UserRole.STUDENT,
        UserRole.FACULTY
    ]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students and faculty can create complaints."
        )

    # Find selected category
    category = (
        db.query(Category)
        .filter(
            Category.id == complaint_data.category_id,
            Category.is_active == True
        )
        .first()
    )

    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found or inactive."
        )

    # Department is automatically taken from Category
    department_id = category.department_id

    complaint = Complaint(
        title=complaint_data.title.strip(),
        description=complaint_data.description.strip(),
        category_id=category.id,
        department_id=department_id,
        location=complaint_data.location.strip(),
        image_url=complaint_data.image_url,
        created_by=current_user.id,
        status=ComplaintStatus.NEW,
        priority=ComplaintPriority.MEDIUM,
        assigned_to=None
    )

    # -----------------------------------------------------
    # Save complaint
    # -----------------------------------------------------

    complaint = repository.create_complaint(
        db=db,
        complaint=complaint
    )

    # -----------------------------------------------------
    # Create history
    # -----------------------------------------------------

    history_repository.create_history(
        db=db,
        complaint_id=complaint.id,
        action=ComplaintHistoryAction.CREATED,
        description="Complaint created.",
        performed_by=current_user.id
    )

    # -----------------------------------------------------
    # Notify Facility Officer
    # -----------------------------------------------------

    facility_officer = get_facility_officer(db)

    if facility_officer:
        create_notification(
            db=db,
            recipient_id=facility_officer.id,
            complaint_id=complaint.id,
            title="New Complaint",
            message=(
                f"New complaint #{complaint.id} has been created: "
                f"{complaint.title}"
            ),
            notification_type=NotificationType.COMPLAINT_CREATED
        )

    return complaint


# =========================================================
# GET SINGLE COMPLAINT
# =========================================================

def get_complaint(
    db: Session,
    complaint_id: int,
    current_user: User
):
    complaint = repository.get_complaint_by_id(
        db,
        complaint_id
    )

    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found."
        )

    # Student / Faculty → own complaints only
    if current_user.role in [
        UserRole.STUDENT,
        UserRole.FACULTY
    ]:
        if complaint.created_by != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only view your own complaints."
            )

    # Maintenance Team → assigned complaints only
    elif current_user.role == UserRole.MAINTENANCE_TEAM:
        if complaint.assigned_to != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only view complaints assigned to you."
            )

    return complaint


# =========================================================
# GET MY COMPLAINTS
# Student / Faculty
# =========================================================

def get_my_complaints(
    db: Session,
    current_user: User
):
    if current_user.role not in [
        UserRole.STUDENT,
        UserRole.FACULTY
    ]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students and faculty can access their complaints."
        )

    return repository.get_complaints_by_user(
        db,
        current_user.id
    )


# =========================================================
# GET ASSIGNED COMPLAINTS
# Maintenance Team
# =========================================================

def get_assigned_complaints(
    db: Session,
    current_user: User
):
    if current_user.role != UserRole.MAINTENANCE_TEAM:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only maintenance team members can access assigned complaints."
        )

    return repository.get_complaints_by_assigned_user(
        db,
        current_user.id
    )


# =========================================================
# GET ALL COMPLAINTS
# Admin / Facility Officer
# =========================================================

def get_all_complaints(
    db: Session,
    current_user: User
):
    if current_user.role not in [
        UserRole.ADMIN,
        UserRole.FACILITY_OFFICER
    ]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to view all complaints."
        )

    return repository.get_all_complaints(db)


# =========================================================
# GET NEW / REOPENED COMPLAINTS
# Facility Officer
# =========================================================

def get_pending_complaints(
    db: Session,
    current_user: User
):
    if current_user.role != UserRole.FACILITY_OFFICER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the facility officer can access pending complaints."
        )

    new_complaints = repository.get_complaints_by_status(
        db,
        ComplaintStatus.NEW
    )

    reopened_complaints = repository.get_complaints_by_status(
        db,
        ComplaintStatus.REOPENED
    )

    return new_complaints + reopened_complaints


# =========================================================
# ASSIGN COMPLAINT
# Facility Officer
# =========================================================

def assign_complaint(
    db: Session,
    complaint_id: int,
    assignment_data: ComplaintAssign,
    current_user: User
):
    if current_user.role != UserRole.FACILITY_OFFICER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the facility officer can assign complaints."
        )

    complaint = repository.get_complaint_by_id(
        db,
        complaint_id
    )

    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found."
        )

    # Complaint must be NEW or REOPENED
    if complaint.status not in [
        ComplaintStatus.NEW,
        ComplaintStatus.REOPENED
    ]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only new or reopened complaints can be assigned."
        )

    # Find maintenance team member
    maintenance_member = (
        db.query(User)
        .filter(
            User.id == assignment_data.assigned_to,
            User.role == UserRole.MAINTENANCE_TEAM,
            User.is_active == True
        )
        .first()
    )

    if not maintenance_member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Active maintenance team member not found."
        )

    complaint.assigned_to = maintenance_member.id
    complaint.priority = assignment_data.priority
    complaint.status = ComplaintStatus.ASSIGNED

    complaint = repository.update_complaint(
        db,
        complaint
    )

    # -----------------------------------------------------
    # Create history
    # -----------------------------------------------------

    history_repository.create_history(
        db=db,
        complaint_id=complaint.id,
        action=ComplaintHistoryAction.ASSIGNED,
        description=(
            f"Complaint assigned to "
            f"{maintenance_member.full_name}."
        ),
        performed_by=current_user.id
    )

    # -----------------------------------------------------
    # Notify assigned Maintenance Team member
    # -----------------------------------------------------

    create_notification(
        db=db,
        recipient_id=maintenance_member.id,
        complaint_id=complaint.id,
        title="Complaint Assigned",
        message=(
            f"Complaint #{complaint.id} has been assigned to you: "
            f"{complaint.title}"
        ),
        notification_type=NotificationType.COMPLAINT_ASSIGNED
    )

    return complaint


# =========================================================
# UPDATE STATUS
# Maintenance Team
# =========================================================

def update_complaint_status(
    db: Session,
    complaint_id: int,
    status_data: ComplaintStatusUpdate,
    current_user: User
):
    if current_user.role != UserRole.MAINTENANCE_TEAM:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only maintenance team members can update complaint status."
        )

    complaint = repository.get_complaint_by_id(
        db,
        complaint_id
    )

    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found."
        )

    # Only assigned member can update the complaint
    if complaint.assigned_to != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update complaints assigned to you."
        )

    new_status = status_data.status

    # ASSIGNED → IN_PROGRESS
    if (
        complaint.status == ComplaintStatus.ASSIGNED
        and new_status == ComplaintStatus.IN_PROGRESS
    ):
        complaint.status = ComplaintStatus.IN_PROGRESS

    # IN_PROGRESS → RESOLVED
    elif (
        complaint.status == ComplaintStatus.IN_PROGRESS
        and new_status == ComplaintStatus.RESOLVED
    ):
        complaint.status = ComplaintStatus.RESOLVED

    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid status transition."
        )

    complaint = repository.update_complaint(
        db,
        complaint
    )

    # -----------------------------------------------------
    # Create history based on new status
    # -----------------------------------------------------

    if new_status == ComplaintStatus.IN_PROGRESS:

        history_repository.create_history(
            db=db,
            complaint_id=complaint.id,
            action=ComplaintHistoryAction.IN_PROGRESS,
            description=(
                "Complaint work started by maintenance team."
            ),
            performed_by=current_user.id
        )

    elif new_status == ComplaintStatus.RESOLVED:

        history_repository.create_history(
            db=db,
            complaint_id=complaint.id,
            action=ComplaintHistoryAction.RESOLVED,
            description=(
                "Complaint marked as resolved by maintenance team."
            ),
            performed_by=current_user.id
        )

        # Notify Student / Faculty
        create_notification(
            db=db,
            recipient_id=complaint.created_by,
            complaint_id=complaint.id,
            title="Complaint Resolved",
            message=(
                f"Your complaint #{complaint.id} has been resolved: "
                f"{complaint.title}"
            ),
            notification_type=NotificationType.COMPLAINT_RESOLVED
        )

    return complaint


# =========================================================
# RESOLVE COMPLAINT
# Maintenance Team
# =========================================================

def resolve_complaint(
    db: Session,
    complaint_id: int,
    resolution_data: ComplaintResolve,
    current_user: User
):
    if current_user.role != UserRole.MAINTENANCE_TEAM:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only maintenance team members can resolve complaints."
        )

    complaint = repository.get_complaint_by_id(
        db,
        complaint_id
    )

    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found."
        )

    if complaint.assigned_to != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only resolve complaints assigned to you."
        )

    if complaint.status != ComplaintStatus.IN_PROGRESS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only complaints in progress can be resolved."
        )

    complaint.resolution_remarks = (
        resolution_data.resolution_remarks.strip()
    )

    complaint.completion_image = resolution_data.completion_image

    complaint.status = ComplaintStatus.RESOLVED

    complaint = repository.update_complaint(
        db,
        complaint
    )

    # -----------------------------------------------------
    # Create history
    # -----------------------------------------------------

    history_repository.create_history(
        db=db,
        complaint_id=complaint.id,
        action=ComplaintHistoryAction.RESOLVED,
        description=(
            "Complaint resolved with resolution remarks."
        ),
        performed_by=current_user.id
    )

    # -----------------------------------------------------
    # Notify Student / Faculty
    # -----------------------------------------------------

    create_notification(
        db=db,
        recipient_id=complaint.created_by,
        complaint_id=complaint.id,
        title="Complaint Resolved",
        message=(
            f"Your complaint #{complaint.id} has been resolved: "
            f"{complaint.title}"
        ),
        notification_type=NotificationType.COMPLAINT_RESOLVED
    )

    return complaint


# =========================================================
# CLOSE COMPLAINT
# Student / Faculty
# =========================================================

def close_complaint(
    db: Session,
    complaint_id: int,
    current_user: User
):
    if current_user.role not in [
        UserRole.STUDENT,
        UserRole.FACULTY
    ]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students and faculty can close complaints."
        )

    complaint = repository.get_complaint_by_id(
        db,
        complaint_id
    )

    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found."
        )

    if complaint.created_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only close your own complaints."
        )

    if complaint.status != ComplaintStatus.RESOLVED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only resolved complaints can be closed."
        )

    complaint.status = ComplaintStatus.CLOSED

    complaint = repository.update_complaint(
        db,
        complaint
    )

    # -----------------------------------------------------
    # Create history
    # -----------------------------------------------------

    history_repository.create_history(
        db=db,
        complaint_id=complaint.id,
        action=ComplaintHistoryAction.CLOSED,
        description=(
            "Complaint closed by complaint creator."
        ),
        performed_by=current_user.id
    )

    return complaint


# =========================================================
# REOPEN COMPLAINT
# Student / Faculty
# =========================================================

def reopen_complaint(
    db: Session,
    complaint_id: int,
    current_user: User
):
    if current_user.role not in [
        UserRole.STUDENT,
        UserRole.FACULTY
    ]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students and faculty can reopen complaints."
        )

    complaint = repository.get_complaint_by_id(
        db,
        complaint_id
    )

    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found."
        )

    if complaint.created_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only reopen your own complaints."
        )

    if complaint.status != ComplaintStatus.RESOLVED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only resolved complaints can be reopened."
        )

    complaint.status = ComplaintStatus.REOPENED

    complaint = repository.update_complaint(
        db,
        complaint
    )

    # -----------------------------------------------------
    # Create history
    # -----------------------------------------------------

    history_repository.create_history(
        db=db,
        complaint_id=complaint.id,
        action=ComplaintHistoryAction.REOPENED,
        description=(
            "Complaint reopened by complaint creator."
        ),
        performed_by=current_user.id
    )

    # -----------------------------------------------------
    # Notify Facility Officer
    # -----------------------------------------------------

    facility_officer = get_facility_officer(db)

    if facility_officer:
        create_notification(
            db=db,
            recipient_id=facility_officer.id,
            complaint_id=complaint.id,
            title="Complaint Reopened",
            message=(
                f"Complaint #{complaint.id} has been reopened: "
                f"{complaint.title}"
            ),
            notification_type=NotificationType.COMPLAINT_REOPENED
        )

    return complaint


# =========================================================
# SEARCH / FILTER / PAGINATION
# =========================================================

def search_complaints(
    db: Session,
    current_user: User,
    search: str | None = None,
    complaint_status: ComplaintStatus | None = None,
    priority: ComplaintPriority | None = None,
    category_id: int | None = None,
    department_id: int | None = None,
    page: int = 1,
    page_size: int = 10
):
    # -----------------------------------------------------
    # Validate pagination
    # -----------------------------------------------------

    if page < 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Page must be greater than or equal to 1."
        )

    if page_size < 1 or page_size > 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Page size must be between 1 and 100."
        )

    # -----------------------------------------------------
    # Role-based filtering
    # -----------------------------------------------------

    created_by = None
    assigned_to = None

    # Student / Faculty
    if current_user.role in [
        UserRole.STUDENT,
        UserRole.FACULTY
    ]:
        created_by = current_user.id

    # Maintenance Team
    elif current_user.role == UserRole.MAINTENANCE_TEAM:
        assigned_to = current_user.id

    # Admin / Facility Officer
    elif current_user.role in [
        UserRole.ADMIN,
        UserRole.FACILITY_OFFICER
    ]:
        pass

    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to search complaints."
        )

    # -----------------------------------------------------
    # Calculate offset
    # -----------------------------------------------------

    skip = (page - 1) * page_size

    # -----------------------------------------------------
    # Get complaints
    # -----------------------------------------------------

    complaints = repository.search_complaints(
        db=db,
        search=search,
        complaint_status=complaint_status,
        priority=priority,
        category_id=category_id,
        department_id=department_id,
        created_by=created_by,
        assigned_to=assigned_to,
        skip=skip,
        limit=page_size
    )

    # -----------------------------------------------------
    # Get total count
    # -----------------------------------------------------

    total = repository.count_complaints(
        db=db,
        search=search,
        complaint_status=complaint_status,
        priority=priority,
        category_id=category_id,
        department_id=department_id,
        created_by=created_by,
        assigned_to=assigned_to
    )

    # -----------------------------------------------------
    # Calculate total pages
    # -----------------------------------------------------

    total_pages = (
        math.ceil(total / page_size)
        if total > 0
        else 0
    )

    return ComplaintListResponse(
        items=complaints,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )