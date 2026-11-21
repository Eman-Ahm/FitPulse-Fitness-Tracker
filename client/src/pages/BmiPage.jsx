import { useState } from 'react';
import './BmiPage.css';

function calcBmi(weight, height) {
  if (!weight || !height || height <= 0) return null;
  return (weight / ((height / 100) ** 2)).toFixed(1);
}

function bmiCategory(bmi) {
  if (!bmi) return null;
  const b = parseFloat(bmi);
  if (b < 18.5) return { label: 'Underweight', color: '#3b82f6' };
  if (b < 25)   return { label: 'Normal weight', color: '#22c55e' };
  if (b < 30)   return { label: 'Overweight', color: '#f59e0b' };
  return { label: 'Obese', color: '#ef4444' };
}

export default function BmiPage() {
  const [form, setForm] = useState({ weight: '', height: '', age: '', gender: 'male' });
  const [result, setResult] = useState(null);

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setResult(null);
  }

  function calculate(e) {
    e.preventDefault();
    const bmi = calcBmi(Number(form.weight), Number(form.height));
    if (!bmi) return;
    const cat = bmiCategory(bmi);
    setResult({ bmi, ...cat });
  }

  const pct = result ? Math.min(100, ((parseFloat(result.bmi) - 10) / 40) * 100) : 0;

  return (
    <div className="bmi-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">BMI Calculator</h1>
          <p className="page-subtitle">Body Mass Index — a rough measure of healthy weight</p>
        </div>
      </div>

      <div className="bmi-grid">
        {/* Form */}
        <div className="card bmi-form-card">
          <h2 className="bmi-form-title">Your Details</h2>
          <form onSubmit={calculate} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="weight">Weight (kg) *</label>
              <input id="weight" name="weight" type="number" min="1" max="700" step="0.1"
                className="form-input" value={form.weight} onChange={handleChange} placeholder="70" />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="height">Height (cm) *</label>
              <input id="height" name="height" type="number" min="50" max="280" step="0.1"
                className="form-input" value={form.height} onChange={handleChange} placeholder="175" />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="age">Age (optional)</label>
              <input id="age" name="age" type="number" min="5" max="120"
                className="form-input" value={form.age} onChange={handleChange} placeholder="25" />
            </div>
            <div className="form-group">
              <label className="form-label">Gender (optional)</label>
              <div className="bmi-gender">
                {['male','female'].map(g => (
                  <button key={g} type="button"
                    className={`bmi-gender-btn${form.gender === g ? ' active' : ''}`}
                    onClick={() => setForm(f => ({ ...f, gender: g }))}
                  >{g.charAt(0).toUpperCase() + g.slice(1)}</button>
                ))}
              </div>
            </div>
            <button className="btn btn-primary bmi-calc-btn" type="submit"
              disabled={!form.weight || !form.height}>
              Calculate BMI
            </button>
          </form>
        </div>

        {/* Result */}
        <div className="card bmi-result-card">
          {!result ? (
            <div className="bmi-placeholder">
              <div className="bmi-placeholder-icon">⚖️</div>
              <p>Enter your weight and height to see your BMI</p>
            </div>
          ) : (
            <div className="bmi-result">
              <p className="bmi-number" style={{ color: result.color }}>{result.bmi}</p>
              <p className="bmi-category" style={{ color: result.color }}>{result.label}</p>

              {/* Scale */}
              <div className="bmi-scale-wrap">
                <div className="bmi-scale-bar">
                  <div className="bmi-scale-seg" style={{ flex:1, background:'#3b82f6' }} title="Underweight &lt;18.5" />
                  <div className="bmi-scale-seg" style={{ flex:1.625, background:'#22c55e' }} title="Normal 18.5–25" />
                  <div className="bmi-scale-seg" style={{ flex:1.25, background:'#f59e0b' }} title="Overweight 25–30" />
                  <div className="bmi-scale-seg" style={{ flex:2, background:'#ef4444' }} title="Obese 30+" />
                </div>
                <div className="bmi-scale-pointer" style={{ left: `${pct}%` }} />
                <div className="bmi-scale-labels">
                  <span>10</span><span>18.5</span><span>25</span><span>30</span><span>50</span>
                </div>
              </div>

              <div className="bmi-info">
                <InfoRow label="BMI" value={result.bmi} />
                <InfoRow label="Category" value={result.label} />
                {form.weight && form.height && (
                  <InfoRow label="Healthy range"
                    value={`${(18.5 * ((Number(form.height)/100)**2)).toFixed(1)}–${(25 * ((Number(form.height)/100)**2)).toFixed(1)} kg`} />
                )}
              </div>

              <p className="bmi-disclaimer">
                BMI is a screening tool, not a diagnosis. Consult a healthcare professional for medical advice.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="bmi-info-row">
      <span className="bmi-info-label">{label}</span>
      <span className="bmi-info-value">{value}</span>
    </div>
  );
}
