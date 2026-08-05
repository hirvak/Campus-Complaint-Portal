from pydantic import BaseModel, Field


class DepartmentCreate(BaseModel):
    name: str = Field(
        min_length=2,
        max_length=100
    )

    description: str | None = Field(
        default=None,
        max_length=500
    )


class DepartmentUpdate(BaseModel):
    name: str | None = Field(
        default=None,
        min_length=2,
        max_length=100
    )

    description: str | None = Field(
        default=None,
        max_length=500
    )

    is_active: bool | None = None


class DepartmentResponse(BaseModel):
    id: int
    name: str
    description: str | None
    is_active: bool

    class Config:
        from_attributes = True