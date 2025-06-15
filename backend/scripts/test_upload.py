import sys
import os
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal, engine
from app.models import Base, User
from passlib.context import CryptContext

# Add app directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Create test client
client = TestClient(app)

# Create admin user if it doesn't exist
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
def create_admin():
    db = SessionLocal()
    try:
        admin_username = "admin"
        admin_password = "admin123"
        hashed_password = pwd_context.hash(admin_password)
        
        existing_admin = db.query(User).filter(User.username == admin_username).first()
        if not existing_admin:
            admin_user = User(
                username=admin_username,
                password=hashed_password,
                role="admin"
            )
            db.add(admin_user)
            db.commit()
            db.refresh(admin_user)
            print(f"Created admin user with ID: {admin_user.id}")
        else:
            print(f"Admin user already exists with ID: {existing_admin.id}")
    finally:
        db.close()

# Create test file
def create_test_file():
    with open("test.xlsx", "w") as f:
        f.write("Name\tAge\nJohn\t30\nJane\t25")
    print("Created test file: test.xlsx")

# Test upload endpoint
def test_upload():
    # Login first to get token
    login_response = client.post(
        "/auth/login",
        data={"username": "admin", "password": "admin123"}
    )
    token = login_response.json()["access_token"]
    print(f"Login successful. Token: {token}")

    # Upload file
    with open("test.xlsx", "rb") as file:
        files = {"file": ("test.xlsx", file, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
        data = {
            "start_date": "2025-06-15",
            "end_date": "2025-06-15"
        }
        headers = {"Authorization": f"Bearer {token}"}
        
        response = client.post(
            "/files/upload",
            headers=headers,
            files=files,
            data=data
        )
        
        print("\n=== Upload Response ===")
        print(f"Status code: {response.status_code}")
        print(f"Response: {response.json()}")

if __name__ == "__main__":
    create_admin()
    create_test_file()
    test_upload()
