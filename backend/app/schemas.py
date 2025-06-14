from typing import Optional
from pydantic import BaseModel

class User(BaseModel):
    id: Optional[int] = None
    username: str
    role: str
    client_id: Optional[int] = None

class Client(BaseModel):
    id: Optional[int] = None
    name: str

class FileMeta(BaseModel):
    id: Optional[int] = None
    filename: str
    path: str
    uploaded_by: int
    client_id: int
    start_date: str
    end_date: str
    uploaded_at: str

class LogEntry(BaseModel):
    id: Optional[int] = None
    user: str
    action: str
    file_id: int
    timestamp: str
