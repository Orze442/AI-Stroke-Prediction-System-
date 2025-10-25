import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DoctorLayout from './DoctorLayout';
import './Doctor.css';
import '../App.css';


function ExistingPatient() {
  const [patientID, setPatientID] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (route) => {
    if (!patientID.trim()) {
      alert('Please enter a Patient ID.');
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/patients/all`);
      const data = await response.json();

      const matchedPatient = data.find(
        (patient) => patient.patient_id.toString() === patientID.trim()
      );

      if (!matchedPatient) {
        alert('❌ No patient found with that ID.');
        return;
      }

      localStorage.setItem('userInfo', JSON.stringify({
        Patient_ID: matchedPatient.patient_id,
        idNumber: matchedPatient.id_number,
        name: matchedPatient.name,
        gender: matchedPatient.gender,
        phone: matchedPatient.phone,
        age: matchedPatient.age,
        }));
      navigate(route);
    } catch (error) {
      console.error('Fetch error:', error);
      alert('❌ Failed to fetch patient data. Please try again.');
    }
  };

  return (
    <DoctorLayout>
      <div className="doctor-container">
        <h2 className="prediction-title">Access Existing Patient</h2>

        <div className="form-group">
          <input
            type="text"
            placeholder="Enter Patient ID"
            value={patientID}
            onChange={(e) => setPatientID(e.target.value)}
            className="form-input"
            required
          />

          <div className="button-group">
            <button type="submit"
              onClick={() => handleSubmit('/StrokePrediction')}
              className="First-button"
            >
              Proceed to Symptom Prediction
            </button>

            <button type="submit"
              onClick={() => handleSubmit('/CTScan')}
              className="second-button"
            >
              Proceed to CT Scan
            </button>
          </div>
        </div>
      </div>
    </DoctorLayout>
  );
}

export default ExistingPatient;
