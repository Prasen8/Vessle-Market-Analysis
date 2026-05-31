import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.username, form.password);
      nav('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="login-brand">
          <div className="login-logo">⚓</div>
          <h1>Vessel Market<br />Performance</h1>
          <p>Track, analyse and compare vessel hire rates against regional market benchmarks — in real time.</p>
        </div>
        <div className="login-stats">
          <div className="lstat"><span>6</span><small>Vessels tracked</small></div>
          <div className="lstat"><span>3</span><small>Regions</small></div>
          <div className="lstat"><span>180+</span><small>Days of data</small></div>
        </div>
      </div>

      <div className="login-right">
        <div className="login-card">
          <h2>Sign in</h2>
          <p className="login-sub">Enter your credentials to access the dashboard</p>

          <form onSubmit={handleSubmit} className="login-form">
            {error && <div className="login-error">{error}</div>}

            <div className="form-field">
              <label>Username</label>
              <input
                type="text"
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                placeholder="Enter username"
                required
                autoFocus
              />
            </div>

            <div className="form-field">
              <label>Password</label>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="••••••••"
                required
              />
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in →'}
            </button>
          </form>

          <div className="login-divider">
            <span>Don't have an account?</span>
          </div>

          <Link to="/register" className="register-link">
            Create new account
          </Link>

          
        </div>
      </div>
    </div>
  );
}
