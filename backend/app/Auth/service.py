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

    # Student must select Student Type
    if user.role == UserRole.STUDENT:

        if user.student_type is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Student type is required for students."
            )

    # Faculty cannot have Student Type
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

    # User does not exist
    if not existing_user:
        return None

    # User account is deactivated
    if not existing_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated. Please contact the administrator."
        )

    # Verify password
    if not verify_password(
        user.password,
        existing_user.password_hash
    ):
        return None

    # Generate JWT access token
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


def google_login_user(
    data,
    db: Session
):
    import json
    import secrets
    import urllib.request
    import os
    from app.Utils.enums import StudentType

    id_token = data.id_token

    # Verify Google ID token using Google's tokeninfo endpoint
    try:
        url = f"https://oauth2.googleapis.com/tokeninfo?id_token={id_token}"
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=10) as resp:
            if resp.status != 200:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid Google ID token."
                )
            token_info = json.loads(resp.read().decode())
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unable to verify Google ID token with Google servers."
        )

    email = token_info.get("email")
    email_verified = token_info.get("email_verified")

    if not email or (isinstance(email_verified, str) and email_verified.lower() != "true" and email_verified is not True):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Google token email is unverified or invalid."
        )

    expected_client_id = os.getenv("GOOGLE_CLIENT_ID")
    if expected_client_id and expected_client_id != "your-google-client-id":
        token_aud = token_info.get("aud")
        if token_aud != expected_client_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Google token audience mismatch."
            )

    email = email.strip().lower()
    full_name = token_info.get("name") or token_info.get("given_name") or "Google User"

    existing_user = db.query(User).filter(
        User.email == email
    ).first()

    if existing_user:
        if not existing_user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your account has been deactivated. Please contact the administrator."
            )

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

    # New user flow: Must be Student or Faculty
    selected_role = data.role
    if not selected_role or selected_role not in [UserRole.STUDENT, UserRole.FACULTY]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role selection required for new Google user. Must be Student or Faculty."
        )

    if selected_role == UserRole.STUDENT:
        student_type = data.student_type or StudentType.CAMPUS
    else:
        student_type = None

    department = (data.department or "General").strip()

    random_password = secrets.token_urlsafe(32)
    new_user = User(
        full_name=full_name.strip(),
        email=email,
        password_hash=hash_password(random_password),
        role=selected_role,
        department=department,
        student_type=student_type,
        is_active=True
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    access_token = create_access_token(
        {
            "sub": new_user.email,
            "role": new_user.role.value
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }