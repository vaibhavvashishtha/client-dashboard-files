import os
import shutil
from typing import List, Optional
from datetime import date
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends, status, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import FileMeta, User, LogEntry, Client
from ..auth import get_current_user
from ..config import UPLOAD_DIR
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/files", tags=["files"])

# Ensure storage directory exists
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.get("/debug/files")
def debug_list_files(
    db: Session = Depends(get_db)
):
    """
    Debug endpoint to list all files in the database with full details.
    Only accessible by admin users.
    """
    try:
        # Get current user
        user = get_current_user(token=None, db=db)
        
        if user.role != "admin":
            raise HTTPException(status_code=403, detail="Only admin users can access this endpoint")

        # Query all files with related data
        files = db.query(FileMeta).all()
        
        # Get file details
        file_details = []
        for file in files:
            try:
                file_path = file.path if file.path else None
                exists_on_disk = False
                if file_path:
                    try:
                        exists_on_disk = os.path.exists(file_path)
                    except Exception as e:
                        logger.error(f"Error checking file existence for {file.filename}: {str(e)}")
                        exists_on_disk = False
                
                file_details.append({
                    "id": file.id,
                    "filename": file.filename,
                    "path": file.path,
                    "uploaded_by": file.uploaded_by,
                    "client_id": file.client_id,
                    "start_date": file.start_date,
                    "end_date": file.end_date,
                    "uploaded_at": file.uploaded_at,
                    "exists_on_disk": exists_on_disk
                })
            except Exception as e:
                logger.error(f"Error processing file {file.id}: {str(e)}")
                continue
        
        return {
            "files": file_details,
            "count": len(files),
            "total_data": {
                "total_files": len(files),
                "files_with_paths": len([f for f in files if f.path]),
                "files_without_paths": len([f for f in files if not f.path]),
                "unique_clients": len(set(f.client_id for f in files if f.client_id)),
                "unique_uploaders": len(set(f.uploaded_by for f in files if f.uploaded_by))
            }
        }
    except Exception as e:
        logger.error(f"Error in debug endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history")
def get_upload_history(
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
    client_id: int = None
):
    try:
        if user.role == "admin":
            query = db.query(FileMeta)
            if client_id:
                query = query.filter(FileMeta.client_id == client_id)
        elif user.role == "employee":
            query = db.query(FileMeta).filter(FileMeta.client_id == user.client_id)
            if client_id and client_id != user.client_id:
                raise HTTPException(status_code=403, detail="Not authorized to view this client's files")
        else:  # client user
            query = db.query(FileMeta).filter(FileMeta.uploaded_by == user.id)
        
        # Add client name to the results for better visibility
        results = query.all()
        for file in results:
            if file.client:
                file.client_name = file.client.name
            else:
                file.client_name = "No Client"
        
        return results
    except Exception as e:
        logger.error(f"Error getting file history: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/download/{file_id}")
def download_file(
    file_id: int,
    db: Session = Depends(get_db),
    token: str = Query(None)
):
    try:
        # First try to get user from Authorization header
        try:
            user = get_current_user(token=None, db=db)
        except HTTPException:
            if not token:
                raise HTTPException(status_code=401, detail="No authentication provided")
            
            # If token in query parameter, verify it
            try:
                payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
                username = payload.get("sub")
                if not username:
                    raise ValueError("Invalid token")
                user = db.query(User).filter(User.username == username).first()
                if not user:
                    raise ValueError("User not found")
            except (JWTError, ValueError) as e:
                raise HTTPException(status_code=401, detail=str(e))

        # Get file metadata
        file_meta = db.query(FileMeta).filter(FileMeta.id == file_id).first()
        if not file_meta:
            raise HTTPException(status_code=404, detail="File not found")

        # Check if user has access to this file
        if user.role == "admin":
            pass  # Admin can download any file
        elif user.role == "employee":
            if file_meta.client_id != user.client_id:
                raise HTTPException(status_code=403, detail="Not authorized to download this file")
        else:  # client user
            if file_meta.uploaded_by != user.id:
                raise HTTPException(status_code=403, detail="Not authorized to download this file")

        # Get absolute file path
        file_path = os.path.join(UPLOAD_DIR, file_meta.path)
        
        # Check if file exists
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail=f"File not found at path: {file_path}")

        # Log the download
        log = LogEntry(user=user.username, action="download", file_id=file_id)
        db.add(log)
        db.commit()

        # Return file as response
        return FileResponse(
            file_path,
            filename=file_meta.filename,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename=\"{file_meta.filename}\""}
        )
    except HTTPException as e:
        logger.error(f"Error downloading file {file_id}: {str(e.detail)}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error downloading file {file_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")
    try:
        # First try to get user from Authorization header
        try:
            user = get_current_user(token=None, db=db)
        except HTTPException:
            if not token:
                raise HTTPException(status_code=401, detail="No authentication provided")
            
            # If token in query parameter, verify it
            try:
                payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
                username = payload.get("sub")
                if not username:
                    raise ValueError("Invalid token")
                user = db.query(User).filter(User.username == username).first()
                if not user:
                    raise ValueError("User not found")
            except (JWTError, ValueError) as e:
                raise HTTPException(status_code=401, detail=str(e))

        # Get file metadata
        file_meta = db.query(FileMeta).filter(FileMeta.id == file_id).first()
        if not file_meta:
            raise HTTPException(status_code=404, detail="File not found")

        # Check if user has access to this file
        if user.role == "admin":
            pass  # Admin can download any file
        elif user.role == "employee":
            if file_meta.client_id != user.client_id:
                raise HTTPException(status_code=403, detail="Not authorized to download this file")
        else:  # client user
            if file_meta.uploaded_by != user.id:
                raise HTTPException(status_code=403, detail="Not authorized to download this file")

        # Get absolute file path
        file_path = os.path.join(UPLOAD_DIR, file_meta.path)
        
        # Check if file exists
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail=f"File not found at path: {file_path}")

        # Log the download
        log = LogEntry(user=user.username, action="download", file_id=file_id)
        db.add(log)
        db.commit()

        # Return file as response
        return FileResponse(
            file_path,
            filename=filename or file_meta.filename,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename=\"{filename or file_meta.filename}\""}
        )
    except HTTPException as e:
        logger.error(f"Error downloading file {file_id}: {str(e.detail)}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error downloading file {file_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")
        # First try to get user from Authorization header
        try:
            user = get_current_user(token=None, db=db)
        except HTTPException:
            if not token:
                raise HTTPException(status_code=401, detail="No authentication provided")
            
            # If token in query parameter, verify it
            try:
                payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
                username = payload.get("sub")
                if not username:
                    raise ValueError("Invalid token")
                user = db.query(User).filter(User.username == username).first()
                if not user:
                    raise ValueError("User not found")
            except (JWTError, ValueError) as e:
                raise HTTPException(status_code=401, detail=str(e))

        # Get file metadata
        file_meta = db.query(FileMeta).filter(FileMeta.id == file_id).first()
        if not file_meta:
            raise HTTPException(status_code=404, detail="File not found")

        # Check if user has access to this file
        if user.role == "admin":
            pass  # Admin can download any file
        elif user.role == "employee":
            if file_meta.client_id != user.client_id:
                raise HTTPException(status_code=403, detail="Not authorized to download this file")
        else:  # client user
            if file_meta.uploaded_by != user.id:
                raise HTTPException(status_code=403, detail="Not authorized to download this file")

        # Get absolute file path
        file_path = os.path.join(UPLOAD_DIR, file_meta.path)
        
        # Check if file exists
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail=f"File not found at path: {file_path}")

        # Log the download
        log = LogEntry(user=user.username, action="download", file_id=file_id)
        db.add(log)
        db.commit()

        # Return file as response
        return FileResponse(
            file_path,
            filename=file_meta.filename,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
    try:
        # First try to get user from Authorization header
        try:
            user = get_current_user(token=None, db=db)
        except HTTPException:
            if not token:
                raise HTTPException(status_code=401, detail="No authentication provided")
            
            # If token in query parameter, verify it
            try:
                payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
                username = payload.get("sub")
                if not username:
                    raise ValueError("Invalid token")
                user = db.query(User).filter(User.username == username).first()
                if not user:
                    raise ValueError("User not found")
            except (JWTError, ValueError) as e:
                raise HTTPException(status_code=401, detail=str(e))

        # Get file metadata
        file_meta = db.query(FileMeta).filter(FileMeta.id == file_id).first()
        if not file_meta:
            raise HTTPException(status_code=404, detail="File not found")

        # Check if user has access to this file
        if user.role == "admin":
            pass  # Admin can download any file
        elif user.role == "employee":
            if file_meta.client_id != user.client_id:
                raise HTTPException(status_code=403, detail="Not authorized to download this file")
        else:  # client user
            if file_meta.uploaded_by != user.id:
                raise HTTPException(status_code=403, detail="Not authorized to download this file")

        # Get absolute file path and ensure it exists
        file_path = os.path.join(UPLOAD_DIR, file_meta.path)
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail=f"File not found at path: {file_path}")

        # Log the download
        log = LogEntry(user=user.username, action="download", file_id=file_id)
        db.add(log)
        db.commit()

        # Read file content and return as response
        try:
            with open(file_path, 'rb') as f:
                content = f.read()
                return Response(
                    content,
                    headers={
                        'Content-Disposition': f'attachment; filename="{file_meta.filename}"',
                        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                    }
                )
        except Exception as e:
            logger.error(f"Error reading file {file_path}: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Error reading file: {str(e)}")
    except HTTPException as e:
        logger.error(f"Error downloading file {file_id}: {str(e.detail)}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error downloading file {file_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")
    except HTTPException as e:
        logger.error(f"Error downloading file {file_id}: {str(e.detail)}")
        raise

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    start_date: date = Form(...),
    end_date: date = Form(...),
    client_id: Optional[int] = Form(None),
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    try:
        logger.info(f"=== Upload Request Received ===")
        logger.info(f"User: {user.username} (ID: {user.id}, Role: {user.role})")
        logger.info(f"File info: {file.filename}, size: {file.size} bytes")
        logger.info(f"Start date: {start_date}, End date: {end_date}")
        logger.info(f"Client ID: {client_id if user.role == 'admin' else user.client_id}")
        
        # Validate file type
        if not file.filename.lower().endswith(('.xls', '.xlsx')):
            logger.error(f"Error: Invalid file type for {file.filename}")
            raise HTTPException(status_code=400, detail="File must be XLS or XLSX")
        
        # Validate file size (100MB limit)
        MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB in bytes
        file_size = file.size
        if file_size > MAX_FILE_SIZE:
            logger.error(f"Error: File size {file_size} exceeds limit")
            raise HTTPException(status_code=400, detail=f"File size exceeds 100MB limit")

        # Validate client_id for admin users
        if user.role == "admin":
            if client_id is None:
                logger.error("Error: Admin must provide client_id for upload")
                raise HTTPException(status_code=400, detail="Client ID is required for admin uploads")
            
            # Verify client exists
            client = db.query(Client).filter(Client.id == client_id).first()
            if not client:
                logger.error(f"Error: Client {client_id} not found")
                raise HTTPException(status_code=404, detail="Client not found")
        
        # Create file metadata first to get the ID
        logger.info("=== Creating File Metadata ===")
        try:
            file_meta = FileMeta(
                filename=file.filename,
                start_date=start_date,
                end_date=end_date,
                uploaded_by=user.id,
                client_id=client_id if user.role == "admin" else user.client_id
            )
            db.add(file_meta)
            db.commit()
            db.refresh(file_meta)
            logger.info(f"File metadata created with ID: {file_meta.id}")
        except Exception as e:
            logger.error(f"Error creating file metadata: {str(e)}")
            db.rollback()
            raise HTTPException(status_code=500, detail=f"Failed to create file metadata: {str(e)}")

        # Save file to disk using the generated ID
        logger.info("=== Saving File to Disk ===")
        try:
            file_path = os.path.join(UPLOAD_DIR, str(file_meta.id) + "_" + file.filename)
            logger.info(f"File path: {file_path}")
            logger.info(f"Storage directory: {UPLOAD_DIR}")
            
            # Ensure storage directory exists
            os.makedirs(UPLOAD_DIR, exist_ok=True)
            
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            logger.info("File saved to disk successfully")
        except Exception as e:
            logger.error(f"Error saving file: {str(e)}")
            db.rollback()
            raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")

        # Update the file path in the database
        logger.info("=== Updating File Path ===")
        try:
            file_meta.path = file_path
            db.commit()
            logger.info("File path updated in database")
        except Exception as e:
            logger.error(f"Error updating file path: {str(e)}")
            db.rollback()
            raise HTTPException(status_code=500, detail=f"Failed to update file path: {str(e)}")

        # Log the upload
        logger.info("=== Logging Upload ===")
        try:
            log = LogEntry(user=user.username, action="upload", file_id=file_meta.id)
            db.add(log)
            db.commit()
            logger.info("Upload logged successfully")
        except Exception as e:
            logger.error(f"Error logging upload: {str(e)}")
            db.rollback()
            raise HTTPException(status_code=500, detail=f"Failed to log upload: {str(e)}")

        logger.info(f"=== Upload Successful ===")
        return {"msg": "File uploaded successfully", "file_id": file_meta.id}
    except Exception as e:
        logger.error(f"=== Upload Failed ===")
        logger.error(f"Error during upload: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.error(f"Error downloading file {file_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    try:
        logger.info(f"=== Upload Request Received ===")
        logger.info(f"User: {user.username} (ID: {user.id}, Role: {user.role})")
        logger.info(f"File info: {file.filename}, size: {file.size} bytes")
        logger.info(f"Start date: {start_date}, End date: {end_date}")
        logger.info(f"Client ID: {user.client_id if hasattr(user, 'client_id') else 'None'}")
        
        # Validate file type
        if not file.filename.lower().endswith(('.xls', '.xlsx')):
            logger.error(f"Error: Invalid file type for {file.filename}")
            raise HTTPException(status_code=400, detail="File must be XLS or XLSX")
        
        # Validate file size (100MB limit)
        MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB in bytes
        file_size = file.size
        if file_size > MAX_FILE_SIZE:
            logger.error(f"Error: File size {file_size} exceeds limit")
            raise HTTPException(status_code=400, detail=f"File size exceeds 100MB limit")

        # Create file metadata first to get the ID
        logger.info("=== Creating File Metadata ===")
        try:
            file_meta = FileMeta(
                filename=file.filename,
                start_date=start_date,
                end_date=end_date,
                uploaded_by=user.id,
                client_id=getattr(user, 'client_id', None)  # Get client_id safely
            )
            db.add(file_meta)
            db.commit()
            db.refresh(file_meta)
            logger.info(f"File metadata created with ID: {file_meta.id}")
        except Exception as e:
            logger.error(f"Error creating file metadata: {str(e)}")
            db.rollback()
            raise HTTPException(status_code=500, detail=f"Failed to create file metadata: {str(e)}")

        # Save file to disk using the generated ID
        logger.info("=== Saving File to Disk ===")
        try:
            file_path = os.path.join(UPLOAD_DIR, str(file_meta.id) + "_" + file.filename)
            logger.info(f"File path: {file_path}")
            logger.info(f"Storage directory: {UPLOAD_DIR}")
            
            # Ensure storage directory exists
            os.makedirs(UPLOAD_DIR, exist_ok=True)
            
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            logger.info("File saved to disk successfully")
        except Exception as e:
            logger.error(f"Error saving file: {str(e)}")
            db.rollback()
            raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")

        # Update the file path in the database
        logger.info("=== Updating File Path ===")
        try:
            file_meta.path = file_path
            db.commit()
            logger.info("File path updated in database")
        except Exception as e:
            logger.error(f"Error updating file path: {str(e)}")
            db.rollback()
            raise HTTPException(status_code=500, detail=f"Failed to update file path: {str(e)}")

        # Log the upload
        logger.info("=== Logging Upload ===")
        try:
            log = LogEntry(user=user.username, action="upload", file_id=file_meta.id)
            db.add(log)
            db.commit()
            logger.info("Upload logged successfully")
        except Exception as e:
            logger.error(f"Error logging upload: {str(e)}")
            db.rollback()
            raise HTTPException(status_code=500, detail=f"Failed to log upload: {str(e)}")

        logger.info(f"=== Upload Successful ===")
        return {"msg": "File uploaded successfully", "file_id": file_meta.id}
    except Exception as e:
        logger.error(f"=== Upload Failed ===")
        logger.error(f"Error during upload: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


        return {"msg": "File uploaded successfully", "file_id": file_meta.id}
    except Exception as e:
        print(f"Error during upload: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/list")
def list_files(db: Session = Depends(get_db), user=Depends(get_current_user)):
    if user.role == "admin":
        return db.query(FileMeta).all()
    elif user.role == "employee":
        return db.query(FileMeta).filter(FileMeta.client_id == user.client_id).all()
    else:
        return db.query(FileMeta).filter(FileMeta.uploaded_by == user.id).all()

@router.delete("/delete/{file_id}")
def delete_file(
    file_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    try:
        file_meta = db.query(FileMeta).filter(FileMeta.id == file_id).first()
        if not file_meta:
            raise HTTPException(status_code=404, detail="File not found")

        # Check if user has permission to delete
        if user.role == "admin":
            pass  # Admins can delete any file
        elif user.role == "employee":
            if file_meta.client_id != user.client_id:
                raise HTTPException(status_code=403, detail="Not authorized to delete this file")
        elif user.role == "client":
            if file_meta.uploaded_by != user.id:
                raise HTTPException(status_code=403, detail="Not authorized to delete this file")
        else:
            raise HTTPException(status_code=403, detail="Not authorized to delete this file")

        # Delete file from storage
        if os.path.exists(file_meta.path):
            os.remove(file_meta.path)

        # Delete from database
        db.delete(file_meta)
        db.commit()

        # Log the deletion
        log = LogEntry(user=user.username, action="delete", file_id=file_id)
        db.add(log)
        db.commit()

        return {"msg": "File deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

from fastapi.responses import FileResponse

@router.get("/download/{file_id}")
def download_file(
    file_id: int,
    db: Session = Depends(get_db),
    token: str = Query(None),
    user=Depends(get_current_user)
):
    try:
        # If token is provided as query parameter, validate it
        if token:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            user = db.query(User).filter(User.username == payload.get("sub")).first()
            if not user:
                raise HTTPException(status_code=401, detail="User not found")
    except (JWTError, AttributeError):
        raise HTTPException(status_code=401, detail="Invalid token")

    file_meta = db.query(FileMeta).filter(FileMeta.id == file_id).first()
    
    if not file_meta:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Check if user has permission to download
    if user.role == "admin":
        pass  # Admins can download any file
    elif user.role == "employee":
        if file_meta.client_id != user.client_id:
            raise HTTPException(status_code=403, detail="Not authorized to download this file")
    elif user.role == "client":
        if file_meta.uploaded_by != user.id:
            raise HTTPException(status_code=403, detail="Not authorized to download this file")
    else:
        raise HTTPException(status_code=403, detail="Not authorized to download this file")
    
    # Log the download
    log = LogEntry(user=user.username, action="download", file_id=file_id)
    db.add(log)
    db.commit()
    
    # Return the file
    return FileResponse(
        file_meta.path,  # Use the stored path
        filename=file_meta.name,
        media_type=file_meta.type
    )
