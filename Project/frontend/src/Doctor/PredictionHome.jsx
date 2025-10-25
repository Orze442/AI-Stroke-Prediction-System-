import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DoctorLayout from './DoctorLayout';
import './Doctor.css';
import '../App.css';


function PredictionHome() {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState({
    idNumber: '',
    name: '',
    phone: '',
    age: '',
    gender: '',
  });
  

  const handleChange = (e) => {
    const { name, value } = e.target;

    const newValue = name === "age" ? Math.max(0, Number(value)) : value;

    setUserInfo((prev) => ({
      ...prev,
      [name]: newValue,
    }));
  };


  const handleNavigate = async (route) => {
    const { idNumber, name, phone, age, gender } = userInfo;

    // Basic field presence check
    if (!idNumber || !name || !phone || !age || !gender) {
      alert("Please fill out all fields.");
      return;
    }

    // Name must only contain letters and spaces
    if (!/^[A-Za-z\s]+$/.test(name)) {
      alert("Name must contain only letters and spaces.");
      return;
    }

    // Phone number must be 7–15 digits
    if (!/^\d{7,15}$/.test(phone)) {
      alert("Please enter a valid phone number (only digits, 7-15 characters).");
      return;
    }

    // Age must be a positive number
    if (isNaN(age) || age <= 0) {
      alert("Please enter a valid age.");
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/api/patient', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userInfo),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 400) {
          alert(result.detail || 'Validation error. Please check your inputs.');
        } else {
          alert('An unexpected error occurred. Please try again.');
        }
        return;
      }

      localStorage.setItem('userInfo', JSON.stringify({
        ...userInfo,
        Patient_ID: result.patientID,
      }));

      navigate(route);
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to save patient data. Please check your internet connection and try again.');
    }
  };

  return (
    <DoctorLayout>
      <div className="doctor-container">
        <h2 className="prediction-title">Stroke Prediction Hub</h2>

        <div className="form-group">
          <input
            type="text"
            name="idNumber"
            placeholder="ID Number"
            value={userInfo.idNumber}
            onChange={handleChange}
            className="form-input"
            required
          />

          <input
            type="text"
            name="name"
            placeholder="Patient Name"
            value={userInfo.name}
            onChange={handleChange}
            className="form-input"
            required
          />

          <input
            type="tel"
            name="phone"
            placeholder="Phone Number"
            value={userInfo.phone}
            onChange={handleChange}
            className="form-input"
            required
          />

          <input
            type="number"
            name="age"
            placeholder="Age"
            value={userInfo.age}
            onChange={handleChange}
            className="form-input"
            required
          />

          <select
            name="gender"
            value={userInfo.gender}
            onChange={handleChange}
            className="form-input"
            required
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>

                  <p style={{ marginTop: '10px', fontSize: '0.9rem' }}>
          <a href="/ExistingPatient" style={{ color: '#007bff', textDecoration: 'underline', cursor: 'pointer' }}>
            Already registered? Click here to proceed
          </a>
        </p>

        <div className="button-group">
          <button type="submit"
            onClick={() => handleNavigate('/StrokePrediction')}
            className="First-button"
          >
            Predict from Symptoms
          </button>

          <button type="submit"
            onClick={() => handleNavigate('/CTScan')}
            className="second-button"
          >
            Predict from CT Scan
          </button>
          </div>
        </div>
      </div>
    </DoctorLayout>
  );
}

export default PredictionHome;
