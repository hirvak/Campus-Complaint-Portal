from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.Reports import repository
from app.Reports.schemas import (
    ReportSummary,
    StatusReport,
    PriorityReport,
    CategoryReport,
    DepartmentReport,
    CompleteReportResponse,
)

from app.Users.models import User
from app.Utils.enums import (
    UserRole,
    ComplaintStatus,
    ComplaintPriority,
)


# =========================================================
# HELPER — GET REPORT SCOPE
# =========================================================

def get_report_scope(
    current_user: User
):
    """
    Determines which complaints the current user
    is allowed to include in reports.
    """

    # Admin and Facility Officer
    # can view campus-wide reports
    if current_user.role in [
        UserRole.ADMIN,
        UserRole.FACILITY_OFFICER
    ]:
        return {
            "created_by": None,
            "assigned_to": None
        }

    # Student / Faculty
    # can view reports only for their own complaints
    if current_user.role in [
        UserRole.STUDENT,
        UserRole.FACULTY
    ]:
        return {
            "created_by": current_user.id,
            "assigned_to": None
        }

    # Maintenance Team
    # can view reports only for complaints assigned to them
    if current_user.role == UserRole.MAINTENANCE_TEAM:
        return {
            "created_by": None,
            "assigned_to": current_user.id
        }

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="You are not authorized to view reports."
    )


# =========================================================
# GET REPORT SUMMARY
# =========================================================

def get_report_summary(
    db: Session,
    current_user: User
):
    scope = get_report_scope(current_user)

    total = repository.get_total_complaints(
        db=db,
        created_by=scope["created_by"],
        assigned_to=scope["assigned_to"]
    )

    new = repository.count_by_status(
        db=db,
        complaint_status=ComplaintStatus.NEW,
        created_by=scope["created_by"],
        assigned_to=scope["assigned_to"]
    )

    assigned = repository.count_by_status(
        db=db,
        complaint_status=ComplaintStatus.ASSIGNED,
        created_by=scope["created_by"],
        assigned_to=scope["assigned_to"]
    )

    in_progress = repository.count_by_status(
        db=db,
        complaint_status=ComplaintStatus.IN_PROGRESS,
        created_by=scope["created_by"],
        assigned_to=scope["assigned_to"]
    )

    resolved = repository.count_by_status(
        db=db,
        complaint_status=ComplaintStatus.RESOLVED,
        created_by=scope["created_by"],
        assigned_to=scope["assigned_to"]
    )

    closed = repository.count_by_status(
        db=db,
        complaint_status=ComplaintStatus.CLOSED,
        created_by=scope["created_by"],
        assigned_to=scope["assigned_to"]
    )

    reopened = repository.count_by_status(
        db=db,
        complaint_status=ComplaintStatus.REOPENED,
        created_by=scope["created_by"],
        assigned_to=scope["assigned_to"]
    )

    low = repository.count_by_priority(
        db=db,
        priority=ComplaintPriority.LOW,
        created_by=scope["created_by"],
        assigned_to=scope["assigned_to"]
    )

    medium = repository.count_by_priority(
        db=db,
        priority=ComplaintPriority.MEDIUM,
        created_by=scope["created_by"],
        assigned_to=scope["assigned_to"]
    )

    high = repository.count_by_priority(
        db=db,
        priority=ComplaintPriority.HIGH,
        created_by=scope["created_by"],
        assigned_to=scope["assigned_to"]
    )

    return ReportSummary(
        total_complaints=total,
        new_complaints=new,
        assigned_complaints=assigned,
        in_progress_complaints=in_progress,
        resolved_complaints=resolved,
        closed_complaints=closed,
        reopened_complaints=reopened,
        low_priority=low,
        medium_priority=medium,
        high_priority=high,
    )


# =========================================================
# GET STATUS REPORT
# =========================================================

def get_status_report(
    db: Session,
    current_user: User
):
    scope = get_report_scope(current_user)

    rows = repository.get_complaints_by_status(
        db=db,
        created_by=scope["created_by"],
        assigned_to=scope["assigned_to"]
    )

    return [
        StatusReport(
            status=status.value,
            count=count
        )
        for status, count in rows
    ]


# =========================================================
# GET PRIORITY REPORT
# =========================================================

def get_priority_report(
    db: Session,
    current_user: User
):
    scope = get_report_scope(current_user)

    rows = repository.get_complaints_by_priority(
        db=db,
        created_by=scope["created_by"],
        assigned_to=scope["assigned_to"]
    )

    return [
        PriorityReport(
            priority=priority.value,
            count=count
        )
        for priority, count in rows
    ]


# =========================================================
# GET CATEGORY REPORT
# =========================================================

def get_category_report(
    db: Session,
    current_user: User
):
    scope = get_report_scope(current_user)

    rows = repository.get_complaints_by_category(
        db=db,
        created_by=scope["created_by"],
        assigned_to=scope["assigned_to"]
    )

    return [
        CategoryReport(
            category_id=category_id,
            category_name=category_name,
            count=count
        )
        for category_id, category_name, count in rows
    ]


# =========================================================
# GET DEPARTMENT REPORT
# =========================================================

def get_department_report(
    db: Session,
    current_user: User
):
    scope = get_report_scope(current_user)

    rows = repository.get_complaints_by_department(
        db=db,
        created_by=scope["created_by"],
        assigned_to=scope["assigned_to"]
    )

    return [
        DepartmentReport(
            department_id=department_id,
            department_name=department_name,
            count=count
        )
        for department_id, department_name, count in rows
    ]


# =========================================================
# GET COMPLETE REPORT
# =========================================================

def get_complete_report(
    db: Session,
    current_user: User
):
    return CompleteReportResponse(
        summary=get_report_summary(
            db=db,
            current_user=current_user
        ),

        status_report=get_status_report(
            db=db,
            current_user=current_user
        ),

        priority_report=get_priority_report(
            db=db,
            current_user=current_user
        ),

        category_report=get_category_report(
            db=db,
            current_user=current_user
        ),

        department_report=get_department_report(
            db=db,
            current_user=current_user
        )
    )


# =========================================================
# EXPORT REPORTS (CSV / PDF)
# Admin Only
# =========================================================

def export_reports(
    db: Session,
    format_type: str,
    current_user: User
):
    import csv
    import io
    from datetime import datetime
    from fastapi.responses import Response
    from app.Complaints.models import Complaint
    from app.Categories.models import Category
    from app.Departments.models import Department

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    # Fetch lookup dictionaries
    cats = {c.id: c.name for c in db.query(Category).all()}
    depts = {d.id: d.name for d in db.query(Department).all()}
    users = {u.id: u.full_name for u in db.query(User).all()}

    complaints = db.query(Complaint).order_by(Complaint.id.asc()).all()

    if format_type == "csv":
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            "Complaint ID",
            "Title",
            "Category",
            "Department",
            "Priority",
            "Status",
            "Location",
            "Created Date",
            "Assigned Member",
            "Resolution Remarks",
            "Last Updated Date"
        ])

        for c in complaints:
            writer.writerow([
                f"#{c.id}",
                c.title,
                cats.get(c.category_id, f"Category #{c.category_id}"),
                depts.get(c.department_id, f"Department #{c.department_id}"),
                c.priority.value if hasattr(c.priority, 'value') else str(c.priority),
                c.status.value if hasattr(c.status, 'value') else str(c.status),
                c.location,
                c.created_at.strftime("%Y-%m-%d %H:%M:%S") if c.created_at else "",
                users.get(c.assigned_to, "Unassigned") if c.assigned_to else "Unassigned",
                c.resolution_remarks or "",
                c.updated_at.strftime("%Y-%m-%d %H:%M:%S") if c.updated_at else ""
            ])

        filename = f"campuscare_report_{timestamp}.csv"
        return Response(
            content=output.getvalue(),
            media_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'}
        )

    elif format_type == "pdf":
        from reportlab.lib.pagesizes import letter
        from reportlab.lib import colors
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()
        elements = []

        title_style = ParagraphStyle(
            'ReportTitle',
            parent=styles['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=16,
            leading=20,
            textColor=colors.HexColor('#B51232'),
            spaceAfter=4
        )

        subtitle_style = ParagraphStyle(
            'ReportSubtitle',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=9,
            leading=11,
            textColor=colors.HexColor('#10213A'),
            spaceAfter=15
        )

        normal_style = styles['Normal']
        normal_style.fontSize = 8
        normal_style.leading = 10

        # Title Header
        elements.append(Paragraph("CampusCare — Campus Complaint Portal", title_style))
        elements.append(Paragraph(f"OFFICIAL ADMINISTRATIVE AUDIT REPORT • Generated {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", subtitle_style))

        # Executive Summary Table
        summary = get_report_summary(db, current_user)
        summary_data = [
            ["Metric", "Count", "Metric", "Count"],
            ["Total Complaints", str(summary.total_complaints), "Low Priority", str(summary.low_priority)],
            ["New Complaints", str(summary.new_complaints), "Medium Priority", str(summary.medium_priority)],
            ["Assigned Complaints", str(summary.assigned_complaints), "High Priority", str(summary.high_priority)],
            ["In Progress Complaints", str(summary.in_progress_complaints), "Resolved Complaints", str(summary.resolved_complaints)],
            ["Closed Complaints", str(summary.closed_complaints), "Reopened Complaints", str(summary.reopened_complaints)]
        ]

        summary_table = Table(summary_data, colWidths=[140, 100, 140, 100])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#10213A')),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,-1), 8),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#DED8CC')),
            ('BACKGROUND', (0,1), (-1,-1), colors.HexColor('#FAF7F0')),
        ]))

        elements.append(Paragraph("EXECUTIVE COMPLAINT SUMMARY", ParagraphStyle('SectionHeader', fontName='Helvetica-Bold', fontSize=10, textColor=colors.HexColor('#B51232'), spaceAfter=6)))
        elements.append(summary_table)
        elements.append(Spacer(1, 15))

        # Complaints Breakdown Table
        elements.append(Paragraph("COMPLAINTS DIRECTORY BREAKDOWN", ParagraphStyle('SectionHeader2', fontName='Helvetica-Bold', fontSize=10, textColor=colors.HexColor('#B51232'), spaceAfter=6)))

        table_data = [["ID", "Title", "Category", "Department", "Priority", "Status", "Date"]]
        for c in complaints[:60]:
            table_data.append([
                f"#{c.id}",
                Paragraph(c.title[:45], normal_style),
                cats.get(c.category_id, f"Cat #{c.category_id}"),
                depts.get(c.department_id, f"Dept #{c.department_id}"),
                c.priority.value if hasattr(c.priority, 'value') else str(c.priority),
                c.status.value if hasattr(c.status, 'value') else str(c.status),
                c.created_at.strftime("%Y-%m-%d") if c.created_at else "—"
            ])

        comp_table = Table(table_data, colWidths=[35, 140, 85, 95, 55, 65, 55])
        comp_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#B51232')),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,-1), 8),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#DED8CC')),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ]))

        elements.append(comp_table)
        doc.build(elements)

        filename = f"campuscare_report_{timestamp}.pdf"
        return Response(
            content=buffer.getvalue(),
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'}
        )