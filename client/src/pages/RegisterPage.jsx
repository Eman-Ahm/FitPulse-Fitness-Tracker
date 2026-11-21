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

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({ name: '', email: '', password: '' });
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    setFieldErrors(fe => ({ ...fe, [name]: '' }));
  }

  function validate() {
    const errs = { name: '', email: '', password: '' };
    if (!form.name.trim())            errs.name = 'Name is required';
    errs.email = validateEmailFormat(form.email);
    if (form.password.length < 8)     errs.password = 'Password must be at least 8 characters';
    else if (!/[A-Z]/.test(form.password)) errs.password = 'Password must contain at least one uppercase letter';
    else if (!/[0-9]/.test(form.password)) errs.password = 'Password must contain at least one number';
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setApiError('');
    const errs = validate();
    if (Object.values(errs).some(Boolean)) { setFieldErrors(errs); return; }
    setLoading(true);
    try {
      await register(form.name.trim(), form.email.trim().toLowerCase(), form.password);
      navigate('/');
    } catch (err) {
      const msgs = err.response?.data?.errors;
      setApiError(
        msgs ? msgs.map(m => m.msg).join(', ') :
        err.response?.data?.error || 'Registration failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">⚡ FitPulse</div>
        <h1 className="auth-title">Create account</h1>
        <p className="auth-subtitle">Start tracking your fitness today</p>

        {apiError && <div className="alert alert-error" role="alert">{apiError}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="name">Full name</label>
            <input
              id="name" name="name" type="text"
              className={`form-input${fieldErrors.name ? ' input-error' : ''}`}
              value={form.name} onChange={handleChange}
              required autoFocus autoComplete="name"
              placeholder="Jane Smith"
              aria-describedby={fieldErrors.name ? 'name-error' : undefined}
              aria-invalid={!!fieldErrors.name}
            />
            {fieldErrors.name && (
              <span id="name-error" className="form-error" role="alert">{fieldErrors.name}</span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email</label>
            <input
              id="email" name="email" type="email"
              className={`form-input${fieldErrors.email ? ' input-error' : ''}`}
              value={form.email} onChange={handleChange}
              required autoComplete="email"
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
              required autoComplete="new-password"
              placeholder="Min. 8 chars, one uppercase, one number"
              aria-describedby="password-hint password-error"
              aria-invalid={!!fieldErrors.password}
            />
            <span id="password-hint" className="form-hint-text">
              At least 8 characters, one uppercase letter, one number.
            </span>
            {fieldErrors.password && (
              <span id="password-error" className="form-error" role="alert">{fieldErrors.password}</span>
            )}
          </div>

          <button className="btn btn-primary auth-submit" type="submit" disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
