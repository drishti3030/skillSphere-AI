import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { authAPI, studentAPI } from '../api/client';

export default function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true);
    setError('');

    try {
      const res = await authAPI.login({ email: email.trim(), password });
      const { token, user } = res.data;

      // Persist to store
      login(token, user);      // Check if user has interests — redirect accordingly
        try {
          const intRes = await studentAPI.getMyInterests();
          navigate(intRes.data?.length > 0 ? '/dashboard' : '/register/interests');
        } catch {
          navigate('/dashboard');
        }
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card slide-up">
        <div className="auth-logo">&#9670;</div>
        <h2 className="auth-title">Welcome back</h2>
        <p className="auth-subtitle">Sign in to continue learning</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              className="input"
              type="email"
              placeholder="you@university.edu"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              className="input"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
            {loading ? <span className="spinner" /> : 'Sign In'}
          </button>
        </form>

        <p className="auth-footer-text">
          Don&apos;t have an account? <Link to="/register">Sign up</Link>
        </p>
      </div>

      <style>{`
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
          text-align: center;
        }

        .auth-subtitle {
          color: var(--text-secondary);
          font-size: 0.9rem;
          margin-bottom: 1.5rem;
          text-align: center;
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
      `}</style>
    </div>
  );
}
