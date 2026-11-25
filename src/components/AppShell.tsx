import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  Compass,
  User,
  Settings,
  Plus,
  Sun,
  Moon,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { theme, toggleTheme } = useTheme();

  const navItems = [
    { to: '/home', label: 'Discover', icon: Compass },
    { to: '/profile', label: 'Profile', icon: User },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="app-shell">
      {/* Consumer Top Header (Desktop & Mobile) */}
      <header className="app-topbar">
        <div className="app-topbar-inner">
          <Link to="/home" className="app-brand">
            <img src="/assets/img/logo.svg" alt="MateEazy" width={34} height={34} />
            <span>
              Mate<span style={{ color: 'var(--coral)' }}>Eazy</span>
            </span>
          </Link>

          <nav className="app-desktop-nav" aria-label="Primary">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `topnav-pill ${isActive ? 'active' : ''}`
                  }
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              type="button"
              onClick={toggleTheme}
              className="icon-circle-btn"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            >
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <Link
              to="/listings/new"
              className="btn-primary"
              style={{ padding: '9px 16px', fontSize: 13 }}
            >
              <Plus size={16} />
              <span>List room</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="app-main">{children}</main>

      {/* Floating Pill Bottom Navigation (Mobile) */}
      <nav className="app-bottom-nav" aria-label="Primary">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `bottom-nav-item ${isActive ? 'active' : ''}`
              }
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
