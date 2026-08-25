from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from app.Utils.enums import NotificationType


class NotificationResponse(BaseModel):
    id: int
    recipient_id: int
    complaint_id: Optional[int] = None
    title: str
    message: str
    notification_type: NotificationType
    is_read: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True