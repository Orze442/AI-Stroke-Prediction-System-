import React, { useEffect, useState } from 'react';
import SupervisorLayout from './SupervisorLayout';
import Report from '../Components/Report';
import './Supervisor.css';
import '../App.css';

function SupervisorReport() {
  const [userName, setUserName] = useState('');
  const categories = ['Misclassified Scans', 'CT Model Retraining', 'ChatBot RAG training', 'Patient Database', 'ChatBot', 'Other'];

  useEffect(() => {
    const name = localStorage.getItem('userName');
    if (name) {
      setUserName(name);
    }
  }, []);

  return (
    <SupervisorLayout>
      <div className="doctor-bot-page">
        <h2>Supervisor Issue Reporting</h2>
        <Report role="supervisor" categories={categories} />
      </div>
    </SupervisorLayout>
  );
}

export default SupervisorReport;
