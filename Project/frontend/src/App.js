import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { FaSun, FaMoon } from 'react-icons/fa';
import Login from './Login';
import SupervisorHome from './Supervisor/SupervisorHome';
import SupervisorBot from './Supervisor/SupervisorBot';
import SupervisorPatientDatabase from './Supervisor/SupervisorPatientDatabase';
import SupervisorReport from './Supervisor/SupervisorReport';
import SupervisorProfile from './Supervisor/SupervisorProfile';
import StrokePrediction from './Doctor/StrokePrediction';
import CTScan from './Doctor/CTScan';
import PredictionHome from './Doctor/PredictionHome';
import ExistingPatient from './Doctor/ExistingPatient';
import DoctorHome from './Doctor/DoctorHome';
import DoctorBot from './Doctor/DoctorBot';
import DoctorPatientDatabase from './Doctor/DoctorPatientDatabase';
import DoctorReport from './Doctor/DoctorReport';
import DoctorProfile from './Doctor/DoctorProfile';
import EditUser from './Admin/EditUser';
import ManageReports from './Admin/ManageReports';
import AdminHome from './Admin/AdminHome';
import AdminBot from './Admin/AdminBot';
import AdminPatientDatabase from './Admin/AdminPatientDatabase';
import AdminProfile from './Admin/AdminProfile';
import PersonDatabase from './Admin/PersonDatabase';
import MisclassifiedScans from './Supervisor/MisclassifiedScans';
import RetrainCTModel from './Supervisor/RetrainCTModel';
import RAGTraining from './Supervisor/RAGTraining';


import './App.css';


function App() {
  const [theme, setTheme] = useState('dark'); // 'light' or 'dark'

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <Router>
      <div className={`App ${theme}`}>
      <button onClick={toggleTheme} className="theme-toggle" aria-label="Toggle theme">
      {theme === 'dark' ? <FaSun size={20} /> : <FaMoon size={20} />}
      </button>

        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/StrokePrediction" element={<StrokePrediction />} />
          <Route path="/supervisor" element={<SupervisorHome />} />
          <Route path="/supervisor/Bot" element={<SupervisorBot/>} />
          <Route path="/supervisor/PatientDatabase" element={<SupervisorPatientDatabase/>} />
          <Route path="/supervisor/report" element={<SupervisorReport/>} />
          <Route path="/supervisor/settings" element={<SupervisorProfile />} />
          <Route path="/admin" element={<AdminHome />} />
          <Route path="/admin/Bot" element={<AdminBot/>} />
          <Route path="/admin/PatientDatabase" element={<AdminPatientDatabase/>} />
          <Route path="/admin/settings" element={<AdminProfile />} />
          <Route path="/doctor" element={<DoctorHome />} />
          <Route path="/doctor/Bot" element={<DoctorBot/>} />
          <Route path="/doctor/PatientDatabase" element={<DoctorPatientDatabase/>} />
          <Route path="/doctor/report" element={<DoctorReport/>} />
          <Route path="/doctor/settings" element={<DoctorProfile />} />
          <Route path="/EditUser" element={<EditUser />} />
          <Route path="/PersonDatabase" element={<PersonDatabase/>} />
          <Route path="/ManageReports" element={<ManageReports />} />
          <Route path="/MisclassifiedScans" element={<MisclassifiedScans />} />
          <Route path="/RetrainCTModel" element={<RetrainCTModel />} />
          <Route path="/RAGTraining" element={<RAGTraining />} />
          <Route path="/CTScan" element={<CTScan />} />
          <Route path="/PredictionHome" element={<PredictionHome />} />
          <Route path="/ExistingPatient" element={<ExistingPatient />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
