import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import './AuthPages.css';

export default function ForgotPasswordPage() {
  const [email, setEmail]   = useState('');
  const [sent, setSent]     = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim()) { setError('Email is required'); return; }
    setLoading(true); setError('');
    try {
      await api.post('/auth/forgot-password', { email: email.trim().toLowerCase() });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally { setLoading(false); }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">⚡ FitPulse</div>
        <h1 className="auth-title">Forgot password</h1>

        {sent ? (
          <>
            <div className="alert alert-success">
              ✅ If that email is registered, a reset link has been sent (or printed to the server console in dev mode).
            </div>
            <p className="auth-switch"><Link to="/login">Back to Sign in</Link></p>
          </>
        ) : (
          <>
            <p className="auth-subtitle">Enter your email and we'll send you a reset link.</p>
            {error && <div className="alert alert-error" role="alert">{error}</div>}
            <form onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label className="form-label" htmlFor="email">Email address</label>
                <input id="email" type="email" className="form-input"
                  value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@gmail.com" autoFocus required />
              </div>
              <button className="btn btn-primary auth-submit" type="submit" disabled={loading}>
                {loading ? 'Sending…' : 'Send reset link'}
              </button>
            </form>
            <p className="auth-switch"><Link to="/login">Back to Sign in</Link></p>
          </>
        )}
      </div>
    </div>
  );
}
