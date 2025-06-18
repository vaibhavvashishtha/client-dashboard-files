import sys
import os

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.models import User
from app.utils import get_password_hash


def main():
    db = SessionLocal()
    try:
        users = db.query(User).all()
        updated = 0
        for user in users:
            if not user.password.startswith("$2"):
                user.password = get_password_hash(user.password)
                updated += 1
        if updated:
            db.commit()
        print(f"Updated {updated} user password(s)")
    finally:
        db.close()


if __name__ == "__main__":
    main()
