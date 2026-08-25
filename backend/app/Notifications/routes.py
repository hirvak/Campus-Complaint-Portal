from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.Auth.dependencies import get_current_user
from app.Database.dependencies import get_db
from app.Notifications import service
from app.Notifications.schemas import NotificationResponse
from app.Users.models import User


router = APIRouter(
    prefix="/notifications",
    tags=["Notifications"]
)


@router.get(
    "/",
    response_model=list[NotificationResponse]
)
def get_my_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return service.get_my_notifications(
        db=db,
        current_user=current_user
    )


@router.get(
    "/unread",
    response_model=list[NotificationResponse]
)
def get_my_unread_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return service.get_my_unread_notifications(
        db=db,
        current_user=current_user
    )


@router.patch(
    "/read-all"
)
def mark_all_notifications_as_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notifications = service.mark_all_as_read(
        db=db,
        current_user=current_user
    )

    return {
        "message": "All notifications marked as read.",
        "count": len(notifications)
    }


@router.patch(
    "/{notification_id}/read",
    response_model=NotificationResponse
)
def mark_notification_as_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return service.mark_as_read(
        db=db,
        notification_id=notification_id,
        current_user=current_user
    )