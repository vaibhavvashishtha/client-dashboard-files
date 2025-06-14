from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas, database
from ..database import get_db
from ..utils import get_current_user

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/clients", response_model=List[schemas.Client])
def get_clients(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    clients = db.query(models.Client).all()
    return clients

@router.get("/files/client/{client_id}")
def get_client_files(
    client_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    files = db.query(models.FileMeta).filter(models.FileMeta.client_id == client_id).all()
    return [{
        "id": file.id,
        "filename": file.filename,
        "path": file.path,
        "uploaded_by": file.uploaded_by,
        "client_id": file.client_id,
        "start_date": file.start_date.strftime("%Y-%m-%d"),
        "end_date": file.end_date.strftime("%Y-%m-%d"),
        "uploaded_at": file.uploaded_at.strftime("%Y-%m-%d %H:%M:%S")
    } for file in files]
