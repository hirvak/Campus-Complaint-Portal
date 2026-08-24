from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List

from app.Database.session import get_db
from app.Auth.dependencies import get_current_user

from app.Users.models import User

from app.Complaints import service
from app.Complaints.schemas import (
    ComplaintCreate,
    ComplaintResponse,
    ComplaintAssign,
    ComplaintStatusUpdate,
    ComplaintResolve,
)

router = APIRouter(
    prefix="/complaints",
    tags=["Complaints"]
)


# =========================================================
# CREATE COMPLAINT
# Student / Faculty
# =========================================================

@router.post(
    "/",
    response_model=ComplaintResponse,
    status_code=status.HTTP_201_CREATED
)
def create_complaint(
    complaint: ComplaintCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return service.create_complaint(
        db=db,
        complaint_data=complaint,
        current_user=current_user
    )


# =========================================================
# GET MY COMPLAINTS
# Student / Faculty
# =========================================================

@router.get(
    "/my",
    response_model=List[ComplaintResponse]
)
def get_my_complaints(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return service.get_my_complaints(
        db=db,
        current_user=current_user
    )


# =========================================================
# GET ASSIGNED COMPLAINTS
# Maintenance Team
# =========================================================

@router.get(
    "/assigned",
    response_model=List[ComplaintResponse]
)
def get_assigned_complaints(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return service.get_assigned_complaints(
        db=db,
        current_user=current_user
    )


# =========================================================
# GET NEW / REOPENED COMPLAINTS
# Facility Officer
# =========================================================

@router.get(
    "/pending",
    response_model=List[ComplaintResponse]
)
def get_pending_complaints(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return service.get_pending_complaints(
        db=db,
        current_user=current_user
    )


# =========================================================
# GET ALL COMPLAINTS
# Admin / Facility Officer
# =========================================================

@router.get(
    "/all",
    response_model=List[ComplaintResponse]
)
def get_all_complaints(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return service.get_all_complaints(
        db=db,
        current_user=current_user
    )


# =========================================================
# GET SINGLE COMPLAINT
# =========================================================

@router.get(
    "/{complaint_id}",
    response_model=ComplaintResponse
)
def get_complaint(
    complaint_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return service.get_complaint(
        db=db,
        complaint_id=complaint_id,
        current_user=current_user
    )


# =========================================================
# ASSIGN COMPLAINT
# Facility Officer
# =========================================================

@router.post(
    "/{complaint_id}/assign",
    response_model=ComplaintResponse
)
def assign_complaint(
    complaint_id: int,
    assignment: ComplaintAssign,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return service.assign_complaint(
        db=db,
        complaint_id=complaint_id,
        assignment_data=assignment,
        current_user=current_user
    )


# =========================================================
# UPDATE STATUS
# Maintenance Team
# =========================================================

@router.patch(
    "/{complaint_id}/status",
    response_model=ComplaintResponse
)
def update_complaint_status(
    complaint_id: int,
    status_data: ComplaintStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return service.update_complaint_status(
        db=db,
        complaint_id=complaint_id,
        status_data=status_data,
        current_user=current_user
    )


# =========================================================
# RESOLVE COMPLAINT
# Maintenance Team
# =========================================================

@router.post(
    "/{complaint_id}/resolve",
    response_model=ComplaintResponse
)
def resolve_complaint(
    complaint_id: int,
    resolution: ComplaintResolve,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return service.resolve_complaint(
        db=db,
        complaint_id=complaint_id,
        resolution_data=resolution,
        current_user=current_user
    )


# =========================================================
# CLOSE COMPLAINT
# Student / Faculty
# =========================================================

@router.post(
    "/{complaint_id}/close",
    response_model=ComplaintResponse
)
def close_complaint(
    complaint_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return service.close_complaint(
        db=db,
        complaint_id=complaint_id,
        current_user=current_user
    )


# =========================================================
# REOPEN COMPLAINT
# Student / Faculty
# =========================================================

@router.post(
    "/{complaint_id}/reopen",
    response_model=ComplaintResponse
)
def reopen_complaint(
    complaint_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return service.reopen_complaint(
        db=db,
        complaint_id=complaint_id,
        current_user=current_user
    )