import { Outlet, useParams } from 'react-router-dom';
import { AppHeader } from './AppHeader';
import '../../styles/auth.css';

export function AppLayout() {
  const { bandId } = useParams();

  return (
    <div className="app-shell">
      <AppHeader bandId={bandId} />

      <div className="app-body">
        <main className="app-main app-main-workspace">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
