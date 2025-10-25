import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import PatientDatabase from '../Components/PatientDatabase';
import './Admin.css';
import '../App.css';


function AdminPatientDatabase() {
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const name = localStorage.getItem('userName');
    if (name) {
      setUserName(name);
    }
  }, []);

  return (
    <AdminLayout>
        <PatientDatabase role="admin" />
    </AdminLayout>
  );
}

export default AdminPatientDatabase;