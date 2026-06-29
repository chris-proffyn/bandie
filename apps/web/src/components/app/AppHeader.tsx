import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { getNotificationSummary, WORKSPACE_MODE_LABELS } from '@bandie/data';
import { useAuth } from '../../context/AuthContext';
import { getAppNavItems } from '../../lib/appNavigation';
import { BANDIE_BRAND_NAME } from '../../lib/brand';
import { BandieLogo } from '../brand/BandieLogo';

type AppHeaderProps = {
  bandId?: string;
};

export function AppHeader({ bandId }: AppHeaderProps) {
  const { displayName, logout, adminModeActive, workspaceMode, canSwitchWorkspaceMode, session } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const navItems = getAppNavItems({
    bandId,
    workspaceMode,
    adminModeActive,
    notificationCount,
  });

  useEffect(() => {
    if (!session || workspaceMode === 'organiser') {
      setNotificationCount(0);
      return;
    }

    getNotificationSummary()
      .then((summary) => setNotificationCount(summary.total))
      .catch(() => setNotificationCount(0));
  }, [session, workspaceMode, bandId]);

  function handleLogout() {
    setMenuOpen(false);
    void logout();
  }

  return (
    <header className="app-header">
      <div className="app-header-inner">
        <Link to="/" className="app-header-brand" aria-label="Bandie home">
          <BandieLogo className="app-header-brand-mark" />
          <span>{BANDIE_BRAND_NAME}</span>
        </Link>

        <button
          type="button"
          className="app-header-toggle"
          aria-expanded={menuOpen}
          aria-controls="app-header-nav"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? 'Close menu' : 'Menu'}
        </button>

        <nav
          id="app-header-nav"
          className={`app-header-nav ${menuOpen ? 'app-header-nav-open' : ''}`}
          aria-label="Workspace"
        >
          {navItems.map((item) => (
            <NavLink
              key={`${item.to}-${item.label}`}
              to={item.to}
              end={item.end}
              className="app-header-nav-link"
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
              {item.badge ? <span className="app-header-nav-badge">{item.badge}</span> : null}
            </NavLink>
          ))}
        </nav>

        <div className={`app-header-account ${menuOpen ? 'app-header-account-open' : ''}`}>
          {adminModeActive ? <span className="app-admin-badge">Admin mode</span> : null}
          {!adminModeActive && canSwitchWorkspaceMode ? (
            <span className="app-workspace-mode-badge">{WORKSPACE_MODE_LABELS[workspaceMode]}</span>
          ) : null}
          <Link to="/app/profile" className="app-header-account-name" onClick={() => setMenuOpen(false)}>
            {displayName}
          </Link>
          <button type="button" className="app-header-sign-out" onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
