import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import MedicalBot from '../Components/MedicalBot';
import './Admin.css';
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
    <AdminLayout>
    <div className="doctor-bot-page">
      <h2>Admin</h2>
      <MedicalBot role="Medical Admin" />
    </div>
    </AdminLayout>
  );
}

export default DoctorBot;