import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

const navGroups = [
  {
    label: 'Main',
    items: [
      { to: '/',          label: 'Overview',    icon: '📊' },
      { to: '/exercises', label: 'Exercises',   icon: '💪' },
      { to: '/workouts',  label: 'Workout Log', icon: '🏋️' },
      { to: '/timer',     label: 'Workout Timer', icon: '⏱️' },
    ],
  },
  {
    label: 'Health',
    items: [
      { to: '/diet',         label: 'Diet Plan',      icon: '🥗' },
      { to: '/water',        label: 'Water Tracker',  icon: '💧' },
      { to: '/measurements', label: 'Measurements',   icon: '📏' },
      { to: '/bmi',          label: 'BMI Calculator', icon: '⚖️' },
      { to: '/goals',        label: 'Goals',          icon: '🎯' },
      { to: '/achievements', label: 'Achievements',   icon: '🏆' },
      { to: '/analytics',   label: 'Progress',       icon: '📈' },
    ],
  },
  {
    label: 'Account',
    items: [
      { to: '/profile', label: 'Profile', icon: '👤' },
    ],
  },
];

// Flat list for mobile bottom nav (most important 5)
const bottomNav = [
  { to: '/',          label: 'Home',     icon: '📊' },
  { to: '/exercises', label: 'Exercise', icon: '💪' },
  { to: '/timer',     label: 'Timer',    icon: '⏱️' },
  { to: '/diet',      label: 'Diet',     icon: '🥗' },
  { to: '/goals',     label: 'Goals',    icon: '🎯' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  function handleLogout() { logout(); navigate('/login'); }
  const initial = user?.name?.[0]?.toUpperCase() ?? '?';

  return (
    <div className="app-shell">
      {/* ── Desktop sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span className="logo-icon">⚡</span>
          <span className="logo-text">FitPulse</span>
        </div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          {navGroups.map(group => (
            <div key={group.label}>
              <p className="nav-section-label">{group.label}</p>
              {group.items.map(({ to, label, icon }) => (
                <NavLink key={to} to={to} end={to === '/'}
                  className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
                  <span className="nav-icon" aria-hidden="true">{icon}</span>
                  <span>{label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{initial}</div>
            <span className="user-name" title={user?.email}>{user?.name}</span>
          </div>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </aside>

      {/* ── Mobile topbar ── */}
      <header className="mobile-topbar">
        <span className="mobile-logo">⚡ FitPulse</span>
        <div className="mobile-topbar-right">
          <span className="mobile-user">{user?.name?.split(' ')[0]}</span>
          <button className="mobile-menu-btn" onClick={() => setMenuOpen(o => !o)}
            aria-label="Toggle menu" aria-expanded={menuOpen}>
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </header>

      {menuOpen && (
        <div className="mobile-menu">
          {navGroups.flatMap(g => g.items).map(({ to, label, icon }) => (
            <NavLink key={to} to={to} end={to === '/'}
              className={({ isActive }) => `mobile-menu-item${isActive ? ' active' : ''}`}
              onClick={() => setMenuOpen(false)}>
              <span>{icon}</span>{label}
            </NavLink>
          ))}
          <button className="mobile-menu-logout" onClick={handleLogout}>Logout</button>
        </div>
      )}

      <main className="main-content"><Outlet /></main>

      {/* ── Mobile bottom nav ── */}
      <nav className="mobile-bottom-nav" aria-label="Quick navigation">
        {bottomNav.map(({ to, label, icon }) => (
          <NavLink key={to} to={to} end={to === '/'}
            className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}>
            <span className="bottom-nav-icon" aria-hidden="true">{icon}</span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
