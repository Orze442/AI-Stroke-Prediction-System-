import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import './Admin.css'; // Keep all sidebar styles here



function AdminHome() {
    const [userName, setUserName] = useState('');

  useEffect(() => {
    const name = localStorage.getItem('userName');
    if (name) {
      setUserName(name);
    }
  }, []);

  return (
    <AdminLayout>
      <div className="admin-container">
      <h1>Welcome, {userName || 'User'}!</h1>
      <p>Select a section from the sidebar to begin.</p>
      </div>
    </AdminLayout>
  );
}

export default AdminHome;
