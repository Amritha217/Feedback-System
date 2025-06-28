import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Login.css';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('manager');
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await axios.post('http://localhost:5000/api/login', {
        email,
        password,
        role,
      });

      localStorage.setItem('userId', res.data.userId);
      localStorage.setItem('email', res.data.email);
      localStorage.setItem('role', res.data.role);

      if (res.data.role === 'manager') {
        navigate('/manager');
      } else {
        navigate('/employee');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="login-container">
      <form className="login-box" onSubmit={handleLogin}>
        <h2>🔐 Login</h2>

        {error && <div className="error-msg">{error}</div>}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />

        <select value={role} onChange={e => setRole(e.target.value)}>
          <option value="manager">Manager</option>
          <option value="employee">Employee</option>
        </select>

        <button type="submit">Login</button>
      </form>
    </div>
  );
}

export default LoginPage;
