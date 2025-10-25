import React, { useEffect, useState, useRef } from 'react';
import '../App.css';

function PatientDatabase({ role }) {
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const printRef = useRef();

  const handlePrint = () => {
    const printContents = printRef.current.innerHTML;
    const printWindow = window.open('', '', 'height=600,width=800');

    printWindow.document.write(`
      <html>
        <head>
          <title>Patient Summary</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h3, h4 { margin-bottom: 10px; }
            img { max-width: 100%; }
            ul { padding-left: 20px; }
            .modal-actions { display: none !important; }
          </style>
        </head>
        <body>
          ${printContents}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = () => {
    fetch('http://localhost:8000/patients/all')
      .then((res) => res.json())
      .then((data) => setPatients(data))
      .catch((err) => console.error('Failed to load patients:', err));
  };

  const filteredPatients = patients.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleView = async (patientId) => {
    try {
      const res1 = await fetch(`http://localhost:8000/api/patient/${patientId}`);
      const basicInfo = await res1.json();

      const res2 = await fetch(`http://localhost:8000/api/patient_symptoms/${patientId}`);
      const symptoms = await res2.json();

      const res3 = await fetch(`http://localhost:8000/api/patient_ct_scans/${patientId}`);
      const ctScan = await res3.json();

      setSelectedPatient({ ...basicInfo, symptoms, ctScan });
      setModalVisible(true);
    } catch (error) {
      console.error("Failed to load patient details:", error);
    }
  };

  const handleDelete = async (patientId) => {
    if (window.confirm("Are you sure you want to delete this patient?")) {
      try {
        const res = await fetch(`http://localhost:8000/patients/${patientId}/delete`, {
          method: 'DELETE',
        });
        if (res.ok) {
          fetchPatients(); // refresh list
        } else {
          console.error("Delete failed");
        }
      } catch (error) {
        console.error("Error deleting patient:", error);
      }
    }
  };

  return (
    <div className="data-database-container">
      <h2>🩺 Patient Database</h2>
      <input
        type="text"
        placeholder="🔍 Search by name..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="search-input"
      />
    <div className="table-scroll">
      <table className="data-table">
        <thead>
          <tr>
            <th>Patient ID</th>
            <th>ID Number</th>
            <th>Name</th>
            <th>Gender</th>
            <th>Age</th>
            <th>Phone</th>
            <th>Created At</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredPatients.length === 0 ? (
            <tr><td colSpan="8">No matching patients found.</td></tr>
          ) : (
            filteredPatients.map((p) => (
              <tr key={p.patient_id}>
                <td>{p.patient_id}</td>
                <td>{p.id_number}</td>
                <td>{p.name}</td>
                <td>{p.gender}</td>
                <td>{p.age}</td>
                <td>{p.phone}</td>
                <td>
                    {p.created_at
                      ? new Date(p.created_at).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true,
                        })
                      : 'N/A'}
                  </td>
                <td>
                  <button onClick={() => handleView(p.patient_id)}>🔍 View</button>
                  {role === 'admin' && (
                    <>
                      <button
                        onClick={() => handleDelete(p.patient_id)}
                        style={{ marginLeft: '0.5rem', color: 'red' }}
                      >
                        🗑 Delete Patient
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      </div>

      {modalVisible && selectedPatient && (
        <div className="modal">
          <div className="modal-content" ref={printRef}>
            <h3>Patient Details: {selectedPatient.name} </h3>
            <p><strong>Patient ID:</strong> {selectedPatient.patientID}</p>
            <p><strong>Gender:</strong> {selectedPatient.gender}</p>
            <p><strong>Age:</strong> {selectedPatient.age}</p>
            <p><strong>Phone:</strong> {selectedPatient.phone}</p>

            <h4>📝 Symptoms</h4>
            {selectedPatient.symptoms?.symptoms?.length > 0 ? (
              <ul>
                {selectedPatient.symptoms.symptoms.map((symptom, index) => (
                  <li key={index}>{symptom}</li>
                ))}
              </ul>
            ) : (
              <p>No symptoms reported.</p>
            )}

            <p><strong>Doctor:</strong> {selectedPatient.symptoms?.doctor_username}</p>
            <p><strong>Reported At:</strong> {selectedPatient.symptoms?.timestamp}</p>

            <h4>🖼 CT Scan</h4>
            {selectedPatient.ctScan?.photo ? (
              <>
                <img
                  src={`http://localhost:8000/${selectedPatient.ctScan.photo}`}
                  alt="CT Scan"
                  width="250"
                />
                <p><strong>Classification:</strong> {selectedPatient.ctScan.classification}</p>
                <p><strong>Doctor:</strong> {selectedPatient.ctScan.doctor_username}</p>
                <p><strong>Timestamp:</strong> {selectedPatient.ctScan.timestamp}</p>
              </>
            ) : (
              <p>No CT scan data available.</p>
            )}

            <div className="modal-actions">
              <button onClick={handlePrint} className="print-btn">🖨 Print</button>
              <button onClick={() => setModalVisible(false)} className="close-btn">❌ Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PatientDatabase;
