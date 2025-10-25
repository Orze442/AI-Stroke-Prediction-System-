import React, { useState } from 'react';
import '../App.css';

function Report({ role, categories }) {
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState('');
  const email = localStorage.getItem('userEmail') || '';
  const displayName = localStorage.getItem('userName') || 'User';

  const handleSubmit = async () => {
    if (!category || !description) {
      setMessage('❗ Please fill in all fields.');
      return;
    }

    const formData = new FormData();
    formData.append('email', email);
    formData.append('role', role);
    formData.append('category', category);
    formData.append('description', description);

    try {
      const res = await fetch('http://localhost:8000/reports/create', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (res.ok) {
        setMessage('✅ Report submitted successfully.');
        setCategory('');
        setDescription('');
      } else {
        setMessage(`❌ Error: ${data.detail || 'Something went wrong.'}`);
      }
    } catch (err) {
      console.error(err);
      setMessage('❌ Failed to submit report.');
    }
  };

  return (
    <div className="report-container">
      <div className="chat-box">
        <div className="chat-message bot-msg">
          Hello {displayName}, report an issue below 👇
        </div>

        <div className="report-form">
          <label>Category:</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">-- Select --</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <label>Description:</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={6}
            placeholder="Describe the issue..."
          />

          <div style={{ marginTop: '1rem' }}>
            <button onClick={handleSubmit}>Submit Report</button>
          </div>

          {message && <div className="chat-message bot-msg">{message}</div>}
        </div>
      </div>
    </div>
  );
}

export default Report;