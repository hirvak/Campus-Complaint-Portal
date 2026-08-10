from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.Users.models import User
from app.Users.schemas import UserRegister
from app.Security.password import hash_password, verify_password
from app.Security.jwt_handler import create_access_token
from app.Utils.enums import UserRole


def register_user(
    user: UserRegister,
    db: Session
):
    user.email = user.email.strip().lower()
    user.full_name = user.full_name.strip()
    user.department = user.department.strip()

    if user.phone:
        user.phone = user.phone.strip()

    # Check if email already exists
    existing_user = db.query(User).filter(
        User.email == user.email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered."
        )

    # Only Student and Faculty can register
    if user.role not in [
        UserRole.STUDENT,
        UserRole.FACULTY
    ]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Student and Faculty can register."
        )

    # Student must select Day Scholar or Hosteller
    if user.role == UserRole.STUDENT:

        if user.student_type is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Student type is required for students."
            )

    # Faculty cannot have a student type
    if user.role == UserRole.FACULTY:

        if user.student_type is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Student type is only applicable to students."
            )

    new_user = User(
        full_name=user.full_name,
        email=user.email,
        password_hash=hash_password(user.password),
        role=user.role,
        department=user.department,
        phone=user.phone,
        student_type=user.student_type
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


def login_user(
    user,
    db: Session
):
    user.email = user.email.strip().lower()

    existing_user = db.query(User).filter(
        User.email == user.email
    ).first()

    if not existing_user:
        return None

    if not verify_password(
        user.password,
        existing_user.password_hash
    ):
        return None

    access_token = create_access_token(
        {
            "sub": existing_user.email,
            "role": existing_user.role.value
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }