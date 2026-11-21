import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAnalytics } from '../api/analytics';
import ActivityChart from '../components/ActivityChart';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import './DashboardPage.css';

/* ══════════════════════════════════════════════════════════
   IMAGE LIBRARY  (all Unsplash – free to use)
══════════════════════════════════════════════════════════ */

const HEROES = [
  { url:'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1400&q=90', label:'Weight Lifting',  accent:'#22c55e', title:'BE STRONG',    sub:'Build raw, functional strength' },
  { url:'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=1400&q=90', label:'Muscle Training', accent:'#f97316', title:'GET BIGGER',   sub:'Sculpt every muscle group' },
  { url:'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=1400&q=90', label:'Power Training',  accent:'#ef4444', title:'GO HARDER',    sub:'Unleash your inner power' },
  { url:'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=1400&q=90', label:'CrossFit',        accent:'#f59e0b', title:'PUSH LIMITS',  sub:'Never stop fighting' },
  { url:'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1400&q=90', label:'Female Strength', accent:'#22c55e', title:'BE POWERFUL',  sub:'Strong is beautiful' },
  { url:'https://images.unsplash.com/photo-1571731956672-f2b94d7dd0cb?w=1400&q=90', label:"Women's Fitness", accent:'#a855f7', title:'RISE UP',      sub:'Empower every single rep' },
  { url:'https://images.unsplash.com/photo-1600881333168-2ef49b341f30?w=1400&q=90', label:'Body Goals',      accent:'#3b82f6', title:'YOUR BODY',    sub:'Shape your future today' },
  { url:'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=1400&q=90', label:'Elite Athlete',   accent:'#f97316', title:'CHAMPION',     sub:'Train like the very best' },
];

const FOODS = [
  { url:'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&q=90', label:'Power Bowl',     cal:'320 kcal', macro:'35g protein' },
  { url:'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=500&q=90', label:'Healthy Plate',  cal:'280 kcal', macro:'28g protein' },
  { url:'https://images.unsplash.com/photo-1547592180-85f173990554?w=500&q=90', label:'Fresh Salad',    cal:'180 kcal', macro:'8g protein'  },
  { url:'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=500&q=90', label:'Clean Eating',   cal:'410 kcal', macro:'42g protein' },
  { url:'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&q=90', label:'Lean Protein',   cal:'450 kcal', macro:'55g protein' },
  { url:'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=500&q=90', label:'Balanced Meal',  cal:'520 kcal', macro:'38g protein' },
  { url:'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=500&q=90', label:'Superfoods',     cal:'240 kcal', macro:'18g protein' },
  { url:'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=500&q=90', label:'Meal Prep',      cal:'380 kcal', macro:'44g protein' },
];

const SERVICES = [
  { url:'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&q=85', label:'Exercise Program', to:'/exercises', icon:'💪' },
  { url:'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=85', label:'Nutrition Plan',   to:'/diet',      icon:'🥗' },
  { url:'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=85', label:'Workout Timer',    to:'/timer',     icon:'⏱️' },
  { url:'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&q=85', label:'Diet Tracker',     to:'/diet',      icon:'📊' },
];

const QUOTES = [
  'The body achieves what the mind believes.',
  'Train insane or remain the same.',
  'Success starts with self-discipline.',
  'Your only limit is your mind.',
  'Every rep brings you closer to your goal.',
  'Pain is temporary. Pride is forever.',
  'Champions are made in the moments they want to quit.',
];

const ACTIONS = [
  { to:'/workouts/new', icon:'➕', label:'Log Workout',  c:'#22c55e' },
  { to:'/timer',        icon:'⏱️', label:'Start Timer',  c:'#3b82f6' },
  { to:'/diet',         icon:'🥗', label:'Log Meal',     c:'#f59e0b' },
  { to:'/goals',        icon:'🎯', label:'Set Goal',     c:'#f97316' },
  { to:'/exercises',    icon:'💪', label:'Exercises',    c:'#a855f7' },
  { to:'/achievements', icon:'🏆', label:'Achievements', c:'#eab308' },
  { to:'/analytics',    icon:'📈', label:'Progress',     c:'#06b6d4' },
  { to:'/workouts',     icon:'📋', label:'All Workouts', c:'#ec4899' },
];

/* ══════════════════════════════════════════════════════════
   ANIMATED COUNTER HOOK
══════════════════════════════════════════════════════════ */
function useCounter(target, duration = 1200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!target) return;
    const n = Number(target.toString().replace(/,/g, ''));
    if (!n) { setValue(target); return; }
    let start = 0;
    const step = n / (duration / 16);
    const id = setInterval(() => {
      start += step;
      if (start >= n) { setValue(target); clearInterval(id); }
      else setValue(Math.floor(start).toLocaleString());
    }, 16);
    return () => clearInterval(id);
  }, [target, duration]);
  return value;
}

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════ */
export default function DashboardPage() {
  const { user }                        = useAuth();
  const [data, setData]                 = useState(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [activeHero, setActiveHero]     = useState(0);
  const [quoteIdx, setQuoteIdx]         = useState(0);
  const intervalRef                     = useRef(null);

  /* fetch data */
  useEffect(() => {
    (async () => {
      try {
        const { data: d } = await getAnalytics();
        setData(d);
      } catch (err) {
        setError(err.response?.status === 401
          ? 'Session expired — please log in again.'
          : 'Cannot reach server. Start XAMPP → run: cd server && node index.js');
      } finally { setLoading(false); }
    })();
  }, []);

  /* hero rotation */
  const startRotation = useCallback(() => {
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => setActiveHero(h => (h + 1) % HEROES.length), 5000);
  }, []);
  useEffect(() => { startRotation(); return () => clearInterval(intervalRef.current); }, [startRotation]);

  /* quote ticker */
  useEffect(() => {
    const t = setInterval(() => setQuoteIdx(q => (q + 1) % QUOTES.length), 4000);
    return () => clearInterval(t);
  }, []);

  function goTo(i) { setActiveHero(i); startRotation(); }

  if (loading) return <div className="loading-spinner">Loading dashboard…</div>;

  /* ── Offline view ── */
  const hero = HEROES[activeHero];
  if (error) return (
    <div className="dash">
      <HeroBlock hero={hero} active={activeHero} goTo={goTo} userName={user?.name?.split(' ')[0]} offline />
      <div className="alert alert-error">⚠️ {error}</div>
      <Ticker quote={QUOTES[quoteIdx]} />
      <SectionHeader icon="💪" label="Featured Workouts" to="/exercises" />
      <CatGrid />
      <SectionHeader icon="🥗" label="Nutrition & Healthy Food" to="/diet" />
      <FoodRow />
      <SectionHeader icon="🏃" label="Services" to="/exercises" />
      <ServRow />
      <SectionHeader icon="⚡" label="Quick Actions" />
      <ActionGrid />
    </div>
  );

  const { summary, recentWorkouts, weekly } = data;
  const isNew = summary.total_workouts === 0;
  const weeklyFmt = weekly.map(w => ({
    ...w,
    label: new Date(w.week_start).toLocaleDateString('en-GB', { month:'short', day:'numeric' }),
  }));

  return (
    <div className="dash">

      {/* ── CINEMATIC HERO ── */}
      <HeroBlock hero={hero} active={activeHero} goTo={goTo} userName={user?.name?.split(' ')[0]} />

      {/* ── MOTIVATIONAL TICKER ── */}
      <Ticker quote={QUOTES[quoteIdx]} />

      {/* ── GLASS STAT CARDS ── */}
      <div className="stat-row">
        <GlassStat icon="🏋️" label="Workouts"    value={summary.total_workouts}      unit="sessions" c="#22c55e" />
        <GlassStat icon="⏱️" label="Duration"    value={fmt(summary.total_duration)} unit="min"      c="#3b82f6" />
        <GlassStat icon="🔥" label="Calories"    value={fmt(summary.total_calories)} unit="kcal"     c="#f97316" />
        <GlassStat icon="🎯" label="Active Goals" value={summary.active_goals}       unit={`/ ${summary.total_goals}`} c="#f59e0b" />
      </div>

      {/* ── FEATURED WORKOUTS 3-card ── */}
      <SectionHeader icon="💪" label="Featured Workouts" to="/exercises" />
      <CatGrid />

      {/* ── FOOD GALLERY ── */}
      <SectionHeader icon="🥗" label="Nutrition & Healthy Food" to="/diet" />
      <FoodRow />

      {/* ── SERVICES ── */}
      <SectionHeader icon="🏃" label="Services" to="/exercises" />
      <ServRow />

      {/* ── QUICK ACTIONS ── */}
      <SectionHeader icon="⚡" label="Quick Actions" />
      <ActionGrid />

      {/* ── ACTIVITY CHART (real daily data) ── */}
      <ActivityChart />

      {/* ── WEEKLY SUMMARY ── */}
      <SectionHeader icon="📊" label="Weekly Summary" to="/analytics" />

      {isNew ? (
        <div className="card new-empty">
          <div className="new-empty-icon">🚀</div>
          <h3 className="new-empty-title">Start your fitness journey</h3>
          <p className="new-empty-sub">Log your first workout to unlock charts and insights</p>
          <Link to="/workouts/new" className="btn btn-primary" style={{marginTop:20}}>
            Log first workout →
          </Link>
        </div>
      ) : (
        <>
          {/* Weekly numbers */}
          <div className="week-nums">
            <WeekNum label="Workouts" value={summary.total_workouts}      c="#22c55e" />
            <WeekNum label="Calories" value={fmt(summary.total_calories)} c="#f97316" />
            <WeekNum label="Minutes"  value={fmt(summary.total_duration)} c="#3b82f6" />
            <WeekNum label="Goals"    value={summary.active_goals}        c="#f59e0b" />
          </div>

          {/* Area chart */}
          {weeklyFmt.length > 0 && (
            <div className="card chart-wrap">
              <div className="chart-hd">
                <span className="chart-title">Calorie Burn — last 8 weeks</span>
                <Link to="/analytics" className="see-all">View full analytics →</Link>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={weeklyFmt} margin={{ top:8, right:4, left:-20, bottom:0 }}>
                  <defs>
                    <linearGradient id="gCal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#f97316" stopOpacity={.35} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gDur" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#22c55e" stopOpacity={.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.05)" />
                  <XAxis dataKey="label" tick={{ fontSize:10, fill:'#555f75' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize:10, fill:'#555f75' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background:'#0a0a0a', border:'1px solid #1e1e1e', borderRadius:10, color:'#f0f2f8', fontSize:12, boxShadow:'0 8px 24px rgba(0,0,0,.6)' }}
                    cursor={{ stroke:'rgba(34,197,94,.2)', strokeWidth:1 }}
                  />
                  <Area type="monotone" dataKey="calories" name="Calories" stroke="#f97316" strokeWidth={2} fill="url(#gCal)" dot={false} />
                  <Area type="monotone" dataKey="duration" name="Duration (min)" stroke="#22c55e" strokeWidth={2} fill="url(#gDur)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Recent workouts */}
          {recentWorkouts.length > 0 && (
            <div className="card">
              <div className="chart-hd">
                <span className="chart-title">Recent Workouts</span>
                <Link to="/workouts" className="see-all">View all →</Link>
              </div>
              <div className="recent-list">
                {recentWorkouts.map((w, i) => (
                  <div key={w.id} className="recent-row" style={{ animationDelay:`${i * 60}ms` }}>
                    <span className="rbadge">{w.type}</span>
                    <span className="rdate">
                      {new Date(w.workout_date).toLocaleDateString('en-GB', { day:'numeric', month:'short' })}
                    </span>
                    <span className="rstat">{w.duration_min} min</span>
                    {w.calories ? <span className="rstat" style={{color:'#f97316'}}>{w.calories} kcal</span> : <span />}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   SUB-COMPONENTS
══════════════════════════════════════════════════════════ */

function HeroBlock({ hero, active, goTo, userName, offline }) {
  const prev = (active - 1 + HEROES.length) % HEROES.length;
  const next = (active + 1) % HEROES.length;
  return (
    <div className="hero-wrap">
      <div className="hero-main" style={{ backgroundImage:`url(${hero.url})` }}>
        <div className="hero-cin-overlay" />
        {/* Noise grain */}
        <div className="hero-grain" />
        <div className="hero-body">
          <div className="hero-content">
            <span className="hero-pill" style={{ color:hero.accent, borderColor:`${hero.accent}40`, background:`${hero.accent}12` }}>
              TRAINING HARD
            </span>
            <h1 className="hero-title">
              <span style={{ color:hero.accent }}>{hero.title.split(' ')[0]}</span>{' '}
              <span className="hero-title-white">{hero.title.split(' ').slice(1).join(' ')}</span>
            </h1>
            <p className="hero-sub">{hero.sub}</p>
            {userName && <p className="hero-greeting">Welcome back, <strong>{userName}</strong> 👋</p>}
            <div className="hero-btns">
              <Link to="/workouts/new" className="btn btn-primary" style={{ background:hero.accent, color:'#000' }}>
                Get Started →
              </Link>
              <Link to="/exercises" className="btn btn-secondary">Browse Exercises</Link>
            </div>
          </div>
          {/* Side thumbnails */}
          <div className="hero-aside">
            {[prev, next].map((idx) => (
              <button key={idx} className="hero-thumb" style={{ backgroundImage:`url(${HEROES[idx].url})` }}
                onClick={() => goTo(idx)}>
                <div className="hero-thumb-overlay" />
                <span className="hero-thumb-label">{HEROES[idx].label}</span>
              </button>
            ))}
          </div>
        </div>
        {/* Progress bar at bottom */}
        <div className="hero-progress-bar">
          <div className="hero-progress-fill" key={active}
            style={{ background:hero.accent, animationDuration:'5s' }} />
        </div>
      </div>
      {/* Dot strip */}
      <div className="hero-dots">
        {HEROES.map((h, i) => (
          <button key={i} onClick={() => goTo(i)}
            className={`hdot${i === active ? ' hdot-active' : ''}`}
            style={i === active ? { background:hero.accent, width:24 } : {}} />
        ))}
      </div>
    </div>
  );
}

function Ticker({ quote }) {
  return (
    <div className="ticker-wrap">
      <span className="ticker-icon">⚡</span>
      <span className="ticker-text" key={quote}>{quote}</span>
    </div>
  );
}

function SectionHeader({ icon, label, to }) {
  return (
    <div className="sec-hd">
      <span className="sec-label">{icon} {label}</span>
      {to && <Link to={to} className="sec-link">See all →</Link>}
    </div>
  );
}

function CatGrid() {
  const cats = [
    { img: HEROES[0].url, label: 'Weight Lifting',  accent: '#22c55e' },
    { img: HEROES[2].url, label: 'Power Training',  accent: '#ef4444' },
    { img: HEROES[4].url, label: 'Female Strength', accent: '#a855f7' },
  ];
  return (
    <div className="cat-grid">
      {cats.map(c => (
        <Link key={c.label} to="/exercises" className="cat-card">
          <img src={c.img} alt={c.label} className="cat-img" loading="lazy" />
          <div className="cat-fade" />
          <div className="cat-bottom">
            <span className="cat-pill" style={{ background:`${c.accent}20`, border:`1px solid ${c.accent}50`, color:c.accent }}>
              {c.label}
            </span>
            <span className="cat-cta">Explore →</span>
          </div>
        </Link>
      ))}
    </div>
  );
}

function FoodRow() {
  return (
    <div className="food-scroll">
      {FOODS.map(f => (
        <Link key={f.label} to="/diet" className="food-card">
          <img src={f.url} alt={f.label} className="food-img" loading="lazy" />
          <div className="food-fade" />
          <div className="food-bottom">
            <span className="food-name">{f.label}</span>
            <div className="food-metas">
              <span className="food-cal">{f.cal}</span>
              <span className="food-macro">{f.macro}</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

function ServRow() {
  return (
    <div className="serv-grid">
      {SERVICES.map(s => (
        <Link key={s.label} to={s.to} className="serv-card">
          <img src={s.url} alt={s.label} className="serv-img" loading="lazy" />
          <div className="serv-fade" />
          <div className="serv-bottom">
            <span className="serv-icon">{s.icon}</span>
            <span className="serv-label">{s.label}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}

function ActionGrid() {
  return (
    <div className="act-grid">
      {ACTIONS.map(a => (
        <Link key={a.to} to={a.to} className="act-btn" style={{ '--ac': a.c }}>
          <span className="act-icon" style={{ background:`${a.c}18`, border:`1px solid ${a.c}30` }}>{a.icon}</span>
          <span className="act-label">{a.label}</span>
          <span className="act-arrow">›</span>
        </Link>
      ))}
    </div>
  );
}

function GlassStat({ icon, label, value, unit, c }) {
  const display = useCounter(value);
  return (
    <div className="gstat glass card-hover">
      <div className="gstat-icon" style={{ background:`${c}15`, border:`1px solid ${c}25` }}>
        <span style={{ fontSize:'1.3rem' }}>{icon}</span>
      </div>
      <div className="gstat-body">
        <p className="gstat-lbl">{label}</p>
        <p className="gstat-val" style={{ color:c }}>{display}</p>
        <p className="gstat-unit">{unit}</p>
      </div>
      <div className="gstat-glow" style={{ background:`radial-gradient(circle at 0% 50%, ${c}18, transparent 70%)` }} />
    </div>
  );
}

function WeekNum({ label, value, c }) {
  return (
    <div className="wnum glass card-hover">
      <span className="wnum-val" style={{ color:c }}>{value}</span>
      <span className="wnum-lbl">{label}</span>
    </div>
  );
}

function fmt(n) { return Number(n).toLocaleString(); }
