from sqlalchemy import Column, Integer, String, Float, Text, DateTime, Boolean, JSON, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String)
    role = Column(String, default="doctor")  # doctor, patient, admin
    specialty = Column(String, nullable=True)
    license_number = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Patient(Base):
    __tablename__ = "patients"
    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(String, unique=True, index=True)
    name = Column(String)
    age = Column(Integer)
    gender = Column(String)
    ward = Column(String)
    diagnosis = Column(String, nullable=True)
    attending = Column(String)
    status = Column(String, default="Pending")
    confidence = Column(Float, default=0.0)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class AIAnalysis(Base):
    __tablename__ = "ai_analyses"
    id = Column(Integer, primary_key=True)
    case_id = Column(String, index=True)
    patient_name = Column(String)
    transcription = Column(Text, nullable=True)
    imaging_report = Column(Text, nullable=True)
    lab_values = Column(JSON, default={})
    keywords = Column(JSON, default=[])
    confidence_score = Column(Float, default=0.0)
    rag_sources = Column(JSON, default=[])
    diagnosis = Column(String, nullable=True)
    reasoning = Column(Text, nullable=True)
    timeline = Column(JSON, default=[])
    summary_sections = Column(JSON, default={})
    patient_instructions = Column(JSON, default={})
    raw_llm_response = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    event = Column(String)
    module = Column(String)
    patient_name = Column(String, nullable=True)
    case_id = Column(String, nullable=True)
    status = Column(String, default="success")
    duration = Column(String, nullable=True)
    details = Column(JSON, default={})
    created_at = Column(DateTime(timezone=True), server_default=func.now())