from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.Utils.enums import ComplaintPriority, ComplaintStatus


# =========================
# Create Complaint
# =========================

class ComplaintCreate(BaseModel):
    title: str = Field(
        ...,
        min_length=3,
        max_length=200
    )

    description: str = Field(
        ...,
        min_length=5
    )

    category_id: int

    location: str = Field(
        ...,
        min_length=2,
        max_length=255
    )

    image_url: Optional[str] = None


# =========================
# Update Basic Complaint
# =========================

class ComplaintUpdate(BaseModel):
    title: Optional[str] = Field(
        None,
        min_length=3,
        max_length=200
    )

    description: Optional[str] = Field(
        None,
        min_length=5
    )

    location: Optional[str] = Field(
        None,
        min_length=2,
        max_length=255
    )


# =========================
# Assign Complaint
# Facility Officer
# =========================

class ComplaintAssign(BaseModel):
    assigned_to: int
    priority: ComplaintPriority = ComplaintPriority.MEDIUM


# =========================
# Update Complaint Status
# Maintenance Team
# =========================

class ComplaintStatusUpdate(BaseModel):
    status: ComplaintStatus


# =========================
# Resolve Complaint
# Maintenance Team
# =========================

class ComplaintResolve(BaseModel):
    resolution_remarks: str = Field(
        ...,
        min_length=5
    )

    completion_image: Optional[str] = None


# =========================
# Complaint Response
# =========================

class ComplaintResponse(BaseModel):
    id: int
    title: str
    description: str

    category_id: int
    department_id: int

    location: str
    image_url: Optional[str]

    status: ComplaintStatus
    priority: ComplaintPriority

    created_by: int
    assigned_to: Optional[int]

    resolution_remarks: Optional[str]
    completion_image: Optional[str]

    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True