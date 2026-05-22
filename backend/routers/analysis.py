from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional
from database.database import get_db
from database.models import AIAnalysis, Patient, AuditLog
from services.llm_service import analyze_clinical_data
from services.ocr_service import extract_text_from_image, extract_lab_values, analyze_medical_image_basic
from services.audio_service import transcribe_audio
from services.rag_service import retrieve_relevant_guidelines
import time
import random

router = APIRouter(prefix="/analysis", tags=["analysis"])

@router.post("/process")
async def process_multimodal(
    patient_name: str = Form(...),
    patient_age: int = Form(0),
    patient_gender: str = Form("Unknown"),
    chief_complaint: str = Form(...),
    clinical_notes: str = Form(""),
    case_id: Optional[str] = Form(None),
    audio: Optional[UploadFile] = File(None),
    image: Optional[UploadFile] = File(None),
    lab: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    start_time = time.time()
    
    # Step 1: Process Audio
    transcription = ""
    if audio and audio.filename:
        audio_data = await audio.read()
        transcription = transcribe_audio(audio_data, audio.filename)
    
    # Step 2: Process Medical Image
    imaging_description = ""
    if image and image.filename:
        img_data = await image.read()
        imaging_description = analyze_medical_image_basic(img_data, image.filename)
    
    # Step 3: Process Lab Document
    lab_text = ""
    lab_values = {}
    if lab and lab.filename:
        lab_data = await lab.read()
        if lab.filename.lower().endswith('.pdf'):
            # Try to extract text from PDF
            try:
                from PIL import Image
                import io
                lab_text = f"PDF lab report uploaded: {lab.filename}"
            except:
                lab_text = f"Lab report uploaded: {lab.filename}"
        else:
            lab_text = extract_text_from_image(lab_data)
            lab_values = extract_lab_values(lab_text)
    
    # Step 4: Retrieve RAG sources
    query = f"{chief_complaint} {clinical_notes} {transcription}"
    rag_sources = retrieve_relevant_guidelines(query)
    
    # Step 5: Run LLM Analysis
    try:
        analysis = await analyze_clinical_data(
            patient_name=patient_name,
            patient_age=patient_age,
            patient_gender=patient_gender,
            chief_complaint=chief_complaint,
            clinical_notes=clinical_notes,
            transcription=transcription,
            imaging_description=imaging_description,
            lab_text=lab_text
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"AI analysis failed: {str(e)}. Ensure Ollama is running: 'ollama serve' and model is pulled: 'ollama pull llama3'"
        )
    
    # Merge extracted lab values
    if lab_values:
        if not analysis.get("lab_values"):
            analysis["lab_values"] = {}
        analysis["lab_values"].update(lab_values)
    
    # Use RAG sources from retrieval
    analysis["rag_sources"] = rag_sources
    
    # Add case_id
    analysis["case_id"] = case_id or f"A-{random.randint(1000,9999)}"
    
    # Save to database
    db_analysis = AIAnalysis(
        case_id=analysis["case_id"],
        patient_name=patient_name,
        transcription=transcription or analysis.get("transcription_summary", ""),
        imaging_report=imaging_description or analysis.get("imaging_report", ""),
        lab_values=analysis.get("lab_values", {}),
        keywords=analysis.get("keywords", []),
        confidence_score=analysis.get("confidence_score", 0),
        rag_sources=rag_sources,
        diagnosis=analysis.get("diagnosis", ""),
        reasoning=analysis.get("reasoning", ""),
        timeline=analysis.get("timeline", []),
        summary_sections=analysis.get("summary_sections", {}),
        patient_instructions=analysis.get("patient_instructions", {}),
        raw_llm_response=str(analysis)
    )
    db.add(db_analysis)
    
    # Update patient status if case_id matches
    if case_id:
        patient = db.query(Patient).filter(Patient.case_id == case_id).first()
        if patient:
            patient.status = "Completed"
            patient.confidence = analysis.get("confidence_score", 0)
            patient.diagnosis = analysis.get("diagnosis", "")
    
    # Log the analysis
    duration = f"{time.time() - start_time:.1f}s"
    log = AuditLog(
        event="AI Analysis Complete",
        module="LLM Reasoner",
        patient_name=patient_name,
        case_id=analysis["case_id"],
        status="success",
        duration=duration,
        details={"diagnosis": analysis.get("diagnosis"), "confidence": analysis.get("confidence_score")}
    )
    db.add(log)
    db.commit()
    
    return analysis

@router.get("/{case_id}")
def get_analysis(case_id: str, db: Session = Depends(get_db)):
    a = db.query(AIAnalysis).filter(AIAnalysis.case_id == case_id).order_by(AIAnalysis.id.desc()).first()
    if not a:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return {
        "case_id": a.case_id,
        "transcription": a.transcription,
        "imaging_report": a.imaging_report,
        "lab_values": a.lab_values,
        "keywords": a.keywords,
        "confidence_score": a.confidence_score,
        "rag_sources": a.rag_sources,
        "diagnosis": a.diagnosis,
        "reasoning": a.reasoning,
        "timeline": a.timeline,
        "summary_sections": a.summary_sections,
        "patient_instructions": a.patient_instructions,
    }