from fastapi import FastAPI
from app.Auth.routes import router as auth_router
from app.Users.routes import router as users_router

app = FastAPI(title="Campus Complaint Portal")
app.include_router(auth_router)
app.include_router(users_router)