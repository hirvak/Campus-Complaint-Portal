from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.Departments.schemas import (
    DepartmentCreate,
    DepartmentUpdate
)
from app.Departments import repository


def create_department(
    db: Session,
    department: DepartmentCreate
):
    department.name = department.name.strip()

    if department.description:
        department.description = department.description.strip()

    existing_department = repository.get_department_by_name(
        db,
        department.name
    )

    if existing_department:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Department already exists."
        )

    return repository.create_department(
        db=db,
        department=department
    )


def get_all_departments(
    db: Session
):
    return repository.get_all_departments(db)


def get_department(
    db: Session,
    department_id: int
):
    department = repository.get_department_by_id(
        db,
        department_id
    )

    if not department:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found."
        )

    return department


def update_department(
    db: Session,
    department_id: int,
    updated_data: DepartmentUpdate
):
    department = repository.get_department_by_id(
        db,
        department_id
    )

    if not department:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found."
        )

    if updated_data.name:
        updated_data.name = updated_data.name.strip()

        existing_department = repository.get_department_by_name(
            db,
            updated_data.name
        )

        if (
            existing_department
            and existing_department.id != department_id
        ):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Department name already exists."
            )

    if updated_data.description:
        updated_data.description = updated_data.description.strip()

    return repository.update_department(
        db=db,
        department=department,
        updated_data=updated_data
    )


def delete_department(
    db: Session,
    department_id: int
):
    department = repository.get_department_by_id(
        db,
        department_id
    )

    if not department:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found."
        )

    repository.delete_department(
        db=db,
        department=department
    )

    return {
        "message": "Department deleted successfully."
    }