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
    name = department.name.strip()

    existing_department = repository.get_department_by_name(
        db,
        name
    )

    if existing_department:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Department already exists."
        )

    department.name = name

    return repository.create_department(
        db,
        department
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

    name = updated_data.name.strip()

    existing_department = repository.get_department_by_name(
        db,
        name
    )

    if (
        existing_department
        and existing_department.id != department_id
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Department name already exists."
        )

    updated_data.name = name

    return repository.update_department(
        db,
        department,
        updated_data
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
        db,
        department
    )

    return {
        "message": "Department deleted successfully."
    }