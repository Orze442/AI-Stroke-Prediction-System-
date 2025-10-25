from fastapi import APIRouter
from pydantic import BaseModel
from clinical_rag.llm_utils import ask_llm_with_context
from main_models.tables import SessionLocal, PatientSymptoms, PatientCTScan
import threading

llm_lock = threading.Lock()

print("✅ chatbot_routes.py loaded")

router = APIRouter(prefix="/chatbot")

class ChatRequest(BaseModel):
    question: str

@router.post("/ask")
def chatbot_ask(req: ChatRequest):
    try:
        print(f"🔍 Received question: {req.question}")
        answer, docs = ask_llm_with_context(req.question)
        return {
            "answer": answer,
            "source": docs
        }
    except Exception as e:
        print(f"❌ Error: {e}")
        return {"error": str(e)}
    

@router.get("/clinical-insight/{patient_id}")
def clinical_insight(patient_id: str):
    try:
        db = SessionLocal()

        symptoms = db.query(PatientSymptoms).filter(PatientSymptoms.patient_id == patient_id).first()
        ct = db.query(PatientCTScan).filter(PatientCTScan.patient_id == patient_id).first()

        if not symptoms or not ct:
            return {"error": "Patient data not found."}

        symptom_fields = [
            "chest_pain", "shortness_of_breath", "irregular_heartbeat", "Fatigue_Weakness", "dizziness",
            "Swelling_Edema", "Pain_in_Neck_Jaw_Shoulder_Back", "Excessive_Sweating", "Persistent_Cough",
            "Nausea_Vomiting", "high_blood_pressure", "Chest_Discomfort_Activity", "Cold_Hands_Feet",
            "Snoring_Sleep_Apnea", "Anxiety_Feeling_of_Doom"
        ]
        positive_symptoms = [field.replace('_', ' ') for field in symptom_fields if getattr(symptoms, field) == 1]
        symptom_text = ", ".join(positive_symptoms) if positive_symptoms else "None reported"

        summary = f"""📋 Patient Summary:
- Age: {symptoms.Age}
- Symptoms: {symptom_text}
- Symptom-based Stroke Risk: {symptoms.stroke_risk if symptoms.stroke_risk is not None else 'N/A'}%
- CT Classification: {ct.classification or 'N/A'}"""

        prompt = f"""
You are a Clinical Decision Support assistant. You support — not replace — medical experts.
Based on the provided patient data and retrieved guidelines, suggest considerations or next steps.
Be factual, cite sources, and avoid making definitive diagnoses.

{summary}

What clinical insights or recommendations can be drawn from this case?
"""

        # 🔒 Use the global LLM lock here 
        if not llm_lock.acquire(blocking=False):
            return {"error": "The assistant is currently processing another request. Please wait."}

        try:
            answer, docs = ask_llm_with_context(prompt)
        finally:
            llm_lock.release()

        return {
            "summary": summary,
            "answer": answer,
            "source": docs
        }

    except Exception as e:
        return {"error": str(e)}
    
    