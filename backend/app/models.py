from sqlalchemy import Column, Integer, String, Date, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from .database import Base
import datetime

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password = Column(String)
    role = Column(String)  # admin, client, employee
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=True)
    client = relationship("Client", back_populates="users")

class Client(Base):
    __tablename__ = "clients"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True)
    users = relationship("User", back_populates="client")
    files = relationship("FileMeta", back_populates="client")

class FileMeta(Base):
    __tablename__ = "files"
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String)
    path = Column(String)
    uploaded_by = Column(Integer, ForeignKey("users.id"))
    client_id = Column(Integer, ForeignKey("clients.id"))
    start_date = Column(Date)
    end_date = Column(Date)
    uploaded_at = Column(DateTime, default=datetime.datetime.utcnow)
    client = relationship("Client", back_populates="files")

class LogEntry(Base):
    __tablename__ = "logs"
    id = Column(Integer, primary_key=True, index=True)
    user = Column(String)
    action = Column(String)
    file_id = Column(Integer, ForeignKey("files.id"))
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
