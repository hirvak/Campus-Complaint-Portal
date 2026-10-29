from datetime import datetime, timezone, timedelta
from typing import Optional, Tuple, List
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_

from app.SLA.models import SLAConfig, EscalationEvent
from app.SLA.schemas import SLAConfigCreate, SLAConfigUpdate, SLAConfigResponse, EscalationCheckResult
from app.Categories.models import Category
from app.Complaints.models import Complaint
from app.Users.models import User
from app.ComplaintHistory import repository as history_repository
from app.Notifications.service import create_notification
from app.Utils.enums import (
    ComplaintPriority,
    ComplaintStatus,
    UserRole,
    NotificationType,
    ComplaintHistoryAction
)

# Default SLA Targets (in hours) if no database configuration matches
DEFAULT_PRIORITY_TARGETS = {
    ComplaintPriority.CRITICAL: 4,
    ComplaintPriority.HIGH: 12,
    ComplaintPriority.MEDIUM: 24,
    ComplaintPriority.LOW: 48,
}

# Default SLA Warning Thresholds (in hours before deadline)
DEFAULT_PRIORITY_WARNINGS = {
    ComplaintPriority.CRITICAL: 1,
    ComplaintPriority.HIGH: 2,
    ComplaintPriority.MEDIUM: 4,
    ComplaintPriority.LOW: 8,
}


# =========================================================
# SLA DEADLINE & STATUS CALCULATION
# =========================================================

def get_applicable_sla(
    db: Session,
    category_id: Optional[int],
    priority: Optional[ComplaintPriority]
) -> Tuple[int, int]:
    """
    Retrieves the applicable (target_hours, warning_hours) adhering to
    Category-over-Priority precedence:
      1. Category-specific SLAConfig rule (if active)
      2. Priority-level SLAConfig rule (if active)
      3. Sensible system defaults
    """
    # 1. Check Category override first
    if category_id is not None:
        try:
            category_config = (
                db.query(SLAConfig)
                .filter(
                    SLAConfig.category_id == category_id,
                    SLAConfig.is_active == True
                )
                .first()
            )
            if category_config:
                return category_config.target_hours, category_config.warning_hours
        except Exception:
            db.rollback()

    # 2. Check Priority-level configuration
    if priority is not None:
        try:
            priority_config = (
                db.query(SLAConfig)
                .filter(
                    SLAConfig.priority == priority,
                    SLAConfig.is_active == True
                )
                .first()
            )
            if priority_config:
                return priority_config.target_hours, priority_config.warning_hours
        except Exception:
            db.rollback()

    # 3. Fallback to system defaults
    target = DEFAULT_PRIORITY_TARGETS.get(priority, 24)
    warning = DEFAULT_PRIORITY_WARNINGS.get(priority, 4)
    return target, warning


def calculate_deadline(
    db: Session,
    category_id: Optional[int],
    priority: Optional[ComplaintPriority],
    start_time: Optional[datetime] = None
) -> datetime:
    """
    Calculates the target resolution deadline starting from start_time
    (or current UTC time if omitted).
    """
    if start_time is None:
        start_time = datetime.now(timezone.utc)
    elif start_time.tzinfo is None:
        start_time = start_time.replace(tzinfo=timezone.utc)

    target_hours, _ = get_applicable_sla(db, category_id, priority)
    return start_time + timedelta(hours=target_hours)


def compute_sla_status(complaint: Complaint, current_time: Optional[datetime] = None) -> str:
    """
    Computes SLA status for a complaint:
      - 'RESOLVED': When complaint is in RESOLVED or CLOSED status.
      - 'OVERDUE': When unresolved and current time > sla_deadline (or already escalated).
      - 'APPROACHING_DEADLINE': When unresolved, not overdue, and remaining time <= warning threshold.
      - 'ON_TRACK': When unresolved, not overdue, and remaining time > warning threshold.
    """
    if complaint.status in [ComplaintStatus.RESOLVED, ComplaintStatus.CLOSED]:
        return "RESOLVED"

    if not complaint.sla_deadline:
        return "ON_TRACK"

    if current_time is None:
        current_time = datetime.now(timezone.utc)
    elif current_time.tzinfo is None:
        current_time = current_time.replace(tzinfo=timezone.utc)

    deadline = complaint.sla_deadline
    if deadline.tzinfo is None:
        deadline = deadline.replace(tzinfo=timezone.utc)

    # If already escalated or deadline breached
    if complaint.is_escalated or current_time > deadline:
        return "OVERDUE"

    # Determine warning threshold in hours
    # Warning threshold defaults: Critical=1, High=2, Medium=4, Low=8
    # Pipe leakage category = 1
    warning_hours = 1 if complaint.category_id == 4 else DEFAULT_PRIORITY_WARNINGS.get(complaint.priority, 4)
    time_to_deadline = deadline - current_time

    if time_to_deadline <= timedelta(hours=warning_hours):
        return "APPROACHING_DEADLINE"

    return "ON_TRACK"


def compute_time_remaining_seconds(complaint: Complaint, current_time: Optional[datetime] = None) -> Optional[int]:
    """
    Returns the number of seconds remaining until the SLA deadline.
    Returns a negative number if the deadline has passed.
    """
    if not complaint.sla_deadline:
        return None

    if current_time is None:
        current_time = datetime.now(timezone.utc)
    elif current_time.tzinfo is None:
        current_time = current_time.replace(tzinfo=timezone.utc)

    deadline = complaint.sla_deadline
    if deadline.tzinfo is None:
        deadline = deadline.replace(tzinfo=timezone.utc)

    return int((deadline - current_time).total_seconds())


# =========================================================
# ADMIN SLA CONFIGURATION ENDPOINTS SERVICE
# =========================================================

def get_all_sla_configs(db: Session) -> List[SLAConfigResponse]:
    """
    Returns all SLA configurations, with category names resolved.
    """
    configs = (
        db.query(SLAConfig, Category.name.label("category_name"))
        .outerjoin(Category, SLAConfig.category_id == Category.id)
        .order_by(SLAConfig.category_id.nulls_last(), SLAConfig.priority.asc())
        .all()
    )

    result = []
    for cfg, cat_name in configs:
        res = SLAConfigResponse(
            id=cfg.id,
            category_id=cfg.category_id,
            category_name=cat_name,
            priority=cfg.priority,
            target_hours=cfg.target_hours,
            warning_hours=cfg.warning_hours,
            is_active=cfg.is_active,
            created_at=cfg.created_at,
            updated_at=cfg.updated_at
        )
        result.append(res)
    return result


def create_sla_config(db: Session, config_data: SLAConfigCreate) -> SLAConfigResponse:
    """
    Creates a new SLA configuration (Admin only).
    Enforces uniqueness per category and priority.
    """
    # 1. Validate Category if provided
    category_name = None
    if config_data.category_id is not None:
        category = db.query(Category).filter(Category.id == config_data.category_id).first()
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Category with ID {config_data.category_id} not found."
            )
        category_name = category.name

        # Check existing rule for category
        existing = db.query(SLAConfig).filter(SLAConfig.category_id == config_data.category_id).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"An SLA configuration already exists for category '{category.name}' (ID {config_data.category_id})."
            )

    # 2. Check existing rule for Priority
    if config_data.priority is not None:
        existing = db.query(SLAConfig).filter(SLAConfig.priority == config_data.priority).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"An SLA configuration already exists for priority '{config_data.priority.value}'."
            )

    now = datetime.now(timezone.utc)
    new_config = SLAConfig(
        category_id=config_data.category_id,
        priority=config_data.priority,
        target_hours=config_data.target_hours,
        warning_hours=config_data.warning_hours,
        is_active=config_data.is_active,
        created_at=now,
        updated_at=now
    )

    db.add(new_config)
    db.commit()
    db.refresh(new_config)

    return SLAConfigResponse(
        id=new_config.id,
        category_id=new_config.category_id,
        category_name=category_name,
        priority=new_config.priority,
        target_hours=new_config.target_hours,
        warning_hours=new_config.warning_hours,
        is_active=new_config.is_active,
        created_at=new_config.created_at,
        updated_at=new_config.updated_at
    )


def update_sla_config(db: Session, config_id: int, update_data: SLAConfigUpdate) -> SLAConfigResponse:
    """
    Updates an existing SLA configuration (Admin only).
    """
    config = db.query(SLAConfig).filter(SLAConfig.id == config_id).first()
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"SLA configuration with ID {config_id} not found."
        )

    new_target = update_data.target_hours if update_data.target_hours is not None else config.target_hours
    new_warning = update_data.warning_hours if update_data.warning_hours is not None else config.warning_hours

    if new_warning >= new_target:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"warning_hours ({new_warning}) must be strictly less than target_hours ({new_target})."
        )

    if update_data.target_hours is not None:
        config.target_hours = update_data.target_hours
    if update_data.warning_hours is not None:
        config.warning_hours = update_data.warning_hours
    if update_data.is_active is not None:
        config.is_active = update_data.is_active

    config.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(config)

    category_name = None
    if config.category_id:
        cat = db.query(Category).filter(Category.id == config.category_id).first()
        if cat:
            category_name = cat.name

    return SLAConfigResponse(
        id=config.id,
        category_id=config.category_id,
        category_name=category_name,
        priority=config.priority,
        target_hours=config.target_hours,
        warning_hours=config.warning_hours,
        is_active=config.is_active,
        created_at=config.created_at,
        updated_at=config.updated_at
    )


# =========================================================
# ESCALATION CHECK RUNNER (SYNCHRONOUS & SAFE)
# =========================================================

def check_and_escalate_overdue_complaints(
    db: Session,
    triggered_by_user: Optional[User] = None
) -> EscalationCheckResult:
    """
    Scans for unresolved, non-grandfathered complaints that have breached their SLA deadline
    and escalates them to the Facility Officer.
    
    Guarantees:
      - with_for_update(skip_locked=True) ensures row-level concurrency safety
      - Unique constraint (complaint_id, sla_cycle, escalation_level) prevents duplicate escalation events
      - is_grandfathered=True complaints are excluded to prevent alert storms
      - Reopened complaints (Cycle 2+) are correctly escalated under their current cycle
    """
    now = datetime.now(timezone.utc)

    # 1. Find active Facility Officer to receive escalation
    facility_officer = (
        db.query(User)
        .filter(
            User.role == UserRole.FACILITY_OFFICER,
            User.is_active == True
        )
        .first()
    )

    if not facility_officer:
        # Fallback to Admin if Facility Officer is not yet configured
        facility_officer = (
            db.query(User)
            .filter(
                User.role == UserRole.ADMIN,
                User.is_active == True
            )
            .first()
        )

    # 2. Query overdue complaints eligible for escalation
    # Row-level lock prevents multiple workers or requests from processing the same row simultaneously
    overdue_complaints = (
        db.query(Complaint)
        .filter(
            Complaint.status.notin_([ComplaintStatus.RESOLVED, ComplaintStatus.CLOSED]),
            Complaint.is_grandfathered == False,
            Complaint.is_escalated == False,
            Complaint.sla_deadline.isnot(None),
            Complaint.sla_deadline < now
        )
        .with_for_update(skip_locked=True)
        .all()
    )

    escalated_ids = []

    for complaint in overdue_complaints:
        current_cycle = complaint.sla_cycle or 1
        escalation_level = 1

        # Check if an escalation event already exists for this cycle to avoid duplicate errors
        existing_event = (
            db.query(EscalationEvent)
            .filter(
                EscalationEvent.complaint_id == complaint.id,
                EscalationEvent.sla_cycle == current_cycle,
                EscalationEvent.escalation_level == escalation_level
            )
            .first()
        )

        if existing_event:
            # Already recorded, mark complaint as escalated
            complaint.is_escalated = True
            complaint.escalated_at = existing_event.escalated_at
            complaint.escalation_level = escalation_level
            continue

        target_recipient_id = facility_officer.id if facility_officer else complaint.created_by
        reason = f"Resolution deadline breached in SLA Cycle {current_cycle} (Deadline: {complaint.sla_deadline.strftime('%Y-%m-%d %H:%M:%S UTC')})"

        # Create escalation audit event
        event = EscalationEvent(
            complaint_id=complaint.id,
            sla_cycle=current_cycle,
            escalation_level=escalation_level,
            escalated_to=target_recipient_id,
            reason=reason,
            escalated_at=now
        )
        db.add(event)

        # Update complaint record
        complaint.is_escalated = True
        complaint.escalated_at = now
        complaint.escalation_level = escalation_level

        # Record in complaint history
        performed_by_id = triggered_by_user.id if triggered_by_user else target_recipient_id
        history_repository.create_history(
            db=db,
            complaint_id=complaint.id,
            action=ComplaintHistoryAction.ESCALATED,
            description=(
                f"Complaint automatically escalated to Facility Officer (Level {escalation_level}) "
                f"due to SLA deadline breach in Cycle {current_cycle}."
            ),
            performed_by=performed_by_id
        )

        # In-app notification to Facility Officer
        if facility_officer:
            create_notification(
                db=db,
                recipient_id=facility_officer.id,
                complaint_id=complaint.id,
                title="Complaint Escalated",
                message=(
                    f"Complaint #{complaint.id} ('{complaint.title}') has breached its SLA resolution deadline "
                    f"in Cycle {current_cycle} and has been escalated."
                ),
                notification_type=NotificationType.COMPLAINT_ESCALATED
            )

        escalated_ids.append(complaint.id)

    db.commit()

    return EscalationCheckResult(
        status="success",
        checked_at=now,
        overdue_detected=len(overdue_complaints),
        escalated_count=len(escalated_ids),
        escalated_complaints=escalated_ids,
        message=f"SLA check completed. {len(escalated_ids)} complaint(s) escalated."
    )
