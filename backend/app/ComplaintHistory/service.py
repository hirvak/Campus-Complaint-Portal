from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.ComplaintHistory import repository
from app.Complaints.models import Complaint
from app.Users.models import User
from app.Utils.enums import UserRole


# =========================================================
# GET COMPLAINT HISTORY
# =========================================================

def get_complaint_history(
    db: Session,
    complaint_id: int,
    current_user: User
):
    # -----------------------------------------------------
    # Check whether complaint exists
    # -----------------------------------------------------

    complaint = (
        db.query(Complaint)
        .filter(
            Complaint.id == complaint_id
        )
        .first()
    )

    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found."
        )

    # -----------------------------------------------------
    # Student / Faculty
    # Can view history only for their own complaints
    # -----------------------------------------------------

    if current_user.role in [
        UserRole.STUDENT,
        UserRole.FACULTY
    ]:

        if complaint.created_by != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only view history of your own complaints."
            )

    # -----------------------------------------------------
    # Maintenance Team
    # Can view history only for complaints assigned to them
    # -----------------------------------------------------

    elif current_user.role == UserRole.MAINTENANCE_TEAM:

        if complaint.assigned_to != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only view history of complaints assigned to you."
            )

    # -----------------------------------------------------
    # Admin / Facility Officer
    # Can view history of all complaints
    # -----------------------------------------------------

    elif current_user.role in [
        UserRole.ADMIN,
        UserRole.FACILITY_OFFICER
    ]:
        pass

    # -----------------------------------------------------
    # Any other role
    # -----------------------------------------------------

    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to view complaint history."
        )

    # -----------------------------------------------------
    # Get history
    # -----------------------------------------------------

    return repository.get_complaint_history(
        db=db,
        complaint_id=complaint_id
    )