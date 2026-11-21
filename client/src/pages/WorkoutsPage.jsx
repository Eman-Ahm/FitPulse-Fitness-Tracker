import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getWorkouts, deleteWorkout } from '../api/workouts';
import { exportToCsv } from '../utils/exportCsv';
import './WorkoutsPage.css';

const WORKOUT_TYPES = ['Running','Cycling','Swimming','Weightlifting','Yoga','Walking','HIIT','Other'];

export default function WorkoutsPage() {
  const [workouts, setWorkouts]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [filterType, setFilterType] = useState('');
  const [sort, setSort]             = useState('workout_date');
  const [order, setOrder]           = useState('DESC');
  const [deleting, setDeleting]     = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const { data } = await getWorkouts({ type: filterType || undefined, sort, order });
      setWorkouts(data.workouts);
    } catch (err) {
      setError(err.response?.status === 401
        ? 'Session expired — please log in again.'
        : 'Cannot reach server. Make sure XAMPP MySQL is running and the server is started.');
    } finally { setLoading(false); }
  }, [filterType, sort, order]);

  useEffect(() => { load(); }, [load]);

  async function handleDelete(id) {
    if (!window.confirm('Delete this workout? This cannot be undone.')) return;
    setDeleting(id);
    try {
      await deleteWorkout(id);
      setWorkouts(w => w.filter(x => x.id !== id));
    } catch { setError('Failed to delete workout.'); }
    finally { setDeleting(null); }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Workout Log</h1>
          <p className="page-subtitle">Track every session</p>
        </div>
        <div style={{display:'flex',gap:10}}>
          <button className="btn btn-outline" onClick={() => {
            const rows = workouts.map(w => ({
              date: new Date(w.workout_date).toISOString().slice(0,10),
              type: w.type, duration_min: w.duration_min,
              calories: w.calories || '', distance_km: w.distance_km || '', notes: w.notes || ''
            }));
            exportToCsv(rows, 'fitpulse-workouts.csv');
          }} disabled={workouts.length === 0} title="Export to CSV">
            ⬇ Export CSV
          </button>
          <Link to="/workouts/new" className="btn btn-primary">+ Add Workout</Link>
        </div>
      </div>

      {/* Filters */}
      <div className="workouts-filters card">
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="form-input filter-select">
          <option value="">All types</option>
          {WORKOUT_TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
        <select value={sort} onChange={e => setSort(e.target.value)} className="form-input filter-select">
          <option value="workout_date">Sort: Date</option>
          <option value="duration_min">Sort: Duration</option>
          <option value="calories">Sort: Calories</option>
          <option value="type">Sort: Type</option>
        </select>
        <select value={order} onChange={e => setOrder(e.target.value)} className="form-input filter-select">
          <option value="DESC">Newest first</option>
          <option value="ASC">Oldest first</option>
        </select>
      </div>

      {error && <div className="alert alert-error">{error}<br /><small>Fix: Start XAMPP MySQL → run <code>cd server &amp;&amp; node index.js</code></small></div>}

      {loading ? (
        <div className="loading-spinner">Loading workouts…</div>
      ) : workouts.length === 0 && !error ? (
        <div className="empty-state card">
          <div style={{fontSize:'2.5rem',marginBottom:12}}>🏋️</div>
          <h3>No workouts yet</h3>
          <p>Click "+ Add Workout" to log your first session.</p>
          <Link to="/workouts/new" className="btn btn-primary" style={{marginTop:18}}>Log first workout</Link>
        </div>
      ) : (
        <div className="workouts-list">
          {workouts.map(w => (
            <div key={w.id} className="workout-card card card-hover">
              <div className="workout-header">
                <span className="workout-type-badge">{w.type}</span>
                <span className="workout-date">
                  {new Date(w.workout_date).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}
                </span>
              </div>
              <div className="workout-stats">
                <Stat label="Duration" value={`${w.duration_min} min`} icon="⏱️" />
                {w.calories    && <Stat label="Calories"  value={`${w.calories} kcal`}  icon="🔥" />}
                {w.distance_km && <Stat label="Distance"  value={`${w.distance_km} km`} icon="📍" />}
              </div>
              {w.notes && <p className="workout-notes">"{w.notes}"</p>}
              <div className="workout-actions">
                <Link to={`/workouts/${w.id}/edit`} className="btn btn-outline">✏️ Edit</Link>
                <button className="btn btn-danger" onClick={() => handleDelete(w.id)} disabled={deleting === w.id}>
                  {deleting === w.id ? 'Deleting…' : '🗑 Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, icon }) {
  return (
    <div className="workout-stat">
      <span className="stat-icon">{icon}</span>
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}
