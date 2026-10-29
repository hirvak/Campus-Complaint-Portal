import re
from typing import Optional

from pydantic import (
    BaseModel,
    EmailStr,
    Field,
    field_validator,
    model_validator
)

from app.Utils.enums import StudentType, UserRole


class UserRegister(BaseModel):
    full_name: str = Field(
        min_length=2,
        max_length=100
    )

    email: EmailStr

    password: str = Field(
        min_length=8,
        max_length=128
    )

    role: UserRole

    department: str = Field(
        min_length=2,
        max_length=100
    )

    phone: Optional[str] = Field(
        default=None,
        max_length=20
    )

    student_type: Optional[StudentType] = None

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, v: str) -> str:
        v_stripped = v.strip()
        if not v_stripped or len(v_stripped) < 2:
            raise ValueError("Full Name must be at least 2 characters.")
        if not re.match(r"^[A-Za-z\s]+$", v_stripped):
            raise ValueError("Full Name must contain only alphabets and spaces.")
        return v_stripped

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        v_stripped = v.strip()
        if not v_stripped:
            return None
        if not re.match(r"^[6-9]\d{9}$", v_stripped):
            raise ValueError("Phone number must be exactly 10 digits starting with 6-9.")
        return v_stripped

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long.")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter.")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter.")
        if not re.search(r"[0-9]", v):
            raise ValueError("Password must contain at least one number.")
        if not re.search(r"[^A-Za-z0-9]", v):
            raise ValueError("Password must contain at least one special character.")
        return v

    @field_validator("role")
    @classmethod
    def validate_public_role(cls, v: UserRole) -> UserRole:
        if v not in [UserRole.STUDENT, UserRole.FACULTY]:
            raise ValueError("Public registration is only allowed for Student and Faculty roles.")
        return v

    @model_validator(mode="after")
    def validate_student_type(self):

        if (
            self.role == UserRole.STUDENT
            and self.student_type is None
        ):
            raise ValueError(
                "Student type is required for students."
            )

        if (
            self.role != UserRole.STUDENT
            and self.student_type is not None
        ):
            raise ValueError(
                "Student type is only applicable to students."
            )

        return self


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    role: UserRole
    department: str
    phone: Optional[str] = None
    student_type: Optional[StudentType] = None
    is_active: bool

    class Config:
        from_attributes = True


class AdminCreateUser(BaseModel):
    """
    Used by Admin to create Facility Officer
    or Maintenance Team accounts.
    """

    full_name: str = Field(
        min_length=2,
        max_length=100
    )

    email: EmailStr

    password: str = Field(
        min_length=8,
        max_length=128
    )

    role: UserRole

    department: str = Field(
        min_length=2,
        max_length=100
    )

    phone: Optional[str] = Field(
        default=None,
        max_length=20
    )

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, v: str) -> str:
        v_stripped = v.strip()
        if not v_stripped or len(v_stripped) < 2:
            raise ValueError("Full Name must be at least 2 characters.")
        if not re.match(r"^[A-Za-z\s]+$", v_stripped):
            raise ValueError("Full Name must contain only alphabets and spaces.")
        return v_stripped

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        v_stripped = v.strip()
        if not v_stripped:
            return None
        if not re.match(r"^[6-9]\d{9}$", v_stripped):
            raise ValueError("Phone number must be exactly 10 digits starting with 6-9.")
        return v_stripped

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long.")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter.")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter.")
        if not re.search(r"[0-9]", v):
            raise ValueError("Password must contain at least one number.")
        if not re.search(r"[^A-Za-z0-9]", v):
            raise ValueError("Password must contain at least one special character.")
        return v

    @model_validator(mode="after")
    def validate_admin_created_role(self):

        if self.role not in [
            UserRole.FACILITY_OFFICER,
            UserRole.MAINTENANCE_TEAM
        ]:
            raise ValueError(
                "Admin can only create Facility Officer or Maintenance Team users."
            )

        return self


class UserStatusUpdate(BaseModel):
    """
    Used by Admin to activate or deactivate a user.
    """

    is_active: bool


class Token(BaseModel):
    access_token: str
    token_type: str

