from pathlib import Path
import os
import shutil
from fastapi import HTTPException, UploadFile
from jose import jwt, JWTError
from sqlalchemy.orm import Session

from .models import User, FileMeta, LogEntry
from .config import UPLOAD_DIR, SECRET_KEY, ALGORITHM


def resolve_file_path(file_meta: FileMeta) -> str:
    """Return absolute path for a stored file."""
    path = Path(file_meta.path)
    if not path.is_absolute():
        path = UPLOAD_DIR / path
    return str(path)


def check_file_permission(user: User, file_meta: FileMeta) -> None:
    """Raise 403 if the user cannot access the file."""
    if user.role == "admin":
        return
    if user.role == "employee":
        if file_meta.client_id != user.client_id:
            raise HTTPException(status_code=403, detail="Not authorized to access this file")
    else:
        if file_meta.uploaded_by != user.id:
            raise HTTPException(status_code=403, detail="Not authorized to access this file")


def log_action(db: Session, user: User, action: str, file_id: int) -> None:
    log = LogEntry(user=user.username, action=action, file_id=file_id)
    db.add(log)
    db.commit()


def save_upload(file: UploadFile, file_id: int) -> str:
    dest = UPLOAD_DIR / f"{file_id}_{file.filename}"
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    with open(dest, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return str(dest)


def get_user_from_token(token: str, db: Session) -> User:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if not username:
            raise ValueError("Invalid token")
        user = db.query(User).filter(User.username == username).first()
        if not user:
            raise ValueError("User not found")
        return user
    except (JWTError, ValueError) as e:
        raise HTTPException(status_code=401, detail=str(e))

