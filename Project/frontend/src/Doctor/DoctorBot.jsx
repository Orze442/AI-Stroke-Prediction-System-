import React, { useState, useEffect } from 'react';
import DoctorLayout from './DoctorLayout';
import MedicalBot from '../Components/MedicalBot';
import './Doctor.css';
import '../App.css';


function DoctorBot() {
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const name = localStorage.getItem('userName');
    if (name) {
      setUserName(name);
    }
  }, []);

  return (
    <DoctorLayout>
    <div className="doctor-bot-page">
      <h2>Doctor Assistant</h2>
      <MedicalBot role="doctor" />
    </div>
    </DoctorLayout>
  );
}

export default DoctorBot;