from typing import Optional

from pydantic import (
    BaseModel,
    EmailStr,
    Field,
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