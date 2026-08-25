from sqlalchemy.orm import Session

from app.ComplaintHistory.models import ComplaintHistory
from app.Utils.enums import ComplaintHistoryAction


def create_history(
    db: Session,
    complaint_id: int,
    action: ComplaintHistoryAction,
    description: str | None,
    performed_by: int
):
    history = ComplaintHistory(
        complaint_id=complaint_id,
        action=action.value,
        description=description,
        performed_by=performed_by
    )

    db.add(history)
    db.commit()
    db.refresh(history)

    return history


def get_complaint_history(
    db: Session,
    complaint_id: int
):
    return (
        db.query(ComplaintHistory)
        .filter(
            ComplaintHistory.complaint_id == complaint_id
        )
        .order_by(
            ComplaintHistory.created_at.asc()
        )
        .all()
    )