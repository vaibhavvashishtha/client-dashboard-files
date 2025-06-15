import os
from pathlib import Path

# Directory paths
BASE_DIR = Path(__file__).parent.parent
UPLOAD_DIR = BASE_DIR / "storage"

# Ensure storage directory exists
UPLOAD_DIR.mkdir(exist_ok=True)

# JWT Configuration
SECRET_KEY = "mysupersecretkey"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Database Configuration
DATABASE_URL = "sqlite:///" + str(BASE_DIR / "app.db")
