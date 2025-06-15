from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.models import Base, FileMeta
from app.database import get_db
from app.main import app

# Create database engine
engine = create_engine("sqlite:///backend/database.db")

# Create tables if they don't exist
Base.metadata.create_all(engine)

# Create a session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

try:
    # Add new columns to files table
    with engine.connect() as conn:
        conn.execute(text("""
            ALTER TABLE files 
            ADD COLUMN size INTEGER,
            ADD COLUMN type TEXT,
            ADD COLUMN name TEXT
        """))
        conn.commit()
    
    print("Database migration completed successfully!")
except Exception as e:
    print(f"Error during migration: {str(e)}")
finally:
    db.close()
