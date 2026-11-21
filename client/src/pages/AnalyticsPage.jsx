import { useState, useEffect } from 'react';
import { getAnalytics } from '../api/analytics';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, LineChart, Line,
} from 'recharts';
import './AnalyticsPage.css';

const COLORS = ['#22c55e','#3b82f6','#f59e0b','#f97316','#ec4899','#8b5cf6','#ef4444'];

export default function AnalyticsPage() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { data: d } = await getAnalytics();
        setData(d);
      } catch (err) {
        setError(err.response?.status === 401
          ? 'Session expired — please log in again.'
          : 'Cannot reach server. Start XAMPP + run: cd server && node index.js');
      } finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <div className="loading-spinner">Loading analytics…</div>;
  if (error)   return <div className="alert alert-error">{error}<br /><small>Fix: Start XAMPP MySQL → run <code>cd server &amp;&amp; node index.js</code></small></div>;

  const { summary, weekly, monthly, byType } = data;
  const isEmpty = summary.total_workouts === 0;

  const weeklyLabelled  = weekly.map(w => ({
    ...w,
    label: new Date(w.week_start).toLocaleDateString('en-GB', { month:'short', day:'numeric' }),
  }));

  return (
    <div className="analytics-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Progress Analytics</h1>
          <p className="page-subtitle">Track your fitness journey over time</p>
        </div>
      </div>

      {isEmpty ? (
        <div className="empty-state card">
          <h3>No data yet</h3>
          <p>Log some workouts and your charts will appear here.</p>
        </div>
      ) : (
        <div className="analytics-grid">

          {/* Weekly duration + calories */}
          <div className="card chart-card span-2">
            <h2 className="chart-title">Weekly Duration &amp; Calories (last 8 weeks)</h2>
            {weeklyLabelled.length === 0 ? <EmptyChart /> : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={weeklyLabelled} margin={{ top:8, right:8, left:-10, bottom:0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill:'#555f75' }} />
                  <YAxis tick={{ fontSize: 11, fill:'#555f75' }} />
                  <Tooltip contentStyle={{ background:'#0d0d0d', border:'1px solid #1e1e1e', borderRadius:8, color:'#f0f2f8', fontSize:12 }} cursor={{ fill:'rgba(34,197,94,.06)' }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="duration" name="Duration (min)" fill="#22c55e" radius={[4,4,0,0]} />
                  <Bar dataKey="calories" name="Calories" fill="#f97316" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Monthly frequency */}
          <div className="card chart-card span-2">
            <h2 className="chart-title">Monthly Workout Frequency (last 6 months)</h2>
            {monthly.length === 0 ? <EmptyChart /> : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={monthly} margin={{ top:8, right:8, left:-10, bottom:0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill:'#555f75' }} />
                  <YAxis tick={{ fontSize: 11, fill:'#555f75' }} allowDecimals={false} />
                  <Tooltip contentStyle={{ background:'#0d0d0d', border:'1px solid #1e1e1e', borderRadius:8, color:'#f0f2f8', fontSize:12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="workouts" name="Workouts"       stroke="#22c55e" strokeWidth={2.5} dot={{ r:4, fill:'#22c55e' }} />
                  <Line type="monotone" dataKey="duration" name="Duration (min)" stroke="#3b82f6" strokeWidth={2.5} dot={{ r:4, fill:'#3b82f6' }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Workout type breakdown */}
          {byType.length > 0 && (
            <div className="card chart-card">
              <h2 className="chart-title">Workouts by Type</h2>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={byType} dataKey="value" nameKey="name"
                    cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`}>
                    {byType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Summary stats */}
          <div className="card chart-card analytics-stats">
            <h2 className="chart-title">All-Time Totals</h2>
            <div className="stats-list">
              <StatRow icon="🏋️" label="Total workouts"  value={summary.total_workouts} />
              <StatRow icon="⏱️" label="Total duration"  value={`${summary.total_duration.toLocaleString()} min`} />
              <StatRow icon="🔥" label="Calories burned" value={`${summary.total_calories.toLocaleString()} kcal`} />
              <StatRow icon="📍" label="Distance"        value={`${Number(summary.total_distance).toFixed(1)} km`} />
              <StatRow icon="🎯" label="Goals active"    value={summary.active_goals} />
              <StatRow icon="✅" label="Goals completed" value={summary.completed_goals} />
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

function EmptyChart() {
  return <p className="chart-empty">No data in this period yet.</p>;
}
function StatRow({ icon, label, value }) {
  return (
    <div className="stat-row">
      <span className="stat-row-icon">{icon}</span>
      <span className="stat-row-label">{label}</span>
      <span className="stat-row-value">{value}</span>
    </div>
  );
}
