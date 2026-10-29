from typing import List
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session

from app.Database.session import get_db
from app.Auth.dependencies import get_current_user
from app.Users.models import User
from app.Utils.enums import UserRole
from app.SLA import service
from app.SLA.schemas import (
    SLAConfigResponse,
    SLAConfigCreate,
    SLAConfigUpdate,
    EscalationCheckResult
)

router = APIRouter(
    prefix="/sla",
    tags=["SLA & Escalation"]
)


def verify_admin(current_user: User):
    """Enforces administrator role authorization."""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators are authorized to manage SLA configurations."
        )


# =========================================================
# 1. GET ALL SLA CONFIGS (Admin only)
# =========================================================

@router.get(
    "/configs",
    response_model=List[SLAConfigResponse],
    summary="Get all SLA configurations"
)
def get_sla_configs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    verify_admin(current_user)
    return service.get_all_sla_configs(db=db)


# =========================================================
# 2. CREATE SLA CONFIG (Admin only)
# =========================================================

@router.post(
    "/configs",
    response_model=SLAConfigResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a category or priority SLA configuration"
)
def create_sla_config(
    config_data: SLAConfigCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    verify_admin(current_user)
    return service.create_sla_config(db=db, config_data=config_data)


# =========================================================
# 3. UPDATE SLA CONFIG (Admin only)
# =========================================================

@router.put(
    "/configs/{config_id}",
    response_model=SLAConfigResponse,
    summary="Update an existing SLA configuration"
)
def update_sla_config(
    config_id: int,
    update_data: SLAConfigUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    verify_admin(current_user)
    return service.update_sla_config(
        db=db,
        config_id=config_id,
        update_data=update_data
    )


# =========================================================
# 4. TRIGGER ON-DEMAND SLA ESCALATION CHECK (Admin only)
# =========================================================

@router.post(
    "/check-now",
    response_model=EscalationCheckResult,
    summary="Run an on-demand check for overdue complaints and trigger escalations"
)
def trigger_sla_check_now(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    verify_admin(current_user)
    return service.check_and_escalate_overdue_complaints(
        db=db,
        triggered_by_user=current_user
    )


# =========================================================
# 5. GET SLA WORKER STATUS (Admin only)
# =========================================================

@router.get(
    "/worker-status",
    summary="Get background SLA worker operational status"
)
def get_sla_worker_status(
    current_user: User = Depends(get_current_user)
):
    verify_admin(current_user)
    from app.SLA.worker import sla_worker
    return sla_worker.get_status()
