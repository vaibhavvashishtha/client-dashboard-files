from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
from ..models import User
from ..database import get_db
from ..utils import verify_password, create_access_token, get_password_hash
from datetime import timedelta

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password):
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role, "id": user.id, "client_id": user.client_id},
        expires_delta=timedelta(minutes=120),
    )
    return {"access_token": access_token, "token_type": "bearer"}

# For demo only: seed users on first run
@router.on_event("startup")
def seed_demo_users():
    from ..models import Client, User
    from ..database import SessionLocal
    db = SessionLocal()
    if db.query(Client).count() == 0:
        c1 = Client(name="AcmeCorp")
        db.add(c1)
        db.commit()
        db.refresh(c1)
        users = [
            User(username="admin", password=get_password_hash("admin123"), role="admin"),
            User(username="client1", password=get_password_hash("client123"), role="client", client_id=c1.id),
            User(username="employee1", password=get_password_hash("emp123"), role="employee", client_id=c1.id),
        ]
        db.add_all(users)
        db.commit()
    db.close()
