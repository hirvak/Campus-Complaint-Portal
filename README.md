# CampusCare — Campus Complaint Portal

CampusCare is a modern, light, SaaS-inspired role-based technology platform designed to streamline campus issue reporting, tracking, department assignment, and resolution.

---

## Project Structure

```text
Campus-Complaint-Portal/
│
├── backend/                  # FastAPI + SQLAlchemy + PostgreSQL Backend
│   ├── app/
│   ├── alembic/
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── requirements.txt
│   └── README.md
│
├── frontend/                 # React + Vite + Tailwind CSS Frontend
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── .env.example
│   ├── .env
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

---

## Design Direction & Visual System

- **Palette**: Warm off-white (`#FAF9F6`), Crisp White (`#FFFFFF`), Primary Blue Accent (`#2563EB`), Light Blue Accent (`#DBEAFE`), Soft Beige (`#F3EFE7`), Text (`#172033`), Muted (`#667085`), Border (`#E8E5DF`).
- **Typography**: Plus Jakarta Sans.
- **Style**: Light, premium, minimal SaaS aesthetic with subtle border radius, gentle micro-interactions, and visual mockups reflecting exact backend workflows.

---

## Quick Start

### 1. Running Backend

Navigate to the `backend/` directory and follow the backend README:

```bash
cd backend
python -m venv venv
# On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The FastAPI backend will run on `http://localhost:8000`.

### 2. Running Frontend

Navigate to the `frontend/` directory:

```bash
cd frontend
npm install
npm run dev
```

The React + Vite frontend will run on `http://localhost:5173`.

---

## Frontend Architecture

- **`src/services/api.js`**: Centralized API service consuming FastAPI endpoints.
- **`src/context/AuthContext.jsx`**: JWT state management, user session hydration via `/users/me`, and role-based redirecting.
- **`src/routes/AppRoutes.jsx`**: Public routes (`/`, `/login`, `/register`) and protected dashboard routes for all 5 roles (`Student`, `Faculty`, `Administrator`, `Facility Officer`, `Maintenance Team`).
