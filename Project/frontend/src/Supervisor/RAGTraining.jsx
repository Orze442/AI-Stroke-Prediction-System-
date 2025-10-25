import React, { useEffect, useState } from 'react';
import SupervisorLayout from './SupervisorLayout';
import '../App.css';
import './Supervisor.css';

function RAGTraining() {
  const [pdfFile, setPdfFile] = useState(null);
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Load existing sources
  const fetchSources = async () => {
    try {
      const res = await fetch('http://localhost:8000/rag/sources');
      const data = await res.json();
      setSources(data.sources || []);
    } catch (err) {
      console.error('Failed to fetch sources');
    }
  };

  useEffect(() => {
    fetchSources();
  }, []);

  // Upload handler
  const handleUpload = async () => {
    if (!pdfFile) return;

    const formData = new FormData();
    formData.append('file', pdfFile);

    setLoading(true);
    setMessage('');

    try {
      const res = await fetch('http://localhost:8000/rag/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        // ❌ Show backend error (e.g., duplicate file)
        setMessage(data.detail || 'Upload failed.');
      } else {
        setMessage(data.message || 'Uploaded successfully!');
        setPdfFile(null);
        fetchSources();
      }

    } catch (err) {
      setMessage('Upload failed. Server error.');
    } finally {
      setLoading(false);
    }
  };

  // Delete handler
  const handleDelete = async (source) => {
    if (!window.confirm(`Delete document: ${source}?`)) return;

    try {
      const res = await fetch(`http://localhost:8000/rag/delete/${encodeURIComponent(source)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      setMessage(data.message || 'Deleted.');
      fetchSources();
    } catch (err) {
      setMessage('Delete failed.');
    }
  };

  return (
    <SupervisorLayout>
      <div className="rag-training-page">
        <h2>🧠 RAG Training Manager</h2>

        <div className="upload-section">
          <input
            type="file"
            accept=".pdf"
            onChange={(e) => setPdfFile(e.target.files[0])}
          />
          <button onClick={handleUpload} disabled={!pdfFile || loading}>
            {loading ? 'Uploading...' : 'Upload & Train'}
          </button>
        </div>

        {message && <p className="info-message">{message}</p>}

        <div className="sources-list">
          <h3>📁 Trained Documents</h3>
          {sources.length === 0 ? (
            <p>No documents uploaded yet.</p>
          ) : (
            <ul>
              {sources.map((source) => (
                <li key={source}>
                  {source}
                  <button className="delete-btn" onClick={() => handleDelete(source)}>
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </SupervisorLayout>
  );
}

export default RAGTraining;