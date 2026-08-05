from sqlalchemy.orm import Session

from app.Database.session import SessionLocal
from app.Users.models import User
from app.Security.password import hash_password
from app.Utils.enums import UserRole


def create_admin():

    db: Session = SessionLocal()

    existing_admin = db.query(User).filter(
        User.role == UserRole.ADMIN
    ).first()

    if existing_admin:
        print("Administrator already exists.")
        db.close()
        return

    admin = User(
        full_name="System Administrator",
        email="admin@gmail.com",
        password_hash=hash_password("Admin@123"),
        role=UserRole.ADMIN,
        department="Administration",
        phone="9999999999"
    )

    db.add(admin)
    db.commit()

    print("Administrator created successfully!")

    db.close()


if __name__ == "__main__":
    create_admin()