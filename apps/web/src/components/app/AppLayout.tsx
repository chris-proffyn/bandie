import { Link, NavLink, Outlet, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { BandSwitcher } from './BandSwitcher';
import '../../styles/auth.css';

export function AppLayout() {
  const { logout, user, displayName, isAppAdmin } = useAuth();
  const { bandId } = useParams();

  function handleLogout() {
    void logout();
  }

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="app-sidebar-brand">
          <Link to="/" className="auth-brand" aria-label="Bandie home">
            <span className="auth-brand-mark">B</span>
            <span>Bandie</span>
          </Link>
          {isAppAdmin ? <span className="app-admin-badge">Admin</span> : null}
        </div>

        <BandSwitcher currentBandId={bandId} />

        <nav aria-label="Band workspace">
          <NavLink to="/app" end className="app-nav-link">
            My bands
          </NavLink>
          <NavLink to="/app/profile" className="app-nav-link">
            My profile
          </NavLink>
          <NavLink to="/app/bands" className="app-nav-link">
            Band directory
          </NavLink>
          <NavLink to="/app/players" className="app-nav-link">
            Player directory
          </NavLink>
          {bandId ? (
            <NavLink to={`/app/${bandId}`} end className="app-nav-link">
              Overview
            </NavLink>
          ) : null}
        </nav>

        <div style={{ marginTop: 'auto' }}>
          <Link to="/app/profile" className="app-nav-link" style={{ display: 'block', marginBottom: '0.75rem' }}>
            {displayName}
          </Link>
          <p style={{ color: '#bbb6aa', fontSize: '0.85rem', margin: '0 0 0.75rem' }}>{user?.email}</p>
          <button type="button" className="auth-button auth-button-secondary" onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </aside>
      <main className="app-main app-main-workspace">
        <Outlet />
      </main>
    </div>
  );
}
