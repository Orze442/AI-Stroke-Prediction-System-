import React, { useEffect, useState } from 'react';
import './Admin.css';
import { FaTrash } from 'react-icons/fa';
import AdminLayout from './AdminLayout';

function EditUser() {
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'doctor',
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const res = await fetch('http://127.0.0.1:8000/users');
    const data = await res.json();
    setUsers(data);
  };


  // Create new user
  const handleCreateUser = async () => {
    const { name, email, password, role } = newUser;

    // Validation
    if (!name || !email || !password || !role) {
      alert('Please fill in all fields.');
      return;
    }

    if (!email.includes('@')) {
      alert('Please enter a valid email address (must contain "@").');
      return;
    }

    if (!/^[A-Za-z\s]+$/.test(name)) {
      alert('Name must only contain letters and spaces.');
      return;
    }

    if (password.length < 6) {
      alert('Password must be at least 6 characters long.');
      return;
    }

    try {
      const res = await fetch('http://127.0.0.1:8000/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || 'Failed to create user.');
        return;
      }

      alert(data.message || 'User created successfully!');
      setNewUser({ name: '', email: '', password: '', role: 'doctor' });
      fetchUsers();
    } catch (error) {
      alert('Network error. Please try again.');
    }
  };

    /* Delete user */
    const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      const res = await fetch(`http://127.0.0.1:8000/users/${userId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setMessage('User deleted successfully');
        fetchUsers();  // refresh user list
      } else {
        const data = await res.json();
        setMessage(data.message || 'Failed to delete user');
      }
    } catch (error) {
      setMessage('Network error while deleting user');
    }
  };

  return (
    <AdminLayout>
      <div className="admin-page">
        <div className="admin-container">
          <h1 className="admin-title">Manage Users</h1>

          <div className="admin-columns">
            {/* Create User Section */}
            <div className="create-user-section">
              <h2>Create New User</h2>
              <input
                type="text"
                placeholder="Name"
                value={newUser.name}
                onChange={e => setNewUser({ ...newUser, name: e.target.value })}
              />
              <input
                type="email"
                placeholder="Email"
                value={newUser.email}
                onChange={e => setNewUser({ ...newUser, email: e.target.value })}
              />
              <input
                type="password"
                placeholder="Password"
                value={newUser.password}
                onChange={e => setNewUser({ ...newUser, password: e.target.value })}
              />
              <select
                value={newUser.role}
                onChange={e => setNewUser({ ...newUser, role: e.target.value })}
              >
                <option value="doctor">Doctor</option>
                <option value="admin">Admin</option>
                <option value="supervisor">Supervisor</option>
              </select>
              <button type="submit" onClick={handleCreateUser}>Create User</button>
              {message && <p className="message">{message}</p>}
            </div>

            {/* User List Section */}
            <div className="user-list-section">
              <h2>Existing Users</h2>
              <ul className="user-list">
                {users.map(user => (
                  <li key={user.id}>
                    <strong>{user.name}</strong> — <span>{user.email}</span> — <em>{user.role}</em>
                    <button
                    className="delete-btn"
                    aria-label={`Delete user ${user.name}`}
                    title="Delete user"
                    onClick={() => handleDeleteUser(user.id)}
                    >
                      <FaTrash />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default EditUser;
