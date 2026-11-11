import { useState, useEffect } from 'react';
import { getGoals, createGoal, updateGoal, deleteGoal } from '../api/goals';
import './GoalsPage.css';

const GOAL_TYPES = [
  { value: 'workouts_count', label: 'Total Workouts' },
  { value: 'duration_min',   label: 'Total Duration (min)' },
  { value: 'calories',       label: 'Total Calories' },
  { value: 'distance_km',    label: 'Total Distance (km)' },
  { value: 'weight_kg',      label: 'Weight (kg)' },
  { value: 'custom',         label: 'Custom' },
];

const EMPTY_FORM = {
  title: '', description: '', goal_type: 'custom',
  target_value: '', current_value: '', unit: '', deadline: '',
};

export default function GoalsPage() {
  const [goals, setGoals]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editGoal, setEditGoal] = useState(null); // goal object when editing
  const [form, setForm]         = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving]     = useState(false);
  const [deleting, setDeleting] = useState(null);

  async function load() {
    setLoading(true); setError('');
    try {
      const { data } = await getGoals();
      setGoals(data.goals);
    } catch (err) {
      setError(err.response?.status === 401
        ? 'Session expired — please log in again.'
        : 'Cannot reach server. Start XAMPP + run: cd server && node index.js');
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  function openNew() {
    setEditGoal(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setShowForm(true);
  }

  function openEdit(g) {
    setEditGoal(g);
    setForm({
      title:         g.title,
      description:   g.description  ?? '',
      goal_type:     g.goal_type,
      target_value:  g.target_value,
      current_value: g.current_value,
      unit:          g.unit         ?? '',
      deadline:      g.deadline     ? g.deadline.split('T')[0] : '',
    });
    setFormError('');
    setShowForm(true);
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  }

  // Auto-computed types don't need a manual current_value
  const isAutoComputed = ['workouts_count','duration_min','calories','distance_km'].includes(form.goal_type);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim())         { setFormError('Title is required'); return; }
    if (!form.target_value || Number(form.target_value) <= 0) { setFormError('Target value must be positive'); return; }
    setSaving(true); setFormError('');
    const payload = {
      title:        form.title.trim(),
      description:  form.description || null,
      goal_type:    form.goal_type,
      target_value: Number(form.target_value),
      current_value: isAutoComputed ? undefined : (Number(form.current_value) || 0),
      unit:         form.unit || null,
      deadline:     form.deadline || null,
    };
    try {
      if (editGoal) await updateGoal(editGoal.id, payload);
      else          await createGoal(payload);
      setShowForm(false);
      load();
    } catch (err) {
      const msgs = err.response?.data?.errors;
      setFormError(msgs ? msgs.map(m => m.msg).join(', ') : err.response?.data?.error || 'Save failed');
    } finally { setSaving(false); }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this goal? This cannot be undone.')) return;
    setDeleting(id);
    try {
      await deleteGoal(id);
      setGoals(g => g.filter(x => x.id !== id));
    } catch { setError('Failed to delete goal'); }
    finally { setDeleting(null); }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Goals</h1>
        <button className="btn btn-primary" onClick={openNew}>+ Add Goal</button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Modal form */}
      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="modal-card card" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">{editGoal ? 'Edit Goal' : 'New Goal'}</h2>
            {formError && <div className="alert alert-error">{formError}</div>}
            <form onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input name="title" className="form-input" value={form.title} onChange={handleChange} placeholder="Run 100 km this month" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select name="goal_type" className="form-input" value={form.goal_type} onChange={handleChange}>
                    {GOAL_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Unit (optional)</label>
                  <input name="unit" className="form-input" value={form.unit} onChange={handleChange} placeholder="km, sessions…" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Target *</label>
                  <input name="target_value" type="number" min="0.01" step="any" className="form-input" value={form.target_value} onChange={handleChange} />
                </div>
                {!isAutoComputed && (
                  <div className="form-group">
                    <label className="form-label">Current</label>
                    <input name="current_value" type="number" min="0" step="any" className="form-input" value={form.current_value} onChange={handleChange} />
                  </div>
                )}
              </div>
              {isAutoComputed && (
                <p className="form-hint">Current value is calculated automatically from your workouts.</p>
              )}
              <div className="form-group">
                <label className="form-label">Description (optional)</label>
                <textarea name="description" rows="2" className="form-input" value={form.description} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Deadline (optional)</label>
                <input name="deadline" type="date" className="form-input" value={form.deadline} onChange={handleChange} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : editGoal ? 'Save changes' : 'Create goal'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading-spinner">Loading goals…</div>
      ) : goals.length === 0 ? (
        <div className="empty-state card">
          <h3>No goals yet</h3>
          <p>Click "+ Add Goal" to set your first fitness goal.</p>
        </div>
      ) : (
        <div className="goals-grid">
          {goals.map(g => <GoalCard key={g.id} goal={g} onEdit={openEdit} onDelete={handleDelete} deleting={deleting} />)}
        </div>
      )}
    </div>
  );
}

function GoalCard({ goal: g, onEdit, onDelete, deleting }) {
  const pct = Math.min(100, g.target_value > 0 ? Math.round((g.current_value / g.target_value) * 100) : 0);
  const typeMeta = GOAL_TYPES.find(t => t.value === g.goal_type);
  return (
    <div className={`goal-card card${g.is_completed ? ' completed' : ''}`}>
      <div className="goal-header">
        <div>
          <span className="goal-type-label">{typeMeta?.label ?? g.goal_type}</span>
          <h3 className="goal-title">{g.title}</h3>
        </div>
        {g.is_completed && <span className="goal-badge-done">✓ Done</span>}
      </div>

      {g.description && <p className="goal-desc">{g.description}</p>}

      <div className="goal-progress-row">
        <span className="goal-progress-label">
          {Number(g.current_value).toLocaleString()} / {Number(g.target_value).toLocaleString()}{g.unit ? ` ${g.unit}` : ''}
        </span>
        <span className="goal-pct">{pct}%</span>
      </div>
      <div className="progress-bar-track">
        <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
      </div>

      {g.deadline && (
        <p className="goal-deadline">
          Deadline: {new Date(g.deadline).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}
        </p>
      )}

      <div className="goal-actions">
        <button className="btn btn-outline" onClick={() => onEdit(g)}>Edit</button>
        <button className="btn btn-danger" onClick={() => onDelete(g.id)} disabled={deleting === g.id}>
          {deleting === g.id ? 'Deleting…' : 'Delete'}
        </button>
      </div>
    </div>
  );
}
