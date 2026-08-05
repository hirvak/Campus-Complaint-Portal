from fastapi import Depends, HTTPException, status

from app.Auth.dependencies import get_current_user
from app.Users.models import User
from app.Utils.enums import UserRole


def require_admin(
    current_user: User = Depends(get_current_user)
) -> User:

    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator access required."
        )

    return current_user


def require_student(
    current_user: User = Depends(get_current_user)
) -> User:

    if current_user.role != UserRole.STUDENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Student access required."
        )

    return current_user


def require_faculty(
    current_user: User = Depends(get_current_user)
) -> User:

    if current_user.role != UserRole.FACULTY:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Faculty access required."
        )

    return current_user