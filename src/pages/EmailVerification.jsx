import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { authAPI } from '../api/client';

export default function EmailVerification() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided.');
      return;
    }
    authAPI.verifyEmail(token)
      .then((res) => {
        setStatus('success');
        setMessage(res.data.message || 'Email verified successfully!');
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.response?.data?.error || 'Verification failed. The link may have expired.');
      });
  }, [searchParams]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      background: 'linear-gradient(135deg, #EEF2FF, #E0E7FF)',
    }}>
      <div className="fade-in" style={{
        width: '100%',
        maxWidth: 420,
        background: '#fff',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-md)',
        padding: '2.5rem',
        textAlign: 'center',
      }}>
        {/* Loading */}
        {status === 'loading' && (
          <>
            <div className="spinner" style={{ margin: '1.5rem auto' }} />
            <h2 className="auth-title" style={{ textAlign: 'center' }}>Verifying your email...</h2>
            <p className="text-secondary mt-1">Please wait while we confirm your email address.</p>
          </>
        )}

        {/* Success */}
        {status === 'success' && (
          <>
            <div style={{ fontSize: '3rem', color: 'var(--accent)', marginBottom: '0.75rem' }}>&#10003;</div>
            <h2 className="auth-title" style={{ textAlign: 'center' }}>Email verified!</h2>
            <p className="text-secondary mt-1 mb-3">{message}</p>
            <Link to="/login" className="btn btn-primary" style={{ display: 'inline-flex' }}>
              Go to Login
            </Link>
          </>
        )}

        {/* Error */}
        {status === 'error' && (
          <>
            <div style={{ fontSize: '3rem', color: 'var(--danger)', marginBottom: '0.75rem' }}>&#10007;</div>
            <h2 className="auth-title" style={{ textAlign: 'center' }}>Verification failed</h2>
            <p className="text-danger mt-1 mb-3">{message}</p>
            <Link to="/register" className="btn btn-outline" style={{ display: 'inline-flex' }}>
              Back to Register
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
