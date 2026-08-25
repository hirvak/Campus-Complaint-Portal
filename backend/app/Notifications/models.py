from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    ForeignKey,
    Boolean,
    DateTime,
    Enum
)

from sqlalchemy.sql import func

from app.Database.base import Base
from app.Utils.enums import NotificationType


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    recipient_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    complaint_id = Column(
        Integer,
        ForeignKey("complaints.id"),
        nullable=True
    )

    title = Column(
        String(200),
        nullable=False
    )

    message = Column(
        Text,
        nullable=False
    )

    notification_type = Column(
        Enum(NotificationType),
        nullable=False
    )

    is_read = Column(
        Boolean,
        default=False,
        nullable=False
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )