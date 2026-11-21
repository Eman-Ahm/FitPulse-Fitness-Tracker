import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AuthPages.css';

// Must match server validation exactly
const ALLOWED_DOMAINS = new Set([
  'gmail.com','yahoo.com','yahoo.co.uk','yahoo.fr','outlook.com','outlook.co.uk',
  'hotmail.com','hotmail.co.uk','icloud.com','me.com','mac.com',
  'protonmail.com','proton.me','live.com','msn.com','aol.com',
]);
const KNOWN_TLDS = new Set(['com','net','org','edu','gov','io','co','uk','de','fr','jp','au','ca','in','pk']);

function validateEmailFormat(raw) {
  const val = raw.trim().toLowerCase();
  if (!val) return 'Please enter your email address';
  if (/\s/.test(val)) return 'Please enter a valid email address (e.g. name@gmail.com)';
  const parts = val.split('@');
  if (parts.length !== 2) return 'Please enter a valid email address (e.g. name@gmail.com)';
  const [local, domain] = parts;
  if (!local || !domain) return 'Please enter a valid email address (e.g. name@gmail.com)';
  if (!domain.includes('.') || domain.endsWith('.')) return 'Please enter a valid email address (e.g. name@gmail.com)';
  const tld = domain.split('.').pop();
  if (!ALLOWED_DOMAINS.has(domain) && !KNOWN_TLDS.has(tld)) {
    return 'Please use a valid email provider (e.g. @gmail.com, @yahoo.com, @outlook.com)';
  }
  return '';
}

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({ email: '', password: '' });
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    // Clear field error on change
    setFieldErrors(fe => ({ ...fe, [name]: '' }));
  }

  function validate() {
    const errs = { email: '', password: '' };
    errs.email    = validateEmailFormat(form.email);
    if (!form.password) errs.password = 'Password is required';
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setApiError('');
    const errs = validate();
    if (errs.email || errs.password) { setFieldErrors(errs); return; }
    setLoading(true);
    try {
      await login(form.email.trim().toLowerCase(), form.password);
      navigate('/');
    } catch (err) {
      setApiError(
        err.response?.data?.error ||
        err.response?.data?.errors?.[0]?.msg ||
        'Login failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">⚡ FitPulse</div>
        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to your account</p>

        {apiError && <div className="alert alert-error" role="alert">{apiError}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email</label>
            <input
              id="email" name="email" type="email"
              className={`form-input${fieldErrors.email ? ' input-error' : ''}`}
              value={form.email} onChange={handleChange}
              required autoFocus autoComplete="email"
              placeholder="you@example.com"
              aria-describedby={fieldErrors.email ? 'email-error' : undefined}
              aria-invalid={!!fieldErrors.email}
            />
            {fieldErrors.email && (
              <span id="email-error" className="form-error" role="alert">{fieldErrors.email}</span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password" name="password" type="password"
              className={`form-input${fieldErrors.password ? ' input-error' : ''}`}
              value={form.password} onChange={handleChange}
              required autoComplete="current-password"
              placeholder="••••••••"
              aria-describedby={fieldErrors.password ? 'password-error' : undefined}
              aria-invalid={!!fieldErrors.password}
            />
            {fieldErrors.password && (
              <span id="password-error" className="form-error" role="alert">{fieldErrors.password}</span>
            )}
          </div>

          <button className="btn btn-primary auth-submit" type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="auth-switch">
          Don't have an account? <Link to="/register">Register</Link>
        </p>
        <p className="auth-switch" style={{marginTop:8}}>
          <Link to="/forgot-password" style={{color:'rgba(255,255,255,.4)',fontSize:'.82rem'}}>Forgot password?</Link>
        </p>
      </div>
    </div>
  );
}
