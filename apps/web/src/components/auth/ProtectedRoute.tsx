import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { loginPathForProtectedRoute } from '../../lib/authRedirects';

export function ProtectedRoute() {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="auth-shell">
        <div className="auth-card">
          <p className="auth-lead">Loading your session…</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <Navigate
        to={loginPathForProtectedRoute(location.pathname, location.search)}
        replace
      />
    );
  }

  return <Outlet />;
}

export function GuestRoute() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="auth-shell">
        <div className="auth-card">
          <p className="auth-lead">Loading…</p>
        </div>
      </div>
    );
  }

  if (session) {
    return <Navigate to="/app" replace />;
  }

  return <Outlet />;
}
