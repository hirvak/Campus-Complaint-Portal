from typing import Optional

from sqlalchemy.orm import Session

from app.Complaints.models import Complaint
from app.Utils.enums import ComplaintStatus, ComplaintPriority


def create_complaint(
    db: Session,
    complaint: Complaint
):
    db.add(complaint)
    db.commit()
    db.refresh(complaint)

    return complaint


def get_complaint_by_id(
    db: Session,
    complaint_id: int
):
    return (
        db.query(Complaint)
        .filter(Complaint.id == complaint_id)
        .first()
    )


def get_all_complaints(
    db: Session
):
    return (
        db.query(Complaint)
        .order_by(Complaint.created_at.desc())
        .all()
    )


def get_complaints_by_user(
    db: Session,
    user_id: int
):
    return (
        db.query(Complaint)
        .filter(
            Complaint.created_by == user_id
        )
        .order_by(
            Complaint.created_at.desc()
        )
        .all()
    )


def get_complaints_by_assigned_user(
    db: Session,
    user_id: int
):
    return (
        db.query(Complaint)
        .filter(
            Complaint.assigned_to == user_id
        )
        .order_by(
            Complaint.created_at.desc()
        )
        .all()
    )


def get_complaints_by_status(
    db: Session,
    complaint_status: ComplaintStatus
):
    return (
        db.query(Complaint)
        .filter(
            Complaint.status == complaint_status
        )
        .order_by(
            Complaint.created_at.desc()
        )
        .all()
    )


def update_complaint(
    db: Session,
    complaint: Complaint
):
    db.commit()
    db.refresh(complaint)

    return complaint


# =========================================================
# SEARCH / FILTER / PAGINATION
# =========================================================

def search_complaints(
    db: Session,
    search: Optional[str] = None,
    complaint_status: Optional[ComplaintStatus] = None,
    priority: Optional[ComplaintPriority] = None,
    category_id: Optional[int] = None,
    department_id: Optional[int] = None,
    created_by: Optional[int] = None,
    assigned_to: Optional[int] = None,
    skip: int = 0,
    limit: int = 10
):
    query = db.query(Complaint)

    # Search title and description
    if search:
        search_term = f"%{search.strip()}%"

        query = query.filter(
            Complaint.title.ilike(search_term)
            |
            Complaint.description.ilike(search_term)
        )

    # Filter by status
    if complaint_status:
        query = query.filter(
            Complaint.status == complaint_status
        )

    # Filter by priority
    if priority:
        query = query.filter(
            Complaint.priority == priority
        )

    # Filter by category
    if category_id:
        query = query.filter(
            Complaint.category_id == category_id
        )

    # Filter by department
    if department_id:
        query = query.filter(
            Complaint.department_id == department_id
        )

    # Filter by creator
    if created_by:
        query = query.filter(
            Complaint.created_by == created_by
        )

    # Filter by assigned maintenance member
    if assigned_to:
        query = query.filter(
            Complaint.assigned_to == assigned_to
        )

    return (
        query
        .order_by(
            Complaint.created_at.desc()
        )
        .offset(skip)
        .limit(limit)
        .all()
    )


def count_complaints(
    db: Session,
    search: Optional[str] = None,
    complaint_status: Optional[ComplaintStatus] = None,
    priority: Optional[ComplaintPriority] = None,
    category_id: Optional[int] = None,
    department_id: Optional[int] = None,
    created_by: Optional[int] = None,
    assigned_to: Optional[int] = None
):
    query = db.query(Complaint)

    if search:
        search_term = f"%{search.strip()}%"

        query = query.filter(
            Complaint.title.ilike(search_term)
            |
            Complaint.description.ilike(search_term)
        )

    if complaint_status:
        query = query.filter(
            Complaint.status == complaint_status
        )

    if priority:
        query = query.filter(
            Complaint.priority == priority
        )

    if category_id:
        query = query.filter(
            Complaint.category_id == category_id
        )

    if department_id:
        query = query.filter(
            Complaint.department_id == department_id
        )

    if created_by:
        query = query.filter(
            Complaint.created_by == created_by
        )

    if assigned_to:
        query = query.filter(
            Complaint.assigned_to == assigned_to
        )

    return query.count()