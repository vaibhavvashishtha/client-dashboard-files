from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from fastapi.responses import FileResponse
from ..database import get_db
from ..models import ProcessedFile, User
from ..utils import get_current_user
from ..config import UPLOAD_DIR
import os
import shutil

router = APIRouter(prefix="/manufacturer", tags=["manufacturer"])

@router.get("/consumption")
def list_consumption_files(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if user.role != "manufacturer":
        raise HTTPException(status_code=403, detail="Not authorized")
    return db.query(ProcessedFile).filter(ProcessedFile.manufacturer_id == user.manufacturer_id).all()

@router.get("/download/{processed_id}")
def download_consumption(processed_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if user.role != "manufacturer":
        raise HTTPException(status_code=403, detail="Not authorized")
    processed = db.query(ProcessedFile).filter(ProcessedFile.id == processed_id, ProcessedFile.manufacturer_id == user.manufacturer_id).first()
    if not processed:
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(processed.path, filename=processed.filename)

@router.post("/quote")
async def upload_quote(
    processed_file_id: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    if user.role != "manufacturer":
        raise HTTPException(status_code=403, detail="Not authorized")
    processed = db.query(ProcessedFile).filter(ProcessedFile.id == processed_file_id, ProcessedFile.manufacturer_id == user.manufacturer_id).first()
    if not processed:
        raise HTTPException(status_code=404, detail="Processed file not found")
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    quote_path = os.path.join(UPLOAD_DIR, f"quote_{processed_file_id}_{file.filename}")
    with open(quote_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    processed.quote_path = quote_path
    db.commit()
    return {"message": "Quote uploaded"}
