import { Outlet, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AppHeader } from './AppHeader';
import { BandSwitcher } from './BandSwitcher';
import '../../styles/auth.css';

export function AppLayout() {
  const { bandId } = useParams();
  const { bands } = useAuth();
  const showBandSwitcher = Boolean(bandId && bands.length > 0);

  return (
    <div className="app-shell">
      <AppHeader bandId={bandId} />

      <div className={`app-body ${showBandSwitcher ? 'app-body-with-sidebar' : ''}`}>
        {showBandSwitcher ? (
          <aside className="app-sidebar app-sidebar-compact" aria-label="Band switcher">
            <BandSwitcher currentBandId={bandId} />
          </aside>
        ) : null}

        <main className="app-main app-main-workspace">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
