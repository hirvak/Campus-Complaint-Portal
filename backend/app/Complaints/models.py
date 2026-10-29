from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    ForeignKey,
    DateTime,
    Enum,
    Boolean
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

    sla_deadline = Column(
        DateTime(timezone=True),
        nullable=True,
        index=True
    )

    is_escalated = Column(
        Boolean,
        default=False,
        nullable=False,
        index=True
    )

    escalated_at = Column(
        DateTime(timezone=True),
        nullable=True
    )

    escalation_level = Column(
        Integer,
        default=0,
        nullable=False
    )

    is_grandfathered = Column(
        Boolean,
        default=False,
        nullable=False
    )

    sla_cycle = Column(
        Integer,
        default=1,
        nullable=False
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

    @property
    def sla_status(self) -> str:
        from app.SLA.service import compute_sla_status
        return compute_sla_status(self)

    @property
    def time_remaining_seconds(self) -> int | None:
        from app.SLA.service import compute_time_remaining_seconds
        return compute_time_remaining_seconds(self)