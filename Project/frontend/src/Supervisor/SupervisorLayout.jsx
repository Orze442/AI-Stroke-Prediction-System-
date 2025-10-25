import React from 'react';
import { Link } from 'react-router-dom';
import { FaCog, FaSignOutAlt, FaRobot, FaExclamationCircle } from 'react-icons/fa';


function SupervisorLayout ({ children }) {
  return (
    <div className="supervisor-layout">
      <div className="supervisor-sidebar">
        <h2 className="sidebar-title">supervisor Panel</h2>
        <nav className="sidebar-nav">
          <Link to="/supervisor" className="sidebar-link">Home</Link>
          <Link to="/MisclassifiedScans" className="sidebar-link">Misclassified Scans</Link>
          <Link to="/RetrainCTModel" className="sidebar-link">CT Model Retraining</Link>
          <Link to="/RAGTraining" className="sidebar-link">Chatbot RAG Training</Link>
          <Link to="/supervisor/PatientDatabase" className="sidebar-link">Patient Database</Link>

          <div className="sidebar-footer">
           <Link to="/supervisor/Bot" className="sidebar-icon-link" title="Chatbot">
               <FaRobot />
            </Link>
             <Link to="/supervisor/report" className="sidebar-icon-link" title="Reports">
               <FaExclamationCircle />
             </Link>
            <Link to="/supervisor/settings" className="sidebar-icon-link" title="Settings">
              <FaCog />
            </Link>
            <Link to="/" className="sidebar-icon-link" title="Logout">
              <FaSignOutAlt />
            </Link>
          </div>
        </nav>
      </div>

      <div className="supervisor-content">
        {children}
      </div>
    </div>
  );
}

export default SupervisorLayout;
