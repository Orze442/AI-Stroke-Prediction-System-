import React, { useState, useEffect } from 'react';
import DoctorLayout from './DoctorLayout';
import PatientDatabase from '../Components/PatientDatabase';
import './Doctor.css';
import '../App.css';


function DoctorPatientDatabase() {
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const name = localStorage.getItem('userName');
    if (name) {
      setUserName(name);
    }
  }, []);

  return (
    <DoctorLayout>
        <PatientDatabase role="doctor" />
    </DoctorLayout>
  );
}

export default DoctorPatientDatabase;