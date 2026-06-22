import { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { creditsAPI } from '../api/client';
import '../styles/globals.css';

/* ── SVG Icons (inline, no external deps) ───────────────────────────── */
const icons = {
  home: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  roadmap: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="2" x2="12" y2="12" /><line x1="12" y1="12" x2="16" y2="16" />
    </svg>
  ),
  buddies: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  skills: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  ),
  profile: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="5" /><path d="M20 21a8 8 0 1 0-16 0" />
    </svg>
  ),
  bell: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
  creditCoin: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="M12 6v12" /><path d="M9 9h4a2 2 0 0 1 0 4H9" />
    </svg>
  ),
  menu: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  ),
  close: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
};

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: icons.home },
  { to: '/roadmap', label: 'Roadmap', icon: icons.roadmap },
  { to: '/buddies', label: 'Buddies', icon: icons.buddies },
  { to: '/skills', label: 'Skills', icon: icons.skills },
  { to: '/profile', label: 'Profile', icon: icons.profile },
];

/* Map current path to a page title */
function getPageTitle(pathname) {
  const map = {
    '/dashboard': 'Dashboard',
    '/roadmap': 'Learning Roadmap',
    '/buddies': 'Study Buddies',
    '/skills': 'Skill Exchange',
    '/profile': 'Profile',
  };
  if (pathname.startsWith('/roadmap/')) return 'Roadmap Detail';
  return map[pathname] || 'Dashboard';
}

export default function Layout() {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const setUser = useAuthStore((s) => s.setUser);
  const [credits, setCredits] = useState(user?.credits ?? 0);
  const [reputation, setReputation] = useState(user?.reputation ?? 0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  /* Fetch credit balance on mount and sync to authStore */
  useEffect(() => {
    creditsAPI.getBalance().then((res) => {
      setCredits(res.data.credits);
      setReputation(res.data.reputation);
      if (user) {
        setUser({ ...user, credits: res.data.credits, reputation: res.data.reputation });
      }
    }).catch(() => {});
  }, []);

  const pageTitle = getPageTitle(location.pathname);

  return (
    <div className="layout-shell">
      {/* ── Sidebar (desktop) ─────────────────────────────────────────── */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <span className="logo-icon">&#9670;</span>
            <span className="logo-text">Skill Sphere AI</span> 
          </div>
          {user?.student_id && (
            <span className="badge badge-rep mt-1">{user.student_id}</span>
          )}
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/dashboard'}
              className={({ isActive }) =>
                `sidebar-link${isActive ? ' active' : ''}`
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="credit-widget">
            <div className="credit-row">
              {icons.creditCoin}
              <span className="credit-value">{credits}</span>
              <span className="credit-label">Credits</span>
            </div>
            <div className="rep-row">
              <span className="badge badge-rep">RP {reputation}</span>
            </div>
          </div>

          <button className="btn btn-ghost logout-btn" onClick={logout}>
            Log out
          </button>
        </div>
      </aside>

      {/* ── Top bar (mobile) ──────────────────────────────────────────── */}
      <header className="topbar">
        <button
          className="btn btn-ghost topbar-menu-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? icons.close : icons.menu}
        </button>

        <h1 className="topbar-title">{pageTitle}</h1>

        <div className="topbar-right">
          {user?.student_id && (
            <span className="badge badge-rep hide-mobile">{user.student_id}</span>
          )}
          <div className="credit-chip">
            {icons.creditCoin}
            <span>{credits}</span>
          </div>
          <button className="btn btn-ghost icon-btn" aria-label="Notifications">
            {icons.bell}
          </button>
        </div>
      </header>

      {/* ── Mobile drawer overlay ─────────────────────────────────────── */}
      {mobileMenuOpen && (
        <div className="mobile-overlay" onClick={() => setMobileMenuOpen(false)}>
          <nav className="mobile-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="sidebar-header">
              <div className="sidebar-logo">
                <span className="logo-icon">&#9670;</span>
                <span className="logo-text">Skilla</span>
              </div>
              {user?.student_id && (
                <span className="badge badge-rep mt-1">{user.student_id}</span>
              )}
            </div>

            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/dashboard'}
                className={({ isActive }) =>
                  `sidebar-link${isActive ? ' active' : ''}`
                }
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            ))}

            <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
              <div className="credit-widget" style={{ margin: 0 }}>
                <div className="credit-row">
                  {icons.creditCoin}
                  <span className="credit-value">{credits}</span>
                  <span className="credit-label">Credits</span>
                </div>
                <div className="rep-row">
                  <span className="badge badge-rep">RP {reputation}</span>
                </div>
              </div>
              <button className="btn btn-ghost logout-btn" onClick={logout} style={{ marginTop: '0.75rem' }}>
                Log out
              </button>
            </div>
          </nav>
        </div>
      )}

      {/* ── Main content ──────────────────────────────────────────────── */}
      <main className="main-content">
        <Outlet />
      </main>

      {/* ── Bottom tab bar (mobile) ───────────────────────────────────── */}
      <nav className="bottom-tabs">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/dashboard'}
            className={({ isActive }) =>
              `bottom-tab${isActive ? ' active' : ''}`
            }
          >
            {item.icon}
            <span className="bottom-tab-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* ── Styles ────────────────────────────────────────────────────── */}
      <style>{`
        .layout-shell {
          display: flex;
          min-height: 100vh;
        }

        /* ── Sidebar ──────────────────────────────────────────── */
        .sidebar {
          width: 240px;
          min-width: 240px;
          background: var(--surface);
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          z-index: 50;
          padding: 1.25rem 0.75rem;
        }

        .sidebar-header {
          padding: 0 0.75rem;
          margin-bottom: 1.5rem;
        }

        .sidebar-logo {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .logo-icon {
          font-size: 1.5rem;
          color: var(--brand);
        }

        .logo-text {
          font-size: 1.2rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
          flex: 1;
        }

        .sidebar-link {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.65rem 0.75rem;
          border-radius: var(--radius);
          color: var(--text-secondary);
          font-size: 0.9rem;
          font-weight: 500;
          transition: all 0.15s ease;
        }
        .sidebar-link:hover {
          background: var(--bg);
          color: var(--text-primary);
        }
        .sidebar-link.active {
          background: var(--brand-light);
          color: var(--brand);
          font-weight: 600;
        }

        .sidebar-footer {
          padding-top: 1rem;
          border-top: 1px solid var(--border);
        }

        .credit-widget {
          background: var(--bg);
          border-radius: var(--radius);
          padding: 0.75rem;
          margin-bottom: 0.5rem;
        }
        .credit-row {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          color: var(--accent);
        }
        .credit-value {
          font-size: 1.1rem;
          font-weight: 700;
        }
        .credit-label {
          font-size: 0.75rem;
          color: var(--text-muted);
          margin-left: 0.15rem;
        }
        .rep-row {
          margin-top: 0.35rem;
        }

        .logout-btn {
          width: 100%;
          justify-content: center;
          font-size: 0.85rem;
        }

        /* ── Top bar ──────────────────────────────────────────── */
        .topbar {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 56px;
          background: var(--surface);
          border-bottom: 1px solid var(--border);
          z-index: 40;
          padding: 0 1rem;
          align-items: center;
          gap: 0.75rem;
        }
        .topbar-title {
          font-size: 1.05rem;
          font-weight: 600;
          flex: 1;
          color: var(--text-primary);
        }
        .topbar-right {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .topbar-menu-btn {
          padding: 0.4rem;
        }
        .icon-btn {
          padding: 0.4rem;
          color: var(--text-muted);
        }

        .credit-chip {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          background: var(--accent-light);
          color: var(--accent);
          font-weight: 700;
          font-size: 0.85rem;
          padding: 0.3rem 0.65rem;
          border-radius: 9999px;
        }

        /* ── Main content ─────────────────────────────────────── */
        .main-content {
          flex: 1;
          margin-left: 240px;
          padding: 1.5rem;
          overflow-y: auto;
          min-height: 100vh;
        }

        /* ── Mobile drawer ────────────────────────────────────── */
        .mobile-overlay {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.4);
          z-index: 60;
        }
        .mobile-drawer {
          width: 280px;
          height: 100%;
          background: var(--surface);
          display: flex;
          flex-direction: column;
          padding: 1.25rem 0.75rem;
          overflow-y: auto;
        }

        /* ── Bottom tabs ──────────────────────────────────────── */
        .bottom-tabs {
          display: none;
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: 62px;
          background: var(--surface);
          border-top: 1px solid var(--border);
          z-index: 40;
          padding: 0.35rem 0;
          justify-content: space-around;
          align-items: center;
        }
        .bottom-tab {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.15rem;
          color: var(--text-muted);
          font-size: 0.65rem;
          padding: 0.25rem 0.5rem;
          border-radius: var(--radius);
          transition: color 0.15s;
          min-width: 56px;
        }
        .bottom-tab.active {
          color: var(--brand);
        }
        .bottom-tab-label {
          font-weight: 500;
          white-space: nowrap;
        }

        /* ── Responsive ───────────────────────────────────────── */
        @media (max-width: 768px) {
          .sidebar {
            display: none;
          }
          .topbar {
            display: flex;
          }
          .main-content {
            margin-left: 0;
            padding: 1rem;
            padding-top: 68px;
            padding-bottom: 74px;
          }
          .bottom-tabs {
            display: flex;
          }
          .mobile-overlay {
            display: block;
          }
          .hide-mobile {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
