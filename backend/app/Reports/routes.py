from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.Database.session import get_db
from app.Auth.dependencies import get_current_user

from app.Users.models import User
from app.Reports import service
from app.Reports.schemas import (
    ReportSummary,
    StatusReport,
    PriorityReport,
    CategoryReport,
    DepartmentReport,
    CompleteReportResponse,
)

from app.Utils.enums import UserRole


router = APIRouter(
    prefix="/reports",
    tags=["Reports"]
)


# =========================================================
# ADMIN ACCESS CHECK
# =========================================================

def require_admin(
    current_user: User
):
    if current_user.role != UserRole.ADMIN:
        from fastapi import HTTPException, status

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin can access reports."
        )

    return current_user


# =========================================================
# COMPLETE REPORT
# Admin
# =========================================================

@router.get(
    "/",
    response_model=CompleteReportResponse
)
def get_complete_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    require_admin(current_user)

    return service.get_complete_report(
        db=db,
        current_user=current_user
    )


# =========================================================
# REPORT SUMMARY
# Admin
# =========================================================

@router.get(
    "/summary",
    response_model=ReportSummary
)
def get_report_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    require_admin(current_user)

    return service.get_report_summary(
        db=db,
        current_user=current_user
    )


# =========================================================
# STATUS REPORT
# Admin
# =========================================================

@router.get(
    "/status",
    response_model=List[StatusReport]
)
def get_status_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    require_admin(current_user)

    return service.get_status_report(
        db=db,
        current_user=current_user
    )


# =========================================================
# PRIORITY REPORT
# Admin
# =========================================================

@router.get(
    "/priority",
    response_model=List[PriorityReport]
)
def get_priority_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    require_admin(current_user)

    return service.get_priority_report(
        db=db,
        current_user=current_user
    )


# =========================================================
# CATEGORY REPORT
# Admin
# =========================================================

@router.get(
    "/categories",
    response_model=List[CategoryReport]
)
def get_category_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    require_admin(current_user)

    return service.get_category_report(
        db=db,
        current_user=current_user
    )


# =========================================================
# DEPARTMENT REPORT
# Admin
# =========================================================

@router.get(
    "/departments",
    response_model=List[DepartmentReport]
)
def get_department_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    require_admin(current_user)

    return service.get_department_report(
        db=db,
        current_user=current_user
    )