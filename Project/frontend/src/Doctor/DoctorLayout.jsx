import React from 'react';
import { Link } from 'react-router-dom';
import { FaCog, FaSignOutAlt, FaRobot, FaExclamationCircle } from 'react-icons/fa';
import './Doctor.css';

function DoctorLayout({ children }) {
  return (
    <div className="doctor-layout">
      <div className="doctor-sidebar">
        <h2 className="sidebar-title">Doctor Panel</h2>
        <nav className="sidebar-nav">
          <Link to="/doctor" className="sidebar-link">Home</Link>
          <Link to="/PredictionHome" className="sidebar-link">Stroke Prediction Hub</Link>
          <Link to="/doctor/PatientDatabase" className="sidebar-link">Patient Database</Link>

          <div className="sidebar-footer">
            <Link to="/doctor/Bot" className="sidebar-icon-link" title="Chatbot">
              <FaRobot />
            </Link>
            <Link to="/doctor/report" className="sidebar-icon-link" title="Reports">
              <FaExclamationCircle />
            </Link>
            <Link to="/doctor/settings" className="sidebar-icon-link" title="Settings">
              <FaCog />
            </Link>
            <Link to="/" className="sidebar-icon-link" title="Logout">
              <FaSignOutAlt />
            </Link>
          </div>
        </nav>
      </div>

      <div className="doctor-content">
        {children}
      </div>
    </div>
  );
}

export default DoctorLayout;
