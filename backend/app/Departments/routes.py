from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.Database.dependencies import get_db
from app.Departments.schemas import (
    DepartmentCreate,
    DepartmentUpdate,
    DepartmentResponse,
)
from app.Departments import service

from app.Security.permissions import require_roles
from app.Utils.enums import UserRole

router = APIRouter(
    prefix="/departments",
    tags=["Departments"]
)


@router.post(
    "/",
    response_model=DepartmentResponse,
    status_code=status.HTTP_201_CREATED
)
def create_department(
    department: DepartmentCreate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(UserRole.ADMIN)
    )
):
    return service.create_department(
        db=db,
        department=department
    )


@router.get(
    "/",
    response_model=list[DepartmentResponse]
)
def get_departments(
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(
            UserRole.ADMIN,
            UserRole.STUDENT,
            UserRole.FACULTY,
            UserRole.FACILITY_OFFICER,
            UserRole.MAINTENANCE_TEAM,
        )
    )
):
    return service.get_all_departments(db)


@router.get(
    "/{department_id}",
    response_model=DepartmentResponse
)
def get_department(
    department_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(
            UserRole.ADMIN,
            UserRole.STUDENT,
            UserRole.FACULTY,
            UserRole.FACILITY_OFFICER,
            UserRole.MAINTENANCE_TEAM,
        )
    )
):
    return service.get_department(
        db=db,
        department_id=department_id
    )


@router.put(
    "/{department_id}",
    response_model=DepartmentResponse
)
def update_department(
    department_id: int,
    updated_department: DepartmentUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(UserRole.ADMIN)
    )
):
    return service.update_department(
        db=db,
        department_id=department_id,
        updated_data=updated_department)


@router.delete(
    "/{department_id}",
    status_code=status.HTTP_200_OK
)
def delete_department(
    department_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(UserRole.ADMIN)
    )
):
    return service.delete_department(
        db=db,
        department_id=department_id
    )