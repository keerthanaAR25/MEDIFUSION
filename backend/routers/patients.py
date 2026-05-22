from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from database.database import get_db
from database.models import Patient, AuditLog
import random
import string
from datetime import datetime

router = APIRouter(prefix="/patients", tags=["patients"])

class PatientCreate(BaseModel):
    name: str
    age: int
    gender: str = "Male"
    ward: str = "General"
    diagnosis: Optional[str] = None
    attending: str

def generate_case_id():
    return f"A-{random.randint(2000,9999)}"

def fmt_time(dt):
    if not dt: return "—"
    diff = datetime.utcnow() - dt.replace(tzinfo=None)
    h = int(diff.total_seconds() / 3600)
    if h < 1: return "Just now"
    if h < 24: return f"{h}h ago"
    return f"{diff.days}d ago"

@router.get("")
def get_patients(db: Session = Depends(get_db)):
    patients = db.query(Patient).order_by(Patient.created_at.desc()).all()
    result = []
    for p in patients:
        result.append({
            "id": p.id,
            "case_id": p.case_id,
            "name": p.name,
            "age": p.age,
            "gender": p.gender,
            "ward": p.ward,
            "diagnosis": p.diagnosis or "Pending",
            "attending": p.attending,
            "status": p.status,
            "confidence": round(p.confidence),
            "updated_at": fmt_time(p.updated_at or p.created_at)
        })
    return result

@router.get("/{case_id}")
def get_patient(case_id: str, db: Session = Depends(get_db)):
    p = db.query(Patient).filter(Patient.case_id == case_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Patient not found")
    return p

@router.post("")
def create_patient(req: PatientCreate, db: Session = Depends(get_db)):
    cid = generate_case_id()
    while db.query(Patient).filter(Patient.case_id == cid).first():
        cid = generate_case_id()
    patient = Patient(
        case_id=cid,
        name=req.name,
        age=req.age,
        gender=req.gender,
        ward=req.ward,
        diagnosis=req.diagnosis,
        attending=req.attending,
        status="Pending"
    )
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return {"id": patient.id, "case_id": patient.case_id, "message": "Patient created"}

@router.put("/{case_id}")
def update_patient(case_id: str, data: dict, db: Session = Depends(get_db)):
    p = db.query(Patient).filter(Patient.case_id == case_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Patient not found")
    for k, v in data.items():
        if hasattr(p, k):
            setattr(p, k, v)
    db.commit()
    return {"message": "Updated"}