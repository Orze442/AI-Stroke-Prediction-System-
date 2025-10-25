import React, { useState, useEffect } from 'react';
import DoctorLayout from './DoctorLayout';
import './Doctor.css';
import '../App.css';

function DoctorHome() {
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const name = localStorage.getItem('userName');
    if (name) {
      setUserName(name);
    }
  }, []);

  return (
    <DoctorLayout>
      <div className="doctor-container">
        <h1>Welcome, {userName || 'User'}!</h1>
        <p>Select a section from the sidebar to begin.</p>
      </div>
    </DoctorLayout>
  );
}

export default DoctorHome;
