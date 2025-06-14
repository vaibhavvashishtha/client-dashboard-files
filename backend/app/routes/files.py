from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import FileMeta, User, LogEntry
import os, shutil
from datetime import date
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError

router = APIRouter(prefix="/files", tags=["files"])

UPLOAD_DIR = "backend/storage"
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")
SECRET_KEY = "mysupersecretkey"
ALGORITHM = "HS256"

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user = db.query(User).filter(User.username == payload.get("sub")).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.post("/upload")
def upload_file(
    file: UploadFile = File(...),
    start_date: date = Form(...),
    end_date: date = Form(...),
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    file_meta = FileMeta(
        filename=file.filename,
        path=file_path,
        uploaded_by=user.id,
        client_id=user.client_id,
        start_date=start_date,
        end_date=end_date,
    )
    db.add(file_meta)
    db.commit()
    db.refresh(file_meta)
    log = LogEntry(user=user.username, action="upload", file_id=file_meta.id)
    db.add(log)
    db.commit()
    return {"msg": "File uploaded", "file_id": file_meta.id}

@router.get("/list")
def list_files(db: Session = Depends(get_db), user=Depends(get_current_user)):
    if user.role == "admin":
        return db.query(FileMeta).all()
    elif user.role == "employee":
        return db.query(FileMeta).filter(FileMeta.client_id == user.client_id).all()
    else:
        return db.query(FileMeta).filter(FileMeta.uploaded_by == user.id).all()

from fastapi.responses import FileResponse

@router.get("/download/{file_id}")
def download_file(file_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    file_meta = db.query(FileMeta).filter(FileMeta.id == file_id).first()
    if not file_meta:
        raise HTTPException(status_code=404, detail="Not found")
    # Admins and employees of that client or owner can download
    if user.role == "admin" or \
       (user.role == "employee" and file_meta.client_id == user.client_id) or \
       (user.role == "client" and file_meta.uploaded_by == user.id):
        log = LogEntry(user=user.username, action="download", file_id=file_id)
        db.add(log)
        db.commit()
        return FileResponse(file_meta.path, filename=file_meta.filename)
    else:
        raise HTTPException(status_code=403, detail="Forbidden")
