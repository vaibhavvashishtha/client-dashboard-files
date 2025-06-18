from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from fastapi.responses import FileResponse
from ..database import get_db
from ..models import FileMeta, ProcessedFile, Manufacturer, User
from ..utils import get_current_user
from ..config import UPLOAD_DIR
import os
import shutil

router = APIRouter(prefix="/affordplan", tags=["affordplan"])

@router.get("/hospital-uploads")
def list_hospital_uploads(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if user.role != "affordplan":
        raise HTTPException(status_code=403, detail="Not authorized")
    return db.query(FileMeta).all()

@router.get("/download/{file_id}")
def download_hospital_file(file_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if user.role != "affordplan":
        raise HTTPException(status_code=403, detail="Not authorized")
    file_meta = db.query(FileMeta).filter(FileMeta.id == file_id).first()
    if not file_meta:
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_meta.path, filename=file_meta.filename)

@router.post("/processed")
async def upload_processed_file(
    hospital_file_id: int = Form(...),
    manufacturer_id: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    if user.role != "affordplan":
        raise HTTPException(status_code=403, detail="Not authorized")
    manufacturer = db.query(Manufacturer).filter(Manufacturer.id == manufacturer_id).first()
    if not manufacturer:
        raise HTTPException(status_code=404, detail="Manufacturer not found")
    if not db.query(FileMeta).filter(FileMeta.id == hospital_file_id).first():
        raise HTTPException(status_code=404, detail="Hospital file not found")
    processed = ProcessedFile(
        hospital_file_id=hospital_file_id,
        manufacturer_id=manufacturer_id,
        filename=file.filename,
        uploaded_by=user.id
    )
    db.add(processed)
    db.commit()
    db.refresh(processed)
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    path = os.path.join(UPLOAD_DIR, f"proc_{processed.id}_{file.filename}")
    with open(path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    processed.path = path
    db.commit()
    return {"id": processed.id}
