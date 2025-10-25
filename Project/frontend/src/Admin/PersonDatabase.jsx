import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import './Admin.css';
import '../App.css';

function PersonDatabase() {
  const [userName, setUserName] = useState('');
  const [persons, setPersons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const name = localStorage.getItem('userName');
    if (name) setUserName(name);

    fetchPersons();
  }, []);

  const fetchPersons = async () => {
    try {
      const res = await fetch('http://localhost:8000/person/all');
      const data = await res.json();
      setPersons(data);
    } catch (error) {
      console.error('Failed to fetch persons', error);
      setMessage('Error loading person data');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (idNumber) => {
    if (!window.confirm("Are you sure you want to delete this person?")) return;

    try {
      const res = await fetch(`http://localhost:8000/person/${idNumber}`, {
        method: 'DELETE',
      });

      const result = await res.json();

      if (!res.ok) {
        alert(result.detail || "Error deleting person.");
        return;
      }

      alert("Person deleted successfully");
      setPersons(persons.filter((p) => p.id_number !== idNumber));
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    }
  };

  const filteredPersons = persons.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout>
        <h2>👥 Person Records</h2>
        <input
          type="text"
          placeholder="🔍 Search by name or ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />

        {message && <p className="error-message">{message}</p>}

        {loading ? (
          <p>Loading...</p>
        ) : filteredPersons.length === 0 ? (
          <p>No persons found.</p>
        ) : (
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID Number</th>
                <th>Name</th>
                <th>Gender</th>
                <th>Patient Count</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPersons.map((person) => (
                <tr key={person.id_number}>
                  <td>{person.id_number}</td>
                  <td>{person.name}</td>
                  <td>{person.gender}</td>
                  <td>{person.patient_count}</td>
                  <td>
                    <button
                      onClick={() => handleDelete(person.id_number)}
                      disabled={person.patient_count > 0}
                      className={
                        person.patient_count > 0
                          ? 'disabled-button'
                          : 'delete-button'
                      }
                    >
                      🗑 Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
    </AdminLayout>
  );
}

export default PersonDatabase;
