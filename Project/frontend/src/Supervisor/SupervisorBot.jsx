import React, { useState, useEffect } from 'react';
import MedicalBot from '../Components/MedicalBot';
import './Supervisor.css';
import '../App.css';
import SupervisorLayout from './SupervisorLayout';


function SupervisorBot() {
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const name = localStorage.getItem('userName');
    if (name) {
      setUserName(name);
    }
  }, []);

  return (
    <SupervisorLayout>
    <div className="doctor-bot-page">
      <h2>Supervisor Assistant</h2>
      <MedicalBot role="Medical Supervisor" />
    </div>
    </SupervisorLayout>
  );
}

export default SupervisorBot;