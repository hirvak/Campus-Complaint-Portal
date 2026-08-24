from sqlalchemy.orm import Session

from app.Complaints.models import Complaint


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
        .filter(Complaint.created_by == user_id)
        .order_by(Complaint.created_at.desc())
        .all()
    )


def get_complaints_by_assigned_user(
    db: Session,
    user_id: int
):
    return (
        db.query(Complaint)
        .filter(Complaint.assigned_to == user_id)
        .order_by(Complaint.created_at.desc())
        .all()
    )


def get_complaints_by_status(
    db: Session,
    status
):
    return (
        db.query(Complaint)
        .filter(Complaint.status == status)
        .order_by(Complaint.created_at.desc())
        .all()
    )


def update_complaint(
    db: Session,
    complaint: Complaint
):
    db.commit()
    db.refresh(complaint)

    return complaint