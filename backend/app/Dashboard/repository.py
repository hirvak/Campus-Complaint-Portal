from sqlalchemy.orm import Session

from app.Complaints.models import Complaint
from app.Categories.models import Category
from app.Departments.models import Department
from app.Utils.enums import ComplaintStatus, ComplaintPriority


def get_total_complaints(
    db: Session
):
    return db.query(Complaint).count()


def get_complaint_count_by_status(
    db: Session,
    complaint_status: ComplaintStatus
):
    return (
        db.query(Complaint)
        .filter(
            Complaint.status == complaint_status
        )
        .count()
    )


def get_complaint_count_by_priority(
    db: Session,
    priority: ComplaintPriority
):
    return (
        db.query(Complaint)
        .filter(
            Complaint.priority == priority
        )
        .count()
    )


def get_complaints_by_category(
    db: Session
):
    results = (
        db.query(
            Category.name,
            Complaint.id
        )
        .join(
            Complaint,
            Complaint.category_id == Category.id
        )
        .all()
    )

    category_counts = {}

    for category_name, complaint_id in results:
        category_counts[category_name] = (
            category_counts.get(category_name, 0) + 1
        )

    return category_counts


def get_complaints_by_department(
    db: Session
):
    results = (
        db.query(
            Department.name,
            Complaint.id
        )
        .join(
            Complaint,
            Complaint.department_id == Department.id
        )
        .all()
    )

    department_counts = {}

    for department_name, complaint_id in results:
        department_counts[department_name] = (
            department_counts.get(department_name, 0) + 1
        )

    return department_counts


def get_complaints_by_user(
    db: Session,
    user_id: int
):
    return (
        db.query(Complaint)
        .filter(
            Complaint.created_by == user_id
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
        .all()
    )

def get_category_name(
    db: Session,
    category_id: int
):
    category = (
        db.query(Category)
        .filter(Category.id == category_id)
        .first()
    )

    if not category:
        return "Unknown"

    return category.name


def get_department_name(
    db: Session,
    department_id: int
):
    department = (
        db.query(Department)
        .filter(Department.id == department_id)
        .first()
    )

    if not department:
        return "Unknown"

    return department.name