import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  Compass,
  User,
  Settings,
  PlusCircle,
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
      {/* Desktop Sidebar */}
      <aside className="app-sidebar">
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '6px 10px 18px',
          }}
        >
          <img src="/assets/img/logo.svg" alt="MateEazy" width={36} height={36} />
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: 20,
            }}
          >
            MateEazy
          </span>
        </Link>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `sidebar-item ${isActive ? 'active' : ''}`
                }
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}

          <Link
            to="/listings/new"
            className="btn-primary"
            style={{ marginTop: 14, width: '100%' }}
          >
            <PlusCircle size={18} />
            <span>Post a room</span>
          </Link>
        </nav>

        <button
          type="button"
          onClick={toggleTheme}
          className="sidebar-item"
          style={{ border: 'none', background: 'transparent', width: '100%' }}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
        </button>
      </aside>

      {/* Main Content */}
      <main className="app-main">{children}</main>

      {/* Mobile Bottom Navigation */}
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
              <Icon size={21} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
