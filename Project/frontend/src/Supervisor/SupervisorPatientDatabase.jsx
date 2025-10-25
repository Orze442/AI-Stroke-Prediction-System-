import React, { useState, useEffect } from 'react';
import SupervisorLayout from './SupervisorLayout';
import PatientDatabase from '../Components/PatientDatabase';
import './Supervisor.css';
import '../App.css';

function SupervisorPatientDatabase() {
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const name = localStorage.getItem('userName');
    if (name) {
      setUserName(name);
    }
  }, []);

  return (
    <SupervisorLayout>
        <PatientDatabase role="supervisor" />
    </SupervisorLayout>
  );
}

export default SupervisorPatientDatabase;