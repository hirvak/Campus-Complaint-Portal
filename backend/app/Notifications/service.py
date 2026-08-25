from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.Notifications import repository
from app.Notifications.models import Notification
from app.Users.models import User
from app.Utils.enums import NotificationType


def create_notification(
    db: Session,
    recipient_id: int,
    title: str,
    message: str,
    notification_type: NotificationType,
    complaint_id: int | None = None
):
    notification = Notification(
        recipient_id=recipient_id,
        complaint_id=complaint_id,
        title=title,
        message=message,
        notification_type=notification_type,
        is_read=False
    )

    return repository.create_notification(
        db=db,
        notification=notification
    )


def get_my_notifications(
    db: Session,
    current_user: User
):
    return repository.get_notifications_by_user(
        db=db,
        user_id=current_user.id
    )


def get_my_unread_notifications(
    db: Session,
    current_user: User
):
    return repository.get_unread_notifications_by_user(
        db=db,
        user_id=current_user.id
    )


def mark_as_read(
    db: Session,
    notification_id: int,
    current_user: User
):
    notification = repository.get_notification_by_id(
        db=db,
        notification_id=notification_id
    )

    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found."
        )

    # User can only modify their own notification
    if notification.recipient_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only access your own notifications."
        )

    return repository.mark_notification_as_read(
        db=db,
        notification=notification
    )


def mark_all_as_read(
    db: Session,
    current_user: User
):
    return repository.mark_all_notifications_as_read(
        db=db,
        user_id=current_user.id
    )