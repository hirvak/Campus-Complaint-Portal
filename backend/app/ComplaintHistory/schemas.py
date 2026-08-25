from datetime import datetime

from pydantic import BaseModel

from app.Utils.enums import ComplaintHistoryAction


class ComplaintHistoryResponse(BaseModel):
    id: int
    complaint_id: int
    action: ComplaintHistoryAction
    description: str | None = None
    performed_by: int
    created_at: datetime

    class Config:
        from_attributes = True