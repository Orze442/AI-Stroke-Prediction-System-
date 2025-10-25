import React, { useEffect, useState } from 'react';
import DoctorLayout from './DoctorLayout';
import Report from '../Components/Report';
import './Doctor.css';
import '../App.css';

function DoctorReport() {
  const [userName, setUserName] = useState('');
  const categories = ['General Prediction Model', 'CT Model', 'Symptom Model', 'Patient Database', 'ChatBot', 'Other'];

  useEffect(() => {
    const name = localStorage.getItem('userName');
    if (name) {
      setUserName(name);
    }
  }, []);

  return (
    <DoctorLayout>
      <div className="doctor-bot-page">
        <h2>Doctor Issue Reporting</h2>
        <Report role="doctor" categories={categories} />
      </div>
    </DoctorLayout>
  );
}

export default DoctorReport;