import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [email, setEmail] = useState(''); 
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setError('Please fill in both fields.');
      return;
    }

    try {
      const response = await fetch('http://127.0.0.1:8000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.detail || 'Login failed');
        return;
      }

      const data = await response.json();
      console.log('Login success:', data);

      localStorage.setItem('userName', data.name);   // Store  name
      localStorage.setItem('userEmail', data.email); 

    // ✅ Redirect based on role
    if (data.role === 'admin') {
      navigate('/admin'); // You must create this route/component
    } else if (data.role === 'doctor') {
      navigate('/doctor');
    } else if (data.role === 'supervisor') {
       navigate('/supervisor');  // 👈 You must create this route/component
    } else {
      setError('Unknown role. Cannot redirect.');
    }
    } catch (err) {
      setError('Network error');
    }
  };

  return (
    <div className="login-container">
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>email</label>
          <input
            type="email"                   // input type email for validation
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="your.email@example.com"
            required
          />
        </div>
        <div>
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>
        {error && <p className="error-message">{error}</p>}
        <button type="submit">Login</button>
      </form>
    </div>
  );
}

export default Login;
