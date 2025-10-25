# FastAPI Core
from fastapi import (
    FastAPI, HTTPException, Request, Depends, File, UploadFile, Form,
    Body, Query, APIRouter
)
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.exceptions import RequestValidationError
from pydantic import BaseModel, EmailStr

# SQLAlchemy & Database
from sqlalchemy import (
    create_engine, Column, Integer, String, Float, DateTime, Enum as PgEnum, func
)
from sqlalchemy.orm import (
    sessionmaker, declarative_base, Session
)
from sqlalchemy.exc import IntegrityError

# ML & Data Science
import pandas as pd
import joblib
import xgboost as xgb
import cupy as cp
from sklearn.metrics import confusion_matrix

# PyTorch & Image Processing
import torch
import torch.nn as nn
import torch.optim as optim
import torch.nn.functional as F
from torchvision import models, transforms
from torchvision.datasets import ImageFolder
from torch.utils.data import Dataset, DataLoader
from PIL import Image
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns

# Python Standard Library
import os
import io
import random
import shutil
import logging
import base64
from uuid import uuid4
from datetime import datetime
from typing import Optional, Dict, List
import enum
import bcrypt

# Local Modules
from main_models.tables import (
    User, Patient, Person, PatientSymptoms, PatientCTScan,
    MisclassifiedCTScans, RetrainingCTModel, Report, Base,
    SessionLocal, sessionmaker
)
from main_models.schemas import (
    LoginData, UserCreate, UserUpdate, PatientCreate,
    PatientSymptomsInput, StrokePredictionInput, RetrainParams,
    ReportCreate, ReportOut
)
from pathlib import Path



# Define the FastAPI app
app = FastAPI()

# FastAPI router and retraining endpoint
router = APIRouter()

from clinical_rag.chatbot_routes import router as chatbot_router
app.include_router(chatbot_router)


from clinical_rag.load_document import (
    extract_text_from_pdf,
    chunk_text,
    store_chunks_to_pgvector,
    Document,  # Needed for query/delete
    SessionLocal
)


# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "clinical_rag/documents"
os.makedirs(UPLOAD_DIR, exist_ok=True)


# Misclassified pictures
# Absolute path to the misclassified_images folder
static_dir = os.path.join(os.path.dirname(__file__), "misclassified_images")
# Ensure it exists (optional safeguard)
if not os.path.isdir(static_dir):
    os.makedirs(static_dir)
# Mount it so that /misclassified_images points to the correct folder
app.mount("/misclassified_images", StaticFiles(directory=static_dir), name="misclassified_images")
#Classified Pictures
uploaded_dir = os.path.join(os.path.dirname(__file__), "uploaded_ct_scans")
os.makedirs(uploaded_dir, exist_ok=True)
app.mount("/uploaded_ct_scans", StaticFiles(directory=uploaded_dir), name="uploaded_ct_scans")


# Load Stroke CT model
model = models.resnet18(pretrained=False)
num_features = model.fc.in_features
model.fc = torch.nn.Linear(num_features, 3)
model.load_state_dict(torch.load("best_brain_ct_model.pth", map_location=torch.device('cpu')))
model.eval()

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = model.to(device)

transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

class_names = ['Normal', 'Hemorrhagic', 'Ischemic']


# Load your Stroke Symptom model once when server starts
xgb_model = joblib.load("symptom_model.pkl")
scaler = joblib.load("scaler.pkl")

def generate_next_id(session: Session, model, id_field: str, prefix: str) -> str:
    last = session.query(getattr(model, id_field)).order_by(getattr(model, id_field).desc()).first()
    if not last or not last[0]:
        return f"{prefix}001"
    last_num = int(last[0][len(prefix):])
    return f"{prefix}{str(last_num + 1).zfill(3)}"


# Generate retraining_ct_id as primary key
def generate_next_rct_id(db: Session):
    last_record = db.query(RetrainingCTModel).order_by(RetrainingCTModel.retraining_ct_id.desc()).first()
    if last_record:
        last_num = int(last_record.retraining_ct_id.replace("RCT", ""))
        return f"RCT{last_num + 1:03d}"
    return "RCT001"


# For Retraining Model
# Define a custom PyTorch Dataset
class CTScanDataset(Dataset):
    def __init__(self, records, transform=None):
        self.records = records
        self.transform = transform
        self.label_map = {"Normal": 0, "Hemorrhagic": 1, "Ischemic": 2}

    def __len__(self):
        return len(self.records)

    def __getitem__(self, idx):
        record = self.records[idx]
        image = Image.open(record.photo).convert('RGB')
        label = self.label_map.get(record.classification, 0)
        if self.transform:
            image = self.transform(image)
        return image, label


class UserRole(enum.Enum):
    admin = "admin"
    user = "user"

# Generate random Patient_ID
def generate_patient_id():
    return "P" + ''.join(str(random.randint(0, 9)) for _ in range(6))




# Routes
# Exception handler for validation errors
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logging.error(f"Validation error: {exc.errors()}")
    return JSONResponse(
        status_code=422,
        content={
            "detail": exc.errors(),
            "body": str(await request.body())  # <-- Convert to string here
        },
    )

# Get all users (for admin use)
@app.post("/users")
def create_user(user: UserCreate):
    db = SessionLocal()
    hashed_pw = bcrypt.hashpw(user.password.encode(), bcrypt.gensalt()).decode()
    new_user = User(
        name=user.name,
        email=user.email,
        password=hashed_pw,
        role=user.role
        )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    db.close()
    return {"message": "User created", "user": {"name": new_user.name, "email": new_user.email, "role": new_user.role}}


@app.get("/users")
def get_users():
    db = SessionLocal()
    users = db.query(User).all()
    db.close()
    return [{"id": u.id, "name": u.name, "email": u.email, "role": u.role} for u in users]

# Delete Users
@app.delete("/users/{user_id}")
def delete_user(user_id: int):
    db = SessionLocal()
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        db.close()
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    db.close()
    return {"message": "User deleted"}

# Update User Profile
@app.put("/users/update")
def update_user(user_update: UserUpdate, email: str = Query(...)):
    db = SessionLocal()
    user = db.query(User).filter(User.email == email).first()
    if not user:
        db.close()
        raise HTTPException(status_code=404, detail="User not found")

    if user_update.name:
        user.name = user_update.name

    if user_update.password:
        user.password = bcrypt.hashpw(user_update.password.encode(), bcrypt.gensalt()).decode()

    db.commit()
    db.refresh(user)
    db.close()

    return {"message": "User profile updated"}

# Login endpoint
@app.post("/login")
def login(data: LoginData):
    db = SessionLocal()
    user = db.query(User).filter(User.email == data.email).first()
    db.close()

    if not user or not bcrypt.checkpw(data.password.encode(), user.password.encode()):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    return {
        "message": "Login successful",
        "email": user.email,
        "role": user.role,
        "name": user.name 
    }

# For report creation and configuration
@router.post("/reports/create")
def create_report(
    email: str = Form(...),
    role: str = Form(...),
    category: str = Form(...),
    description: str = Form(...),
    db: Session = Depends(get_db)
):
    new_id = generate_next_id(db, Report, 'report_id', 'RPT')

    new_report = Report(
        report_id=new_id,
        email=email,
        role=role,
        category=category,
        description=description,
        created_at=datetime.now(),
        is_resolved=False
    )

    db.add(new_report)
    db.commit()
    db.refresh(new_report)

    return {
        "message": "✅ Report submitted successfully.",
        "report_id": new_report.report_id
    }

    
@router.get("/reports/all", response_model=list[ReportOut])
def get_all_reports(db: Session = Depends(get_db)):
    return db.query(Report).order_by(Report.created_at.desc()).all()

@app.patch("/reports/{report_id}/toggle")
def toggle_report_resolution(report_id: str, session: Session = Depends(get_db)):
    report = session.query(Report).filter(Report.report_id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    report.is_resolved = not report.is_resolved
    session.commit()
    return {"message": f"Report marked as {'solved' if report.is_resolved else 'unsolved'}"}


# Stroke CT Scan Prediction 
@app.post("/predict-ct-scan")
async def predict_ct_scan(file: UploadFile = File(...)):
    image_data = await file.read()
    image = Image.open(io.BytesIO(image_data)).convert('RGB')
    image_tensor = transform(image).unsqueeze(0).to(device)

    with torch.no_grad():
        outputs = model(image_tensor)
        _, predicted = outputs.max(1)
        predicted_class = class_names[predicted.item()]

    return {"predicted_label": predicted_class}

# Register Patient Data
@app.post("/api/patient")
def create_patient(patient: PatientCreate):
    db: Session = SessionLocal()
    try:
        # Check if person already exists
        person = db.query(Person).filter_by(id_number=patient.idNumber).first()

        if person:
            if person.name != patient.name or person.gender != patient.gender:
                raise HTTPException(
                    status_code=400,
                    detail="Name or gender does not match existing record for this ID number."
                )
        else:
            # Create new person
            person = Person(
                id_number=patient.idNumber,
                name=patient.name,
                gender=patient.gender
            )
            db.add(person)
            db.commit()
            db.refresh(person)

        # Create new patient
        patient_id = generate_patient_id()
        new_patient = Patient(
            Patient_ID=patient_id,
            id_number=patient.idNumber,
            phone=patient.phone,
            age=patient.age
        )
        db.add(new_patient)
        db.commit()

        return {"message": "Patient saved", "patientID": patient_id}

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()

@router.get("/patients/all")
def get_all_patients(session: Session = Depends(get_db)):
    patients = session.query(Patient).all()

    result = []
    for patient in patients:
        person = session.query(Person).filter_by(id_number=patient.id_number).first()
        result.append({
            "patient_id": patient.Patient_ID,
            "id_number": patient.id_number,
            "name": person.name if person else "Unknown",
            "gender": person.gender if person else "Unknown",
            "phone": patient.phone,
            "age": patient.age,
            "created_at": patient.created_at.isoformat() 
        })

    return result

# Get Patient info 
@app.get("/api/patient/{patient_id}")
def get_patient_with_person(patient_id: str):
    db = SessionLocal()
    try:
        patient = db.query(Patient).filter_by(Patient_ID=patient_id).first()
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")

        person = db.query(Person).filter_by(id_number=patient.id_number).first()

        return {
            "patientID": patient.Patient_ID,
            "idNumber": patient.id_number,
            "name": person.name,
            "gender": person.gender,
            "age": patient.age,
            "phone": patient.phone
        }

    finally:
        db.close()

@router.get("/api/patient_symptoms/{patient_id}")
def get_patient_symptoms(patient_id: str):
    session = SessionLocal()
    try:
        symptoms = session.query(PatientSymptoms).filter_by(patient_id=patient_id).first()
        if not symptoms:
            raise HTTPException(status_code=404, detail="No symptoms found")

        data = symptoms.__dict__

        # Create a clean list of symptom names where the value is 1
        symptom_names = [
            k.replace('_', ' ').title()
            for k, v in data.items()
            if k not in ('_sa_instance_state', 'patient_id', 'id_number', 'doctor_username', 'timestamp')
            and v == 1
        ]

        return {
            "symptoms": symptom_names,
            "doctor_username": symptoms.doctor_username,
            "timestamp": symptoms.timestamp
        }

    finally:
        session.close()

# Get patient CT scan
@app.get("/api/patient_ct_scans/{patient_id}")
def get_patient_ct(patient_id: str):
    session = SessionLocal()
    try:
        ct = session.query(PatientCTScan).filter_by(patient_id=patient_id).first()
        if not ct:
            return {}
        return ct.__dict__
    finally:
        session.close()

# Delete Patient Data
@app.delete("/patients/{patient_id}/delete")
def delete_patient(patient_id: str, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.Patient_ID == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    db.delete(patient)
    db.commit()
    return {"message": "Patient deleted successfully"}

@router.get("/person/all")
def get_all_persons(db: Session = Depends(get_db)):
    results = (
        db.query(
            Person.id_number,
            Person.name,
            Person.gender,
            func.count(Patient.Patient_ID).label("patient_count")
        )
        .outerjoin(Patient, Person.id_number == Patient.id_number)
        .group_by(Person.id_number)
        .all()
    )

    # Format results into dicts
    return [
        {
            "id_number": row.id_number,
            "name": row.name,
            "gender": row.gender,
            "patient_count": row.patient_count
        }
        for row in results
    ]

@app.delete("/person/{id_number}")
def delete_person(id_number: str, db: Session = Depends(get_db)):
    person = db.query(Person).filter(Person.id_number == id_number).first()
    
    if not person:
        raise HTTPException(status_code=404, detail="Person not found")

    if person.patients:  # Check if any linked patients exist
        raise HTTPException(
            status_code=400,
            detail="Cannot delete person with linked patients"
        )

    db.delete(person)
    db.commit()
    return {"message": "Person deleted successfully"}

# Save CT-Scan
@app.post("/save-ct-scan")
async def save_ct_scan(
    patient_id: str = Form(...),
    id_number: str = Form(...),
    classification: str = Form(...),
    doctor_username: str = Form(...),
    model_training: str = Form("No"),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    # Check if CT scan already exists
    existing_ct = db.query(PatientCTScan).filter_by(patient_id=patient_id).first()
    if existing_ct:
        raise HTTPException(
            status_code=400,
            detail="❌ This patient's CT scan has already been saved."
        )

    # Check if misclassification already exists
    existing_misclassification = db.query(MisclassifiedCTScans).filter_by(patient_id=patient_id).first()
    if existing_misclassification:
        raise HTTPException(
            status_code=400,
            detail="❌ This patient has a pending misclassification. Cannot save CT scan."
        )

    # Save file to disk
    upload_dir = "uploaded_ct_scans"
    os.makedirs(upload_dir, exist_ok=True)
    filename = f"{patient_id}_{file.filename}"
    file_path = os.path.join(upload_dir, filename)

    with open(file_path, "wb") as f:
        f.write(await file.read())

    ct_entry = PatientCTScan(
        patient_id=patient_id,
        id_number=id_number,
        photo=file_path,
        classification=classification,
        doctor_username=doctor_username,
        model_training=model_training
    )

    try:
        db.add(ct_entry)
        db.commit()
        db.refresh(ct_entry)
        return {"message": "✅ Saved successfully", "filename": filename}

    except IntegrityError as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="❌ Database error while saving scan."
        )

# Report Misclassification
@app.post("/report-misclassification")
async def report_misclassification(
    file: UploadFile = File(...),
    patient_id: str = Form(...),
    id_number: str = Form(...),
    model_prediction: str = Form(...),
    correct_label: str = Form(...),
    doctor_username: str = Form(...),
    db: Session = Depends(get_db)
):
    # Check if patient already reported misclassification
    existing_misclassification = db.query(MisclassifiedCTScans).filter_by(patient_id=patient_id).first()
    if existing_misclassification:
        raise HTTPException(status_code=400, detail="❌ Misclassification already reported for this patient.")

    # Check if patient already has a CT scan
    existing_ct_scan = db.query(PatientCTScan).filter_by(patient_id=patient_id).first()
    if existing_ct_scan:
        raise HTTPException(status_code=400, detail="❌ CT scan already exists. Cannot report misclassification.")

    # Save file to disk
    save_dir = "misclassified_images"
    os.makedirs(save_dir, exist_ok=True)
    file_path = os.path.join(save_dir, file.filename)
    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    # Save misclassification record
    misclassified = MisclassifiedCTScans(
        patient_id=patient_id,
        id_number=id_number,
        photo=file_path,
        model_prediction=model_prediction,
        correct_label=correct_label,
        doctor_username=doctor_username,
        timestamp=datetime.now().isoformat()
    )
    db.add(misclassified)
    db.commit()
    db.refresh(misclassified)

    return {"message": "Misclassification reported", "id": misclassified.misclassified_id}

# Get all information about misclassified ct scans 
@app.get("/misclassified-ct-scans")
def get_misclassified_scans(db: Session = Depends(get_db)):
    scans = db.query(MisclassifiedCTScans).all()
    result = []

    for scan in scans:
        result.append({
            "id": scan.misclassified_id,
            "patient_id": scan.patient_id,
            "id_number": scan.id_number,
            "photo": scan.photo,
            "model_prediction": scan.model_prediction,
            "correct_label": scan.correct_label,
            "doctor_username": scan.doctor_username,
            "timestamp": scan.timestamp
        })

    return result  # <-- return a JSON list!

# Put missclassified CT scans in correct folder after classifying them correctly 
@app.post("/approve-misclassification")
def approve_misclassification(
    misclassified_id: int = Form(...),
    new_label: str = Form(...),
    db: Session = Depends(get_db)
):
    
    scan = db.query(MisclassifiedCTScans).filter_by(misclassified_id=misclassified_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")

    # Move image to uploaded_ct_scans
    upload_dir = "uploaded_ct_scans"
    os.makedirs(upload_dir, exist_ok=True)
    new_filename = f"{scan.patient_id}_{os.path.basename(scan.photo)}"
    new_path = os.path.join(upload_dir, new_filename)

    try:
        shutil.move(scan.photo, new_path)  # Move image
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File move failed: {str(e)}")

    # Save to PatientCTScan
    ct_entry = PatientCTScan(
        patient_id=scan.patient_id,
        id_number=scan.id_number,
        photo=new_path,
        classification=new_label,
        doctor_username=scan.doctor_username,  # ✅ Use existing value
        model_training="No"
    )
    db.add(ct_entry)

    # Delete misclassified entry
    db.delete(scan)
    db.commit()

    return {"message": "Misclassified scan approved and saved."}

# RAG based chatbot Configurations
@app.post("/rag/upload")
async def upload_pdf(file: UploadFile = File(...)):
    session = SessionLocal()
    
    # Check if this filename already exists
    existing = session.query(Document).filter(Document.source == file.filename).first()
    if existing:
        session.close()
        raise HTTPException(status_code=400, detail=f"❌ Document '{file.filename}' already exists.")

    session.close()

    # Save file to disk
    path = Path(UPLOAD_DIR) / file.filename
    with open(path, "wb") as f:
        f.write(await file.read())

    # Process and store text chunks
    text = extract_text_from_pdf(str(path))
    chunks = chunk_text(text)
    store_chunks_to_pgvector(chunks, file.filename)

    return {"message": f"✅ Document '{file.filename}' uploaded and trained."}

@app.get("/rag/sources")
def list_sources():
    session = SessionLocal()
    sources = session.query(Document.source).distinct().all()
    session.close()
    return {"sources": [src[0] for src in sources]}

@app.delete("/rag/delete/{source}")
def delete_source(source: str):
    session = SessionLocal()
    count = session.query(Document).filter(Document.source == source).delete()
    session.commit()
    session.close()
    return {"message": f"🗑️ Deleted {count} chunks for '{source}'."}


# Save Symptoms 
@app.post("/save-symptoms")
def save_symptoms(symptoms: PatientSymptomsInput):
    db = SessionLocal()
    try:
        # Check if patient_id already exists
        existing = db.query(PatientSymptoms).filter_by(patient_id=symptoms.patient_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Patient data already exists.")

        new_entry = PatientSymptoms(**symptoms.dict())
        db.add(new_entry)
        db.commit()
        return {"message": "Symptoms saved successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()

# Check if patient data is compatible with bot 
@router.get("/check-patient-readiness/{patient_id}")
def check_patient_readiness(patient_id: str, db: Session = Depends(get_db)):
    symptoms_exists = db.query(PatientSymptoms).filter_by(patient_id=patient_id).first()
    ct_scan_exists = db.query(PatientCTScan).filter_by(patient_id=patient_id).first()

    if symptoms_exists and ct_scan_exists:
        return {"ready": True}
    return {"ready": False}

# Get Stats about the images being used for retraining        
@router.get("/retrain-model/stats")
def get_retrain_stats(db: Session = Depends(get_db)):
    scans = db.query(PatientCTScan).filter(PatientCTScan.model_training == "No").all()

    stats = {
        "total": len(scans),
        "by_class": {
            "Normal": sum(1 for s in scans if s.classification == "Normal"),
            "Hemorrhagic": sum(1 for s in scans if s.classification == "Hemorrhagic"),
            "Ischemic": sum(1 for s in scans if s.classification  == "Ischemic"),
        }
    }
    return stats

# Code for model retraining 
@router.post("/retrain-model")
def retrain_ct_model(params: RetrainParams, db: Session = Depends(get_db)):
    EPOCHS = 5
    LEARNING_RATE = 0.001

    scans = db.query(PatientCTScan).filter(PatientCTScan.model_training == "No").all()

    if len(scans) < 5:
        raise HTTPException(status_code=400, detail="Not enough labeled scans to retrain (min: 5).")

    transform_pipeline = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406],
                             [0.229, 0.224, 0.225])
    ])

    dataset = CTScanDataset(scans, transform=transform_pipeline)
    dataloader = DataLoader(dataset, batch_size=8, shuffle=True)

    model = models.resnet18(pretrained=False)
    model.fc = nn.Linear(model.fc.in_features, 3)

    try:
        # ✅ Backup current model
        current_model_path = "best_brain_ct_model.pth"
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        os.makedirs("backup_model", exist_ok=True)
        backup_path = f"backup_model/ct_backup_model_{timestamp}.pth"
        shutil.copy(current_model_path, backup_path)
        print(f"📦 Backup created at {backup_path}")

        model.load_state_dict(torch.load(current_model_path, map_location=torch.device("cpu")))
        print("✅ Loaded existing model weights.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load existing model: {e}")

    for name, param in model.named_parameters():
        param.requires_grad = ("layer4" in name or "fc" in name)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model.to(device)

    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(
        filter(lambda p: p.requires_grad, model.parameters()),
        lr=LEARNING_RATE
    )

    # Training loop
    model.train()
    for epoch in range(EPOCHS):
        total_loss = 0
        for images, labels in dataloader:
            images, labels = images.to(device), labels.to(device)
            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()
            total_loss += loss.item()
        print(f"Epoch {epoch+1} | Loss: {total_loss:.4f}")

    torch.save(model.state_dict(), "best_brain_ct_model_retrained.pth")

    for scan in scans:
        scan.model_training = "Yes"
    db.commit()

        # 📈 Evaluate on training set
    model.eval()
    correct, total, eval_loss = 0, 0, 0
    with torch.no_grad():
        for images, labels in dataloader:
            images, labels = images.to(device), labels.to(device)
            outputs = model(images)
            loss = criterion(outputs, labels)
            eval_loss += loss.item()
            _, predicted = torch.max(outputs.data, 1)
            total += labels.size(0)
            correct += (predicted == labels).sum().item()

    # 🧪 Evaluate on external test set from folder
    external_metrics = None
    external_data_dir = "external_test"
    

    if os.path.exists(external_data_dir):
        target_class_to_idx = {'Normal': 0, 'Hemorrhagic': 1, 'Ischemic': 2}

        ext_dataset = ImageFolder(
            root=external_data_dir,
            transform=transform_pipeline
        )
        ext_dataset.class_to_idx = target_class_to_idx
        ext_dataset.samples = [(path, target_class_to_idx[class_name]) 
                               for (path, _) in ext_dataset.samples 
                               for class_name in target_class_to_idx 
                               if os.path.normpath(path).split(os.sep)[-2] == class_name]

        ext_loader = DataLoader(ext_dataset, batch_size=8, shuffle=False)
        ext_correct, ext_total, ext_loss = 0, 0, 0
        all_preds, all_labels = [], []

        with torch.no_grad():
            for images, labels in ext_loader:
                images, labels = images.to(device), labels.to(device)
                outputs = model(images)
                loss = criterion(outputs, labels)
                ext_loss += loss.item()
                _, predicted = torch.max(outputs.data, 1)
                ext_total += labels.size(0)
                ext_correct += (predicted == labels).sum().item()
                all_labels.extend(labels.cpu().numpy())
                all_preds.extend(predicted.cpu().numpy())
        
        retraining_ct_id = generate_next_rct_id(db)

        external_metrics = {
            "accuracy": round(ext_correct / ext_total, 4) if ext_total > 0 else 0,
            "samples": ext_total
        }

        class_names = ['Normal', 'Hemorrhagic', 'Ischemic']


    else:
        external_metrics = "❌ Folder 'external_test/' not found."
    
    new_retraining_ct = RetrainingCTModel(
    retraining_ct_id=retraining_ct_id,
    backup_path=backup_path,
    external_accuracy=external_metrics["accuracy"] if isinstance(external_metrics, dict) else None,
    )
    db.add(new_retraining_ct)
    db.commit()

    # ✅ This return is now valid because it's inside the function
    return {
    "message": "✅ Model retrained successfully.",
    "external_accuracy": external_metrics["accuracy"] if isinstance(external_metrics, dict) else None
}

app.include_router(router)

# Stroke risk prediction endpoint
@app.post("/predict-stroke")
def predict_stroke(data: StrokePredictionInput):
    # Map incoming keys to model feature names
    input_dict = {
        'chest_pain': data.chest_pain,
        'shortness_of_breath': data.shortness_of_breath,
        'irregular_heartbeat': data.irregular_heartbeat,
        'Fatigue & Weakness': data.Fatigue_Weakness,
        'dizziness': data.dizziness,
        'Swelling (Edema)': data.Swelling_Edema,
        'Pain in Neck/Jaw/Shoulder/Back': data.Pain_in_Neck_Jaw_Shoulder_Back,
        'Excessive Sweating': data.Excessive_Sweating,
        'Persistent Cough': data.Persistent_Cough,
        'Nausea/Vomiting': data.Nausea_Vomiting,
        'high_blood_pressure': data.high_blood_pressure,
        'Chest Discomfort (Activity)': data.Chest_Discomfort_Activity,
        'Cold Hands/Feet': data.Cold_Hands_Feet,
        'Snoring/Sleep Apnea': data.Snoring_Sleep_Apnea,
        'Anxiety/Feeling of Doom': data.Anxiety_Feeling_of_Doom,
        'Age': data.Age
    }

    df = pd.DataFrame([input_dict])
    df['bp_heartbeat_interaction'] = ((df['high_blood_pressure'] == 1) & (df['irregular_heartbeat'] == 1)).astype(int)
    df["Age"] = scaler.transform(df[["Age"]])

    # Convert DataFrame to CuPy array for GPU prediction
    cupy_array = cp.array(df.values)

    # Predict using GPU (CuPy data)
    predicted_risk = xgb_model.predict(cupy_array)[0]

    # Convert NumPy float to native Python float for JSON serialization
    risk_percentage = round(float(predicted_risk), 2)

    return {"predicted_risk_percentage": risk_percentage}

for route in app.routes:
    print(f"🔍 ROUTE: {route.path}")