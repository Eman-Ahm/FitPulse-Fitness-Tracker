import { useState, useEffect, useCallback } from 'react';
import { getExercises, createExercise, deleteExercise, logExercise } from '../api/exercises';
import { checkAchievements } from '../api/achievements';
import './ExercisesPage.css';

const CATEGORIES = ['All','Upper Body','Lower Body','Core','Cardio','HIIT','Flexibility','Recovery','General'];

export default function ExercisesPage() {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [category, setCategory]   = useState('All');
  const [search, setSearch]       = useState('');
  const [showAdd, setShowAdd]     = useState(false);
  const [logModal, setLogModal]   = useState(null); // exercise object
  const [logDuration, setLogDuration] = useState('');
  const [logLoading, setLogLoading]   = useState(false);
  const [successMsg, setSuccessMsg]   = useState('');
  const [newEx, setNewEx] = useState({ name:'', category:'General', muscle_group:'', equipment:'', calories_per_min:'' });

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const { data } = await getExercises(category !== 'All' ? { category } : {});
      setExercises(data.exercises);
    } catch { setError('Failed to load exercises'); }
    finally { setLoading(false); }
  }, [category]);

  useEffect(() => { load(); }, [load]);

  const filtered = exercises.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    (e.muscle_group||'').toLowerCase().includes(search.toLowerCase())
  );

  async function handleAdd(e) {
    e.preventDefault();
    if (!newEx.name.trim()) return;
    try {
      await createExercise(newEx);
      setShowAdd(false);
      setNewEx({ name:'', category:'General', muscle_group:'', equipment:'', calories_per_min:'' });
      load();
    } catch { setError('Failed to add exercise'); }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this exercise?')) return;
    try { await deleteExercise(id); setExercises(ex => ex.filter(e => e.id !== id)); }
    catch { setError('Failed to delete'); }
  }

  async function handleLog(e) {
    e.preventDefault();
    if (!logDuration || logDuration < 1) return;
    setLogLoading(true);
    try {
      const { data } = await logExercise(logModal.id, { duration_min: Number(logDuration) });
      await checkAchievements();
      setSuccessMsg(`✅ Logged! Est. ${data.calories_burned ?? '—'} kcal burned`);
      setTimeout(() => setSuccessMsg(''), 3000);
      setLogModal(null); setLogDuration('');
    } catch { setError('Failed to log exercise'); }
    finally { setLogLoading(false); }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Exercise Library</h1>
          <p className="page-subtitle">Browse exercises and log your activity</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(s => !s)}>+ Add Exercise</button>
      </div>

      {successMsg && <div className="alert alert-success">{successMsg}</div>}
      {error      && <div className="alert alert-error">{error}</div>}

      {/* Add form */}
      {showAdd && (
        <div className="card ex-add-form">
          <h3 className="ex-add-title">New Exercise</h3>
          <form onSubmit={handleAdd}>
            <div className="ex-add-grid">
              <div className="form-group">
                <label className="form-label">Name *</label>
                <input className="form-input" value={newEx.name} onChange={e => setNewEx(n=>({...n,name:e.target.value}))} placeholder="e.g. Cable Rows" />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-input" value={newEx.category} onChange={e => setNewEx(n=>({...n,category:e.target.value}))}>
                  {CATEGORIES.filter(c=>c!=='All').map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Muscle Group</label>
                <input className="form-input" value={newEx.muscle_group} onChange={e => setNewEx(n=>({...n,muscle_group:e.target.value}))} placeholder="e.g. Back, Biceps" />
              </div>
              <div className="form-group">
                <label className="form-label">Equipment</label>
                <input className="form-input" value={newEx.equipment} onChange={e => setNewEx(n=>({...n,equipment:e.target.value}))} placeholder="e.g. Cables" />
              </div>
              <div className="form-group">
                <label className="form-label">Calories/min (est.)</label>
                <input className="form-input" type="number" min="0" step="0.1" value={newEx.calories_per_min} onChange={e => setNewEx(n=>({...n,calories_per_min:e.target.value}))} placeholder="e.g. 6" />
              </div>
            </div>
            <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:8}}>
              <button type="button" className="btn btn-outline" onClick={()=>setShowAdd(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Add Exercise</button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="ex-filters">
        <input className="form-input ex-search" placeholder="Search exercises…" value={search} onChange={e=>setSearch(e.target.value)} />
        <div className="ex-cat-tabs">
          {CATEGORIES.map(c => (
            <button key={c} className={`cat-tab${category===c?' active':''}`} onClick={()=>setCategory(c)}>{c}</button>
          ))}
        </div>
      </div>

      {loading ? <div className="loading-spinner">Loading exercises…</div> :
       filtered.length === 0 ? <div className="empty-state card"><h3>No exercises found</h3></div> : (
        <div className="ex-grid">
          {filtered.map(ex => (
            <div key={ex.id} className="ex-card card">
              <div className="ex-card-header">
                <div>
                  <span className="ex-cat-badge">{ex.category}</span>
                  <h3 className="ex-name">{ex.name}</h3>
                </div>
                {ex.calories_per_min && (
                  <span className="ex-kcal">{ex.calories_per_min} kcal/min</span>
                )}
              </div>
              {ex.muscle_group && <p className="ex-muscle">🎯 {ex.muscle_group}</p>}
              {ex.equipment    && <p className="ex-equip">🔧 {ex.equipment}</p>}
              <div className="ex-actions">
                <button className="btn btn-primary ex-log-btn" onClick={() => { setLogModal(ex); setLogDuration(''); }}>
                  Log Exercise
                </button>
                <button className="btn btn-outline ex-del-btn" onClick={() => handleDelete(ex.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Log modal */}
      {logModal && (
        <div className="modal-backdrop" onClick={() => setLogModal(null)}>
          <div className="modal-card card" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">Log Exercise</h2>
            <p className="modal-subtitle">Exercise Type: <strong>{logModal.name}</strong></p>
            <form onSubmit={handleLog}>
              <div className="form-group" style={{marginTop:16}}>
                <label className="form-label">Duration (minutes) *</label>
                <input className="form-input" type="number" min="1" value={logDuration}
                  onChange={e=>setLogDuration(e.target.value)} placeholder="30" autoFocus />
              </div>
              {logModal.calories_per_min && logDuration > 0 && (
                <div className="log-preview">
                  Est. Calories Burned: <strong>{Math.round(logModal.calories_per_min * logDuration)} kcal</strong>
                </div>
              )}
              <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:20}}>
                <button type="button" className="btn btn-outline" onClick={()=>setLogModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={logLoading}>
                  {logLoading ? 'Saving…' : 'Save Exercise'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
