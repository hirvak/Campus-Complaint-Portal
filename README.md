# CampusCare : Campus Complaint Portal

[![FastAPI](https://img.shields.io/badge/FastAPI-0.141.1-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19.2.8-61DAFB.svg?logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8.3.0-646CFF.svg?logo=vite&logoColor=white)](https://vitejs.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1.svg?logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-2.0.51-D71F00.svg?logo=sqlalchemy&logoColor=white)](https://www.sqlalchemy.org)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.3.3-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Alembic](https://img.shields.io/badge/Alembic-1.18.5-336791.svg)](https://alembic.sqlalchemy.org)
[![Tests](https://img.shields.io/badge/Tests-72%20Passed-success.svg)](#13-testing)

CampusCare is a full-stack, enterprise-grade, role-based complaint management and resolution platform engineered for academic and campus environments. It replaces manual complaint handling, informal messaging, and paper-based logs with a structured, transparent, and auditable digital lifecycle.

---

## Table of Contents

- [1. Project Overview](#1-project-overview)
- [2. Key Features](#2-key-features)
- [3. Technology Stack](#3-technology-stack)
- [4. Architecture](#4-architecture)
- [5. Project Folder Structure](#5-project-folder-structure)
- [6. Prerequisites](#6-prerequisites)
- [7. Installation and Setup](#7-installation-and-setup)
- [8. How to Run the Project](#8-how-to-run-the-project)
- [9. Database and Migrations](#9-database-and-migrations)
- [10. Authentication and Role-Based Access](#10-authentication-and-role-based-access)
- [11. Smart SLA and Escalation System](#11-smart-sla-and-escalation-system)
- [12. API Documentation](#12-api-documentation)
- [13. Testing](#13-testing)
  - [Unit Testing (62 Tests)](#unit-testing)
  - [Integration Testing (10 Workflows)](#integration-testing)
  - [Additional Verification Scripts](#additional-verification-scripts)
  - [Verified Test Results Summary](#verified-test-results-summary)
- [14. Troubleshooting](#14-troubleshooting)
- [15. Security Notes](#15-security-notes)
- [16. Git Workflow](#16-git-workflow)
- [17. Future Improvements](#17-future-improvements)
- [18. Conclusion](#18-conclusion)

---

## 1. Project Overview

Academic campuses frequently face challenges in maintaining facilities, resolving equipment failures, and managing student and faculty grievances. Complaints often suffer from:
- Lack of accountability and unclear departmental ownership.
- Unmonitored resolution timelines without service-level standards.
- Inability for students to track real-time issue progress.
- Absence of audit history when issues are reopened or escalated.

**CampusCare** solves these problems with a unified web portal:
1. **Students and Faculty** submit complaints with location details, descriptions, category selection, and optional image attachments (verified up to 5 MB).
2. **Categories Automatically Route** complaints to the responsible department (e.g., Electrical, Civil, IT, Hostel, Housekeeping).
3. **Facility Officers** review incoming complaints, prioritize urgency (`Low`, `Medium`, `High`, `Critical`), and assign them to specialized Maintenance Team members.
4. **Maintenance Team Members** manage their active workload, advance complaint status to `In Progress`, and resolve issues with resolution remarks and optional completion photos.
5. **Complainants Retain Ownership**: Once marked `Resolved`, the student or faculty member can officially **Close** the complaint or **Reopen** it if the issue persists.
6. **Smart SLA Engine**: Monitors resolution deadlines automatically, computes health statuses (`ON_TRACK`, `APPROACHING_DEADLINE`, `OVERDUE`, `RESOLVED`), and escalates overdue complaints to facility administration in a background monitoring loop.

---

## 2. Key Features

### User Authentication & Security
- Public user self-registration for `Student` (with `Campus` or `Hostel` type) and `Faculty`.
- Administrative creation for `Facility Officer` and `Maintenance Team` accounts.
- Password hashing using **bcrypt** via Passlib.
- Stateless session management using **JWT (JSON Web Tokens)** with HMAC-SHA256 signatures and configurable expiration (`ACCESS_TOKEN_EXPIRE_MINUTES`).
- User account activation and deactivation controlled by administrators.

### Role-Based Portals & Dashboards
- Dedicated, role-tailored dashboards and navigation guards for each of the 5 roles:
  - **Student**: File complaints, track personal complaints, view real-time status badges, close or reopen resolved complaints.
  - **Faculty**: File and monitor department or classroom complaints with priority visibility.
  - **Facility Officer**: Review pending triage pool, assign maintenance personnel, set priority levels, and inspect escalations.
  - **Maintenance Team**: View assigned task queue, transition tickets to `In Progress`, and submit resolutions with completion photos.
  - **Administrator**: Comprehensive oversight of all users, departments, categories, SLA rules, systemic analytics, and exportable reports.

### Complete Complaint Lifecycle
- **Status Progression**:
  $$\text{New} \longrightarrow \text{Assigned} \longrightarrow \text{In Progress} \longrightarrow \text{Resolved} \longrightarrow \text{Closed} \;\text{or}\; \text{Reopened}$$
- **Multi-Cycle Reopening**: Reopening a complaint starts a fresh SLA cycle (`sla_cycle`), computes a new deadline from the reopening timestamp, resets escalation flags, clears grandfathered status, and preserves all historical audit events.
- **Audit History**: Every creation, assignment, status transition, resolution, closure, reopening, and SLA recalculation is logged in the `ComplaintHistory` table with performer ID and timestamp.

### Secure Image Upload & Validation
- Complainants can attach reference images during creation.
- Maintenance technicians can attach proof-of-work completion images during resolution.
- Enforces strict image validation using **Pillow**:
  - Maximum upload file size: **5 MB**.
  - Verified image formats: **JPEG**, **PNG**, **WEBP**.
  - Binary verification prevents malicious file renaming (e.g., non-image files renamed with image extensions).
  - Files are saved with unique UUID filenames under `backend/uploads/complaints/` and served via FastAPI StaticFiles.

### In-App Notification System
- Dispatches event-driven notifications stored in PostgreSQL:
  - `Complaint Created`: Notifies Facility Officers of new unassigned tickets.
  - `Complaint Assigned`: Notifies assigned Maintenance technicians.
  - `Complaint Resolved`: Alerts the student/faculty ticket creator for review.
  - `Complaint Reopened`: Alerts Facility Officers to re-triage.
  - `Complaint Escalated`: Dispatched when SLA deadlines breach.
- Unread count badges, notification lists, and single or bulk "Mark as Read" actions.

### Smart SLA & Automated Background Escalation
- **Precedence Hierarchy**: Category-specific SLA rules take priority over system priority defaults.
- **Dynamic SLA Status**: Evaluates each complaint dynamically into `ON_TRACK`, `APPROACHING_DEADLINE`, `OVERDUE`, or `RESOLVED`.
- **Background Worker**: An asynchronous worker integrated into the FastAPI lifespan runs every 60 seconds (configurable via `SLA_CHECK_INTERVAL_SECONDS`).
- **Concurrency & Transaction Safety**: Uses PostgreSQL row-level locks (`with_for_update(skip_locked=True)`) to safely process overdue items across worker ticks without duplicates.
- **Audit Trails**: Escalations generate immutable `EscalationEvent` records keyed by complaint ID and SLA cycle.

### Reporting & Analytics
- Visual dashboard metric cards for total, pending, in-progress, resolved, closed, and escalated complaints.
- Aggregate breakdown queries across statuses, priorities, categories, and departments.
- Administrative report generation and one-click export to **CSV** or styled **PDF** format (built with ReportLab).

---

## 3. Technology Stack

### Frontend
| Component | Technology | Version / Specification |
|---|---|---|
| **Framework** | React | `^19.2.8` |
| **Build Tool** | Vite | `^8.3.0` |
| **Styling** | Tailwind CSS | `^4.3.3` (via `@tailwindcss/vite`) |
| **Routing** | React Router DOM | `^7.18.4` |
| **Icons** | Lucide React | `^1.49.0` |
| **Linter** | Oxlint | `^1.81.0` |

### Backend
| Component | Technology | Version / Specification |
|---|---|---|
| **Language** | Python | `3.11+` (tested with Python `3.13.5`) |
| **Framework** | FastAPI | `0.141.1` |
| **ASGI Server** | Uvicorn | `0.52.1` |
| **Validation** | Pydantic v2 | `2.13.4` (Core `2.46.4`) |
| **Database ORM** | SQLAlchemy | `2.0.51` |
| **PostgreSQL Driver** | psycopg2-binary | `2.9.12` |
| **Migrations** | Alembic | `1.18.5` |
| **Authentication** | python-jose / Passlib / bcrypt | `python-jose==3.5.0`, `passlib==1.7.4`, `bcrypt==4.0.1` |
| **Image Processing** | Pillow (PIL) | `12.3.0` |
| **PDF Generation** | ReportLab | `5.0.1` |
| **Environment** | python-dotenv | `1.2.2` |

### Database & Infrastructure
| Component | Technology | Specification |
|---|---|---|
| **Database** | PostgreSQL | Version `16` (Database: `campus_complaint_portal`) |
| **Container Engine** | Docker & Docker Compose | Dockerfile (`python:3.11-slim`), `docker-compose.yml` (db & backend services) |
| **Test Database** | SQLite In-Memory | `sqlite:///:memory:` with SQLAlchemy `StaticPool` (zero risk to PostgreSQL) |

---

## 4. Architecture

CampusCare follows a clean, layered architecture separating presentations, API routing, business services, database persistence, and asynchronous worker tasks:

```mermaid
flowchart TD
    subgraph Client["Frontend Client (React 19 + Vite)"]
        UI["Tailwind CSS UI / Dashboards"]
        AuthCtx["AuthContext (JWT Session)"]
        ApiClient["services/api.js (Fetch Client)"]
        UI --> AuthCtx
        UI --> ApiClient
    end

    subgraph Backend["FastAPI Backend (Port 8000)"]
        Router["API Routers (/auth, /complaints, /sla, etc.)"]
        Deps["Dependencies (get_db, get_current_user, require_roles)"]
        ServiceLayer["Service Layer (Business Logic & SLA Engine)"]
        RepoLayer["Repository Layer (CRUD Queries)"]
        Worker["SLA Background Worker (asyncio loop, 60s tick)"]

        Router --> Deps
        Router --> ServiceLayer
        Worker --> ServiceLayer
        ServiceLayer --> RepoLayer
    end

    subgraph Storage["Data & File Persistence"]
        DB[("PostgreSQL 16 Database\ncampus_complaint_portal")]
        StaticFiles["Local File Storage\nbackend/uploads/complaints/"]
        
        RepoLayer --> DB
        ServiceLayer --> DB
        ServiceLayer --> StaticFiles
    end

    ApiClient -->|"REST API / JSON / Bearer Token"| Router
```

### Architectural Layers
1. **Presentation Layer (Frontend)**: React 19 single-page application utilizing React Router DOM v7 for protected route hierarchies, AuthContext for hydration of `/users/me`, and Tailwind CSS for minimal, accessible styling.
2. **API Routing Layer (`app/*/routes.py`)**: Defines REST endpoints, validates HTTP query/path parameters, deserializes Pydantic schemas, and injects authentication/database dependencies.
3. **Service Layer (`app/*/service.py`)**: Coordinates core business operations: calculating SLA deadlines, resolving category-to-department assignments, enforcing lifecycle status checks, uploading verified photos, dispatching notifications, and generating audit history logs.
4. **Repository Layer (`app/*/repository.py`)**: Encapsulates SQLAlchemy database queries, filters, pagination, and transactional updates.
5. **Background SLA Worker (`app/SLA/worker.py`)**: Runs concurrently inside the FastAPI lifespan using `asyncio.to_thread` to execute non-blocking checks against overdue complaints with row locks (`with_for_update(skip_locked=True)`).
6. **Persistence Layer**: PostgreSQL 16 relational database with 8 domain tables managed by 9 linear Alembic migration revisions.

---

## 5. Project Folder Structure

```text
Campus-Complaint-Portal/
├── README.md                           # Master Project Documentation (This File)
│
├── frontend/                           # React + Vite Frontend
│   ├── public/                         # Public static assets
│   ├── src/
│   │   ├── assets/                     # Icons, logos, and illustrations
│   │   ├── components/                 # Reusable UI components
│   │   │   ├── Button.jsx
│   │   │   ├── ComplaintDetailsModal.jsx
│   │   │   ├── ComplaintFilters.jsx
│   │   │   ├── ComplaintPhoto.jsx
│   │   │   ├── ComplaintPriorityBadge.jsx
│   │   │   ├── ComplaintStatusBadge.jsx
│   │   │   ├── ComplaintTable.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── SlaBadge.jsx            # Dynamic SLA status indicator
│   │   │   └── SlaTracker.jsx          # Deadline countdown & overdue display
│   │   ├── context/
│   │   │   ├── AuthContext.jsx         # User session & token state management
│   │   │   └── ThemeContext.jsx
│   │   ├── pages/
│   │   │   ├── admin/                  # Admin management pages
│   │   │   │   ├── CategoryManagement.jsx
│   │   │   │   ├── DepartmentManagement.jsx
│   │   │   │   ├── ReportsAnalytics.jsx
│   │   │   │   ├── SlaManagement.jsx   # SLA configuration UI
│   │   │   │   └── UserManagement.jsx
│   │   │   ├── dashboards/             # Role-specific dashboard views
│   │   │   │   ├── AdminDashboard.jsx
│   │   │   │   ├── FacilityOfficerDashboard.jsx
│   │   │   │   ├── FacultyDashboard.jsx
│   │   │   │   ├── MaintenanceDashboard.jsx
│   │   │   │   └── StudentDashboard.jsx
│   │   │   ├── AllComplaints.jsx
│   │   │   ├── AssignedComplaints.jsx
│   │   │   ├── CreateComplaint.jsx
│   │   │   ├── Landing.jsx             # Public landing page
│   │   │   ├── Login.jsx
│   │   │   ├── MyComplaints.jsx
│   │   │   ├── Notifications.jsx
│   │   │   ├── PendingComplaints.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── SingleComplaintDetails.jsx
│   │   │   └── Unauthorized.jsx
│   │   ├── routes/
│   │   │   └── AppRoutes.jsx           # Protected & role-based routing table
│   │   ├── services/
│   │   │   └── api.js                  # Centralized HTTP API client
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── .env.example                    # Frontend environment template
│   ├── package.json                    # Frontend dependencies & npm scripts
│   └── vite.config.js                  # Vite configuration with Tailwind CSS v4
│
└── backend/                            # FastAPI + SQLAlchemy Backend
    ├── alembic/
    │   ├── versions/                   # 9 linear migration scripts
    │   └── env.py                      # Alembic environment and model bindings
    │
    ├── app/                            # Backend Application Package
    │   ├── Auth/                       # Authentication, login, dependencies, JWT
    │   ├── Categories/                 # Complaint categories & department mapping
    │   ├── ComplaintHistory/           # Audit trail logging & history routes
    │   ├── Complaints/                 # Complaint lifecycle, photo storage, filters
    │   ├── Dashboard/                  # Aggregate counts & dashboard analytics
    │   ├── Database/                   # Engine, SessionLocal, declarative base
    │   ├── Departments/                # Department entity management
    │   ├── Notifications/              # In-app notifications & read receipts
    │   ├── Reports/                    # Summary metrics, CSV/PDF export
    │   ├── Scripts/                    # Administrative seeding utilities (create_admin.py)
    │   ├── Security/                   # Bcrypt password hashing, JWT encoder/decoder
    │   ├── SLA/                        # Smart SLA engine, rules, worker, routes
    │   ├── Users/                      # User model, schemas, admin management
    │   ├── Utils/                      # Enums (UserRole, ComplaintStatus, etc.)
    │   └── main.py                     # FastAPI app factory, CORS, lifespan worker
    │
    ├── scratch/                        # Automated Test Suites & Verification Tools
    │   ├── test_auth_unit.py           # Unit tests: Auth & registration
    │   ├── test_category_unit.py       # Unit tests: Categories module
    │   ├── test_department_unit.py     # Unit tests: Departments module
    │   ├── test_user_unit.py           # Unit tests: Users & password hashing
    │   ├── test_complaint_unit.py      # Unit tests: Complaint transitions & lifecycle
    │   ├── test_notification_unit.py   # Unit tests: Notifications dispatch & read
    │   ├── test_sla_unit.py            # Unit tests: SLA calculations & overrides
    │   ├── test_history_dashboard_unit.py # Unit tests: History logging & metrics
    │   ├── test_workflows_integration.py # 10 End-to-end integration workflows (SQLite)
    │   ├── test_image_upload.py        # Image upload & size/format validation test
    │   ├── test_sla_focus.py           # Focused SLA calculations & cycle tests
    │   ├── test_stage2_sla.py          # SLA API routes & permission checks
    │   ├── test_stage2_escalation_trigger.py # On-demand check-now escalation test
    │   ├── test_stage3_worker.py       # Background worker startup, loop & shutdown test
    │   ├── test_sql_output.py          # Offline Alembic SQL inspection script
    │   └── verify_alembic_dag.py       # Alembic DAG integrity verification tool
    │
    ├── uploads/                        # Runtime complaint file uploads directory
    │   └── complaints/
    ├── .env.example                    # Backend environment template
    ├── alembic.ini                     # Alembic configuration file
    ├── docker-compose.yml              # PostgreSQL 16 & backend container setup
    ├── Dockerfile                      # Production container recipe (Python 3.11-slim)
    └── requirements.txt                # Pinned Python package dependencies
```

---

## 6. Prerequisites

Ensure the following tools are installed on your machine before setting up CampusCare:

1. **Python**: Version `3.11` or higher (`Python 3.13` is fully verified).
   ```powershell
   python --version
   ```
2. **Node.js & npm**: Node.js `v18+` or `v20+` (verified on `v24.18.0`) with npm `v9+` (verified on `11.16.0`).
   ```powershell
   node --version
   npm --version
   ```
3. **PostgreSQL**: Version `16` installed locally or available via Docker Desktop.
   ```powershell
   # If using local PostgreSQL
   psql --version
   # If using Docker
   docker --version
   docker compose version
   ```
4. **Git**:
   ```powershell
   git --version
   ```

---

## 7. Installation and Setup

Follow these step-by-step instructions in **Windows PowerShell** to clone and configure the project from scratch.

### Step 1: Clone the Repository
```powershell
git clone https://github.com/hirvak/Campus-Complaint-Portal.git
cd "Campus-Complaint-Portal"
```

### Step 2: Configure Backend Virtual Environment & Dependencies
```powershell
cd backend

# Create virtual environment
python -m venv venv

# If PowerShell script execution is restricted, run:
# Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Upgrade pip and install all required packages
pip install --upgrade pip
pip install -r requirements.txt
```

### Step 3: Configure Backend Environment Variables
Create a `.env` file in the `backend/` directory by copying the provided `.env.example`:

```powershell
Copy-Item .env.example .env
```

Open `backend/.env` in your text editor and verify or customize the values:
```env
# Database connection string (Format: postgresql://<user>:<password>@<host>:<port>/<dbname>)
DATABASE_URL=postgresql://postgres:1234@localhost:5432/campus_complaint_portal

# Secret key used for signing JWT tokens (replace with a long, random string in production)
SECRET_KEY=your-secure-secret-key-replace-me

# JWT hashing algorithm
ALGORITHM=HS256

# JWT token expiration time in minutes (1440 = 24 hours)
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Optional: SLA background monitor check interval in seconds (default is 60)
SLA_CHECK_INTERVAL_SECONDS=60
```

### Step 4: Configure Frontend Dependencies & Environment
In a new PowerShell terminal, navigate to the `frontend/` directory:

```powershell
cd "Campus-Complaint-Portal\frontend"

# Install frontend dependencies
npm install

# Create frontend environment file
Copy-Item .env.example .env
```

Verify that `frontend/.env` points to the FastAPI backend:
```env
VITE_API_BASE_URL=http://localhost:8000
```

### Step 5: Database Creation & Migration
1. Ensure your PostgreSQL server is running. Create the database `campus_complaint_portal` if it does not already exist:
   ```powershell
   # Example using PostgreSQL psql CLI:
   psql -U postgres -c "CREATE DATABASE campus_complaint_portal;"
   ```
   *(Or start PostgreSQL via Docker as shown in [Section 8](#8-how-to-run-the-project)).*

2. Apply all 9 Alembic migrations to set up the complete schema:
   ```powershell
   cd "Campus-Complaint-Portal\backend"
   .\venv\Scripts\Activate.ps1
   alembic upgrade head
   ```

3. Seed the initial Administrator account:
   ```powershell
   python -m app.Scripts.create_admin
   ```
   > **Note**: This creates an initial administrator account with email `admin@gmail.com` and password `Admin@123` (if not already existing). You can immediately log into the `/admin` portal with these credentials.

---

## 8. How to Run the Project

Running the complete application requires starting the Database, the FastAPI Backend, and the React Frontend. Open three separate PowerShell terminals:

### Terminal 1: Database

#### Option A: Using Local PostgreSQL Service
If PostgreSQL 16 is installed on Windows, make sure the service is active:
```powershell
Get-Service -Name postgresql*
# If stopped:
Start-Service postgresql*
```

#### Option B: Using Docker Compose (Database Only)
You can start just the PostgreSQL container using the included `docker-compose.yml`:
```powershell
cd "Campus-Complaint-Portal\backend"
docker compose up -d db
```

---

### Terminal 2: FastAPI Backend Server

```powershell
cd "Campus-Complaint-Portal\backend"
.\venv\Scripts\Activate.ps1

# Start Uvicorn with auto-reload
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Upon startup, you will see output indicating that the SLA Background Monitor has started:
```text
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:sla_worker:SLA Background Monitor started (interval=60s)
INFO:     Application startup complete.
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
```

---

### Terminal 3: React / Vite Frontend

```powershell
cd "Campus-Complaint-Portal\frontend"
npm run dev
```

Vite will start the client development server:
```text
  VITE v8.3.0  ready in 240 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

---

### Access URLs

| Application | URL | Description |
|---|---|---|
| **Web Portal** | [http://localhost:5173](http://localhost:5173) | Main React Single-Page Application |
| **API Root** | [http://localhost:8000](http://localhost:8000) | FastAPI Backend Base URL |
| **Interactive API Docs (Swagger UI)** | [http://localhost:8000/docs](http://localhost:8000/docs) | Interactive API Explorer & Testing Tool |
| **Alternative API Docs (ReDoc)** | [http://localhost:8000/redoc](http://localhost:8000/redoc) | Clean API Reference Documentation |
| **Static Uploads** | [http://localhost:8000/uploads/](http://localhost:8000/uploads/) | Publicly served image uploads |

---

## 9. Database and Migrations

The database architecture is managed with **SQLAlchemy ORM** and tracked through **Alembic**.

### Migration Chain
The project has 9 strictly linear revisions without forks or multiple heads:

| Revision ID | Down Revision | Description |
|---|---|---|
| `0d5268754757` | `None` | Create `users` table |
| `8b6444ff5594` | `0d5268754757` | Create `departments` table |
| `b903cf698178` | `8b6444ff5594` | Add `student_type` column to `users` |
| `4cffe76445e0` | `b903cf698178` | Create `categories` table |
| `fb49b11fb6bc` | `4cffe76445e0` | Create `complaints` table |
| `c537f639cd5a` | `fb49b11fb6bc` | Create `notifications` table |
| `9b2504848c76` | `c537f639cd5a` | Create `complaint_history` table |
| `a1b2c3d4e5f6` | `9b2504848c76` | Add `COMPLAINT_ESCALATED` to notification type enum |
| `e8a1d7f4c3b2` | `a1b2c3d4e5f6` | Add Smart SLA & Escalation System (`sla_configs`, `escalation_events`, cycle support) |

### Migration Commands (from `backend/`)

```powershell
cd backend
.\venv\Scripts\Activate.ps1

# Apply all pending migrations to the latest revision (head)
alembic upgrade head

# Check the current database revision
alembic current

# View the full migration history
alembic history --verbose

# Inspect the exact SQL statements generated without executing them
alembic upgrade head --sql

# Verify DAG integrity using the project's verification utility
python scratch\verify_alembic_dag.py
```

> [!WARNING]
> Never run migration rollback or test commands against the development database without a verified backup. Automated tests use an isolated in-memory SQLite database and do not touch PostgreSQL.

---

## 10. Authentication and Role-Based Access

Authentication uses HTTP Bearer tokens with JSON Web Tokens (JWT). When a user logs in via `POST /auth/login`, the backend verifies credentials using bcrypt and issues a signed JWT token:

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

Protected endpoints require the standard header:
```http
Authorization: Bearer <access_token>
```

### Role Permissions Matrix

The system defines 5 distinct roles in `app.Utils.enums.UserRole`:

| Feature / Action | Student | Faculty | Facility Officer | Maintenance Team | Administrator |
|---|:---:|:---:|:---:|:---:|:---:|
| Self-register via `/auth/register` | ✅ | ✅ | ❌ | ❌ | ❌ |
| Create new complaints | ✅ | ✅ | ❌ | ❌ | ❌ |
| View "My Complaints" list | ✅ | ✅ | ❌ | ❌ | ❌ |
| View pending triage pool (`/complaints/pending`) | ❌ | ❌ | ✅ | ❌ | ❌ |
| Assign complaint & set priority (`/complaints/{id}/assign`) | ❌ | ❌ | ✅ | ❌ | ❌ |
| View assigned tasks (`/complaints/assigned`) | ❌ | ❌ | ❌ | ✅ | ❌ |
| Mark complaint `In Progress` | ❌ | ❌ | ❌ | ✅ | ❌ |
| Resolve complaint with remarks & photo | ❌ | ❌ | ❌ | ✅ | ❌ |
| Close or Reopen own resolved complaint | ✅ | ✅ | ❌ | ❌ | ❌ |
| View all campus complaints (`/complaints/all`) | ❌ | ❌ | ✅ | ❌ | ✅ |
| Manage SLA rules & run on-demand checks | ❌ | ❌ | ❌ | ❌ | ✅ |
| Manage Departments, Categories & Users | ❌ | ❌ | ❌ | ❌ | ✅ |
| Export Analytics & Reports (CSV / PDF) | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 11. Smart SLA and Escalation System

CampusCare features an automated Service Level Agreement (SLA) and escalation engine designed to enforce timely complaint resolution.

### 1. Precedence Hierarchy
When calculating an SLA deadline, the system resolves rules in this strict order:
1. **Category-Specific SLA Rule**: If an active rule in `sla_configs` matches the complaint's `category_id`, its `target_hours` and `warning_hours` apply directly (regardless of ticket priority).
2. **Priority-Level SLA Rule**: If no category rule matches, the active configuration for the ticket's priority (`Critical`, `High`, `Medium`, `Low`) is used.
3. **System Defaults**: If no database configuration matches, hardcoded defaults apply:

| Priority | Default Target Duration | Default Warning Window |
|---|:---:|:---:|
| **Critical** | **4 hours** | 1 hour before deadline |
| **High** | **12 hours** | 2 hours before deadline |
| **Medium** | **24 hours** | 4 hours before deadline |
| **Low** | **48 hours** | 8 hours before deadline |

### 2. SLA Health Statuses
The frontend displays color-coded badges and countdown timers based on calculated statuses:
- **`ON_TRACK`**: Ticket is active, unresolved, and remaining time exceeds the warning window.
- **`APPROACHING_DEADLINE`**: Unresolved and remaining time is within the warning window.
- **`OVERDUE`**: Unresolved and the deadline timestamp has passed, or the ticket has been escalated.
- **`RESOLVED`**: Ticket has reached `Resolved` or `Closed` status.

### 3. Multi-Cycle Reopening Architecture
When a student or faculty member reopens a resolved complaint:
1. `complaint.sla_cycle` increments by 1 (e.g., from cycle 1 to cycle 2).
2. Current-cycle escalation state is reset (`is_escalated = False`, `escalation_level = 0`).
3. `is_grandfathered` is cleared to ensure the ticket is actively monitored.
4. A **fresh SLA deadline** is computed starting from the reopening timestamp.
5. All prior escalation events in the `EscalationEvent` audit table remain untouched and preserved for administrative auditing.

### 4. Background SLA Worker
- Configured in `app/main.py` via FastAPI lifespan (`sla_worker.start()` and `await sla_worker.stop()`).
- Ticks every 60 seconds (configurable via `SLA_CHECK_INTERVAL_SECONDS`).
- Runs synchronous database queries in a worker thread (`asyncio.to_thread`) to prevent blocking the async event loop.
- Uses PostgreSQL row locks (`with_for_update(skip_locked=True)`) to eliminate race conditions between workers.
- Automatically generates `EscalationEvent` records and dispatches `COMPLAINT_ESCALATED` notifications to Facility Officers.

---

## 12. API Documentation

When the FastAPI server is running, explore and test the endpoints directly via the interactive Swagger UI at **`http://localhost:8000/docs`**.

### Summary of Endpoint Groups

```text
Authentication     /auth/register, /auth/login
Users              /users/me, /users/, /users/{id}, /users/{id}/status
Complaints         /complaints/, /complaints/my, /complaints/pending, /complaints/assigned,
                   /complaints/all, /complaints/search, /complaints/{id}, /complaints/upload-image,
                   /complaints/{id}/assign, /complaints/{id}/status, /complaints/{id}/resolve,
                   /complaints/{id}/close, /complaints/{id}/reopen
Complaint History  /complaints/{id}/history
Categories         /categories/, /categories/{id}, /categories/department/{dept_id}
Departments        /departments/, /departments/{id}
Notifications      /notifications/, /notifications/unread, /notifications/read-all,
                   /notifications/{id}/read
Dashboard          /dashboard/
Reports            /reports/, /reports/summary, /reports/status, /reports/priority,
                   /reports/categories, /reports/departments, /reports/export?format=csv|pdf
SLA & Escalation   /sla/configs, /sla/configs/{id}, /sla/check-now, /sla/worker-status
```

---

## 13. Testing

CampusCare includes both **unit test suites** (testing isolated functions with mocks) and **integration test suites** (testing multi-module workflows against an isolated in-memory SQLite database).

### Unit Testing

Unit tests reside in `backend/scratch/` and test individual services, repositories, schemas, and password security using `unittest` and `unittest.mock`:

| Test File | Modules Tested | Focus Area |
|---|---|---|
| [`test_auth_unit.py`](file:///backend/scratch/test_auth_unit.py) | `app.Auth`, `app.Security` | User registration, login verification, JWT token generation |
| [`test_category_unit.py`](file:///backend/scratch/test_category_unit.py) | `app.Categories` | Category CRUD operations, department associations |
| [`test_department_unit.py`](file:///backend/scratch/test_department_unit.py) | `app.Departments` | Department CRUD, validation, role restrictions |
| [`test_user_unit.py`](file:///backend/scratch/test_user_unit.py) | `app.Users`, `app.Security` | User queries, profile retrieval, password hashing |
| [`test_complaint_unit.py`](file:///backend/scratch/test_complaint_unit.py) | `app.Complaints` | Creation, assignment, status update, resolve, close, reopen |
| [`test_notification_unit.py`](file:///backend/scratch/test_notification_unit.py) | `app.Notifications` | Notification dispatch, inbox queries, marking read |
| [`test_sla_unit.py`](file:///backend/scratch/test_sla_unit.py) | `app.SLA` | Precedence resolution, deadline calculation, warning thresholds |
| [`test_history_dashboard_unit.py`](file:///backend/scratch/test_history_dashboard_unit.py) | `app.ComplaintHistory`, `app.Dashboard` | Audit history creation, dashboard counters |

#### Running All Unit Tests

**From Repository Root (PowerShell):**
```powershell
$env:PYTHONPATH = "backend"
.\backend\venv\Scripts\python.exe -m unittest discover -s backend/scratch -p "test_*_unit.py" -v
```

**From `backend/` Directory (PowerShell):**
```powershell
cd backend
.\venv\Scripts\Activate.ps1
$env:PYTHONPATH = "."
python -m unittest discover -s scratch -p "test_*_unit.py" -v
```

---

### Integration Testing

The integration test suite in [`backend/scratch/test_workflows_integration.py`](file:///backend/scratch/test_workflows_integration.py) executes **10 end-to-end multi-module workflows**:

1. `test_auth_registration_and_login_workflow`: User registration $\rightarrow$ bcrypt hash $\rightarrow$ login $\rightarrow$ JWT verification.
2. `test_complaint_creation_and_automatic_notification_workflow`: Student submits complaint $\rightarrow$ category SLA calculated $\rightarrow$ history entry created $\rightarrow$ Facility Officer notified.
3. `test_complaint_assignment_and_sla_recalculation_workflow`: Officer assigns complaint $\rightarrow$ priority set to High $\rightarrow$ SLA recalculated to 12h $\rightarrow$ Maintenance notified.
4. `test_maintenance_work_progression_workflow`: Maintenance updates status to `In Progress` $\rightarrow$ history logged.
5. `test_complaint_resolution_workflow`: Maintenance resolves complaint with remarks & photo $\rightarrow$ student notified.
6. `test_student_reopen_and_multi_cycle_sla_workflow`: Student reopens ticket $\rightarrow$ `sla_cycle` increments to 2 $\rightarrow$ flags reset $\rightarrow$ fresh deadline computed $\rightarrow$ officer alerted.
7. `test_sla_escalation_engine_execution_workflow`: Overdue ticket simulated $\rightarrow$ `check_and_escalate_overdue_complaints` runs $\rightarrow$ `EscalationEvent` recorded $\rightarrow$ officer alerted.
8. `test_notification_consumption_and_read_status_workflow`: Officer retrieves inbox $\rightarrow$ marks notification read $\rightarrow$ persisted in database.
9. `test_student_complaint_closure_workflow`: Student marks resolved ticket as `Closed` $\rightarrow$ history recorded.
10. `test_sla_config_crud_and_precedence_workflow`: Admin creates category rule $\rightarrow$ confirms category rule overrides priority rule.

#### Database Isolation in Integration Tests
> [!NOTE]
> Integration tests use an **in-memory SQLite database** (`sqlite:///:memory:`) configured with SQLAlchemy's `StaticPool`.
> - The live PostgreSQL development database is **never touched, altered, or queried**.
> - Each test case dynamically creates all 8 database tables during `setUp()` and tears them down during `tearDown()`.
> - Because `httpx` is not required, tests directly invoke route functions with Pydantic request models, current user contexts, and database sessions. This exercises full route parameter validation, permission checks, services, repositories, and ORM persistence without needing external network sockets.

#### Running Integration Tests

**From Repository Root (PowerShell):**
```powershell
.\backend\venv\Scripts\python.exe backend\scratch\test_workflows_integration.py
```

**From `backend/` Directory (PowerShell):**
```powershell
cd backend
.\venv\Scripts\Activate.ps1
python scratch\test_workflows_integration.py
```

---

### Additional Verification Scripts

| Script | Purpose | Note |
|---|---|---|
| `verify_alembic_dag.py` | Validates Alembic migration integrity, detects branching, and ensures 1 head. | Safe to run offline anytime. |
| `test_sql_output.py` | Generates offline SQL for migration head inspection. | Safe to run offline. |
| `test_image_upload.py` | Tests Pillow image format verification and 5 MB size limit. | Mock/unit execution. |
| `test_sla_focus.py` | Focused verification of deadline calculation, category override, and grandfathering. | Unit execution. |
| `test_stage2_sla.py` | Verifies Stage 2 SLA logic, permissions, and configuration validation. | Unit execution. |
| `test_stage2_escalation_trigger.py` | Verifies on-demand `/sla/check-now` escalation triggering. | Unit execution. |
| `test_stage3_worker.py` | Tests SLA background worker loop startup, execution ticks, and graceful shutdown. | Uses isolated SQLite. |

---

### Verified Test Results Summary

*(Executed and verified in project environment on 2026-10-29)*

```text
======================================================================
CampusCare Test Suite Execution Summary
======================================================================
Unit Tests (8 test suites):         62 Passed,  0 Failed,  0 Errors  (1.53s)
Integration Tests (10 workflows):   10 Passed,  0 Failed,  0 Errors  (13.91s)
----------------------------------------------------------------------
Total Test Coverage:                72 Passed,  0 Failed,  0 Errors
======================================================================
```

---

## 14. Troubleshooting

### 1. PowerShell Script Execution Error
- **Symptom**: `File ...\Activate.ps1 cannot be loaded because running scripts is disabled on this system.`
- **Solution**: Enable script execution for the current user in PowerShell:
  ```powershell
  Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
  ```

### 2. Database Connection Failure (`OperationalError`)
- **Symptom**: `connection to server at "localhost", port 5432 failed: Connection refused`
- **Solution**:
  - Verify PostgreSQL is running: `Get-Service postgresql*` or `docker compose ps`.
  - Check `DATABASE_URL` in `backend/.env`. Ensure the username, password, port, and database name match your local PostgreSQL configuration.

### 3. Alembic Migration Fails (`Can't locate revision`)
- **Symptom**: `Target database is not up to date` or revision mismatch.
- **Solution**:
  - Run `alembic current` from the `backend/` directory to inspect the current revision.
  - Run `python scratch\verify_alembic_dag.py` to confirm the migration files on disk form a linear chain ending at `e8a1d7f4c3b2`.
  - Apply head: `alembic upgrade head`.

### 4. Frontend Cannot Connect to Backend (`Unable to connect to backend server`)
- **Symptom**: Network error when logging in or submitting forms.
- **Solution**:
  - Confirm the FastAPI backend is running on port 8000.
  - Verify that `frontend/.env` contains `VITE_API_BASE_URL=http://localhost:8000`.
  - Check CORS settings in `backend/app/main.py`. The backend allows `http://localhost:5173` and `http://127.0.0.1:5173`.

### 5. Test Import Errors (`ModuleNotFoundError: No module named 'app'`)
- **Symptom**: Running tests via `python -m unittest` fails to find `app`.
- **Solution**: Set the Python path in PowerShell before running test commands:
  ```powershell
  $env:PYTHONPATH = "backend"
  ```

---

## 15. Security Notes

- **Never Commit Secrets**: Never commit `.env` files containing `DATABASE_URL`, `SECRET_KEY`, or credentials to version control. Both `backend/.env.example` and `frontend/.env.example` are provided as clean templates.
- **Frontend Environment Best Practice**: Add `.env` explicitly to `frontend/.gitignore` to prevent committing client-side configuration.
- **Test Database Isolation**: Always run automated tests using the provided scripts. Integration tests use SQLite in-memory with `StaticPool` to ensure your live development database is never modified or erased.
- **Password Hashing**: Passwords are never stored in plaintext. They are salted and hashed using bcrypt before being committed to PostgreSQL.
- **Role Verification**: Critical endpoints enforce backend role checks using FastAPI's dependency injection (`require_roles` or `verify_admin`). Client-side route protections serve for UX and navigation convenience, with authoritative authorization enforced at the API layer.

---

## 16. Git Workflow

When contributing or updating features in CampusCare, follow a standard Git workflow:

```powershell
# 1. Check current repository status
git status

# 2. Review line-by-line diffs
git diff

# 3. Stage specific modified files (avoid blind "git add .")
git add <filename>

# 4. Commit changes with a descriptive message
git commit -m "feat(sla): implement category precedence in deadline calculation"

# 5. Push to remote repository
git push origin main
```

---

## 17. Future Improvements

The following items are potential future enhancements for CampusCare:
- **Email & SMS Notifications**: Integrate SendGrid or Twilio for external email and SMS alerts alongside existing in-app notifications.
- **Campus Calendar & Holiday Awareness**: Enhance the SLA calculation engine to pause SLA countdowns during official campus holidays and weekends.
- **Real-Time WebSockets**: Introduce WebSocket feeds to update complaint trackers, countdown timers, and notifications without polling.
- **Mobile Companion App**: Build a cross-platform mobile application (React Native or Flutter) for maintenance staff working in the field.

---

## 18. Conclusion

CampusCare provides a robust, production-ready campus complaint resolution platform. Built with **FastAPI**, **React 19**, and **PostgreSQL 16**, it brings complete accountability, automated SLA enforcement, and real-time visibility to institutional facility management.
