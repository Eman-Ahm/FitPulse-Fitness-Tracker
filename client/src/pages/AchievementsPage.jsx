import { useState, useEffect } from 'react';
import { getAchievements, checkAchievements } from '../api/achievements';
import './AchievementsPage.css';

export default function AchievementsPage() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [checking, setChecking] = useState(false);
  const [newlyEarned, setNewlyEarned] = useState([]);

  async function load() {
    setLoading(true); setError('');
    try {
      const { data: d } = await getAchievements();
      setData(d);
    } catch { setError('Failed to load achievements'); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function handleCheck() {
    setChecking(true);
    try {
      const { data: d } = await checkAchievements();
      setNewlyEarned(d.newly_earned);
      if (d.newly_earned.length > 0) load();
      setTimeout(() => setNewlyEarned([]), 5000);
    } catch { setError('Check failed'); }
    finally { setChecking(false); }
  }

  if (loading) return <div className="loading-spinner">Loading achievements…</div>;
  if (error)   return (
    <div style={{padding:32}}>
      <div className="alert alert-error">{error}</div>
      <p style={{color:'var(--color-muted)',fontSize:'.88rem',marginTop:8}}>
        Make sure the server is running and MySQL is connected, then refresh.
      </p>
    </div>
  );
  if (!data) return <div className="loading-spinner">Loading…</div>;

  const earned = data.achievements.filter(a => a.earned);
  const locked = data.achievements.filter(a => !a.earned);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Achievements</h1>
          <p className="page-subtitle">{data.earned_count} of {data.total} unlocked</p>
        </div>
        <button className="btn btn-primary" onClick={handleCheck} disabled={checking}>
          {checking ? 'Checking…' : '🔄 Check for new'}
        </button>
      </div>

      {/* Newly earned toast */}
      {newlyEarned.length > 0 && (
        <div className="alert alert-success ach-toast">
          🎉 New achievement{newlyEarned.length > 1 ? 's' : ''} unlocked:{' '}
          {newlyEarned.map(a => `${a.icon} ${a.title}`).join(', ')}
        </div>
      )}

      {/* Progress bar */}
      <div className="card ach-progress-card">
        <div className="ach-progress-row">
          <span className="ach-progress-label">Overall Progress</span>
          <span className="ach-progress-pct">{Math.round((data.earned_count / data.total) * 100)}%</span>
        </div>
        <div className="progress-bar-track" style={{height:12,marginTop:8}}>
          <div className="progress-bar-fill" style={{width:`${(data.earned_count/data.total)*100}%`}} />
        </div>
        <p className="ach-progress-sub">{data.earned_count} earned · {data.total - data.earned_count} remaining</p>
      </div>

      {/* Earned */}
      {earned.length > 0 && (
        <>
          <h2 className="ach-section-title">🏆 Earned</h2>
          <div className="ach-grid">
            {earned.map(a => <AchCard key={a.key} ach={a} earned />)}
          </div>
        </>
      )}

      {/* Locked */}
      {locked.length > 0 && (
        <>
          <h2 className="ach-section-title" style={{marginTop:28}}>🔒 Locked</h2>
          <div className="ach-grid">
            {locked.map(a => <AchCard key={a.key} ach={a} earned={false} />)}
          </div>
        </>
      )}

      {data.achievements.length === 0 && (
        <div className="empty-state card">
          <h3>No achievements yet</h3>
          <p>Log your first workout to start earning badges.</p>
        </div>
      )}
    </div>
  );
}

function AchCard({ ach, earned }) {
  return (
    <div className={`ach-card card${earned ? ' earned' : ' locked'}`}>
      <div className="ach-icon">{ach.icon}</div>
      <div className="ach-body">
        <h3 className="ach-title">{ach.title}</h3>
        <p className="ach-desc">{ach.description}</p>
        {earned && ach.earned_at && (
          <p className="ach-date">
            {new Date(ach.earned_at).toLocaleDateString('en-GB', {day:'numeric',month:'short',year:'numeric'})}
          </p>
        )}
      </div>
      {earned && <span className="ach-badge-done">✓</span>}
    </div>
  );
}
