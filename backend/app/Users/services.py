from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.Users.models import User
from app.Users.schemas import AdminCreateUser
from app.Security.password import hash_password
from app.Utils.enums import UserRole


def create_admin_user(
    user: AdminCreateUser,
    db: Session,
    current_user: User
):
    # Only Admin can create users
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can create users."
        )

    email = user.email.strip().lower()
    full_name = user.full_name.strip()
    department = user.department.strip()

    phone = None

    if user.phone:
        phone = user.phone.strip()

    # Admin can create only Facility Officer
    # or Maintenance Team
    if user.role not in [
        UserRole.FACILITY_OFFICER,
        UserRole.MAINTENANCE_TEAM
    ]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admin can only create Facility Officer or Maintenance Team users."
        )

    # Only ONE Facility Officer is allowed
    if user.role == UserRole.FACILITY_OFFICER:

        existing_officer = (
            db.query(User)
            .filter(
                User.role == UserRole.FACILITY_OFFICER
            )
            .first()
        )

        if existing_officer:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A Facility Officer already exists. Only one Facility Officer is allowed."
            )

    # Check duplicate email
    existing_user = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered."
        )

    new_user = User(
        full_name=full_name,
        email=email,
        password_hash=hash_password(user.password),
        role=user.role,
        department=department,
        phone=phone,
        student_type=None
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user