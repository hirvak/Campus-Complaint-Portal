from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    ForeignKey,
    DateTime,
    Enum,
    UniqueConstraint,
    CheckConstraint,
    Index
)
from sqlalchemy.sql import func
from app.Database.base import Base
from app.Utils.enums import ComplaintPriority


class SLAConfig(Base):
    __tablename__ = "sla_configs"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    # Category-specific override (NULL when priority rule)
    category_id = Column(
        Integer,
        ForeignKey("categories.id", ondelete="CASCADE"),
        nullable=True,
        index=True
    )

    # Priority-level default (NULL when category rule)
    priority = Column(
        Enum(ComplaintPriority),
        nullable=True,
        index=True
    )

    # Resolution target in hours
    target_hours = Column(
        Integer,
        nullable=False
    )

    # Warning threshold in hours before deadline to trigger warning
    warning_hours = Column(
        Integer,
        nullable=False,
        default=1
    )

    is_active = Column(
        Boolean,
        default=True,
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

    __table_args__ = (
        # Ensure mutually exclusive rule type: either category-specific OR priority-specific
        CheckConstraint(
            "(category_id IS NOT NULL AND priority IS NULL) OR (category_id IS NULL AND priority IS NOT NULL)",
            name="ck_sla_config_target"
        ),
        # Ensure positive target hours and warning hours strictly less than target
        CheckConstraint(
            "target_hours > 0 AND warning_hours > 0 AND warning_hours < target_hours",
            name="ck_sla_config_hours"
        ),
        # Partial unique index: at most one active rule per category
        Index(
            "uq_sla_config_category",
            "category_id",
            unique=True,
            postgresql_where=(category_id.isnot(None))
        ),
        # Partial unique index: at most one active rule per priority
        Index(
            "uq_sla_config_priority",
            "priority",
            unique=True,
            postgresql_where=(priority.isnot(None))
        ),
    )


class EscalationEvent(Base):
    __tablename__ = "escalation_events"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    complaint_id = Column(
        Integer,
        ForeignKey("complaints.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # SLA Cycle identifier: increments on reopen (1 for initial, 2 for first reopen, etc.)
    sla_cycle = Column(
        Integer,
        nullable=False,
        default=1
    )

    escalation_level = Column(
        Integer,
        nullable=False,
        default=1
    )

    escalated_to = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    reason = Column(
        String(255),
        nullable=False
    )

    escalated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    __table_args__ = (
        # Uniqueness scoped to (complaint_id, sla_cycle, escalation_level):
        # Prevents duplicate escalations within the same cycle, but allows repeat escalations across cycles if reopened
        UniqueConstraint(
            "complaint_id",
            "sla_cycle",
            "escalation_level",
            name="uq_complaint_cycle_escalation_level"
        ),
    )
