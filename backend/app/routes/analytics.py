from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import LogEntry
from .files import get_current_user

router = APIRouter(prefix="/analytics", tags=["analytics"])

@router.get("/logs")
def get_logs(db: Session = Depends(get_db), user=Depends(get_current_user)):
    if user.role != "admin":
        return []
    logs = db.query(LogEntry).order_by(LogEntry.timestamp.desc()).all()
    return [{
        "user": l.user,
        "action": l.action,
        "file_id": l.file_id,
        "timestamp": l.timestamp
    } for l in logs]
