import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getProfile, updateName, changePassword, deleteAccount } from '../api/profile';
import './ProfilePage.css';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate          = useNavigate();

  const [profile, setProfile]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  // Name form
  const [nameVal, setNameVal]   = useState('');
  const [nameSaving, setNameSaving] = useState(false);
  const [nameMsg, setNameMsg]   = useState('');

  // Password form
  const [pwForm, setPwForm]     = useState({ current_password:'', new_password:'', confirm:'' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg]       = useState('');
  const [pwErr, setPwErr]       = useState('');

  // Delete
  const [delPw, setDelPw]       = useState('');
  const [delLoading, setDelLoading] = useState(false);
  const [showDel, setShowDel]   = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await getProfile();
        setProfile(data.user);
        setNameVal(data.user.name);
      } catch { setError('Failed to load profile'); }
      finally { setLoading(false); }
    })();
  }, []);

  async function handleNameSave(e) {
    e.preventDefault();
    if (!nameVal.trim()) return;
    setNameSaving(true); setNameMsg('');
    try {
      await updateName(nameVal.trim());
      setNameMsg('✅ Name updated successfully');
      setTimeout(() => setNameMsg(''), 3000);
    } catch (err) {
      setNameMsg('❌ ' + (err.response?.data?.error || 'Failed to update'));
    } finally { setNameSaving(false); }
  }

  async function handlePasswordSave(e) {
    e.preventDefault();
    setPwErr(''); setPwMsg('');
    if (pwForm.new_password !== pwForm.confirm) {
      setPwErr('New passwords do not match'); return;
    }
    if (pwForm.new_password.length < 8) {
      setPwErr('Password must be at least 8 characters'); return;
    }
    setPwSaving(true);
    try {
      await changePassword({ current_password: pwForm.current_password, new_password: pwForm.new_password });
      setPwMsg('✅ Password changed successfully');
      setPwForm({ current_password:'', new_password:'', confirm:'' });
      setTimeout(() => setPwMsg(''), 3000);
    } catch (err) {
      setPwErr(err.response?.data?.error || 'Failed to change password');
    } finally { setPwSaving(false); }
  }

  async function handleDeleteAccount(e) {
    e.preventDefault();
    if (!window.confirm('This will permanently delete your account and all your data. This cannot be undone. Are you sure?')) return;
    setDelLoading(true);
    try {
      await deleteAccount(delPw);
      logout();
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete account');
      setDelLoading(false);
    }
  }

  if (loading) return <div className="loading-spinner">Loading profile…</div>;
  if (error && !profile) return <div className="alert alert-error">{error}</div>;

  return (
    <div className="profile-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Profile Settings</h1>
          <p className="page-subtitle">Manage your account</p>
        </div>
      </div>

      {/* Account info */}
      <div className="card profile-section">
        <div className="profile-avatar-row">
          <div className="profile-avatar">{profile?.name?.[0]?.toUpperCase()}</div>
          <div>
            <p className="profile-name">{profile?.name}</p>
            <p className="profile-email">{profile?.email}</p>
            <p className="profile-since">Member since {new Date(profile?.created_at).toLocaleDateString('en-GB', { month:'long', year:'numeric' })}</p>
          </div>
        </div>
      </div>

      {/* Edit name */}
      <div className="card profile-section">
        <h2 className="profile-section-title">Edit Name</h2>
        <form onSubmit={handleNameSave} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="name">Full name</label>
            <input id="name" type="text" className="form-input" value={nameVal}
              onChange={e => setNameVal(e.target.value)} maxLength={100} required />
          </div>
          {nameMsg && <p className={`profile-msg${nameMsg.startsWith('❌') ? ' err' : ''}`}>{nameMsg}</p>}
          <button className="btn btn-primary" type="submit" disabled={nameSaving}>
            {nameSaving ? 'Saving…' : 'Save name'}
          </button>
        </form>
      </div>

      {/* Change password */}
      <div className="card profile-section">
        <h2 className="profile-section-title">Change Password</h2>
        <form onSubmit={handlePasswordSave} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="cur-pw">Current password</label>
            <input id="cur-pw" type="password" className="form-input"
              value={pwForm.current_password} autoComplete="current-password"
              onChange={e => setPwForm(f => ({ ...f, current_password: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="new-pw">New password</label>
            <input id="new-pw" type="password" className="form-input"
              value={pwForm.new_password} autoComplete="new-password"
              placeholder="Min. 8 chars, one uppercase, one number"
              onChange={e => setPwForm(f => ({ ...f, new_password: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="confirm-pw">Confirm new password</label>
            <input id="confirm-pw" type="password" className="form-input"
              value={pwForm.confirm} autoComplete="new-password"
              onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} />
          </div>
          {pwErr && <div className="alert alert-error">{pwErr}</div>}
          {pwMsg && <p className="profile-msg">{pwMsg}</p>}
          <button className="btn btn-primary" type="submit" disabled={pwSaving}>
            {pwSaving ? 'Changing…' : 'Change password'}
          </button>
        </form>
      </div>

      {/* Delete account */}
      <div className="card profile-section profile-danger-zone">
        <h2 className="profile-section-title danger">⚠️ Danger Zone</h2>
        <p className="profile-danger-text">
          Deleting your account is permanent. All workouts, goals, meals, and progress will be lost forever.
        </p>
        {!showDel ? (
          <button className="btn btn-danger" onClick={() => setShowDel(true)}>
            Delete my account
          </button>
        ) : (
          <form onSubmit={handleDeleteAccount} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="del-pw">Enter your password to confirm</label>
              <input id="del-pw" type="password" className="form-input input-error"
                value={delPw} onChange={e => setDelPw(e.target.value)}
                placeholder="Your current password" />
            </div>
            <div className="profile-danger-actions">
              <button type="button" className="btn btn-outline" onClick={() => { setShowDel(false); setDelPw(''); }}>
                Cancel
              </button>
              <button type="submit" className="btn btn-danger" disabled={delLoading || !delPw}>
                {delLoading ? 'Deleting…' : 'Yes, permanently delete'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
