# Client File Dashboard

A comprehensive file management dashboard that allows clients to upload files with date ranges, while providing role-based access control for viewing and downloading files. The application features separate interfaces for administrators and clients, with secure authentication and file management capabilities.

## Features

- **User Authentication**: Secure login system with JWT tokens
- **Role-Based Access Control**:
  - **Admin**: Full access to all features including user management
  - **Client**: File upload and view access to their own files
- **File Management**:
  - Upload files with date range metadata
  - View and download files
  - Track file upload history
- **Admin Dashboard**:
  - View all files across clients
  - Manage users and permissions
  - Monitor system activity

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

#### Development Environment

1. **Set up a virtual environment**:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment variables**:
   Create a `.env` file in the `backend` directory with the following variables:
   ```
   SECRET_KEY=your-secret-key
   DATABASE_URL=sqlite:///./sql_app.db  # For development
   # For production, use:
   # DATABASE_URL=postgresql://user:password@localhost/dbname
   ```

4. **Run database migrations**:
   ```bash
   alembic upgrade head
   ```

5. **Start the backend server**:
   ```bash
   uvicorn app.main:app --reload
   ```
   The API will be available at `http://localhost:8000`
   API documentation (Swagger UI) is available at `http://localhost:8000/docs`

### 3. Frontend Setup

1. **Install dependencies**:
   ```bash
   cd frontend
   npm install
   ```

2. **Configure environment variables**:
   Create a `.env` file in the `frontend` directory:
   ```
   VITE_API_URL=http://localhost:8000
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```
   The frontend will be available at `http://localhost:3000`

## Available Scripts

### Backend

- `uvicorn app.main:app --reload`: Start the development server
- `pytest`: Run backend tests
- `alembic upgrade head`: Apply database migrations

### Frontend

- `npm run dev`: Start the development server
- `npm run build`: Build for production
- `npm run preview`: Preview production build
- `npm run lint`: Run ESLint
- `npm test`: Run tests

## Default Users

### Admin User
- **Username**: admin
- **Password**: admin123 (Change this in production!)

### Client User
- **Username**: client1
- **Password**: client123

## Environment Variables

### Backend

- `SECRET_KEY`: Secret key for JWT token generation
- `DATABASE_URL`: Database connection URL
- `ACCESS_TOKEN_EXPIRE_MINUTES`: JWT token expiration time (default: 1440 minutes / 24 hours)
- `ALGORITHM`: JWT algorithm (default: HS256)

### Frontend

- `VITE_API_URL`: Base URL for API requests (default: http://localhost:8000)

## Deployment

### Backend

1. Set up a production database (PostgreSQL recommended)
2. Configure environment variables in production
3. Use a production ASGI server like Uvicorn with Gunicorn:
   ```bash
   gunicorn -w 4 -k uvicorn.workers.UvicornWorker app.main:app
   ```

### Frontend

1. Build the production bundle:
   ```bash
   npm run build
   ```
2. Deploy the contents of the `dist` directory to your web server

## Troubleshooting

- **Database connection issues**: Ensure your database is running and the connection string is correct
- **CORS errors**: Verify the backend CORS settings match your frontend URL
- **Authentication issues**: Check JWT token expiration and secret key configuration

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
