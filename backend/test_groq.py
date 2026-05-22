import asyncio
import os
from dotenv import load_dotenv
load_dotenv(override=True)

from services.llm_service import analyze_clinical_data, parse_llm_json, call_groq

async def test():
    print("=" * 50)
    print("TEST 1: Raw Groq call")
    print("=" * 50)
    try:
        raw = await call_groq('Say only the word: WORKING')
        print(f"Groq raw response: {raw}")
    except Exception as e:
        print(f"Groq FAILED: {e}")

    print("\n" + "=" * 50)
    print("TEST 2: Full clinical analysis")
    print("=" * 50)
    try:
        result = await analyze_clinical_data(
            patient_name="Ravi",
            patient_age=40,
            patient_gender="Male",
            chief_complaint="chest pain radiating to left arm",
            clinical_notes="ECG shows ST elevation",
        )
        print(f"Diagnosis: {result.get('diagnosis')}")
        print(f"Confidence: {result.get('confidence_score')}")
        print("SUCCESS - analysis working!")
    except Exception as e:
        print(f"Analysis FAILED: {e}")

asyncio.run(test())