import React, { useState, useEffect } from 'react';
import DoctorLayout from './DoctorLayout';

function DoctorProfile() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [message, setMessage] = useState('');

  // Load current user data from localStorage or API on mount
  useEffect(() => {
    // You might want to fetch user data from backend here
    const storedName = localStorage.getItem('userName') || '';
    const storedEmail = localStorage.getItem('userEmail') || '';
    setFormData(prev => ({ ...prev, name: storedName, email: storedEmail }));
  }, []);

  const handleChange = e => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();

    if (formData.password && formData.password !== formData.confirmPassword) {
      setMessage('Passwords do not match.');
      return;
    }

    try {
        const res = await fetch(`http://127.0.0.1:8000/users/update?email=${encodeURIComponent(formData.email)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
        name: formData.name,
         password: formData.password || undefined,
        }),
    });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.detail || 'Update failed');
        return;
      }

      setMessage('Profile updated successfully!');
      // Optionally update localStorage with new name/email
      localStorage.setItem('userName', formData.name);
      localStorage.setItem('userEmail', formData.email);

    } catch (err) {
      setMessage('Network error');
    }
  };

  return (
    <DoctorLayout>
      <div className="doctor-container">
        <h1>Update Profile</h1>
        <form onSubmit={handleSubmit} className="profile-form">
          <label>
            Name:
            <input
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Email:
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              readOnly 
            />
          </label>

          <label>
            New Password:
            <input
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Leave blank to keep current"
            />
          </label>

          <label>
            Confirm Password:
            <input
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm new password"
            />
          </label>

          {message && <p className="message">{message}</p>}

          <button type="submit">Save Changes</button>
        </form>
      </div>
    </DoctorLayout>
  );
}

export default DoctorProfile;
