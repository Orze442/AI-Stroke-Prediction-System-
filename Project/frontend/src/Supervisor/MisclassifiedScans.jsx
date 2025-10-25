import React, { useEffect, useState } from 'react';
import SupervisorLayout from './SupervisorLayout'
import axios from 'axios';

function MisclassifiedScans() {
  const [scans, setScans] = useState([]);

  useEffect(() => {
    axios.get('http://127.0.0.1:8000/misclassified-ct-scans')
      .then(res => {
        setScans(res.data);
      })
      .catch(err => {
        console.error("Failed to fetch misclassified scans", err);
      });
  }, []);

  const [selectedLabel, setSelectedLabel] = useState({});  // Track new labels

  const handleLabelChange = (id, value) => {
    setSelectedLabel(prev => ({ ...prev, [id]: value }));
  };

  const handleApprove = async (scan) => {
  try {
    const formData = new FormData();
    formData.append("misclassified_id", scan.id);
    formData.append("new_label", selectedLabel[scan.id] || scan.correct_label);

    await axios.post('http://127.0.0.1:8000/approve-misclassification', formData);

    setScans(prev => prev.filter(s => s.id !== scan.id));
    alert("Scan approved and moved.");
  } catch (err) {
    console.error("Approval failed", err);
    alert("Failed to approve scan.");
  }
};

  return (
    <SupervisorLayout>
  <div className="CT-container">
    <h1>Misclassified CT Scans</h1>
    <div className="scans-grid">
      {Array.isArray(scans) && scans.length === 0 && <p>No scans found.</p>}
      {Array.isArray(scans) && scans.map(scan => (
        <div key={scan.id} className="scan-card">
          <img
            src={`http://localhost:8000/misclassified_images/${encodeURIComponent(scan.photo.split('\\').pop())}`}
            alt="CT scan"
          />
          <p><strong>Patient ID:</strong> {scan.patient_id}</p>
          <p><strong>ID Number:</strong> {scan.id_number}</p>
          <p><strong>Predicted:</strong> {scan.model_prediction}</p>
          <p><strong>Assigned Doctor:</strong> {scan.doctor_username}</p>
          <p><strong>Corrected Label:</strong> {scan.correct_label}</p>
          <p><strong>Submitted on:</strong> {scan.timestamp
           ? new Date(scan.timestamp).toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
              })
            : 'N/A'}
          </p>

          <label>Update Label:</label>
          <select
            value={selectedLabel[scan.id] || scan.correct_label}
            onChange={(e) => handleLabelChange(scan.id, e.target.value)}
          >
            <option value="Normal">Normal</option>
            <option value="Ischemic">Ischemic</option>
            <option value="Hemorrhagic">Hemorrhagic</option>
          </select>

          <button onClick={() => handleApprove(scan)}>✅ Approve & Save</button>
        </div>
      ))}
    </div>
  </div>
</SupervisorLayout>
  );
}

export default MisclassifiedScans;

