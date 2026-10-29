import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getWorkouts, deleteWorkout } from '../api/workouts';
import './WorkoutsPage.css';

const WORKOUT_TYPES = ['Running','Cycling','Swimming','Weightlifting','Yoga','Walking','HIIT','Other'];

export default function WorkoutsPage() {
  const [workouts, setWorkouts]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [filterType, setFilterType] = useState('');
  const [sort, setSort]           = useState('workout_date');
  const [order, setOrder]         = useState('DESC');
  const [deleting, setDeleting]   = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const { data } = await getWorkouts({ type: filterType || undefined, sort, order });
      setWorkouts(data.workouts);
    } catch { setError('Failed to load workouts'); }
    finally { setLoading(false); }
  }, [filterType, sort, order]);

  useEffect(() => { load(); }, [load]);

  async function handleDelete(id) {
    if (!window.confirm('Delete this workout? This cannot be undone.')) return;
    setDeleting(id);
    try {
      await deleteWorkout(id);
      setWorkouts(w => w.filter(x => x.id !== id));
    } catch { setError('Failed to delete workout'); }
    finally { setDeleting(null); }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Workouts</h1>
        <Link to="/workouts/new" className="btn btn-primary">+ Add Workout</Link>
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

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading-spinner">Loading workouts…</div>
      ) : workouts.length === 0 ? (
        <div className="empty-state card">
          <h3>No workouts yet</h3>
          <p>Click "+ Add Workout" to log your first session.</p>
        </div>
      ) : (
        <div className="workouts-list">
          {workouts.map(w => (
            <div key={w.id} className="workout-card card">
              <div className="workout-header">
                <span className="workout-type-badge">{w.type}</span>
                <span className="workout-date">{new Date(w.workout_date).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}</span>
              </div>
              <div className="workout-stats">
                <Stat label="Duration" value={`${w.duration_min} min`} />
                {w.calories   && <Stat label="Calories" value={`${w.calories} kcal`} />}
                {w.distance_km && <Stat label="Distance" value={`${w.distance_km} km`} />}
              </div>
              {w.notes && <p className="workout-notes">{w.notes}</p>}
              <div className="workout-actions">
                <Link to={`/workouts/${w.id}/edit`} className="btn btn-outline">Edit</Link>
                <button
                  className="btn btn-danger"
                  onClick={() => handleDelete(w.id)}
                  disabled={deleting === w.id}
                >
                  {deleting === w.id ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="workout-stat">
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}
