import os, sys, hashlib

# MUST be first — loads .env before any service imports
from dotenv import load_dotenv
load_dotenv(override=True)

print(f"[ENV] GROQ_API_KEY: {os.getenv('GROQ_API_KEY','NOT FOUND')[:15]}...")

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

sys.path.insert(0, os.path.dirname(__file__))

from database.database import engine, Base
from database.models import User, Patient, AIAnalysis, AuditLog
from routers import auth, patients, analysis, summary, reports
from sqlalchemy.orm import Session
from database.database import SessionLocal

Base.metadata.create_all(bind=engine)

app = FastAPI(title="MediFusion API", version="2.4.1")
app.add_middleware(CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

app.include_router(auth.router)
app.include_router(patients.router)
app.include_router(analysis.router)
app.include_router(summary.router)
app.include_router(reports.router)


def hash_password(p):
    return hashlib.sha256(f"medifusion_salt_2024{p}".encode()).hexdigest()


def seed_demo_data():
    db = SessionLocal()
    try:
        if not db.query(User).filter(User.username=="drchen").first():
            db.add(User(username="drchen", email="drchen@hospital.com",
                hashed_password=hash_password("doctor123"),
                full_name="Dr. Chen", role="doctor", specialty="Cardiology"))
        if not db.query(User).filter(User.username=="patient1").first():
            db.add(User(username="patient1", email="patient1@example.com",
                hashed_password=hash_password("patient123"),
                full_name="Rajesh Kumar", role="patient"))
        for pd in [
            {"case_id":"A-2041","name":"Rajesh Kumar","age":54,"gender":"Male","ward":"Cardiology","diagnosis":"Acute MI","attending":"Dr. Chen","status":"Completed","confidence":96.0},
            {"case_id":"A-2040","name":"Maria Santos","age":34,"gender":"Female","ward":"Pulmonology","diagnosis":"Pneumonia","attending":"Dr. Patel","status":"Processing","confidence":89.0},
            {"case_id":"A-2039","name":"John Williams","age":67,"gender":"Male","ward":"Endocrinology","diagnosis":"T2 Diabetes","attending":"Dr. Lee","status":"Under Review","confidence":94.0},
            {"case_id":"A-2038","name":"Priya Sharma","age":28,"gender":"Female","ward":"Surgery","diagnosis":"Appendicitis","attending":"Dr. Chen","status":"Completed","confidence":98.0},
            {"case_id":"A-2037","name":"Ahmed Hassan","age":45,"gender":"Male","ward":"Neurology","diagnosis":"Migraine Disorder","attending":"Dr. Wang","status":"Completed","confidence":94.0},
            {"case_id":"A-2036","name":"Linda Park","age":52,"gender":"Female","ward":"Orthopedics","diagnosis":"Hip Fracture","attending":"Dr. Patel","status":"Completed","confidence":97.0},
        ]:
            if not db.query(Patient).filter(Patient.case_id==pd["case_id"]).first():
                db.add(Patient(**pd))
        db.commit()
        print("✅ Demo data seeded")
    except Exception as e:
        print(f"Seed error: {e}"); db.rollback()
    finally:
        db.close()


@app.on_event("startup")
async def startup():
    seed_demo_data()
    key = os.getenv("GROQ_API_KEY","")
    print("🚀 MediFusion API → http://localhost:8000")
    print(f"{'✅ Groq ready: ' + key[:15] if key and key!='your_groq_api_key_here' else '⚠️ No Groq key'}")


@app.get("/")
def root():
    return {"service":"MediFusion API","version":"2.4.1","status":"online"}

@app.get("/health")
def health():
    key = os.getenv("GROQ_API_KEY","")
    return {
        "status": "healthy",
        "groq_ready": bool(key and key not in ("","your_groq_api_key_here")),
        "groq_preview": key[:15]+"..." if key else "NOT SET"
    }

@app.exception_handler(Exception)
async def err(request: Request, exc: Exception):
    return JSONResponse(status_code=500, content={"detail": str(exc)[:500]})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)