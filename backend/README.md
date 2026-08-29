
# Campus Complaint Portal - Backend

Backend service for the **Campus Complaint Portal**, a role-based complaint management system for a college campus.

The backend is built with **FastAPI**, **SQLAlchemy**, **PostgreSQL**, and **Alembic**. It provides authentication, complaint management, role-based access control, notifications, complaint history, dashboards, reports, and administrative management.

---

## Features

- User registration and login
- JWT-based authentication
- Role-based authorization
- Student and Faculty complaint creation
- Automatic department assignment based on complaint category
- Facility Officer complaint assignment
- Maintenance Team complaint handling
- Complaint status workflow
- Complaint closing and reopening
- Complaint history tracking
- Notifications
- Dashboard and analytics
- Complaint reports
- Category management
- Department management
- User management
- Admin user activation/deactivation
- PostgreSQL database
- Alembic database migrations
- Docker and Docker Compose support
- Swagger/OpenAPI documentation

---

## User Roles

The system contains five roles:

| Role | Main Responsibilities |
|------|------------------------|
| Student | Register, create complaints, track complaints, close/reopen complaints |
| Faculty | Register, create complaints, track complaints, close/reopen complaints |
| Admin | Manage users, departments, categories, complaints and reports |
| Facility Officer | View pending complaints and assign maintenance members |
| Maintenance Team | View assigned complaints and update/resolve them |

---

## Complaint Workflow

The complaint lifecycle is:

```text
Student / Faculty
       |
       v
Create Complaint
       |
       v
Category Selected
       |
       v
Department Assigned Automatically
       |
       v
NEW
       |
       v
Facility Officer
       |
       v
Assign Maintenance Member
       |
       v
ASSIGNED
       |
       v
Maintenance Team
       |
       v
IN PROGRESS
       |
       v
RESOLVED
       |
       v
Student / Faculty
       |
       +---------> CLOSED
       |
       +---------> REOPENED
                         |
                         v
                 Facility Officer
````

---

# Tech Stack

| Technology     | Purpose                      |
| -------------- | ---------------------------- |
| Python         | Programming language         |
| FastAPI        | Backend REST API framework   |
| SQLAlchemy     | ORM and database interaction |
| PostgreSQL     | Relational database          |
| Alembic        | Database migrations          |
| Pydantic       | Request/response validation  |
| JWT            | Authentication               |
| Uvicorn        | ASGI server                  |
| Docker         | Containerization             |
| Docker Compose | Multi-container development  |

---

# Project Structure

```text
backend/
│
├── app/
│   │
│   ├── Auth/
│   │   ├── dependencies.py
│   │   ├── routes.py
│   │   └── ...
│   │
│   ├── Users/
│   │   ├── models.py
│   │   ├── routes.py
│   │   ├── schemas.py
│   │   └── service.py
│   │
│   ├── Departments/
│   │
│   ├── Categories/
│   │
│   ├── Complaints/
│   │
│   ├── Notifications/
│   │
│   ├── ComplaintHistory/
│   │
│   ├── Dashboard/
│   │
│   ├── Reports/
│   │   ├── routes.py
│   │   ├── schemas.py
│   │   ├── service.py
│   │   └── repository.py
│   │
│   ├── Database/
│   │   ├── database.py
│   │   ├── session.py
│   │   └── base.py
│   │
│   ├── Utils/
│   │   └── enums.py
│   │
│   └── main.py
│
├── alembic/
│   ├── versions/
│   └── env.py
│
├── requirements.txt
├── alembic.ini
├── Dockerfile
├── docker-compose.yml
├── .dockerignore
├── .env
└── README.md
```

---

# Prerequisites

For local development:

* Python 3.11+
* PostgreSQL
* Git

For Docker development:

* Docker Desktop
* Docker Compose

---

# Environment Variables

Create a `.env` file in the backend root directory.

Example:

```env
DATABASE_URL=postgresql://postgres:1234@localhost:5432/campus_complaint_portal

SECRET_KEY=your-secret-key

ALGORITHM=HS256

ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

### Important

Do not commit `.env` to Git.

It contains sensitive information such as:

* Database credentials
* JWT secret

---

# Local Setup

## 1. Clone the Repository

```bash
git clone <repository-url>
```

Move into the backend directory:

```bash
cd backend
```

---

## 2. Create Virtual Environment

### Windows

```powershell
python -m venv venv
```

Activate it:

```powershell
venv\Scripts\activate
```

---

## 3. Install Dependencies

```bash
pip install -r requirements.txt
```

---

# PostgreSQL Setup

Create a PostgreSQL database:

```text
campus_complaint_portal
```

Update the `.env` file with the correct database URL.

Example:

```env
DATABASE_URL=postgresql://postgres:1234@localhost:5432/campus_complaint_portal
```

---

# Database Migrations

The project uses **Alembic** for database schema management.

## Check Current Migration

```bash
alembic current
```

## Apply Migrations

```bash
alembic upgrade head
```

## Create a New Migration

After modifying database models:

```bash
alembic revision --autogenerate -m "description of change"
```

Then apply it:

```bash
alembic upgrade head
```

---

# Run Backend Locally

Start the FastAPI development server:

```bash
uvicorn app.main:app --reload
```

The backend will be available at:

```text
http://127.0.0.1:8000
```

---

# API Documentation

FastAPI automatically provides Swagger documentation.

Open:

```text
http://127.0.0.1:8000/docs
```

Alternative OpenAPI documentation:

```text
http://127.0.0.1:8000/redoc
```

---

# Authentication

The backend uses JWT-based authentication.

Typical flow:

```text
Register
   |
   v
Login
   |
   v
JWT Access Token
   |
   v
Authenticated API Requests
```

Protected APIs require:

```text
Authorization: Bearer <access_token>
```

---

# Main API Modules

The backend contains APIs for:

## Authentication

Registration and login for Student and Faculty users.

## Users

User management and activation/deactivation.

Example:

```text
PATCH /users/{user_id}/status
```

## Departments

Department creation and management.

## Categories

Complaint category management.

Categories are mapped to departments automatically.

Example:

```text
WiFi → IT
Computer → IT
Electricity → Electrical
Plumbing → Civil
Hostel Room → Hostel
Cleanliness → Housekeeping
```

## Complaints

Complaint creation and lifecycle management.

Examples:

```text
POST  /complaints/
GET   /complaints/my
GET   /complaints/assigned
GET   /complaints/pending
GET   /complaints/all
GET   /complaints/{complaint_id}
POST  /complaints/{complaint_id}/assign
PATCH /complaints/{complaint_id}/status
POST  /complaints/{complaint_id}/resolve
POST  /complaints/{complaint_id}/close
POST  /complaints/{complaint_id}/reopen
```

## Complaint History

Tracks actions performed on complaints.

Example:

```text
GET /complaints/{complaint_id}/history
```

## Notifications

Provides notification functionality for relevant complaint events.

## Dashboard

Provides complaint statistics for dashboard views.

## Reports

Provides administrative complaint reports.

Examples:

```text
GET /reports/
GET /reports/summary
GET /reports/status
GET /reports/priority
GET /reports/categories
GET /reports/departments
```

Reports provide statistics based on:

* Complaint status
* Complaint priority
* Complaint category
* Department
* Overall complaint counts

Reports are restricted to Admin access.

---

# Docker Setup

The backend can run using Docker Compose.

The Docker environment contains two services:

```text
FastAPI Backend
       |
       v
PostgreSQL Database
```

## Start Docker Environment

From the backend directory:

```bash
docker compose up -d
```

## Check Containers

```bash
docker compose ps
```

Expected services:

```text
campus_complaint_backend
campus_complaint_db
```

The PostgreSQL container should report a healthy status.

## Stop Docker Environment

```bash
docker compose down
```

This stops and removes the containers while preserving the PostgreSQL volume.

Do not use:

```bash
docker compose down -v
```

unless you intentionally want to delete the Docker PostgreSQL volume.

---

# Docker Database

The Docker PostgreSQL service uses:

```text
Database: campus_complaint_portal
Username: postgres
Password: 1234
Port: 5432
```

The backend connects to PostgreSQL using the Docker service name:

```text
db
```

Therefore, inside Docker the database URL is:

```text
postgresql://postgres:1234@db:5432/campus_complaint_portal
```

---

# Alembic with Docker

Run migrations inside the backend container:

```bash
docker compose exec backend alembic upgrade head
```

Check the current migration:

```bash
docker compose exec backend alembic current
```

The Docker database has been successfully migrated to the latest revision.

---

# Testing

APIs can be tested using:

* Swagger UI
* Postman

## Swagger

```text
http://localhost:8000/docs
```

## Postman

Set the base URL to:

```text
http://localhost:8000
```

For protected APIs, provide the JWT access token:

```text
Authorization: Bearer <token>
```

---

# Development Workflow

Recommended development workflow:

```text
1. Create/modify feature
        ↓
2. Update models if required
        ↓
3. Create Alembic migration
        ↓
4. Apply migration
        ↓
5. Run FastAPI
        ↓
6. Test through Swagger/Postman
        ↓
7. Fix issues
        ↓
8. git status
        ↓
9. git add .
        ↓
10. git commit
        ↓
11. git push
```

---

# Useful Commands

### Start local server

```bash
uvicorn app.main:app --reload
```

### Start Docker

```bash
docker compose up -d
```

### Stop Docker

```bash
docker compose down
```

### View backend logs

```bash
docker compose logs backend
```

### View database logs

```bash
docker compose logs db
```

### Check containers

```bash
docker compose ps
```

### Enter backend container

```bash
docker compose exec backend bash
```

### Run Alembic migration

```bash
docker compose exec backend alembic upgrade head
```

### Check Alembic revision

```bash
docker compose exec backend alembic current
```

---

# Database Tables

The current database schema contains:

```text
users
departments
categories
complaints
notifications
complaint_history
alembic_version
```

---

# Security Notes

* Do not commit `.env`.
* Do not expose database passwords in source code.
* Use a strong `SECRET_KEY` in production.
* Protected endpoints require authentication.
* Role-based authorization is applied to restricted operations.
* Admin-only operations must not be accessible to other roles.

---

# Current Backend Status

The planned backend functionality has been implemented:

```text
Authentication             ✓
User Management            ✓
Role-Based Access          ✓
Departments                ✓
Categories                 ✓
Complaint Management       ✓
Automatic Department Map   ✓
Complaint Assignment       ✓
Maintenance Workflow       ✓
Close / Reopen             ✓
Notifications              ✓
Complaint History          ✓
Dashboard & Analytics      ✓
Reports                    ✓
Admin User Blocking        ✓
Docker Support             ✓
Alembic Migrations         ✓
```

---

# Frontend Integration

The backend exposes REST APIs that can be consumed by the frontend application.

Expected architecture:

```text
                 Frontend
                    |
                    | HTTP / REST API
                    v
              FastAPI Backend
                    |
                    v
               PostgreSQL
```

The frontend can use the JWT returned during login to access protected APIs.

---

# Project Status

The backend feature-development phase is complete.

Remaining project work includes:

* Frontend development
* Frontend/backend integration
* Complete end-to-end testing
* Deployment
* Final project documentation
* Final presentation/demo preparation

---

# License

This project is developed as an academic/college project for the Campus Complaint Portal.

````

### After creating it

Run:

```powershell
git status
````

Then:

```powershell
git add README.md
git commit -m "docs: add backend README"
git push origin main
```
