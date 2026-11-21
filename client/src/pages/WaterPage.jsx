import { useState, useEffect, useCallback } from 'react';
import { getWater, logWater, deleteWater } from '../api/water';
import './WaterPage.css';

const DAILY_GOAL_ML = 2500;
const QUICK_AMOUNTS = [250, 330, 500, 750];

export default function WaterPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate]         = useState(today);
  const [entries, setEntries]   = useState([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [amount, setAmount]     = useState('');
  const [saving, setSaving]     = useState(false);
  const [deleting, setDeleting] = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const { data } = await getWater({ date });
      setEntries(data.entries);
      setTotal(data.dailyTotal || 0);
    } catch { setError('Failed to load water data'); }
    finally { setLoading(false); }
  }, [date]);

  useEffect(() => { load(); }, [load]);

  async function handleLog(ml) {
    setSaving(true);
    try {
      await logWater({ logged_date: date, amount_ml: ml });
      load();
    } catch (err) { setError(err.response?.data?.error || 'Failed to log'); }
    finally { setSaving(false); setAmount(''); }
  }

  async function handleDelete(id) {
    setDeleting(id);
    try { await deleteWater(id); load(); }
    catch { setError('Delete failed'); }
    finally { setDeleting(null); }
  }

  const pct  = Math.min(100, Math.round((total / DAILY_GOAL_ML) * 100));
  const cups  = Math.round(total / 250);
  const glasses = Array.from({ length: 10 });

  return (
    <div className="water-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">💧 Water Tracker</h1>
          <p className="page-subtitle">Daily goal: {(DAILY_GOAL_ML / 1000).toFixed(1)} L</p>
        </div>
        <input type="date" className="form-input" value={date}
          onChange={e => setDate(e.target.value)} style={{ width: 160 }}
          max={today} />
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Progress */}
      <div className="card water-progress-card">
        <div className="water-progress-header">
          <div>
            <p className="water-total">{(total / 1000).toFixed(2)} L</p>
            <p className="water-goal-text">of {(DAILY_GOAL_ML/1000).toFixed(1)} L goal · {cups} glasses</p>
          </div>
          <span className="water-pct">{pct}%</span>
        </div>
        <div className="progress-bar-track" style={{ height: 12, marginTop: 12 }}>
          <div className="progress-bar-fill"
            style={{ width:`${pct}%`, background: pct >= 100 ? '#22c55e' : '#3b82f6' }} />
        </div>
        {/* Glasses visual */}
        <div className="water-glasses">
          {glasses.map((_, i) => (
            <div key={i} className={`water-glass${i < cups ? ' filled' : ''}`}>💧</div>
          ))}
        </div>
      </div>

      {/* Quick add */}
      <div className="card water-quick-card">
        <h2 className="water-section-title">Quick Add</h2>
        <div className="water-quick-btns">
          {QUICK_AMOUNTS.map(ml => (
            <button key={ml} className="water-quick-btn" onClick={() => handleLog(ml)} disabled={saving}>
              +{ml} ml
            </button>
          ))}
        </div>
        <div className="water-custom-row">
          <input type="number" min="1" max="5000" className="form-input" value={amount}
            onChange={e => setAmount(e.target.value)} placeholder="Custom amount (ml)" />
          <button className="btn btn-primary"
            onClick={() => { if (amount && amount > 0) handleLog(Number(amount)); }}
            disabled={saving || !amount}>
            Add
          </button>
        </div>
      </div>

      {/* Log */}
      <div className="card">
        <h2 className="water-section-title">Today's Log</h2>
        {loading ? <div className="loading-spinner">Loading…</div> :
         entries.length === 0 ? <p className="water-empty">No entries yet for {date}.</p> : (
          <div className="water-log">
            {entries.map(e => (
              <div key={e.id} className="water-entry">
                <span className="water-entry-icon">💧</span>
                <span className="water-entry-amount">{e.amount_ml} ml</span>
                <span className="water-entry-time">
                  {new Date(e.created_at).toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' })}
                </span>
                <button className="btn btn-outline water-del" onClick={() => handleDelete(e.id)} disabled={deleting === e.id}>
                  {deleting === e.id ? '…' : '✕'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
