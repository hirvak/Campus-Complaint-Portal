from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.Users.models import User
from app.Users.schemas import UserRegister,UserLogin
from app.Security.password import hash_password,verify_password
from app.Security.jwt_handler import create_access_token
from app.Utils.enums import UserRole


def register_user(user: UserRegister, db: Session):

    user.email = user.email.strip().lower()
    user.full_name = user.full_name.strip()
    user.department = user.department.strip()

    if user.phone:
        user.phone = user.phone.strip()
    existing_user = db.query(User).filter(
        User.email == user.email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=409,
            detail="Email already registered."
        )
    if user.role not in [UserRole.STUDENT,UserRole.FACULTY]:
        raise HTTPException(
            status_code=403,
            detail="Only Student and Faculty can register."
        )
    new_user = User(
        full_name=user.full_name,
        email=user.email,
        password_hash=hash_password(user.password),
        role=user.role,
        department=user.department,
        phone=user.phone
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


def login_user(user: UserLogin, db: Session):

    user.email = user.email.strip().lower()
    existing_user = db.query(User).filter(
        User.email == user.email
    ).first()

    if not existing_user:
        return None

    if not verify_password(user.password, existing_user.password_hash):
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