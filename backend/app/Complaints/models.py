from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    ForeignKey,
    DateTime,
    Enum
)
from sqlalchemy.sql import func

from app.Database.base import Base
from app.Utils.enums import ComplaintStatus, ComplaintPriority


class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    title = Column(
        String(200),
        nullable=False
    )

    description = Column(
        Text,
        nullable=False
    )

    category_id = Column(
        Integer,
        ForeignKey("categories.id"),
        nullable=False
    )

    department_id = Column(
        Integer,
        ForeignKey("departments.id"),
        nullable=False
    )

    location = Column(
        String(255),
        nullable=False
    )

    image_url = Column(
        String(500),
        nullable=True
    )

    status = Column(
        Enum(ComplaintStatus),
        nullable=False,
        default=ComplaintStatus.NEW
    )

    priority = Column(
        Enum(ComplaintPriority),
        nullable=False,
        default=ComplaintPriority.MEDIUM
    )

    created_by = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    assigned_to = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True
    )

    resolution_remarks = Column(
        Text,
        nullable=True
    )

    completion_image = Column(
        String(500),
        nullable=True
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )