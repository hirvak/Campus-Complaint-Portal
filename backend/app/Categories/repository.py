from sqlalchemy.orm import Session

from app.Categories.models import Category
from app.Categories.schemas import (
    CategoryCreate,
    CategoryUpdate
)


def create_category(
    db: Session,
    category: CategoryCreate
):
    new_category = Category(
        name=category.name,
        description=category.description,
        department_id=category.department_id
    )

    db.add(new_category)
    db.commit()
    db.refresh(new_category)

    return new_category


def get_category_by_id(
    db: Session,
    category_id: int
):
    return db.query(Category).filter(
        Category.id == category_id,
        Category.is_active.is_(True)
    ).first()


def get_category_by_name(
    db: Session,
    name: str
):
    return db.query(Category).filter(
        Category.name.ilike(name),
        Category.is_active.is_(True)
    ).first()


def get_all_categories(
    db: Session
):
    return db.query(Category).filter(
        Category.is_active.is_(True)
    ).all()


def get_categories_by_department(
    db: Session,
    department_id: int
):
    return db.query(Category).filter(
        Category.department_id == department_id,
        Category.is_active.is_(True)
    ).all()


def update_category(
    db: Session,
    category: Category,
    updated_data: CategoryUpdate
):
    category.name = updated_data.name
    category.description = updated_data.description
    category.department_id = updated_data.department_id
    category.is_active = updated_data.is_active

    db.commit()
    db.refresh(category)

    return category


def delete_category(
    db: Session,
    category: Category
):
    category.is_active = False

    db.commit()
    db.refresh(category)

    return category