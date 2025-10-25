from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, String, Integer, Text, create_engine, Float, DateTime, ForeignKey, Boolean
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector 

# Replace with your actual password and DB name
DATABASE_URL = "postgresql://postgres:admin@localhost/login_app"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()



class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String, unique=True, nullable=False)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    role = Column(String, nullable=False)


class PatientSymptoms(Base):
    __tablename__ = "patient_symptoms"

    patient_id = Column(String, ForeignKey("patient_data.Patient_ID", ondelete="CASCADE"), primary_key=True) # e.g., P000123
    id_number = Column(String, nullable=False)

    chest_pain = Column(Integer)
    shortness_of_breath = Column(Integer)
    irregular_heartbeat = Column(Integer)
    Fatigue_Weakness = Column(Integer)
    dizziness = Column(Integer)
    Swelling_Edema = Column(Integer)
    Pain_in_Neck_Jaw_Shoulder_Back = Column(Integer)
    Excessive_Sweating = Column(Integer)
    Persistent_Cough = Column(Integer)
    Nausea_Vomiting = Column(Integer)
    high_blood_pressure = Column(Integer)
    Chest_Discomfort_Activity = Column(Integer)
    Cold_Hands_Feet = Column(Integer)
    Snoring_Sleep_Apnea = Column(Integer)
    Anxiety_Feeling_of_Doom = Column(Integer)
    stroke_risk = Column(Integer)
    Age = Column(Integer)
    doctor_username = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.now)

    patient = relationship("Patient", back_populates="symptoms")

class PatientCTScan(Base):
    __tablename__ = "patient_ct_scans"

    patient_id = Column(String, ForeignKey("patient_data.Patient_ID", ondelete="CASCADE"), primary_key=True)
    id_number = Column(String, nullable=False)
    photo = Column(String, nullable=False)
    classification = Column(String, nullable=True)
    doctor_username = Column(String, nullable=False)
    model_training = Column(String, nullable=False, default="No")  # "Yes" or "No"
    timestamp = Column(DateTime, default=datetime.now)

    patient = relationship("Patient", back_populates="ct_scan")

class MisclassifiedCTScans(Base):
    __tablename__ = "misclassified_ct_scans"

    misclassified_id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    patient_id = Column(String, ForeignKey("patient_data.Patient_ID", ondelete="CASCADE"), nullable=False)
    id_number = Column(String, nullable=False)
    photo = Column(String, nullable=False)  # File path
    model_prediction = Column(String, nullable=False)
    correct_label = Column(String, nullable=False)
    doctor_username = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.now)

    patient = relationship("Patient", back_populates="misclassified_scans")

class RetrainingCTModel(Base):
    __tablename__ = "retraining_ct_model"

    retraining_ct_id = Column(String(10), primary_key=True, index=True)  # e.g., RCT001
    backup_path = Column(String, nullable=False)
    external_accuracy = Column(Float)
    timestamp = Column(DateTime, default=datetime.now)

class Report(Base):
    __tablename__ = "reports"

    report_id = Column(String, primary_key=True)
    email = Column(String, nullable=True) 
    role = Column(String, nullable=False)
    category = Column(String, nullable=False)
    description = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.now)
    is_resolved = Column(Boolean, default=False)


class Person(Base):
    __tablename__ = 'person'
    id_number = Column(String(50), primary_key=True)
    name = Column(String(100), nullable=False)
    gender = Column(String(10), nullable=False)

    patients = relationship("Patient", back_populates="person", cascade="all, delete-orphan")

class Patient(Base):
    __tablename__ = 'patient_data'

    Patient_ID = Column(String(10), primary_key=True)
    id_number = Column(String(50), ForeignKey('person.id_number'), nullable=False)
    phone = Column(String(20), nullable=False)
    age = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.now)

    person = relationship("Person", back_populates="patients")
    symptoms = relationship("PatientSymptoms", back_populates="patient", uselist=False, cascade="all, delete-orphan", passive_deletes=True)
    ct_scan = relationship("PatientCTScan", back_populates="patient", uselist=False, cascade="all, delete-orphan", passive_deletes=True)
    misclassified_scans = relationship("MisclassifiedCTScans", back_populates="patient", cascade="all, delete-orphan", passive_deletes=True)

class Document(Base):
    __tablename__ = "documents"
    id = Column(Integer, primary_key=True)
    content = Column(String)
    source = Column(String)         # column to store the document name 
    embedding = Column(Vector(384))  # 384 for MiniLM

# Create all tables
engine = create_engine(DATABASE_URL)
Base.metadata.create_all(engine)