from typing import Optional

from sqlalchemy.orm import Session
from sqlalchemy import func

from app.Complaints.models import Complaint
from app.Categories.models import Category
from app.Departments.models import Department
from app.Utils.enums import ComplaintStatus, ComplaintPriority


# =========================================================
# TOTAL COMPLAINTS
# =========================================================

def get_total_complaints(
    db: Session,
    created_by: Optional[int] = None,
    assigned_to: Optional[int] = None
):
    query = db.query(func.count(Complaint.id))

    if created_by is not None:
        query = query.filter(
            Complaint.created_by == created_by
        )

    if assigned_to is not None:
        query = query.filter(
            Complaint.assigned_to == assigned_to
        )

    return query.scalar() or 0


# =========================================================
# COMPLAINTS BY STATUS
# =========================================================

def get_complaints_by_status(
    db: Session,
    created_by: Optional[int] = None,
    assigned_to: Optional[int] = None
):
    query = (
        db.query(
            Complaint.status,
            func.count(Complaint.id)
        )
        .group_by(Complaint.status)
        .order_by(Complaint.status)
    )

    if created_by is not None:
        query = query.filter(
            Complaint.created_by == created_by
        )

    if assigned_to is not None:
        query = query.filter(
            Complaint.assigned_to == assigned_to
        )

    return query.all()


# =========================================================
# COMPLAINTS BY PRIORITY
# =========================================================

def get_complaints_by_priority(
    db: Session,
    created_by: Optional[int] = None,
    assigned_to: Optional[int] = None
):
    query = (
        db.query(
            Complaint.priority,
            func.count(Complaint.id)
        )
        .group_by(Complaint.priority)
        .order_by(Complaint.priority)
    )

    if created_by is not None:
        query = query.filter(
            Complaint.created_by == created_by
        )

    if assigned_to is not None:
        query = query.filter(
            Complaint.assigned_to == assigned_to
        )

    return query.all()


# =========================================================
# COMPLAINTS BY CATEGORY
# =========================================================

def get_complaints_by_category(
    db: Session,
    created_by: Optional[int] = None,
    assigned_to: Optional[int] = None
):
    query = (
        db.query(
            Category.id,
            Category.name,
            func.count(Complaint.id)
        )
        .join(
            Complaint,
            Complaint.category_id == Category.id
        )
        .group_by(
            Category.id,
            Category.name
        )
        .order_by(
            func.count(Complaint.id).desc()
        )
    )

    if created_by is not None:
        query = query.filter(
            Complaint.created_by == created_by
        )

    if assigned_to is not None:
        query = query.filter(
            Complaint.assigned_to == assigned_to
        )

    return query.all()


# =========================================================
# COMPLAINTS BY DEPARTMENT
# =========================================================

def get_complaints_by_department(
    db: Session,
    created_by: Optional[int] = None,
    assigned_to: Optional[int] = None
):
    query = (
        db.query(
            Department.id,
            Department.name,
            func.count(Complaint.id)
        )
        .join(
            Complaint,
            Complaint.department_id == Department.id
        )
        .group_by(
            Department.id,
            Department.name
        )
        .order_by(
            func.count(Complaint.id).desc()
        )
    )

    if created_by is not None:
        query = query.filter(
            Complaint.created_by == created_by
        )

    if assigned_to is not None:
        query = query.filter(
            Complaint.assigned_to == assigned_to
        )

    return query.all()


# =========================================================
# COUNT SPECIFIC STATUS
# =========================================================

def count_by_status(
    db: Session,
    complaint_status: ComplaintStatus,
    created_by: Optional[int] = None,
    assigned_to: Optional[int] = None
):
    query = (
        db.query(func.count(Complaint.id))
        .filter(
            Complaint.status == complaint_status
        )
    )

    if created_by is not None:
        query = query.filter(
            Complaint.created_by == created_by
        )

    if assigned_to is not None:
        query = query.filter(
            Complaint.assigned_to == assigned_to
        )

    return query.scalar() or 0


# =========================================================
# COUNT SPECIFIC PRIORITY
# =========================================================

def count_by_priority(
    db: Session,
    priority: ComplaintPriority,
    created_by: Optional[int] = None,
    assigned_to: Optional[int] = None
):
    query = (
        db.query(func.count(Complaint.id))
        .filter(
            Complaint.priority == priority
        )
    )

    if created_by is not None:
        query = query.filter(
            Complaint.created_by == created_by
        )

    if assigned_to is not None:
        query = query.filter(
            Complaint.assigned_to == assigned_to
        )

    return query.scalar() or 0