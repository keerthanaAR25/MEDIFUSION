from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from jose import jwt
from datetime import datetime, timedelta
import os
import hashlib
import hmac

from database.database import get_db
from database.models import User

router = APIRouter(prefix="/auth", tags=["auth"])

SECRET_KEY = os.getenv("SECRET_KEY", "medifusion-secret")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))


# ── Simple SHA-256 password hashing (no bcrypt needed) ──────────────────────
def hash_password(password: str) -> str:
    """Hash password using SHA-256 with a salt"""
    salt = "medifusion_salt_2024"
    return hashlib.sha256(f"{salt}{password}".encode()).hexdigest()

def verify_password(plain: str, hashed: str) -> bool:
    """Verify password against stored hash"""
    return hash_password(plain) == hashed
# ─────────────────────────────────────────────────────────────────────────────


def create_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


class LoginRequest(BaseModel):
    username: str
    password: str

class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str
    full_name: str
    role: str = "doctor"
    specialty: Optional[str] = None
    license_number: Optional[str] = None


@router.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == req.username).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    token = create_token({"sub": user.username, "role": user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role
        }
    }


@router.post("/register")
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.username == req.username).first():
        raise HTTPException(status_code=400, detail="Username already exists")
    if db.query(User).filter(User.email == req.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        username=req.username,
        email=req.email,
        hashed_password=hash_password(req.password),
        full_name=req.full_name,
        role=req.role,
        specialty=req.specialty,
        license_number=req.license_number
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"message": "Account created successfully", "username": user.username}


@router.get("/me")
def me():
    return {"message": "Authenticated"}