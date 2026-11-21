import { useState, useEffect, useRef, useCallback } from 'react';
import './TimerPage.css';

const PRESETS = [
  { name:'HIIT 30/10', label:'HIIT 30/10', work:30, rest:10, rounds:8 },
  { name:'Tabata',     label:'Tabata',      work:20, rest:10, rounds:8 },
  { name:'Boxing 3min',label:'Boxing 3min', work:180, rest:60, rounds:3 },
  { name:'Custom',     label:'Custom',      work:30, rest:15, rounds:5 },
];

export default function TimerPage() {
  const [preset, setPreset]           = useState(PRESETS[0]);
  const [customWork, setCustomWork]   = useState(30);
  const [customRest, setCustomRest]   = useState(15);
  const [customRounds, setCustomRounds] = useState(5);

  const [phase, setPhase]   = useState('idle'); // idle | work | rest | done
  const [round, setRound]   = useState(1);
  const [timeLeft, setTimeLeft] = useState(PRESETS[0].work);
  const [running, setRunning]   = useState(false);
  const intervalRef = useRef(null);

  const cfg = preset.name === 'Custom'
    ? { work: customWork, rest: customRest, rounds: customRounds }
    : preset;

  const reset = useCallback(() => {
    clearInterval(intervalRef.current);
    setRunning(false); setPhase('idle'); setRound(1); setTimeLeft(cfg.work);
  }, [cfg.work]);

  // Reset when preset changes
  useEffect(() => { reset(); }, [preset, customWork, customRest, customRounds]);

  useEffect(() => {
    if (!running) { clearInterval(intervalRef.current); return; }
    intervalRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t > 1) return t - 1;
        // Time's up for this phase
        clearInterval(intervalRef.current);
        setPhase(p => {
          if (p === 'work') {
            setTimeLeft(cfg.rest); setRunning(true); return 'rest';
          } else {
            // end of rest
            setRound(r => {
              if (r >= cfg.rounds) { setPhase('done'); setRunning(false); setTimeLeft(0); return r; }
              setTimeLeft(cfg.work); setRunning(true);
              setPhase('work');
              return r + 1;
            });
            return p; // will be overwritten above
          }
        });
        return 0;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [running, cfg]);

  function start() {
    if (phase === 'idle' || phase === 'done') {
      setRound(1); setPhase('work'); setTimeLeft(cfg.work);
    }
    setRunning(true);
  }

  const totalTime = cfg.work + cfg.rest;
  const phaseDuration = phase === 'rest' ? cfg.rest : cfg.work;
  const progress = phaseDuration > 0 ? ((phaseDuration - timeLeft) / phaseDuration) * 100 : 0;
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference - (progress / 100) * circumference;

  const phaseColor = phase === 'work' ? 'var(--color-accent)' : phase === 'rest' ? 'var(--color-accent2)' : 'var(--color-border)';

  function fmt(s) {
    const m = Math.floor(s / 60).toString().padStart(2,'0');
    const sec = (s % 60).toString().padStart(2,'0');
    return `${m}:${sec}`;
  }

  return (
    <div className="timer-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Workout Timer</h1>
          <p className="page-subtitle">Interval timer for your training sessions</p>
        </div>
      </div>

      {/* Preset tabs */}
      <div className="timer-presets">
        {PRESETS.map(p => (
          <button key={p.name} className={`preset-tab${preset.name===p.name?' active':''}`}
            onClick={() => setPreset(p)}>
            {p.label}
          </button>
        ))}
      </div>

      {/* Custom inputs */}
      {preset.name === 'Custom' && (
        <div className="card custom-inputs">
          <div className="custom-input-group">
            <label className="form-label">Work (sec)</label>
            <input type="number" min="5" className="form-input" value={customWork} onChange={e=>setCustomWork(Number(e.target.value))} />
          </div>
          <div className="custom-input-group">
            <label className="form-label">Rest (sec)</label>
            <input type="number" min="0" className="form-input" value={customRest} onChange={e=>setCustomRest(Number(e.target.value))} />
          </div>
          <div className="custom-input-group">
            <label className="form-label">Rounds</label>
            <input type="number" min="1" className="form-input" value={customRounds} onChange={e=>setCustomRounds(Number(e.target.value))} />
          </div>
        </div>
      )}

      {/* Timer display */}
      <div className="timer-display card">
        <div className="timer-info-row">
          <span className="timer-phase-label" style={{color: phaseColor}}>
            {phase === 'idle' ? 'Ready' : phase === 'done' ? '🎉 Complete!' : phase === 'work' ? 'WORK' : 'REST'}
          </span>
          <span className="timer-round-label">Round {round} / {cfg.rounds}</span>
        </div>

        {/* SVG ring */}
        <div className="timer-ring-wrap">
          <svg viewBox="0 0 200 200" className="timer-ring">
            <circle cx="100" cy="100" r={radius} fill="none" stroke="var(--color-border)" strokeWidth="10" />
            <circle cx="100" cy="100" r={radius} fill="none"
              stroke={phaseColor} strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeOffset}
              transform="rotate(-90 100 100)"
              style={{transition:'stroke-dashoffset .5s linear, stroke .3s'}}
            />
          </svg>
          <div className="timer-time">{phase === 'done' ? '00:00' : fmt(timeLeft)}</div>
        </div>

        <div className="timer-summary">
          <span>Work: <strong>{fmt(cfg.work)}</strong></span>
          <span>Rest: <strong>{fmt(cfg.rest)}</strong></span>
          <span>Total: <strong>{fmt(cfg.rounds * totalTime)}</strong></span>
        </div>

        <div className="timer-controls">
          {!running && phase !== 'done' && (
            <button className="btn btn-primary timer-btn" onClick={start}>
              {phase === 'idle' ? '▶ Start' : '▶ Resume'}
            </button>
          )}
          {running && (
            <button className="btn btn-secondary timer-btn" onClick={() => setRunning(false)}>
              ⏸ Pause
            </button>
          )}
          <button className="btn btn-outline timer-btn" onClick={reset}>↺ Reset</button>
        </div>
      </div>

      {/* Round progress dots */}
      <div className="rounds-dots">
        {Array.from({length: cfg.rounds}).map((_,i) => (
          <div key={i} className={`round-dot${i < round - 1 ? ' done' : i === round - 1 && phase !== 'idle' ? ' active' : ''}`} />
        ))}
      </div>
    </div>
  );
}
