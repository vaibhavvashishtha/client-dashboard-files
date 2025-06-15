# Client File Dashboard

A minimal dashboard to allow clients to upload files (with date range), assign employees per client, and allow employees/admins to view/download files based on access.

## Setup

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

This starts Vite on `http://localhost:3000` which proxies requests to the backend.

### Docker

Build and run both services together using Docker Compose:

```bash
docker-compose up --build
```

The backend will run on `http://localhost:8000` and the frontend will be served from `http://localhost`.

To build the images manually without Compose you can also run:

```bash
docker build -t client-dashboard-backend ./backend
docker build -t client-dashboard-frontend ./frontend
```

