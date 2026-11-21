import { useState, useEffect, useCallback } from 'react';
import { getMeals, createMeal, deleteMeal } from '../api/meals';
import { checkAchievements } from '../api/achievements';
import './DietPage.css';

const MEAL_TYPES = ['Breakfast','Lunch','Dinner','Snack'];
const CALORIE_GOAL = 2000;

const QUICK_ADD = [
  { name:'Grilled Chicken Salad', meal_type:'Lunch',     calories:320, protein_g:35, carbs_g:12, fat_g:10 },
  { name:'Oatmeal with Berries',  meal_type:'Breakfast', calories:280, protein_g:8,  carbs_g:52, fat_g:5  },
  { name:'Salmon with Quinoa',    meal_type:'Dinner',    calories:450, protein_g:40, carbs_g:30, fat_g:14 },
  { name:'Greek Yogurt Bowl',     meal_type:'Breakfast', calories:180, protein_g:15, carbs_g:22, fat_g:3  },
  { name:'Turkey Wrap',           meal_type:'Lunch',     calories:380, protein_g:28, carbs_g:40, fat_g:9  },
  { name:'Protein Smoothie',      meal_type:'Snack',     calories:220, protein_g:25, carbs_g:20, fat_g:4  },
];

const EMPTY_FORM = { name:'', meal_type:'Breakfast', calories:'', protein_g:'', carbs_g:'', fat_g:'', notes:'' };

export default function DietPage() {
  const today = new Date().toISOString().slice(0,10);
  const [date, setDate]         = useState(today);
  const [meals, setMeals]       = useState([]);
  const [totals, setTotals]     = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [saving, setSaving]     = useState(false);
  const [deleting, setDeleting] = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const { data } = await getMeals({ date });
      setMeals(data.meals);
      setTotals(data.dailyTotals);
    } catch { setError('Failed to load meals'); }
    finally { setLoading(false); }
  }, [date]);

  useEffect(() => { load(); }, [load]);

  function handleChange(e) { setForm(f => ({...f, [e.target.name]: e.target.value})); }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.calories) return;
    setSaving(true);
    try {
      await createMeal({ ...form, meal_date: date, calories: Number(form.calories),
        protein_g: form.protein_g ? Number(form.protein_g) : null,
        carbs_g:   form.carbs_g   ? Number(form.carbs_g)   : null,
        fat_g:     form.fat_g     ? Number(form.fat_g)     : null,
      });
      await checkAchievements();
      setShowForm(false); setForm(EMPTY_FORM); load();
    } catch { setError('Failed to save meal'); }
    finally { setSaving(false); }
  }

  async function handleQuickAdd(item) {
    try {
      await createMeal({ ...item, meal_date: date });
      await checkAchievements();
      load();
    } catch { setError('Failed to add meal'); }
  }

  async function handleDelete(id) {
    if (!window.confirm('Remove this meal?')) return;
    setDeleting(id);
    try { await deleteMeal(id); load(); }
    catch { setError('Failed to delete meal'); }
    finally { setDeleting(null); }
  }

  const calPct = totals ? Math.min(100, Math.round((totals.calories / CALORIE_GOAL) * 100)) : 0;
  const grouped = MEAL_TYPES.reduce((acc, t) => {
    acc[t] = meals.filter(m => m.meal_type === t);
    return acc;
  }, {});

  return (
    <div className="diet-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Diet Planner</h1>
          <p className="page-subtitle">Track meals and manage nutrition</p>
        </div>
        <div style={{display:'flex',gap:10,alignItems:'center'}}>
          <input type="date" className="form-input" value={date} onChange={e=>setDate(e.target.value)} style={{width:160}} />
          <button className="btn btn-primary" onClick={()=>setShowForm(s=>!s)}>+ Log Meal</button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Daily summary */}
      {totals !== null && (
        <div className="card diet-summary">
          <div className="diet-summary-top">
            <div className="macro-big">
              <span className="macro-big-val" style={{color:'var(--color-accent)'}}>{totals.calories}</span>
              <span className="macro-big-label">Calories</span>
            </div>
            <div className="macro-big">
              <span className="macro-big-val" style={{color:'var(--color-accent2)'}}>{Number(totals.protein_g).toFixed(0)}g</span>
              <span className="macro-big-label">Protein</span>
            </div>
            <div className="macro-big">
              <span className="macro-big-val" style={{color:'var(--color-warn)'}}>{Number(totals.carbs_g).toFixed(0)}g</span>
              <span className="macro-big-label">Carbs</span>
            </div>
            <div className="macro-big">
              <span className="macro-big-val" style={{color:'var(--color-orange)'}}>{Number(totals.fat_g).toFixed(0)}g</span>
              <span className="macro-big-label">Fat</span>
            </div>
          </div>
          <div style={{marginTop:12}}>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:'.8rem',color:'var(--color-muted)',marginBottom:6}}>
              <span>Daily Calorie Goal ({CALORIE_GOAL} kcal)</span>
              <span>{calPct}%</span>
            </div>
            <div className="progress-bar-track">
              <div className="progress-bar-fill" style={{width:`${calPct}%`, background: calPct > 100 ? 'var(--color-danger)' : 'var(--color-accent)'}} />
            </div>
          </div>
        </div>
      )}

      {/* Quick Add */}
      <div className="card" style={{marginBottom:20}}>
        <h2 className="section-title">⚡ Quick Add</h2>
        <div className="quick-add-grid">
          {QUICK_ADD.map(item => (
            <button key={item.name} className="quick-add-btn" onClick={()=>handleQuickAdd(item)}>
              <span className="qa-name">{item.name}</span>
              <span className="qa-meta">{item.calories} kcal · {item.protein_g}g P · {item.carbs_g}g C · {item.fat_g}g F</span>
            </button>
          ))}
        </div>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="card" style={{marginBottom:20}}>
          <h2 className="section-title">Add Meal</h2>
          <form onSubmit={handleSubmit} noValidate>
            <div className="meal-form-grid">
              <div className="form-group" style={{gridColumn:'1/-1'}}>
                <label className="form-label">Food Name *</label>
                <input name="name" className="form-input" value={form.name} onChange={handleChange} placeholder="e.g. Grilled Chicken Breast" autoFocus />
              </div>
              <div className="form-group">
                <label className="form-label">Meal Type</label>
                <select name="meal_type" className="form-input" value={form.meal_type} onChange={handleChange}>
                  {MEAL_TYPES.map(t=><option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Calories *</label>
                <input name="calories" type="number" min="1" className="form-input" value={form.calories} onChange={handleChange} placeholder="350" />
              </div>
              <div className="form-group">
                <label className="form-label">Protein (g)</label>
                <input name="protein_g" type="number" min="0" step="0.1" className="form-input" value={form.protein_g} onChange={handleChange} placeholder="30" />
              </div>
              <div className="form-group">
                <label className="form-label">Carbs (g)</label>
                <input name="carbs_g" type="number" min="0" step="0.1" className="form-input" value={form.carbs_g} onChange={handleChange} placeholder="40" />
              </div>
              <div className="form-group">
                <label className="form-label">Fat (g)</label>
                <input name="fat_g" type="number" min="0" step="0.1" className="form-input" value={form.fat_g} onChange={handleChange} placeholder="10" />
              </div>
            </div>
            <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
              <button type="button" className="btn btn-outline" onClick={()=>setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving?'Saving…':'Log Meal'}</button>
            </div>
          </form>
        </div>
      )}

      {/* Meal history by type */}
      <div className="card">
        <h2 className="section-title">Meal History</h2>
        {loading ? <div className="loading-spinner">Loading…</div> :
         meals.length === 0 ? <div className="empty-state"><h3>No meals logged for this day</h3></div> : (
          MEAL_TYPES.filter(t => grouped[t].length > 0).map(mealType => (
            <div key={mealType} className="meal-type-group">
              <h3 className="meal-type-label">{mealType}</h3>
              {grouped[mealType].map(m => (
                <div key={m.id} className="meal-row">
                  <div className="meal-info">
                    <span className="meal-name">{m.name}</span>
                    <div className="meal-macros">
                      <span>{m.calories} kcal</span>
                      {m.protein_g && <span>{m.protein_g}g P</span>}
                      {m.carbs_g   && <span>{m.carbs_g}g C</span>}
                      {m.fat_g     && <span>{m.fat_g}g F</span>}
                    </div>
                  </div>
                  <button className="btn btn-outline meal-del" onClick={()=>handleDelete(m.id)} disabled={deleting===m.id}>
                    {deleting===m.id ? '…' : '✕'}
                  </button>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
