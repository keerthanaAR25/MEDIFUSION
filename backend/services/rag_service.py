import json
import numpy as np
from typing import List, Dict

# Clinical knowledge base for RAG
CLINICAL_KNOWLEDGE = [
    {
        "id": "acc_stemi_2023",
        "title": "ACC/AHA STEMI Guidelines 2023",
        "content": "STEMI management: Immediate PCI within 90 minutes. Aspirin 325mg loading dose. Clopidogrel or ticagrelor. Heparin anticoagulation. Beta-blockers for rate control. ACE inhibitors for ejection fraction.",
        "category": "cardiology",
        "keywords": ["chest pain", "STEMI", "MI", "troponin", "ST elevation", "myocardial infarction"]
    },
    {
        "id": "dapt_protocol",
        "title": "Drug: Aspirin+Clopidogrel DAPT Protocol",
        "content": "Dual antiplatelet therapy: Aspirin 100mg daily indefinitely. Clopidogrel 75mg daily for 12 months post-ACS. Alternative: Ticagrelor 90mg twice daily. Monitor for bleeding. Avoid NSAIDs.",
        "category": "cardiology",
        "keywords": ["aspirin", "clopidogrel", "antiplatelet", "ACS", "stent"]
    },
    {
        "id": "inferior_mi_template",
        "title": "Inferior MI Discharge Template v3",
        "content": "Inferior STEMI discharge: Cardiac diet, activity restriction 4-6 weeks, cardiac rehab referral. Follow-up with cardiologist in 2 weeks. Medications: Aspirin, clopidogrel, beta-blocker, statin, ACE inhibitor.",
        "category": "cardiology",
        "keywords": ["inferior MI", "discharge", "STEMI", "treatment plan"]
    },
    {
        "id": "pneumonia_guidelines",
        "title": "CAP Management Guidelines 2023",
        "content": "Community-acquired pneumonia treatment: Amoxicillin-clavulanate or azithromycin for mild cases. Hospitalized: IV ceftriaxone + azithromycin. Oxygen therapy for SpO2 <94%. Chest X-ray follow-up in 6 weeks.",
        "category": "pulmonology",
        "keywords": ["pneumonia", "cough", "consolidation", "fever", "respiratory"]
    },
    {
        "id": "diabetes_t2_protocol",
        "title": "T2 Diabetes Management Protocol",
        "content": "T2DM management: HbA1c target <7%. First-line: Metformin. Add SGLT2 inhibitor or GLP-1 agonist if CVD. Monitor: HbA1c every 3 months, annual eye/kidney/foot exams. Lifestyle modification essential.",
        "category": "endocrinology",
        "keywords": ["diabetes", "HbA1c", "insulin", "glucose", "hyperglycemia"]
    },
    {
        "id": "appendicitis_surgery",
        "title": "Appendicitis Surgical Protocol",
        "content": "Acute appendicitis: Laparoscopic appendectomy preferred. Antibiotics pre-op: cefazolin + metronidazole. Post-op: Pain management, early mobilization, wound care. Follow-up in 2 weeks.",
        "category": "surgery",
        "keywords": ["appendicitis", "abdominal pain", "surgery", "appendectomy"]
    },
    {
        "id": "hypertension_guidelines",
        "title": "Hypertension Treatment Guidelines",
        "content": "HTN management: Target BP <130/80 mmHg. First-line: ACE inhibitor or ARB, thiazide diuretic, CCB. Lifestyle: salt restriction, DASH diet, exercise. Monitor electrolytes with ACE inhibitor.",
        "category": "cardiology",
        "keywords": ["hypertension", "blood pressure", "BP", "HTN"]
    },
    {
        "id": "migraine_protocol",
        "title": "Migraine Management Protocol",
        "content": "Acute migraine: Triptans (sumatriptan 100mg) for moderate-severe. NSAIDs for mild. Anti-nausea: metoclopramide. Prophylaxis if >4 episodes/month: topiramate or propranolol. Avoid triggers.",
        "category": "neurology",
        "keywords": ["migraine", "headache", "neurological", "pain"]
    },
]

def simple_similarity(query: str, text: str) -> float:
    """Simple keyword-based similarity scoring"""
    query_words = set(query.lower().split())
    text_words = set(text.lower().split())
    common = len(query_words.intersection(text_words))
    if len(query_words) == 0:
        return 0.0
    return min(0.99, 0.5 + (common / max(len(query_words), 1)) * 0.5)

def retrieve_relevant_guidelines(query: str, top_k: int = 3) -> List[Dict]:
    """Retrieve relevant clinical guidelines based on query"""
    scored = []
    
    for doc in CLINICAL_KNOWLEDGE:
        # Check keyword matches
        keyword_score = 0
        for kw in doc["keywords"]:
            if kw.lower() in query.lower():
                keyword_score += 0.1
        
        # Content similarity
        content_score = simple_similarity(query, doc["content"])
        total_score = min(0.99, content_score + keyword_score)
        
        scored.append({
            "title": doc["title"],
            "content": doc["content"],
            "category": doc["category"],
            "cosine": round(total_score, 2)
        })
    
    # Sort by score and return top k
    scored.sort(key=lambda x: x["cosine"], reverse=True)
    return scored[:top_k]