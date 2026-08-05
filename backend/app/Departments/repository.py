from sqlalchemy.orm import Session

from app.Departments.models import Department
from app.Departments.schemas import (
    DepartmentCreate,
    DepartmentUpdate
)


def create_department(
    db: Session,
    department: DepartmentCreate
):
    new_department = Department(
        name=department.name,
        description=department.description
    )

    db.add(new_department)
    db.commit()
    db.refresh(new_department)

    return new_department


def get_department_by_id(
    db: Session,
    department_id: int
):
    return (
        db.query(Department)
        .filter(
            Department.id == department_id,
            Department.is_active.is_(True)
        )
        .first()
    )


def get_department_by_name(
    db: Session,
    name: str
):
    return (
        db.query(Department)
        .filter(
            Department.name == name,
            Department.is_active.is_(True)
        )
        .first()
    )


def get_all_departments(
    db: Session
):
    return (
        db.query(Department)
        .filter(
            Department.is_active.is_(True)
        )
        .all()
    )


def update_department(
    db: Session,
    department: Department,
    updated_data: DepartmentUpdate
):
    if updated_data.name is not None:
        department.name = updated_data.name

    if updated_data.description is not None:
        department.description = updated_data.description

    if updated_data.is_active is not None:
        department.is_active = updated_data.is_active

    db.commit()
    db.refresh(department)

    return department


def delete_department(
    db: Session,
    department: Department
):
    department.is_active = False

    db.commit()
    db.refresh(department)

    return department