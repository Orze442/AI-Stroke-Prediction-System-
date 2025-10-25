import React, { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import './Admin.css';
import '../App.css';

function ManageReports() {
  const [reports, setReports] = useState([]);
  const [error, setError] = useState('');
  const [searchCategory, setSearchCategory] = useState('');
  const [searchRole, setSearchRole] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await fetch('http://localhost:8000/reports/all');
      const data = await res.json();
      setReports(data);
    } catch (err) {
      setError('❌ Failed to load reports.');
    }
  };

  const updateSolvedStatus = async (reportId, status) => {
    try {
      await fetch(`http://localhost:8000/reports/${reportId}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ solved: status })
      });
      fetchReports();
    } catch (err) {
      console.error(err);
    }
  };

 const filteredReports = reports.filter((r) => {
 const isSolvedMatch =
    filter === 'solved' ? r.is_resolved :
    filter === 'unsolved' ? !r.is_resolved :
    true;

  const matchesCategory = r.category.toLowerCase().includes(searchCategory.toLowerCase());
  const matchesRole = r.role.toLowerCase().includes(searchRole.toLowerCase());

  return isSolvedMatch && matchesCategory && matchesRole;
});
  return (
    <AdminLayout>
      <div className="admin-report-page">
        <h1>📋 Admin Report Management</h1>

        <div className="filter-buttons">
          <button
            className={filter === 'all' ? 'active' : ''}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            className={filter === 'unsolved' ? 'active' : ''}
            onClick={() => setFilter('unsolved')}
          >
            Unsolved
          </button>
          <button
            className={filter === 'solved' ? 'active' : ''}
            onClick={() => setFilter('solved')}
          >
            Solved
          </button>
         <div className="search-fields" style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            <input
                type="text"
                placeholder="Search by category..."
                value={searchCategory}
                onChange={(e) => setSearchCategory(e.target.value)}
            />
            <input
                type="text"
                placeholder="Search by role..."
                value={searchRole}
                onChange={(e) => setSearchRole(e.target.value)}
            />
         </div>
        </div>

        {error && <p className="error-text">{error}</p>}
      <div className="table-scroll">
        <table className="report-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Email</th>
              <th>Role</th>
              <th>Category</th>
              <th>Description</th>
              <th>Created At</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredReports.length === 0 ? (
              <tr>
                <td colSpan="7">No reports to display.</td>
              </tr>
            ) : (
              filteredReports.map((report) => (
                <tr key={report.report_id}>
                  <td>{report.report_id}</td>
                  <td>{report.email}</td>
                  <td>{report.role}</td>
                  <td>{report.category}</td>
                  <td>{report.description}</td>
                  <td>{new Date(report.created_at).toLocaleString()}</td>
                  <td>{report.is_resolved ? '✅ Solved' : '⏳ Unsolved'}</td>
                  <td>
                    <button
                      className={`toggle-button ${report.is_resolved ? 'unsolve' : 'solve'}`}
                      onClick={() =>
                        updateSolvedStatus(report.report_id, !report.is_resolved)
                      }
                    >
                      {report.is_resolved ? '↩️ Unsolve' : '✅ Solve'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>
    </AdminLayout>
  );
}

export default ManageReports;