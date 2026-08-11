from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.Database.dependencies import get_db
from app.Categories.schemas import (
    CategoryCreate,
    CategoryUpdate,
    CategoryResponse
)
from app.Categories import service
from app.Security.permissions import require_roles
from app.Utils.enums import UserRole


router = APIRouter(
    prefix="/categories",
    tags=["Categories"]
)


@router.post(
    "/",
    response_model=CategoryResponse
)
def create_category(
    category: CategoryCreate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(UserRole.ADMIN)
    )
):
    return service.create_category(
        db=db,
        category=category
    )


@router.get(
    "/",
    response_model=list[CategoryResponse]
)
def get_categories(
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(
            UserRole.ADMIN,
            UserRole.STUDENT,
            UserRole.FACULTY,
            UserRole.FACILITY_OFFICER,
            UserRole.MAINTENANCE_TEAM
        )
    )
):
    return service.get_all_categories(db)


@router.get(
    "/{category_id}",
    response_model=CategoryResponse
)
def get_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(
            UserRole.ADMIN,
            UserRole.STUDENT,
            UserRole.FACULTY,
            UserRole.FACILITY_OFFICER,
            UserRole.MAINTENANCE_TEAM
        )
    )
):
    return service.get_category(
        db=db,
        category_id=category_id
    )


@router.get(
    "/department/{department_id}",
    response_model=list[CategoryResponse]
)
def get_categories_by_department(
    department_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(
            UserRole.ADMIN,
            UserRole.STUDENT,
            UserRole.FACULTY,
            UserRole.FACILITY_OFFICER,
            UserRole.MAINTENANCE_TEAM
        )
    )
):
    return service.get_categories_by_department(
        db=db,
        department_id=department_id
    )


@router.put(
    "/{category_id}",
    response_model=CategoryResponse
)
def update_category(
    category_id: int,
    updated_category: CategoryUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(UserRole.ADMIN)
    )
):
    return service.update_category(
        db=db,
        category_id=category_id,
        updated_data=updated_category
    )


@router.delete(
    "/{category_id}"
)
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(UserRole.ADMIN)
    )
):
    return service.delete_category(
        db=db,
        category_id=category_id
    )