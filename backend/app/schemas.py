from typing import Optional
from pydantic import BaseModel

class User(BaseModel):
    id: Optional[int] = None
    username: str
    role: str
    client_id: Optional[int] = None
    manufacturer_id: Optional[int] = None

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


class Manufacturer(BaseModel):
    id: Optional[int] = None
    name: str


class ProcessedFile(BaseModel):
    id: Optional[int] = None
    hospital_file_id: int
    manufacturer_id: int
    filename: str
    path: str
    uploaded_by: int
    quote_path: Optional[str] = None
