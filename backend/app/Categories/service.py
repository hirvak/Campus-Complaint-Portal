from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.Categories.schemas import (
    CategoryCreate,
    CategoryUpdate
)
from app.Categories import repository
from app.Departments import repository as department_repository


def create_category(
    db: Session,
    category: CategoryCreate
):
    name = category.name.strip()

    # Check duplicate category
    existing_category = repository.get_category_by_name(
        db,
        name
    )

    if existing_category:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Category already exists."
        )

    # Check department
    department = department_repository.get_department_by_id(
        db,
        category.department_id
    )

    if not department:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found or inactive."
        )

    category.name = name

    return repository.create_category(
        db,
        category
    )


def get_all_categories(
    db: Session
):
    return repository.get_all_categories(db)


def get_category(
    db: Session,
    category_id: int
):
    category = repository.get_category_by_id(
        db,
        category_id
    )

    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found."
        )

    return category


def get_categories_by_department(
    db: Session,
    department_id: int
):
    department = department_repository.get_department_by_id(
        db,
        department_id
    )

    if not department:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found or inactive."
        )

    return repository.get_categories_by_department(
        db,
        department_id
    )


def update_category(
    db: Session,
    category_id: int,
    updated_data: CategoryUpdate
):
    category = repository.get_category_by_id(
        db,
        category_id
    )

    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found."
        )

    name = updated_data.name.strip()

    # Check duplicate category name
    existing_category = repository.get_category_by_name(
        db,
        name
    )

    if (
        existing_category
        and existing_category.id != category_id
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Category name already exists."
        )

    # Check new department
    department = department_repository.get_department_by_id(
        db,
        updated_data.department_id
    )

    if not department:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found or inactive."
        )

    updated_data.name = name

    return repository.update_category(
        db,
        category,
        updated_data
    )


def delete_category(
    db: Session,
    category_id: int
):
    category = repository.get_category_by_id(
        db,
        category_id
    )

    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found."
        )

    repository.delete_category(
        db,
        category
    )

    return {
        "message": "Category deleted successfully."
    }