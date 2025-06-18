import os
import tempfile
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app import models
from app.database import Base, get_db
import app.database as database
import app.routes.auth as auth

@pytest.fixture()
def client(monkeypatch):
    # create a temporary database
    fd, path = tempfile.mkstemp()
    os.close(fd)
    SQLALCHEMY_DATABASE_URL = f"sqlite:///{path}"
    engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)

    # override SessionLocal and engine
    monkeypatch.setattr(database, "SessionLocal", TestingSessionLocal)
    monkeypatch.setattr(database, "engine", engine)
    monkeypatch.setattr(auth, "SessionLocal", TestingSessionLocal, raising=False)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()
    app.dependency_overrides[get_db] = override_get_db

    # seed demo users
    auth.seed_demo_users()

    client = TestClient(app)
    yield client

    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)
    os.remove(path)
