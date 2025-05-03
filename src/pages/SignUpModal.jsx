import { useState } from 'react';
import '../Styles/Modal.css';

export default function SignUpModal({ onClose }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    try {
      // Register user
      const regRes = await fetch('http://4.237.58.241:3000/user/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const regData = await regRes.json();
      if (!regRes.ok) throw new Error(regData.message || 'Registration failed');

      // Auto-login after registration
      const loginRes = await fetch('http://4.237.58.241:3000/user/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const loginData = await loginRes.json();
      if (!loginRes.ok) throw new Error(loginData.message || 'Login failed');

      // Save session tokens
      localStorage.setItem('cinefyra-token', loginData.bearerToken.token);
      localStorage.setItem('cinefyra-refresh', loginData.refreshToken.token);
      localStorage.setItem('cinefyra-user', email);

      alert('✅ Registered and logged in!');
      onClose(); // Close modal
      window.location.reload(); // Refresh UI state
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>×</button>
        <h2>Sign Up to CineFyra</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
          <button type="submit" className="modal-login-btn">Register</button>
        </form>
        {error && <p className="error">{error}</p>}
      </div>
    </div>
  );
}
