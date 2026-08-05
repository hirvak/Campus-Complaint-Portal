from pydantic import BaseModel, EmailStr, Field
from app.Utils.enums import UserRole


class UserRegister(BaseModel):
    full_name: str = Field(
        min_length=3,
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

    phone: str | None = Field(
        default=None,
        max_length=15
    )


class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1)


class UserResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    role: UserRole
    department: str
    phone: str | None

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str