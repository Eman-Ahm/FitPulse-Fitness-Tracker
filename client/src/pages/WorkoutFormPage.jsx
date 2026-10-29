import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getWorkout, createWorkout, updateWorkout } from '../api/workouts';
import './WorkoutFormPage.css';

const WORKOUT_TYPES = ['Running','Cycling','Swimming','Weightlifting','Yoga','Walking','HIIT','Other'];
const EMPTY = { workout_date: '', type: '', duration_min: '', calories: '', distance_km: '', notes: '' };

export default function WorkoutFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm]     = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading]   = useState(false);
  const [fetching, setFetching] = useState(isEdit);

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const { data } = await getWorkout(id);
        const w = data.workout;
        setForm({
          workout_date: w.workout_date?.split('T')[0] ?? '',
          type: w.type,
          duration_min: w.duration_min,
          calories: w.calories ?? '',
          distance_km: w.distance_km ?? '',
          notes: w.notes ?? '',
        });
      } catch { setApiError('Failed to load workout'); }
      finally { setFetching(false); }
    })();
  }, [id, isEdit]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    setErrors(e => ({ ...e, [name]: '' }));
  }

  function validate() {
    const errs = {};
    if (!form.workout_date) errs.workout_date = 'Date is required';
    if (!form.type)         errs.type = 'Type is required';
    if (!form.duration_min || Number(form.duration_min) < 1) errs.duration_min = 'Duration must be ≥ 1 minute';
    if (form.calories && Number(form.calories) < 1)     errs.calories = 'Calories must be positive';
    if (form.distance_km && Number(form.distance_km) < 0) errs.distance_km = 'Distance must be ≥ 0';
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true); setApiError('');

    const payload = {
      workout_date: form.workout_date,
      type: form.type,
      duration_min: Number(form.duration_min),
      calories:    form.calories    ? Number(form.calories)    : null,
      distance_km: form.distance_km ? Number(form.distance_km) : null,
      notes:       form.notes || null,
    };

    try {
      if (isEdit) await updateWorkout(id, payload);
      else        await createWorkout(payload);
      navigate('/workouts');
    } catch (err) {
      const msgs = err.response?.data?.errors;
      setApiError(msgs ? msgs.map(m => m.msg).join(', ') : err.response?.data?.error || 'Save failed');
    } finally { setLoading(false); }
  }

  if (fetching) return <div className="loading-spinner">Loading…</div>;

  return (
    <div className="workout-form-page">
      <div className="page-header">
        <h1 className="page-title">{isEdit ? 'Edit Workout' : 'Add Workout'}</h1>
      </div>

      <div className="card workout-form-card">
        {apiError && <div className="alert alert-error">{apiError}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label" htmlFor="workout_date">Date *</label>
              <input id="workout_date" name="workout_date" type="date"
                className="form-input" value={form.workout_date} onChange={handleChange} />
              {errors.workout_date && <span className="form-error">{errors.workout_date}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="type">Type *</label>
              <select id="type" name="type" className="form-input" value={form.type} onChange={handleChange}>
                <option value="">Select type…</option>
                {WORKOUT_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
              {errors.type && <span className="form-error">{errors.type}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="duration_min">Duration (min) *</label>
              <input id="duration_min" name="duration_min" type="number" min="1"
                className="form-input" value={form.duration_min} onChange={handleChange} placeholder="45" />
              {errors.duration_min && <span className="form-error">{errors.duration_min}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="calories">Calories (optional)</label>
              <input id="calories" name="calories" type="number" min="1"
                className="form-input" value={form.calories} onChange={handleChange} placeholder="350" />
              {errors.calories && <span className="form-error">{errors.calories}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="distance_km">Distance km (optional)</label>
              <input id="distance_km" name="distance_km" type="number" min="0" step="0.01"
                className="form-input" value={form.distance_km} onChange={handleChange} placeholder="5.5" />
              {errors.distance_km && <span className="form-error">{errors.distance_km}</span>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="notes">Notes (optional)</label>
            <textarea id="notes" name="notes" rows="3"
              className="form-input" value={form.notes} onChange={handleChange}
              placeholder="How did it feel?" />
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-outline" onClick={() => navigate('/workouts')}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving…' : isEdit ? 'Save changes' : 'Add workout'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
