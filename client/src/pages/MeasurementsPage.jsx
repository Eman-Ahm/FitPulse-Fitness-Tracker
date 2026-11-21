import { useState, useEffect } from 'react';
import { getMeasurements, createMeasurement, deleteMeasurement } from '../api/measurements';
import {
  ResponsiveContainer, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import './MeasurementsPage.css';

const EMPTY = { measured_at:'', weight_kg:'', body_fat_pct:'', chest_cm:'', waist_cm:'', hips_cm:'', notes:'' };

export default function MeasurementsPage() {
  const [data, setData]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState(EMPTY);
  const [saving, setSaving]     = useState(false);
  const [formErr, setFormErr]   = useState('');
  const [deleting, setDeleting] = useState(null);

  async function load() {
    setLoading(true); setError('');
    try { const { data: d } = await getMeasurements(); setData(d.measurements); }
    catch { setError('Failed to load measurements'); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function handleSave(e) {
    e.preventDefault();
    if (!form.measured_at) { setFormErr('Date is required'); return; }
    const today = new Date().toISOString().slice(0, 10);
    if (form.measured_at > today) { setFormErr('Date cannot be in the future'); return; }
    if (form.measured_at < '1900-01-01') { setFormErr('Date cannot be before 1900'); return; }
    setSaving(true); setFormErr('');
    try {
      await createMeasurement({
        ...form,
        weight_kg:    form.weight_kg    ? Number(form.weight_kg)    : null,
        body_fat_pct: form.body_fat_pct ? Number(form.body_fat_pct) : null,
        chest_cm:     form.chest_cm     ? Number(form.chest_cm)     : null,
        waist_cm:     form.waist_cm     ? Number(form.waist_cm)     : null,
        hips_cm:      form.hips_cm      ? Number(form.hips_cm)      : null,
      });
      setShowForm(false); setForm(EMPTY); load();
    } catch (err) { setFormErr(err.response?.data?.error || 'Save failed'); }
    finally { setSaving(false); }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this measurement?')) return;
    setDeleting(id);
    try { await deleteMeasurement(id); setData(d => d.filter(x => x.id !== id)); }
    catch { setError('Delete failed'); }
    finally { setDeleting(null); }
  }

  // Chart data for weight
  const chartData = [...data].reverse()
    .filter(m => m.weight_kg)
    .map(m => ({
      date: new Date(m.measured_at).toLocaleDateString('en-GB', { month:'short', day:'numeric' }),
      weight: Number(m.weight_kg),
    }));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Body Measurements</h1>
          <p className="page-subtitle">Track weight and body measurements over time</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(s => !s)}>
          + Add Measurement
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Weight chart */}
      {chartData.length > 1 && (
        <div className="card meas-chart-card">
          <h2 className="chart-title">Weight over time (kg)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData} margin={{ top:8, right:8, left:-20, bottom:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.05)" />
              <XAxis dataKey="date" tick={{ fontSize:10, fill:'#555f75' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize:10, fill:'#555f75' }} axisLine={false} tickLine={false} domain={['auto','auto']} />
              <Tooltip contentStyle={{ background:'#0d0d0d', border:'1px solid #1e1e1e', borderRadius:8, color:'#f0f2f8', fontSize:12 }} />
              <Line type="monotone" dataKey="weight" name="Weight (kg)" stroke="#22c55e" strokeWidth={2.5} dot={{ r:4, fill:'#22c55e' }} animationDuration={600} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <div className="card meas-form">
          <h3 className="meas-form-title">Add Measurement</h3>
          <form onSubmit={handleSave} noValidate>
            <div className="meas-grid">
              <div className="form-group">
                <label className="form-label" htmlFor="measured_at">Date *</label>
                <input id="measured_at" type="date" className="form-input"
                  value={form.measured_at} max={new Date().toISOString().slice(0,10)}
                  onChange={e => setForm(f => ({...f, measured_at: e.target.value}))} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="weight_kg">Weight (kg)</label>
                <input id="weight_kg" type="number" step="0.1" min="1" max="700" className="form-input"
                  value={form.weight_kg} onChange={e => setForm(f => ({...f, weight_kg: e.target.value}))} placeholder="70.5" />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="body_fat_pct">Body Fat %</label>
                <input id="body_fat_pct" type="number" step="0.1" min="1" max="70" className="form-input"
                  value={form.body_fat_pct} onChange={e => setForm(f => ({...f, body_fat_pct: e.target.value}))} placeholder="18.5" />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="waist_cm">Waist (cm)</label>
                <input id="waist_cm" type="number" step="0.1" min="1" max="300" className="form-input"
                  value={form.waist_cm} onChange={e => setForm(f => ({...f, waist_cm: e.target.value}))} placeholder="80" />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="chest_cm">Chest (cm)</label>
                <input id="chest_cm" type="number" step="0.1" min="1" max="300" className="form-input"
                  value={form.chest_cm} onChange={e => setForm(f => ({...f, chest_cm: e.target.value}))} placeholder="95" />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="hips_cm">Hips (cm)</label>
                <input id="hips_cm" type="number" step="0.1" min="1" max="300" className="form-input"
                  value={form.hips_cm} onChange={e => setForm(f => ({...f, hips_cm: e.target.value}))} placeholder="90" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="notes">Notes</label>
              <textarea id="notes" className="form-input" rows="2"
                value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} />
            </div>
            {formErr && <div className="alert alert-error">{formErr}</div>}
            <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
              <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      {loading ? <div className="loading-spinner">Loading…</div> :
       data.length === 0 ? (
        <div className="empty-state card">
          <h3>No measurements yet</h3>
          <p>Click "+ Add Measurement" to start tracking.</p>
        </div>
      ) : (
        <div className="meas-list">
          {data.map(m => (
            <div key={m.id} className="card meas-row">
              <div className="meas-date">
                {new Date(m.measured_at).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}
              </div>
              <div className="meas-stats">
                {m.weight_kg    && <MeasStat label="Weight"   value={`${m.weight_kg} kg`} />}
                {m.body_fat_pct && <MeasStat label="Body Fat" value={`${m.body_fat_pct}%`} />}
                {m.waist_cm     && <MeasStat label="Waist"    value={`${m.waist_cm} cm`} />}
                {m.chest_cm     && <MeasStat label="Chest"    value={`${m.chest_cm} cm`} />}
                {m.hips_cm      && <MeasStat label="Hips"     value={`${m.hips_cm} cm`} />}
              </div>
              {m.notes && <p className="meas-notes">"{m.notes}"</p>}
              <button className="btn btn-danger meas-del" onClick={() => handleDelete(m.id)} disabled={deleting === m.id}>
                {deleting === m.id ? '…' : 'Delete'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MeasStat({ label, value }) {
  return (
    <div className="meas-stat">
      <span className="meas-stat-val">{value}</span>
      <span className="meas-stat-lbl">{label}</span>
    </div>
  );
}
