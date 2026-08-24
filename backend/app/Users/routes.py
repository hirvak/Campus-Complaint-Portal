from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.Auth.dependencies import get_current_user
from app.Database.session import get_db

from app.Users.models import User
from app.Users.schemas import (
    UserResponse,
    AdminCreateUser
)
from app.Users import services


router = APIRouter(
    prefix="/users",
    tags=["Users"]
)


@router.get(
    "/me",
    response_model=UserResponse
)
def get_me(
    current_user: User = Depends(get_current_user)
):
    return current_user


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