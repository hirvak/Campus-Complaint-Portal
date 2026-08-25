from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.Auth.dependencies import get_current_user
from app.Database.dependencies import get_db

from app.Users.models import User
from app.Users.schemas import (
    UserResponse,
    AdminCreateUser,
    UserStatusUpdate
)
from app.Users import services


router = APIRouter(
    prefix="/users",
    tags=["Users"]
)


# Get current logged-in user
@router.get(
    "/me",
    response_model=UserResponse
)
def get_me(
    current_user: User = Depends(get_current_user)
):
    return current_user


# Admin creates Facility Officer / Maintenance Team
@router.post(
    "/",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED
)
def create_user_by_admin(
    user: AdminCreateUser,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return services.create_admin_user(
        user=user,
        db=db,
        current_user=current_user
    )


# Admin views all users
@router.get(
    "/",
    response_model=list[UserResponse]
)
def get_all_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return services.get_all_users(
        db=db,
        current_user=current_user
    )


# Admin views a specific user
@router.get(
    "/{user_id}",
    response_model=UserResponse
)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return services.get_user_by_id(
        db=db,
        user_id=user_id,
        current_user=current_user
    )


# Admin activates / deactivates a user
@router.patch(
    "/{user_id}/status",
    response_model=UserResponse
)
def update_user_status(
    user_id: int,
    status_data: UserStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return services.update_user_status(
        db=db,
        user_id=user_id,
        is_active=status_data.is_active,
        current_user=current_user
    )