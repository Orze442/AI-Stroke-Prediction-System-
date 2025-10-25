import React, { useState, useEffect } from 'react';
import SupervisorLayout from './SupervisorLayout'
import '../App.css';
import './Supervisor.css';


function SupervisorHome() {
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const name = localStorage.getItem('userName');
    if (name) {
      setUserName(name);
    }
  }, []);

  return (
    <SupervisorLayout>
      <div className="doctor-container">
        <h1>Welcome, {userName || 'User'}!</h1>
        <p>Select a section from the sidebar to begin.</p>
      </div>
    </SupervisorLayout>

  );
}

export default SupervisorHome;
