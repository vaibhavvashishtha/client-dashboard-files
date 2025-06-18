# Client File Dashboard

A comprehensive file management dashboard that lets clients securely upload files with date ranges while providing role-based access to view and download them.

## Features

- **User Authentication** using JWT
- **Role-Based Access Control**
- **File Management** with upload history
- **Admin Dashboard** to monitor all activity

## Roles

- **Admin** – manage all clients and files
- **Employee** – access files for their assigned client
- **Client** – upload and download their own files

## Prerequisites

- Node.js (v14+)
- Python (3.8+)
- PostgreSQL (for production, SQLite used for development)
- npm or yarn

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/client-dashboard-files.git
cd client-dashboard-files
```

### 2. Backend Setup

1. **Create a virtual environment**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows use venv\Scripts\activate
   ```
2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```
3. **Environment variables** – create a `.env` file in `backend`:
   ```
   SECRET_KEY=your-secret-key
   DATABASE_URL=sqlite:///./app.db
   ACCESS_TOKEN_EXPIRE_MINUTES=120
   ALGORITHM=HS256
   ```
4. **Run database migrations**
   ```bash
   alembic upgrade head
   ```
   If upgrading from an older version, run `python scripts/migrate_database.py` to apply legacy changes.
5. **Create an admin user**
   ```bash
   python scripts/create_admin.py
   ```
6. **Start the backend**
   ```bash
   uvicorn app.main:app --reload
   ```

### 3. Frontend Setup

1. **Install dependencies**
   ```bash
   cd ../frontend
   npm install
   ```
2. **Environment variables** – create a `.env` file in `frontend`:
   ```
   VITE_API_URL=http://localhost:8000
   ```
3. **Start the frontend**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:3000`.

## Onboarding Process

1. Admin signs in and creates clients and employee accounts (see example script above).
2. Provide new users with their credentials.
3. Employees and clients log in via `/login` and can upload or view files according to their role.

## File Flow

1. A file is uploaded via the dashboard.
2. Metadata is stored in the database and the file is saved to `backend/storage` as `<id>_<original-name>`.
3. Users can retrieve files through the download endpoint which validates their role.
4. All downloads and uploads are logged in the `logs` table for auditing.

## Environment Variables

### Backend
- `SECRET_KEY` – JWT signing key
- `DATABASE_URL` – database connection string
- `ACCESS_TOKEN_EXPIRE_MINUTES` – token lifetime in minutes
- `ALGORITHM` – JWT algorithm
- `UPLOAD_DIR` – storage folder (defaults to `backend/storage`)

### Frontend
- `VITE_API_URL` – base URL for API requests

## Test Commands

- `pytest` – run backend tests
- `python scripts/test_upload.py` – simple upload test
- `npm run lint` – lint frontend code

## Migration Steps

1. Run `alembic upgrade head` for new database revisions.
2. If migrating from earlier versions, execute `python scripts/migrate_database.py` once to add legacy columns.

