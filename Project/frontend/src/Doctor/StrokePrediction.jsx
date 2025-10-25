import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DoctorLayout from './DoctorLayout';
import '../App.css'; // Make sure this line is importing your CSS
import './Doctor.css';


function StrokePrediction() {
  const [patientData, setPatientData] = useState(null);

    useEffect(() => {
      const storedData = localStorage.getItem('userInfo');
      const doctorName = localStorage.getItem('userName'); // from login
    
      if (storedData) {
        const parsed = JSON.parse(storedData);
    
        if (!parsed.doctorUsername && doctorName) {
          parsed.doctorUsername = doctorName;
          localStorage.setItem('userInfo', JSON.stringify(parsed)); // optional but keeps it in sync
        }
    
        setPatientData(parsed);

        // Set age from patient data
        setFormData((prev) => ({
          ...prev,
          Age: Number(parsed.age) || 0,
        }));
      }
    }, []);


  const [formData, setFormData] = useState({
    chest_pain: 0,
    shortness_of_breath: 0,
    irregular_heartbeat: 0,
    Fatigue_Weakness: 0,
    dizziness: 0,
    Swelling_Edema: 0,
    Pain_in_Neck_Jaw_Shoulder_Back: 0,
    Excessive_Sweating: 0,
    Persistent_Cough: 0,
    Nausea_Vomiting: 0,
    high_blood_pressure: 0,
    Chest_Discomfort_Activity: 0,
    Cold_Hands_Feet: 0,
    Snoring_Sleep_Apnea: 0,
    Anxiety_Feeling_of_Doom: 0,
    Age: 50,
  });

  const [risk, setRisk] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    const numberValue = Number(value);

    setFormData((prev) => ({
      ...prev,
      [name]: name === "Age" ? Math.max(0, numberValue) : numberValue,
    }));
  };

    const handleBotNavigation = async () => {
    if (!patientData?.Patient_ID) {
      alert("No patient ID found.");
      return;
    }

    try {
      const res = await fetch(`http://127.0.0.1:8000/check-patient-readiness/${patientData.Patient_ID}`);
      const data = await res.json();

      if (data.ready) {
        navigate(`/doctor/Bot?patient_id=${patientData.Patient_ID}`);
      } else {
        alert("MedicalBot access requires both stroke and CT scan data.");
      }
    } catch (error) {
      console.error("Error checking patient readiness:", error);
      alert("Server error while checking access. Please try again.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const res = await fetch('http://127.0.0.1:8000/predict-stroke', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    if (!res.ok) {
      setRisk('Error: Could not get prediction');
      return;
    }

    const data = await res.json();
    setRisk(data.predicted_risk_percentage);
  };

  const handleSave = async () => {
  if (!patientData) return alert("No patient data available");

  if (risk === null || risk === undefined) {
  alert("Please generate the stroke risk prediction before saving.");
  return;
  }

  const payload = {
    ...formData,
    patient_id: patientData.Patient_ID,
    id_number: patientData.idNumber,
    stroke_risk: Math.round(risk),
    doctor_username: patientData.doctorUsername || localStorage.getItem('userName'),
    
  };

  const res = await fetch('http://127.0.0.1:8000/save-symptoms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const result = await res.json();

  if (res.ok) {
    alert("Data saved successfully");
  } else {
    alert("Error: " + result.detail);
  }
};

  const formatLabel = (key) =>
    key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

  return (
    <DoctorLayout>
    <div className="home-page">
      <h2>Stroke Risk Prediction</h2>
      {patientData && (
        <div>
          <p><strong>Patient ID:</strong> {patientData.Patient_ID}</p>
          <p><strong>ID Number:</strong> {patientData.idNumber}</p>
        </div>
      )}
      <form onSubmit={handleSubmit}>
        {Object.keys(formData).map((key) =>
          key === 'Age' ? (
            <div key={key}>
              <label htmlFor={key}>{formatLabel(key)}</label>
              <input
                type="number"
                name={key}
                value={formData[key]}
                onChange={handleChange}
                min="0"
                max="120"
              />
            </div>
          ) : (
            <div key={key}>
              <label htmlFor={key}>{formatLabel(key)}</label>
              <select
                name={key}
                value={formData[key]}
                onChange={handleChange}
              >
                <option value={0}>No</option>
                <option value={1}>Yes</option>
              </select>
            </div>
          )
        )}
        <button type="submit" style={{ marginTop: '120px' }}>Predict</button>
      </form>

      {risk !== null && (
        <div className="result">
          Predicted Stroke Risk: {risk}%
        </div>
      )}
    </div>

    <button type="submit" onClick={handleSave} className="first-button">
     Save Data
    </button>
    <div className="bottom-right-buttons">
       <button type="submit" onClick={() => navigate('/CTScan')}  className="second-button"
       >CT Scan Prediction</button>
       
       <button
          type="submit"  // ✅ Don't use "submit" if you're not submitting a form
          onClick={handleBotNavigation}
          className="green-button"
          >
           MedicalBot
        </button>
     </div>
    </DoctorLayout>
  );
}

export default StrokePrediction;
