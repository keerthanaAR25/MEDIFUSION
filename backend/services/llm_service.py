import httpx
import json
import os
import re

GROQ_API_KEY      = os.getenv("GROQ_API_KEY", "")
GEMINI_API_KEY    = os.getenv("GEMINI_API_KEY", "")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
OLLAMA_URL        = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL      = os.getenv("OLLAMA_MODEL", "tinyllama")
_BAD = {"", "your_groq_api_key_here", "your_key_here", "none", "null"}


GROQ_MODEL = "llama-3.1-8b-instant"


async def call_groq(prompt: str) -> str:
    async with httpx.AsyncClient(timeout=60) as c:
        r = await c.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {GROQ_API_KEY.strip()}",
                "Content-Type": "application/json",
            },
            json={
                "model": GROQ_MODEL,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.3,
                "max_tokens": 1500,
            }
        )
        if r.status_code != 200:
            print(f"[GROQ ERROR] {r.status_code}: {r.text[:300]}")
            r.raise_for_status()
        return r.json()["choices"][0]["message"]["content"]


async def call_gemini(prompt: str) -> str:
    async with httpx.AsyncClient(timeout=60) as c:
        r = await c.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY.strip()}",
            headers={"Content-Type": "application/json"},
            json={
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"temperature": 0.3, "maxOutputTokens": 1500}
            }
        )
        if r.status_code != 200:
            print(f"[GEMINI ERROR] {r.status_code}: {r.text[:300]}")
            r.raise_for_status()
        return r.json()["candidates"][0]["content"]["parts"][0]["text"]


async def call_ollama(prompt: str) -> str:
    async with httpx.AsyncClient(timeout=120) as c:
        r = await c.post(
            f"{OLLAMA_URL}/api/generate",
            json={"model": OLLAMA_MODEL, "prompt": prompt,
                  "stream": False, "options": {"temperature": 0.3}}
        )
        r.raise_for_status()
        return r.json().get("response", "")


async def call_claude(prompt: str) -> str:
    async with httpx.AsyncClient(timeout=60) as c:
        r = await c.post(
            "https://api.anthropic.com/v1/messages",
            headers={"x-api-key": ANTHROPIC_API_KEY.strip(),
                     "anthropic-version": "2023-06-01",
                     "content-type": "application/json"},
            json={"model": "claude-3-haiku-20240307", "max_tokens": 1500,
                  "messages": [{"role": "user", "content": prompt}]}
        )
        r.raise_for_status()
        return r.json()["content"][0]["text"]


async def call_llm(prompt: str, system: str = "") -> str:
     # My custom routing logic
    full = f"{system}\n\n{prompt}" if system else prompt
    full = full[:4500]  # stay within token limits

    errors = []

    if GROQ_API_KEY.strip().lower() not in _BAD:
        try:
            print(f"[LLM] Trying Groq ({GROQ_MODEL})...")
            out = await call_groq(full)
            print("[LLM] ✓ Groq success")
            return out
        except Exception as e:
            errors.append(f"Groq:{str(e)[:100]}")
            print(f"[LLM] Groq failed: {e}")

   
    if GEMINI_API_KEY.strip().lower() not in _BAD:
        try:
            print("[LLM] Trying Gemini...")
            out = await call_gemini(full)
            print("[LLM] ✓ Gemini success")
            return out
        except Exception as e:
            errors.append(f"Gemini:{str(e)[:100]}")
            print(f"[LLM] Gemini failed: {e}")

 
    try:
        print(f"[LLM] Trying Ollama ({OLLAMA_MODEL})...")
        out = await call_ollama(full)
        print("[LLM] ✓ Ollama success")
        return out
    except Exception as e:
        errors.append(f"Ollama:{str(e)[:100]}")
        print(f"[LLM] Ollama failed: {e}")

    if ANTHROPIC_API_KEY.strip().lower() not in _BAD:
        try:
            print("[LLM] Trying Claude...")
            out = await call_claude(full)
            print("[LLM] ✓ Claude success")
            return out
        except Exception as e:
            errors.append(f"Claude:{str(e)[:80]}")

    raise Exception(
        "AI analysis failed. Debug: " + " | ".join(errors)
    )


def parse_llm_json(text: str) -> dict:
    clean = text.strip()
    for fence in ["```json", "```JSON", "```"]:
        if fence in clean:
            parts = clean.split(fence)
            if len(parts) >= 3:
                clean = parts[1].strip()
                break
    s = clean.find("{")
    e = clean.rfind("}") + 1
    if s >= 0 and e > s:
        clean = clean[s:e]
    try:
        return json.loads(clean)
    except json.JSONDecodeError:
        clean = re.sub(r',\s*}', '}', clean)
        clean = re.sub(r',\s*]', ']', clean)
        return json.loads(clean)


async def analyze_clinical_data(
    patient_name: str, patient_age: int, patient_gender: str,
    chief_complaint: str, clinical_notes: str,
    transcription: str = "", imaging_description: str = "", lab_text: str = ""
) -> dict:

    system = "You are a clinical AI. Return ONLY a valid JSON object. No text before or after the JSON."

    prompt = f"""Analyze this patient. Return ONLY the JSON below filled with real values.

PATIENT: {patient_name}, Age:{patient_age}, Gender:{patient_gender}
COMPLAINT: {chief_complaint[:150]}
NOTES: {(clinical_notes or 'None')[:500]}
TRANSCRIPTION: {(transcription or 'None')[:250]}
IMAGING: {(imaging_description or 'None')[:200]}
LABS: {(lab_text or 'None')[:200]}

Return ONLY this JSON:
{{
  "diagnosis": "specific diagnosis based on patient data",
  "confidence_score": 88,
  "keywords": ["keyword1","keyword2","keyword3","keyword4"],
  "transcription_summary": "brief clinical summary",
  "imaging_report": "imaging findings or inferred from presentation",
  "lab_values": {{"WBC":"N/A","CRP":"N/A","Troponin I":"N/A","BNP":"N/A","HbA1c":"N/A"}},
  "rag_sources": [
    {{"title":"relevant clinical guideline","cosine":0.91}},
    {{"title":"drug protocol for this condition","cosine":0.87}},
    {{"title":"discharge template","cosine":0.84}}
  ],
  "reasoning": "detailed clinical reasoning for this specific patient",
  "timeline": [
    {{"time":"08:00","event":"Patient admitted","source":"Clinical Notes","icon":"📋","color":"purple"}},
    {{"time":"08:30","event":"Consultation transcribed","source":"Whisper ASR","icon":"🎙️","color":"cyan"}},
    {{"time":"09:15","event":"Imaging analyzed","source":"Vision AI","icon":"🔬","color":"purple"}},
    {{"time":"10:00","event":"Lab values extracted","source":"OCR Engine","icon":"🧪","color":"green"}},
    {{"time":"11:30","event":"Differential diagnosis generated","source":"LLM Reasoner","icon":"🧠","color":"pink"}},
    {{"time":"13:00","event":"Treatment plan formulated","source":"RAG + LLM","icon":"💊","color":"yellow"}},
    {{"time":"15:00","event":"Ready for clinician review","source":"Clinician","icon":"✅","color":"green"}}
  ],
  "summary_sections": {{
    "diagnosis": "Primary diagnosis. Secondary conditions if any.",
    "hospital_course": "Narrative of hospital course",
    "investigations": "Tests and results",
    "treatment": "Treatment provided",
    "medications": "Medications with doses and frequency",
    "followup": "Follow-up plan with timeframes"
  }},
  "patient_instructions": {{
    "diagnosis": "Simple patient-friendly explanation",
    "medications": ["Medication 1 - dose and timing","Medication 2 - dose and timing"],
    "followup": "When and where to follow up",
    "warnings": ["Go to ER if you experience...","Call doctor if..."],
    "diet": "Dietary recommendations",
    "activity": "Activity restrictions"
  }}
}}"""

    try:
        raw = await call_llm(prompt, system)
        return parse_llm_json(raw)
    except json.JSONDecodeError:
        raise Exception("Failed to parse AI clinical analysis. Please try again. Check your API connection and try again.")
    except Exception as e:
        raise Exception(str(e))


async def translate_instructions(instructions: dict, language: str) -> dict:
    names = {"es": "Spanish", "fr": "French", "hi": "Hindi", "ta": "Tamil",
             "ar": "Arabic", "zh": "Chinese", "de": "German", "en": "English"}
    if language == "en":
        return instructions
    lang = names.get(language, "English")
    short = {k: instructions[k] for k in
             ["diagnosis", "medications", "followup", "warnings", "diet", "activity"]
             if k in instructions}
    prompt = f"Translate all string values to {lang}. Keep JSON keys in English. Return ONLY JSON:\n{json.dumps(short, ensure_ascii=False)}"
    try:
        return parse_llm_json(await call_llm(prompt))
    except Exception:
        return instructions


async def generate_summary_sections(data: dict) -> dict:
    prompt = (
        f"Write clinical discharge summary for: {data.get('diagnosis', '')}. "
        f"Reasoning: {str(data.get('reasoning', ''))[:300]}. "
        f"Return ONLY JSON with keys: diagnosis, hospital_course, investigations, treatment, medications, followup."
    )
    try:
        return parse_llm_json(await call_llm(prompt))
    except Exception:
        return data.get("summary_sections", {})