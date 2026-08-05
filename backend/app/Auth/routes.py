from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.Database.dependencies import get_db
from app.Users.schemas import (
    UserRegister,
    UserResponse,
    UserLogin,
    Token
)
from app.Auth.service import register_user, login_user

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED
)
def register(
    user: UserRegister,
    db: Session = Depends(get_db)
):
    return register_user(user, db)


@router.post(
    "/login",
    response_model=Token,
    status_code=status.HTTP_200_OK
)
def login(
    user: UserLogin,
    db: Session = Depends(get_db)
):
    token = login_user(user, db)

    if token is None:
        from fastapi import HTTPException

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    return token