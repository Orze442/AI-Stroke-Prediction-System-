import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DoctorLayout from './DoctorLayout';
import './Doctor.css';

function CTScan() {
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
  }
}, []);

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
  

  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [prediction, setPrediction] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isPredictionComplete, setIsPredictionComplete] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showCorrection, setShowCorrection] = useState(false);
  const [correctLabel, setCorrectLabel] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
    setImagePreview(file ? URL.createObjectURL(file) : null);
    setPrediction('');
    setError('');
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please select an image file.');
      return;
    }

    setIsLoading(true);
    setPrediction('');
    setError('');
    setSaved(false);
    setIsPredictionComplete(false);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch('http://127.0.0.1:8000/predict-ct-scan', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Server error. Please try again.');
      }

      const data = await response.json();
      setPrediction(data.predicted_label);
      setIsPredictionComplete(true);
    } catch (err) {
      setError(err.message || 'Error: Unable to process the image.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedFile || !patientData || !prediction) {
      alert('Missing data to save.');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('patient_id', patientData.Patient_ID);
    formData.append('id_number', patientData.idNumber);
    formData.append('classification', prediction);
    formData.append('doctor_username', patientData.doctorUsername || 'unknown');
    formData.append('model_training', 'No');

    try {
      const response = await fetch('http://127.0.0.1:8000/save-ct-scan', {
        method: 'POST',
        body: formData,
      });

      const responseData = await response.json();

      if (!response.ok) {
        if (responseData.detail?.includes("already been saved")) {
          alert("❌ This patient's CT scan has already been saved. You cannot upload it again.");
        } else {
          alert(`❌ Failed to save scan: ${responseData.detail || 'Unknown error'}`);
        }
        return;
      }

      alert('✅ Scan saved!');
      setSaved(true);
    } catch (err) {
      console.error(err);
      alert('❌ Error occurred while saving the scan.');
    }
  };


const handleReportMisclassification = async () => {
  if (!correctLabel || !selectedFile || !patientData || !prediction) {
    alert('❗ Please complete all required fields before submitting.');
    return;
  }

  const formData = new FormData();
  formData.append('file', selectedFile);
  formData.append('patient_id', patientData.Patient_ID);
  formData.append('id_number', patientData.idNumber);
  formData.append('model_prediction', prediction.replace('Predicted:', '').trim());
  formData.append('correct_label', correctLabel);
  formData.append('doctor_username', patientData.doctorUsername || 'unknown');

  try {
    const response = await fetch('http://127.0.0.1:8000/report-misclassification', {
      method: 'POST',
      body: formData,
    });

    const responseData = await response.json();

    if (!response.ok) {
      if (response.status === 400) {
        alert(`⚠️ ${responseData.detail || 'Misclassification already exists or invalid data.'}`);
      } else if (response.status === 500) {
        alert(`❌ Server error: ${responseData.detail || 'Something went wrong on the server.'}`);
      } else {
        alert(`❌ Error: ${responseData.detail || 'Unexpected error occurred.'}`);
      }
      return;
    }

    alert('📝 Misclassification reported successfully.');
    setSaved(true);
    setShowCorrection(false);
  } catch (err) {
    console.error('Misclassification error:', err);
    alert('❌ A network or system error occurred while reporting the misclassification.');
  }
};
  const navigate = useNavigate();

  return (
    <DoctorLayout>
      <div style={{ textAlign: 'center' }}>
        <h2>CT Scan Stroke Detection</h2>
        {patientData && (
        <div>
          <p><strong>Patient ID:</strong> {patientData.Patient_ID}</p>
          <p><strong>ID Number:</strong> {patientData.idNumber}</p>
        </div>
      )}
        <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <input
            type="file"
            accept="image/png"
            onChange={handleFileChange}
          />
          {imagePreview && (
            <img
              src={imagePreview}
              alt="Selected CT Scan"
              style={{
                maxWidth: '700px',
                maxHeight: '500px',
                margin: '0 auto',
                display: 'block',
                border: 'none',
                outline: 'none',
                boxShadow: 'none',
                backgroundColor: 'transparent',
              }}
            />
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="second-button"
          >
            {isLoading ? 'Predicting...' : 'Upload and Predict'}
          </button>
        </form>

        {isLoading && <div>Processing image...</div>}
        {prediction && <div className="result">{prediction}</div>}
        {error && <div>{error}</div>}

        
        {isPredictionComplete && !saved && (
      <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
    <div>
      <button
        onClick={handleSave}
        className="green-button"
        style={{ marginRight: '1rem' }}
      >
        ✅ Confirm & Save
      </button>

      <button
        onClick={() => setShowCorrection(true)}
        className="first-button"
        style={{ backgroundColor: '#d9534f', color: 'white' }}
      >
        ❌ Report Misclassification
      </button>
    </div>

    {showCorrection && (
      <div style={{ textAlign: 'center' }}>
        <label htmlFor="correctLabel"><strong>Select Correct Classification:</strong></label>
        <select
          id="correctLabel"
          value={correctLabel}
          onChange={(e) => setCorrectLabel(e.target.value)}
          style={{ marginLeft: '0.5rem', padding: '0.3rem' }}
        >
          <option value="">-- Choose --</option>
          <option value="Normal">Normal</option>
          <option value="Ischemic">Ischemic</option>
          <option value="Hemorrhagic">Hemorrhagic</option>
        </select>

        <div>
          <button
            onClick={handleReportMisclassification}
            className="green-button"
            style={{ marginTop: '1rem' }}
          >
            Submit Correction
          </button>
        </div>
      </div>
    )}
  </div>
)}
        
      </div>
      <div className="bottom-right-buttons">
       <button type="submit" onClick={() => navigate('/StrokePrediction')}  className="first-button"
       >Stroke Prediction</button>
       
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

export default CTScan;