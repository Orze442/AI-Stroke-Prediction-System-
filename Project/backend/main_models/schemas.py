from pydantic import BaseModel, EmailStr
from typing import Optional, Dict
from datetime import datetime

class LoginData(BaseModel):
    email: EmailStr
    password: str

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    password: Optional[str] = None

class PatientCreate(BaseModel):
    idNumber: str
    name: str
    phone: str
    age: int
    gender: str

# For saving Patient Symptom data in databse 
class PatientSymptomsInput(BaseModel):
    patient_id: str
    id_number: str
    chest_pain: int
    shortness_of_breath: int
    irregular_heartbeat: int
    Fatigue_Weakness: int
    dizziness: int
    Swelling_Edema: int
    Pain_in_Neck_Jaw_Shoulder_Back: int
    Excessive_Sweating: int
    Persistent_Cough: int
    Nausea_Vomiting: int
    high_blood_pressure: int
    Chest_Discomfort_Activity: int
    Cold_Hands_Feet: int
    Snoring_Sleep_Apnea: int
    Anxiety_Feeling_of_Doom: int
    stroke_risk: int
    Age: int
    doctor_username: str

# Input model for stroke prediction (underscore names, no spaces)
class StrokePredictionInput(BaseModel):
    chest_pain: int
    shortness_of_breath: int
    irregular_heartbeat: int
    Fatigue_Weakness: int
    dizziness: int
    Swelling_Edema: int
    Pain_in_Neck_Jaw_Shoulder_Back: int
    Excessive_Sweating: int
    Persistent_Cough: int
    Nausea_Vomiting: int
    high_blood_pressure: int
    Chest_Discomfort_Activity: int
    Cold_Hands_Feet: int
    Snoring_Sleep_Apnea: int
    Anxiety_Feeling_of_Doom: int
    Age: int

# Input model for training parameters
class RetrainParams(BaseModel):
    epochs: int = 5
    learning_rate: float = 0.001

# Input model for report creation
class ReportCreate(BaseModel):
    email: EmailStr
    role: str
    category: str
    description: str

class ReportOut(BaseModel):
    report_id: str
    email: EmailStr
    role: str
    category: str
    description: str
    created_at: datetime
    is_resolved: bool

    class Config:
        orm_mode = True



