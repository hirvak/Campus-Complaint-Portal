from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, model_validator

from app.Utils.enums import ComplaintPriority


class SLAConfigBase(BaseModel):
    category_id: Optional[int] = None
    priority: Optional[ComplaintPriority] = None
    target_hours: int = Field(..., gt=0, description="Target resolution duration in hours")
    warning_hours: int = Field(1, gt=0, description="Warning threshold in hours before breach")
    is_active: bool = True


class SLAConfigCreate(SLAConfigBase):
    @model_validator(mode="after")
    def validate_target_and_hours(self):
        # Exactly one of category_id or priority must be provided
        has_category = self.category_id is not None
        has_priority = self.priority is not None

        if has_category and has_priority:
            raise ValueError("Provide either category_id or priority, not both.")
        if not has_category and not has_priority:
            raise ValueError("Either category_id or priority must be provided.")

        if self.warning_hours >= self.target_hours:
            raise ValueError("warning_hours must be strictly less than target_hours.")

        return self


class SLAConfigUpdate(BaseModel):
    target_hours: Optional[int] = Field(None, gt=0)
    warning_hours: Optional[int] = Field(None, gt=0)
    is_active: Optional[bool] = None


class SLAConfigResponse(BaseModel):
    id: int
    category_id: Optional[int] = None
    category_name: Optional[str] = None
    priority: Optional[ComplaintPriority] = None
    target_hours: int
    warning_hours: int
    is_active: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class EscalationCheckResult(BaseModel):
    status: str
    checked_at: datetime
    overdue_detected: int
    escalated_count: int
    escalated_complaints: List[int]
    message: str
