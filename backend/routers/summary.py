from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import json

from database.database import get_db
from database.models import Patient, AIAnalysis
from services.llm_service import translate_instructions, call_llm, parse_llm_json

router = APIRouter(prefix="/summary", tags=["summary"])


# ── Request models ────────────────────────────────────────────────
class TranslateRequest(BaseModel):
    text:            str
    target_language: str
    prompt:          Optional[str] = None

class ApproveRequest(BaseModel):
    case_id:  str
    section:  str
    approved: bool
    note:     Optional[str] = ""

class GenerateRequest(BaseModel):
    case_id: str


# ── GET summary for a case ────────────────────────────────────────
@router.get("/{case_id}")
def get_summary(case_id: str, db: Session = Depends(get_db)):
    analysis = (
        db.query(AIAnalysis)
        .filter(AIAnalysis.case_id == case_id)
        .order_by(AIAnalysis.id.desc())
        .first()
    )
    if not analysis:
        raise HTTPException(status_code=404, detail="No analysis found for this case")

    def safe_load(val, fallback):
        try:
            return json.loads(val) if val else fallback
        except Exception:
            return fallback

    return {
        "case_id":              case_id,
        "diagnosis":            analysis.diagnosis,
        "confidence_score":     analysis.confidence_score,
        "reasoning":            analysis.reasoning,
        "keywords":             safe_load(analysis.keywords, []),
        "lab_values":           safe_load(analysis.lab_values, {}),
        "rag_sources":          safe_load(analysis.rag_sources, []),
        "timeline":             safe_load(analysis.timeline, []),
        "summary_sections":     safe_load(analysis.summary_sections, {}),
        "patient_instructions": safe_load(analysis.patient_instructions, {}),
        "clinician_approved":   analysis.clinician_approved,
        "transcription_summary":analysis.transcription_summary,
        "imaging_report":       analysis.imaging_report,
    }


# ── TRANSLATE patient instructions ───────────────────────────────
@router.post("/translate")
async def translate(req: TranslateRequest):
    """
    Translates patient instructions to target language using LLM.
    target_language: 'es','fr','hi','ta','ar','zh','de'
    """
    lang_names = {
        "es": "Spanish", "fr": "French",  "hi": "Hindi",
        "ta": "Tamil",   "ar": "Arabic",  "zh": "Chinese (Simplified)",
        "de": "German",  "en": "English"
    }

    if req.target_language == "en":
        # No translation needed — try to parse and return as-is
        try:
            return parse_llm_json(req.text)
        except Exception:
            return {"error": "Cannot parse English content"}

    lang_name = lang_names.get(req.target_language, "Spanish")

    # Use custom prompt if provided, otherwise build one
    if req.prompt:
        prompt = req.prompt
    else:
        prompt = f"""Translate these patient medical instructions to {lang_name}.
Keep all JSON keys in English. Only translate the values.
Return ONLY valid JSON, no extra text.

{req.text}"""

    try:
        raw  = await call_llm(prompt)
        data = parse_llm_json(raw)
        print(f"[TRANSLATE] ✓ Translated to {lang_name}")
        return data
    except Exception as e:
        print(f"[TRANSLATE] Failed for {lang_name}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Translation to {lang_name} failed: {str(e)}"
        )


# ── TRANSLATE by case_id (used by multilingual page) ─────────────
@router.get("/translate/{case_id}/{lang}")
async def translate_by_case(
    case_id: str, lang: str, db: Session = Depends(get_db)
):
    """Get translated patient instructions for a specific case"""
    analysis = (
        db.query(AIAnalysis)
        .filter(AIAnalysis.case_id == case_id)
        .order_by(AIAnalysis.id.desc())
        .first()
    )
    if not analysis:
        raise HTTPException(status_code=404, detail="No analysis found")

    try:
        instructions = json.loads(analysis.patient_instructions) if analysis.patient_instructions else {}
    except Exception:
        instructions = {}

    if lang == "en":
        return instructions

    try:
        translated = await translate_instructions(instructions, lang)
        return translated
    except Exception as e:
        print(f"[TRANSLATE] Failed: {e}")
        return instructions  # fallback to English


# ── APPROVE a section ─────────────────────────────────────────────
@router.post("/approve")
def approve_section(req: ApproveRequest, db: Session = Depends(get_db)):
    analysis = (
        db.query(AIAnalysis)
        .filter(AIAnalysis.case_id == req.case_id)
        .order_by(AIAnalysis.id.desc())
        .first()
    )
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")

    analysis.clinician_approved = "approved" if req.approved else "flagged"
    db.commit()
    return {"status": "ok", "approved": req.approved, "section": req.section}


# ── GENERATE fresh summary sections ──────────────────────────────
@router.post("/generate")
async def generate_summary(req: GenerateRequest, db: Session = Depends(get_db)):
    analysis = (
        db.query(AIAnalysis)
        .filter(AIAnalysis.case_id == req.case_id)
        .order_by(AIAnalysis.id.desc())
        .first()
    )
    if not analysis:
        raise HTTPException(status_code=404, detail="No analysis found")

    prompt = f"""Write a clinical discharge summary for this patient.
Diagnosis: {analysis.diagnosis}
Reasoning: {(analysis.reasoning or '')[:400]}

Return ONLY this JSON:
{{
  "diagnosis": "full diagnosis statement",
  "hospital_course": "narrative of hospital course",
  "investigations": "tests performed and results",
  "treatment": "treatment provided",
  "medications": "medications with doses",
  "followup": "follow-up plan with timeframes"
}}"""

    try:
        raw      = await call_llm(prompt)
        sections = parse_llm_json(raw)
        analysis.summary_sections = json.dumps(sections)
        db.commit()
        return {"status": "ok", "summary_sections": sections}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Summary generation failed: {str(e)}")