from typing import Optional

from pydantic import BaseModel, Field, field_validator


class CategoryCreate(BaseModel):
    name: str = Field(
        min_length=2,
        max_length=100
    )

    description: Optional[str] = Field(
        default=None,
        max_length=255
    )

    department_id: int = Field(
        gt=0
    )

    @field_validator("name")
    @classmethod
    def validate_name(cls, value):
        value = value.strip()

        if not value:
            raise ValueError(
                "Category name cannot be empty."
            )

        return value

    @field_validator("description")
    @classmethod
    def validate_description(cls, value):
        if value is not None:
            value = value.strip()

            if not value:
                return None

        return value


class CategoryUpdate(BaseModel):
    name: str = Field(
        min_length=2,
        max_length=100
    )

    description: Optional[str] = Field(
        default=None,
        max_length=255
    )

    department_id: int = Field(
        gt=0
    )

    is_active: bool = True

    @field_validator("name")
    @classmethod
    def validate_name(cls, value):
        value = value.strip()

        if not value:
            raise ValueError(
                "Category name cannot be empty."
            )

        return value

    @field_validator("description")
    @classmethod
    def validate_description(cls, value):
        if value is not None:
            value = value.strip()

            if not value:
                return None

        return value


class CategoryResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    department_id: int
    is_active: bool

    class Config:
        from_attributes = True