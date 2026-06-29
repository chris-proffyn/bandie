import { Navigate, Outlet, useParams } from 'react-router-dom';
import { isBandRouteId } from '../../lib/bandRoutes';

/**
 * Guards `/app/:bandId/*` so reserved segments (e.g. `admin`) never reach band pages.
 */
export function BandScopedRoute() {
  const { bandId } = useParams();

  if (!isBandRouteId(bandId)) {
    if (bandId === 'admin') {
      return <Navigate to="/admin" replace />;
    }

    return <Navigate to="/app" replace />;
  }

  return <Outlet />;
}
