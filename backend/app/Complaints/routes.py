from fastapi import APIRouter, Depends, status, Request, UploadFile, File, HTTPException
from pydantic import ValidationError
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
    ComplaintListResponse,
)

from app.Utils.enums import (
    ComplaintStatus,
    ComplaintPriority
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
async def create_complaint(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    content_type = request.headers.get("content-type", "")
    if "multipart/form-data" in content_type or "application/x-www-form-urlencoded" in content_type:
        form = await request.form()
        title = form.get("title")
        description = form.get("description")
        category_id = form.get("category_id")
        location = form.get("location")
        file_obj = form.get("image") or form.get("file")

        if not title or not str(title).strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Title is required."
            )
        if not description or not str(description).strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Description is required."
            )
        if not category_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Category ID is required."
            )
        try:
            category_id = int(category_id)
        except (ValueError, TypeError):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Category ID must be an integer."
            )
        if not location or not str(location).strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Location is required."
            )

        image_url = None
        if file_obj and hasattr(file_obj, "filename") and file_obj.filename:
            image_url = await service.save_complaint_image(file_obj)
        elif form.get("image_url"):
            image_url = str(form.get("image_url")).strip() or None

        try:
            complaint_data = ComplaintCreate(
                title=str(title).strip(),
                description=str(description).strip(),
                category_id=category_id,
                location=str(location).strip(),
                image_url=image_url
            )
        except ValidationError as ve:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=ve.errors()
            )
    else:
        body = await request.json()
        try:
            complaint_data = ComplaintCreate(**body)
        except ValidationError as ve:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=ve.errors()
            )

    return service.create_complaint(
        db=db,
        complaint_data=complaint_data,
        current_user=current_user
    )


# =========================================================
# UPLOAD COMPLAINT IMAGE
# =========================================================

@router.post(
    "/upload-image",
    status_code=status.HTTP_201_CREATED
)
async def upload_complaint_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    image_url = await service.save_complaint_image(file)
    return {"image_url": image_url}



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
# SEARCH / FILTER / PAGINATION
# =========================================================

@router.get(
    "/search",
    response_model=ComplaintListResponse
)
def search_complaints(
    search: str | None = None,
    status_filter: ComplaintStatus | None = None,
    priority: ComplaintPriority | None = None,
    category_id: int | None = None,
    department_id: int | None = None,
    page: int = 1,
    page_size: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return service.search_complaints(
        db=db,
        current_user=current_user,
        search=search,
        complaint_status=status_filter,
        priority=priority,
        category_id=category_id,
        department_id=department_id,
        page=page,
        page_size=page_size
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