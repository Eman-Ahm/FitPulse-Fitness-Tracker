import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import './AuthPages.css';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate        = useNavigate();
  const token           = searchParams.get('token') || '';

  const [form, setForm]     = useState({ new_password:'', confirm:'' });
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const [done, setDone]     = useState(false);

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.new_password !== form.confirm) { setError('Passwords do not match'); return; }
    if (form.new_password.length < 8)       { setError('Password must be at least 8 characters'); return; }
    if (!/[A-Z]/.test(form.new_password))   { setError('Password must contain at least one uppercase letter'); return; }
    if (!/[0-9]/.test(form.new_password))   { setError('Password must contain at least one number'); return; }
    if (!token)                             { setError('Invalid reset link — no token found'); return; }

    setLoading(true); setError('');
    try {
      await api.post('/auth/reset-password', { token, new_password: form.new_password });
      setDone(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid or expired reset link');
    } finally { setLoading(false); }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">⚡ FitPulse</div>
        <h1 className="auth-title">Reset password</h1>

        {done ? (
          <div className="alert alert-success">✅ Password reset! Redirecting to login…</div>
        ) : !token ? (
          <div className="alert alert-error">
            Invalid reset link. <Link to="/forgot-password">Request a new one</Link>.
          </div>
        ) : (
          <>
            {error && <div className="alert alert-error" role="alert">{error}</div>}
            <form onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label className="form-label" htmlFor="new_password">New password</label>
                <input id="new_password" name="new_password" type="password"
                  className="form-input" value={form.new_password} onChange={handleChange}
                  placeholder="Min. 8 chars, one uppercase, one number"
                  autoComplete="new-password" autoFocus />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="confirm">Confirm new password</label>
                <input id="confirm" name="confirm" type="password"
                  className="form-input" value={form.confirm} onChange={handleChange}
                  placeholder="Same password again" autoComplete="new-password" />
              </div>
              <button className="btn btn-primary auth-submit" type="submit" disabled={loading}>
                {loading ? 'Resetting…' : 'Set new password'}
              </button>
            </form>
          </>
        )}
        <p className="auth-switch"><Link to="/login">Back to Sign in</Link></p>
      </div>
    </div>
  );
}
