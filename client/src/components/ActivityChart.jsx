/**
 * ActivityChart — real daily workout data with 7/30/90 day toggle
 * Uses GET /api/analytics/daily?days=N
 * Fills missing days with 0 so x-axis always shows every day
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import { getDailyChart } from '../api/analytics';
import './ActivityChart.css';

const METRICS = [
  { key: 'duration', label: 'Duration',  unit: 'min',  color: '#22c55e' },
  { key: 'calories', label: 'Calories',  unit: 'kcal', color: '#f97316' },
  { key: 'workouts', label: 'Workouts',  unit: '',     color: '#3b82f6' },
];
const RANGES = [
  { days: 7,  label: '7 days'  },
  { days: 30, label: '30 days' },
  { days: 90, label: '90 days' },
];

function ChartSkeleton() {
  return (
    <div className="ac-skeleton" aria-label="Loading chart…">
      <div className="ac-skeleton-bar" style={{ height: 180 }} />
    </div>
  );
}

function pctStr(n) {
  if (n === null || n === undefined) return null;
  const sign = n >= 0 ? '+' : '';
  return `${sign}${n}%`;
}

export default function ActivityChart() {
  const [days,    setDays]    = useState(7);
  const [metric,  setMetric]  = useState('duration');
  const [chart,   setChart]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError('');
    getDailyChart(days)
      .then(({ data }) => { if (!cancelled) setChart(data); })
      .catch(() => { if (!cancelled) setError('Could not load chart data.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [days]);

  const m = METRICS.find(x => x.key === metric);
  const hasData = chart && chart.summary.total_workouts > 0;
  const change  = chart?.summary[`change_${metric}`];
  const changeTxt = pctStr(change);

  // Custom tooltip
  function CustomTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    return (
      <div className="ac-tooltip">
        <p className="ac-tooltip-date">{d?.fullLabel || label}</p>
        <p className="ac-tooltip-row"><span style={{ color:'#22c55e' }}>Duration:</span> {d?.duration} min</p>
        <p className="ac-tooltip-row"><span style={{ color:'#f97316' }}>Calories:</span> {d?.calories} kcal</p>
        <p className="ac-tooltip-row"><span style={{ color:'#3b82f6' }}>Workouts:</span> {d?.workouts}</p>
      </div>
    );
  }

  return (
    <div className="ac-wrap card" aria-label={`Activity chart — ${m.label} over ${days} days`}>
      {/* Header */}
      <div className="ac-header">
        <div className="ac-left">
          <h2 className="ac-title">Activity Overview</h2>
          {chart && (
            <p className="ac-summary">
              {chart.summary[`total_${metric === 'workouts' ? 'workouts' : metric}`]?.toLocaleString()}
              {m.unit ? ` ${m.unit}` : ''} total
              {changeTxt && (
                <span className={`ac-change ${change >= 0 ? 'pos' : 'neg'}`}>
                  {changeTxt} vs prev period
                </span>
              )}
            </p>
          )}
        </div>
        <div className="ac-controls">
          {/* Metric tabs */}
          <div className="ac-tabs">
            {METRICS.map(met => (
              <button key={met.key}
                className={`ac-tab${metric === met.key ? ' active' : ''}`}
                onClick={() => setMetric(met.key)}
                style={metric === met.key ? { color: met.color, borderColor: met.color } : {}}
              >
                {met.label}
              </button>
            ))}
          </div>
          {/* Range selector */}
          <div className="ac-ranges">
            {RANGES.map(r => (
              <button key={r.days}
                className={`ac-range${days === r.days ? ' active' : ''}`}
                onClick={() => setDays(r.days)}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart body */}
      {error ? (
        <div className="ac-error">
          <span>⚠️ {error}</span>
          <button className="btn btn-outline ac-retry" onClick={() => setDays(d => d)}>Retry</button>
        </div>
      ) : loading ? (
        <ChartSkeleton />
      ) : !hasData ? (
        <div className="ac-empty">
          <div className="ac-empty-icon">📊</div>
          <p className="ac-empty-text">No workouts yet. Log your first workout to see your progress here.</p>
          <Link to="/workouts/new" className="btn btn-primary ac-empty-btn">Log a workout</Link>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chart.data} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}>
            <defs>
              <linearGradient id={`acGrad-${m.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={m.color} stopOpacity={0.28} />
                <stop offset="95%" stopColor={m.color} stopOpacity={0}    />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.05)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: '#555f75' }}
              axisLine={false} tickLine={false}
              interval={days <= 7 ? 0 : days <= 30 ? 4 : 9}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#555f75' }}
              axisLine={false} tickLine={false}
              tickFormatter={v => v === 0 ? '0' : `${v}${m.unit ? ' ' + m.unit : ''}`}
              width={m.unit ? 52 : 28}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,.1)', strokeWidth: 1 }} />
            <Area
              type="monotone"
              dataKey={m.key}
              name={m.label}
              stroke={m.color}
              strokeWidth={2.5}
              strokeLinecap="round"
              fill={`url(#acGrad-${m.key})`}
              dot={false}
              activeDot={{ r: 5, fill: m.color, stroke: '#000', strokeWidth: 2 }}
              animationDuration={600}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
