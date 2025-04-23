import { useState } from 'react';
import '../Styles/Modal.css';

export default function SignInModal({ onClose }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const res = await fetch('http://4.237.58.241:3000/user/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Login failed');

      localStorage.setItem('cinefyra-token', data.bearerToken.token);
      localStorage.setItem('cinefyra-refresh', data.refreshToken.token);
      localStorage.setItem('cinefyra-user', email);

      alert('✅ Login successful!');
      onClose();
      window.location.reload();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>×</button>
        <h2>Sign In to CineFyra</h2>
        <form onSubmit={handleSubmit}>
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button type="submit" className="modal-login-btn">Login</button>
        </form>
        {error && <p className="error">{error}</p>}
      </div>
    </div>
  );
}
