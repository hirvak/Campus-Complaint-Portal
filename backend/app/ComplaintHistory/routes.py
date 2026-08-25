from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.Database.session import get_db
from app.Auth.dependencies import get_current_user

from app.ComplaintHistory import service
from app.ComplaintHistory.schemas import ComplaintHistoryResponse
from app.Users.models import User


router = APIRouter(
    prefix="/complaints",
    tags=["Complaint History"]
)


@router.get(
    "/{complaint_id}/history",
    response_model=list[ComplaintHistoryResponse]
)
def get_complaint_history(
    complaint_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return service.get_complaint_history(
        db=db,
        complaint_id=complaint_id,
        current_user=current_user
    )