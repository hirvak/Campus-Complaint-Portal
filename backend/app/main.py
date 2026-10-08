from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.Auth.routes import router as auth_router
from app.Users.routes import router as users_router
from app.Departments.routes import router as department_router
from app.Categories.routes import router as category_router
from app.Complaints.routes import router as complaints_router
from app.Notifications.routes import router as notifications_router
from app.Dashboard.routes import router as dashboard_router
from app.ComplaintHistory.routes import router as complaint_history_router
from app.Reports.routes import router as reports_router
app = FastAPI(
    title="Campus Complaint Portal"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(complaints_router)
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(department_router)
app.include_router(category_router)
app.include_router(notifications_router)
app.include_router(dashboard_router)
app.include_router(complaint_history_router)
app.include_router(reports_router)