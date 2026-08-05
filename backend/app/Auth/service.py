from sqlalchemy.orm import Session
from app.Users.models import User
from app.Users.schemas import UserRegister
from app.Security.password import hash_password,verify_password
from app.Security.jwt_handler import create_access_token

def register_user(user: UserRegister, db: Session):

    existing_user = db.query(User).filter(
        User.email == user.email
    ).first()

    if existing_user:
        return None

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




def login_user(user, db: Session):

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