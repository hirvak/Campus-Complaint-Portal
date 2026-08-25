from typing import Dict

from pydantic import BaseModel


class ComplaintStatistics(BaseModel):
    total_complaints: int
    new_complaints: int
    assigned_complaints: int
    in_progress_complaints: int
    resolved_complaints: int
    closed_complaints: int
    reopened_complaints: int


class ComplaintPriorityStatistics(BaseModel):
    low: int
    medium: int
    high: int
    critical: int


class DashboardResponse(BaseModel):
    complaint_statistics: ComplaintStatistics
    priority_statistics: ComplaintPriorityStatistics
    category_statistics: Dict[str, int]
    department_statistics: Dict[str, int]