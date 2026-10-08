from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.Database.dependencies import get_db
from app.Users.schemas import (
    UserRegister,
    UserResponse,
    UserLogin,
    Token,
    GoogleAuthLogin
)
from app.Auth.service import register_user, login_user, google_login_user


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
    response_model=Token
)
def login(
    user: UserLogin,
    db: Session = Depends(get_db)
):
    token = login_user(user, db)

    if token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    return token


@router.post(
    "/google",
    response_model=Token
)
def google_auth(
    data: GoogleAuthLogin,
    db: Session = Depends(get_db)
):
    return google_login_user(data, db)