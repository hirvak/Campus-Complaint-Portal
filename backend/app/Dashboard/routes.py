from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.Auth.dependencies import get_current_user
from app.Database.dependencies import get_db
from app.Dashboard import service
from app.Dashboard.schemas import DashboardResponse
from app.Users.models import User


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


@router.get(
    "/",
    response_model=DashboardResponse
)
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return service.get_dashboard(
        db=db,
        current_user=current_user
    )