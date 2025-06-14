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
