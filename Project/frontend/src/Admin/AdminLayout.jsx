import React from 'react';
import { Link } from 'react-router-dom';
import { FaCog, FaSignOutAlt, FaRobot } from 'react-icons/fa';
import './Admin.css';

function AdminLayout({ children }) {
  return (
    <div className="admin-layout">
      <div className="admin-sidebar">
        <h2 className="sidebar-title">Admin Panel</h2>
        <nav className="sidebar-nav">
          <Link to="/admin" className="sidebar-link">Home</Link>
          <Link to="/EditUser" className="sidebar-link">Manage Users</Link>
          <Link to="/ManageReports" className="sidebar-link">Manage Reports</Link>
          <Link to="/PersonDatabase" className="sidebar-link">Person Database</Link>
          <Link to="/admin/PatientDatabase" className="sidebar-link">Patient Database</Link>


          <div className="sidebar-footer">
            <Link to="/admin/Bot" className="sidebar-icon-link" title="Chatbot">
                <FaRobot />
            </Link>
            <Link to="/admin/settings" className="sidebar-icon-link" title="Settings">
              <FaCog />
            </Link>
            <Link to="/" className="sidebar-icon-link" title="Logout">
              <FaSignOutAlt />
            </Link>
          </div>
        </nav>
      </div>

      <div className="admin-content">
        {children}
      </div>
    </div>
  );
}

export default AdminLayout;
