import pytesseract
from PIL import Image
import io
import re
from typing import Optional

def extract_text_from_image(image_data: bytes) -> str:
    """Extract text from image using Tesseract OCR"""
    try:
        image = Image.open(io.BytesIO(image_data))
        # Enhance image for better OCR
        if image.mode != 'RGB':
            image = image.convert('RGB')
        text = pytesseract.image_to_string(image, config='--psm 6')
        return text.strip()
    except Exception as e:
        return f"OCR extraction note: {str(e)}"

def extract_lab_values(text: str) -> dict:
    """Extract lab values from OCR text using pattern matching"""
    lab_patterns = {
        "WBC": r"WBC[:\s]+([0-9.]+\s*[×x]?\s*10[³3]?[/]?[μu]?[Ll]?)",
        "CRP": r"CRP[:\s]+([0-9.]+\s*mg/[Ll]?)",
        "Troponin": r"[Tt]roponin\s*[IT]?[:\s]+([0-9.]+\s*ng/m[Ll]?)",
        "BNP": r"BNP[:\s]+([0-9.]+\s*pg/m[Ll]?)",
        "HbA1c": r"HbA1c[:\s]+([0-9.]+\s*%?)",
        "Glucose": r"[Gg]lucose[:\s]+([0-9.]+\s*mg/d[Ll]?)",
        "Creatinine": r"[Cc]reatinine[:\s]+([0-9.]+\s*mg/d[Ll]?)",
        "Hemoglobin": r"[Hh]emoglobin[:\s]+([0-9.]+\s*g/d[Ll]?)",
        "Potassium": r"[Kk]\+?[:\s]+([0-9.]+\s*mEq/[Ll]?)",
        "Sodium": r"[Nn]a\+?[:\s]+([0-9.]+\s*mEq/[Ll]?)",
    }
    
    results = {}
    for name, pattern in lab_patterns.items():
        match = re.search(pattern, text)
        if match:
            results[name] = match.group(1).strip()
    
    return results

def analyze_medical_image_basic(image_data: bytes, filename: str = "") -> str:
    """Basic image analysis using OCR and filename context"""
    try:
        # Try to extract any text from the image (radiology reports with text overlay)
        ocr_text = extract_text_from_image(image_data)
        
        # Analyze based on filename and content
        fname_lower = filename.lower()
        
        if any(term in fname_lower for term in ['xray', 'x-ray', 'chest', 'cxr']):
            if ocr_text and len(ocr_text) > 20:
                return f"Chest X-ray analysis: {ocr_text[:300]}"
            return "Chest X-ray submitted for analysis. Image uploaded successfully for radiological review."
        elif any(term in fname_lower for term in ['ct', 'scan', 'mri']):
            return f"CT/MRI scan submitted for analysis. Advanced imaging uploaded for specialist review."
        elif any(term in fname_lower for term in ['ecg', 'ekg', 'echo']):
            return f"Cardiac imaging submitted. ECG/Echo uploaded for cardiology review."
        else:
            if ocr_text and len(ocr_text) > 20:
                return f"Medical image analysis: Extracted text: {ocr_text[:200]}"
            return "Medical image submitted for analysis."
            
    except Exception as e:
        return f"Image submitted for analysis (processing note: {str(e)[:50]})"