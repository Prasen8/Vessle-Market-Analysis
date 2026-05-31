import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import './Login.css';
import './Register.css';

const emptyForm = {
  username: '',
  email: '',
  first_name: '',
  last_name: '',
  password: '',
  password2: '',
};

export default function Register() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    // Clear field error on change
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.username.trim()) errs.username = 'Username is required.';
    if (!form.password) errs.password = 'Password is required.';
    else if (form.password.length < 6) errs.password = 'At least 6 characters.';
    if (form.password !== form.password2) errs.password2 = 'Passwords do not match.';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGlobalError('');

    const clientErrors = validate();
    if (Object.keys(clientErrors).length) { setErrors(clientErrors); return; }

    setLoading(true);
    try {
      await api.post('/auth/register/', {
        username:   form.username.trim(),
        email:      form.email.trim(),
        first_name: form.first_name.trim(),
        last_name:  form.last_name.trim(),
        password:   form.password,
        password2:  form.password2,
      });
      // Auto-login after registration
      await login(form.username.trim(), form.password);
      nav('/dashboard');
    } catch (err) {
      const data = err.response?.data;
      if (data && typeof data === 'object' && !data.detail) {
        setErrors(data);
      } else {
        setGlobalError(data?.detail || data?.error || 'Registration failed. Please try again.');
      }
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
          <p>Join the platform to track vessel hire rates against regional market benchmarks in real time.</p>
        </div>
        <div className="register-info">
          <div className="info-item">
            <span className="info-icon">✓</span>
            New accounts get <strong>User</strong> access by default
          </div>
          <div className="info-item">
            <span className="info-icon">✓</span>
            View dashboards, regional & aggregated charts
          </div>
          <div className="info-item">
            <span className="info-icon">✓</span>
            Contact an admin to get data-entry permissions
          </div>
        </div>
      </div>

      <div className="login-right">
        <div className="login-card register-card">
          <h2>Create account</h2>
          <p className="login-sub">Fill in your details to get started</p>

          <form onSubmit={handleSubmit} className="login-form">
            {globalError && <div className="login-error">{globalError}</div>}

            <div className="reg-row">
              <div className="form-field">
                <label>First name</label>
                <input
                  type="text"
                  name="first_name"
                  value={form.first_name}
                  onChange={handleChange}
                  placeholder="John"
                  autoFocus
                />
              </div>
              <div className="form-field">
                <label>Last name</label>
                <input
                  type="text"
                  name="last_name"
                  value={form.last_name}
                  onChange={handleChange}
                  placeholder="Doe"
                />
              </div>
            </div>

            <div className="form-field">
              <label>Username <span className="required">*</span></label>
              <input
                type="text"
                name="username"
                value={form.username}
                onChange={handleChange}
                placeholder="e.g. john_doe"
                required
              />
              {errors.username && <span className="field-error">{errors.username}</span>}
            </div>

            <div className="form-field">
              <label>Email address</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="john@company.com"
              />
              {errors.email && <span className="field-error">{errors.email}</span>}
            </div>

            <div className="form-field">
              <label>Password <span className="required">*</span></label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Min. 6 characters"
                required
              />
              {errors.password && <span className="field-error">{errors.password}</span>}
            </div>

            <div className="form-field">
              <label>Confirm password <span className="required">*</span></label>
              <input
                type="password"
                name="password2"
                value={form.password2}
                onChange={handleChange}
                placeholder="Re-enter password"
                required
              />
              {errors.password2 && <span className="field-error">{errors.password2}</span>}
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'Creating account...' : 'Create account →'}
            </button>
          </form>

          <div className="login-divider">
            <span>Already have an account?</span>
          </div>

          <Link to="/login" className="register-link">
            Sign in instead
          </Link>
        </div>
      </div>
    </div>
  );
}
