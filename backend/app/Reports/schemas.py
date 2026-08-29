from pydantic import BaseModel
from typing import List


# =========================================================
# STATUS REPORT
# =========================================================

class StatusReport(BaseModel):
    status: str
    count: int


# =========================================================
# PRIORITY REPORT
# =========================================================

class PriorityReport(BaseModel):
    priority: str
    count: int


# =========================================================
# CATEGORY REPORT
# =========================================================

class CategoryReport(BaseModel):
    category_id: int
    category_name: str
    count: int


# =========================================================
# DEPARTMENT REPORT
# =========================================================

class DepartmentReport(BaseModel):
    department_id: int
    department_name: str
    count: int


# =========================================================
# REPORT SUMMARY
# =========================================================

class ReportSummary(BaseModel):
    total_complaints: int

    new_complaints: int
    assigned_complaints: int
    in_progress_complaints: int
    resolved_complaints: int
    closed_complaints: int
    reopened_complaints: int

    low_priority: int
    medium_priority: int
    high_priority: int


# =========================================================
# COMPLETE REPORT RESPONSE
# =========================================================

class CompleteReportResponse(BaseModel):
    summary: ReportSummary

    status_report: List[StatusReport]
    priority_report: List[PriorityReport]
    category_report: List[CategoryReport]
    department_report: List[DepartmentReport]