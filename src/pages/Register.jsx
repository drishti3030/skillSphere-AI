import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../api/client';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Register() {
  const [form, setForm] = useState({ fullName: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [apiError, setApiError] = useState('');

  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = 'Full name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!EMAIL_RE.test(form.email)) e.email = 'Invalid email format';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 8) e.password = 'Password must be at least 8 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (field) => (e) => {
    setForm((p) => ({ ...p, [field]: e.target.value }));
    if (errors[field]) setErrors((p) => ({ ...p, [field]: '' }));
    setApiError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setApiError('');

    try {
      const res = await authAPI.register({
        full_name: form.fullName.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      setSuccess(res.data);
    } catch (err) {
      setApiError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Success state ───────────────────────────────────────────────── */
  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-card fade-in">
          <div className="auth-success-icon">&#10003;</div>
          <h2 className="auth-title" style={{ textAlign: 'center' }}>Account created!</h2>

          <div className="card" style={{ background: 'var(--bg)', border: '1px solid var(--border)', padding: '1rem', marginBottom: '1rem' }}>
            <p className="text-secondary" style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>
              Your verification link (simulated email):
            </p>
            <a
              href={success.verificationLink}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: '0.85rem', wordBreak: 'break-all', color: 'var(--brand)' }}
            >
              {success.verificationLink}
            </a>
          </div>

          <p className="text-secondary" style={{ fontSize: '0.9rem', textAlign: 'center', marginBottom: '0.5rem' }}>
            Your Student ID will be: STU-{new Date().getFullYear()}-XXXX
          </p>

          <p className="text-muted" style={{ fontSize: '0.85rem', textAlign: 'center', marginBottom: '0.75rem' }}>
            In production, check your inbox for the verification email.
          </p>

          <Link to="/login" className="btn btn-primary" style={{ display: 'block', textAlign: 'center' }}>
            Go to Login
          </Link>
        </div>

        <style>{authStyles}</style>
      </div>
    );
  }

  /* ── Registration form ────────────────────────────────────────────── */
  return (
    <div className="auth-page">
      <div className="auth-card slide-up">
        <div className="auth-logo">&#9670;</div>
        <h2 className="auth-title">Create your account</h2>
        <p className="auth-subtitle">Join the student learning community</p>

        {apiError && <div className="auth-error">{apiError}</div>}

        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="fullName">Full Name</label>
            <input
              id="fullName"
              className={`input${errors.fullName ? ' input-error' : ''}`}
              type="text"
              placeholder="John Doe"
              value={form.fullName}
              onChange={handleChange('fullName')}
            />
            {errors.fullName && <span className="field-error">{errors.fullName}</span>}
          </div>

          <div className="auth-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              className={`input${errors.email ? ' input-error' : ''}`}
              type="email"
              placeholder="you@university.edu"
              value={form.email}
              onChange={handleChange('email')}
            />
            {errors.email && <span className="field-error">{errors.email}</span>}
          </div>

          <div className="auth-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              className={`input${errors.password ? ' input-error' : ''}`}
              type="password"
              placeholder="At least 8 characters"
              value={form.password}
              onChange={handleChange('password')}
            />
            {errors.password && <span className="field-error">{errors.password}</span>}
          </div>

          <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
            {loading ? <span className="spinner" /> : 'Create Account'}
          </button>
        </form>

        <p className="auth-footer-text">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>

      <style>{authStyles}</style>
    </div>
  );
}

const authStyles = `
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: linear-gradient(135deg, #EEF2FF, #E0E7FF);
}

.auth-card {
  width: 100%;
  max-width: 420px;
  background: #fff;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  padding: 2.5rem;
}

.auth-logo {
  font-size: 2rem;
  color: var(--brand);
  text-align: center;
  margin-bottom: 0.5rem;
}

.auth-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.auth-subtitle {
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin-bottom: 1.5rem;
}

.auth-success-icon {
  font-size: 2.5rem;
  color: var(--accent);
  text-align: center;
  margin-bottom: 0.75rem;
}

.auth-error {
  background: #FEE2E2;
  border: 1px solid #FECACA;
  border-radius: var(--radius);
  padding: 0.65rem 1rem;
  margin-bottom: 1rem;
  color: var(--danger);
  font-size: 0.85rem;
}

.auth-field {
  margin-bottom: 1rem;
}

.auth-field label {
  display: block;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 0.35rem;
}

.input-error {
  border-color: var(--danger) !important;
}

.field-error {
  display: block;
  color: var(--danger);
  font-size: 0.8rem;
  margin-top: 0.25rem;
}

.auth-submit {
  width: 100%;
  justify-content: center;
  padding: 0.7rem;
  margin-top: 0.5rem;
}

.auth-footer-text {
  text-align: center;
  margin-top: 1.25rem;
  color: var(--text-muted);
  font-size: 0.875rem;
}

.auth-footer-text a {
  color: var(--brand);
  font-weight: 600;
}
`;
