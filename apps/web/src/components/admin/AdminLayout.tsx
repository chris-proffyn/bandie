import { NavLink, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/admin.css';

const ADMIN_NAV = [
  { label: 'Overview', to: '/admin' },
  { label: 'Accounts', to: '/admin/accounts' },
  { label: 'Metrics', to: '/admin/metrics' },
  { label: 'Entitlements', to: '/admin/entitlements' },
  { label: 'Audit log', to: '/admin/audit' },
];

export function AdminLayout() {
  const { isAppAdmin, loading } = useAuth();

  if (loading) {
    return <p className="workspace-empty-note">Loading admin portal…</p>;
  }

  if (!isAppAdmin) {
    return <Navigate to="/app" replace />;
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar panel">
        <p className="my-bands-eyebrow">Platform admin</p>
        <h1>Bandie admin</h1>
        <nav className="admin-nav">
          {ADMIN_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/admin'}
              className={({ isActive }) => `admin-nav-link${isActive ? ' active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <NavLink to="/app" className="admin-back-link">
          Back to app
        </NavLink>
      </aside>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
