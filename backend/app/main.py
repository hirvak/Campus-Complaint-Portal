from fastapi import FastAPI

from app.Auth.routes import router as auth_router
from app.Users.routes import router as users_router
from app.Departments.routes import router as department_router
from app.Categories.routes import router as category_router
from app.Complaints.routes import router as complaints_router
from app.Notifications.routes import router as notifications_router


app = FastAPI(
    title="Campus Complaint Portal"
)


app.include_router(complaints_router)
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(department_router)
app.include_router(category_router)
app.include_router(notifications_router)