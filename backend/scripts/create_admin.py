import sys
import os

# Add the backend directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from passlib.context import CryptContext
from app.database import SessionLocal, engine
from app.models import Base, User

# Create all tables
Base.metadata.create_all(bind=engine)

# Create session
db = SessionLocal()

# Create password hasher
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Create admin user
admin_username = "admin"
admin_password = "admin123"
hashed_password = pwd_context.hash(admin_password)

# Check if admin user already exists
existing_admin = db.query(User).filter(User.username == admin_username).first()
if existing_admin:
    print(f"Admin user '{admin_username}' already exists!")
else:
    # Create new admin user
    admin_user = User(
        username=admin_username,
        password=hashed_password,
        role="admin"
    )
    db.add(admin_user)
    db.commit()
    print(f"Admin user '{admin_username}' created successfully!")

db.close()
