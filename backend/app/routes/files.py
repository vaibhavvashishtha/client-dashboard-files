import os
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Client, FileMeta, User
from ..auth import get_current_user
from ..config import UPLOAD_DIR
from ..file_utils import (
    check_file_permission,
    get_user_from_token,
    log_action,
    resolve_file_path,
    save_upload,
)

router = APIRouter(prefix="/files", tags=["files"])

# Ensure storage directory exists
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.get("/debug/files")
def debug_list_files(db: Session = Depends(get_db)):
    """List all files with metadata for admins."""
    user = get_current_user(token=None, db=db)
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admin users can access this endpoint")

    files = db.query(FileMeta).all()
    details = []
    for file in files:
        path = file.path
        exists = os.path.exists(path) if path else False
        details.append(
            {
                "id": file.id,
                "filename": file.filename,
                "path": file.path,
                "uploaded_by": file.uploaded_by,
                "client_id": file.client_id,
                "start_date": file.start_date,
                "end_date": file.end_date,
                "uploaded_at": file.uploaded_at,
                "exists_on_disk": exists,
            }
        )

    return {"files": details, "count": len(files)}


@router.get("/history")
def get_upload_history(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    client_id: Optional[int] = None,
):
    if user.role == "admin":
        query = db.query(FileMeta)
        if client_id:
            query = query.filter(FileMeta.client_id == client_id)
    elif user.role == "employee":
        query = db.query(FileMeta).filter(FileMeta.client_id == user.client_id)
        if client_id and client_id != user.client_id:
            raise HTTPException(status_code=403, detail="Not authorized to view this client's files")
    else:
        query = db.query(FileMeta).filter(FileMeta.uploaded_by == user.id)

    results = query.all()
    for f in results:
        f.client_name = f.client.name if f.client else "No Client"
    return results


@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    start_date: date = Form(...),
    end_date: date = Form(...),
    client_id: Optional[int] = Form(None),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not file.filename.lower().endswith((".xls", ".xlsx")):
        raise HTTPException(status_code=400, detail="File must be XLS or XLSX")
    max_size = 100 * 1024 * 1024
    if file.size > max_size:
        raise HTTPException(status_code=400, detail="File size exceeds 100MB limit")

    if user.role == "admin":
        if client_id is None:
            raise HTTPException(status_code=400, detail="Client ID is required for admin uploads")
        if not db.query(Client).filter(Client.id == client_id).first():
            raise HTTPException(status_code=404, detail="Client not found")
    else:
        client_id = user.client_id

    file_meta = FileMeta(
        filename=file.filename,
        start_date=start_date,
        end_date=end_date,
        uploaded_by=user.id,
        client_id=client_id,
    )
    db.add(file_meta)
    db.commit()
    db.refresh(file_meta)

    path = save_upload(file, file_meta.id)
    file_meta.path = path
    db.commit()

    log_action(db, user, "upload", file_meta.id)
    return {"msg": "File uploaded successfully", "file_id": file_meta.id}


@router.get("/list")
def list_files(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if user.role == "admin":
        return db.query(FileMeta).all()
    if user.role == "employee":
        return db.query(FileMeta).filter(FileMeta.client_id == user.client_id).all()
    return db.query(FileMeta).filter(FileMeta.uploaded_by == user.id).all()


@router.delete("/delete/{file_id}")
def delete_file(file_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    file_meta = db.query(FileMeta).filter(FileMeta.id == file_id).first()
    if not file_meta:
        raise HTTPException(status_code=404, detail="File not found")

    check_file_permission(user, file_meta)

    path = resolve_file_path(file_meta)
    if os.path.exists(path):
        os.remove(path)

    db.delete(file_meta)
    db.commit()
    log_action(db, user, "delete", file_id)
    return {"msg": "File deleted successfully"}


@router.get("/download/{file_id}")
def download_file(
    file_id: int,
    db: Session = Depends(get_db),
    token: Optional[str] = Query(None),
):
    try:
        user = get_current_user(token=None, db=db)
    except HTTPException:
        if not token:
            raise HTTPException(status_code=401, detail="No authentication provided")
        user = get_user_from_token(token, db)

    file_meta = db.query(FileMeta).filter(FileMeta.id == file_id).first()
    if not file_meta:
        raise HTTPException(status_code=404, detail="File not found")

    check_file_permission(user, file_meta)
    path = resolve_file_path(file_meta)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail=f"File not found at path: {path}")

    log_action(db, user, "download", file_id)
    return FileResponse(path, filename=file_meta.filename, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
