import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { getCommunicationSummary, listUserSubscriptions, WORKSPACE_MODE_LABELS } from '@bandie/data';
import { useAuth } from '../../context/AuthContext';
import { usePlayerWorkspaceAccess } from '../../hooks/usePlayerWorkspaceAccess';
import { getAppNavItems } from '../../lib/appNavigation';
import { BANDIE_BRAND_NAME } from '../../lib/brand';
import { resolveWorkspacePlanPill } from '../../lib/planPill';
import { usePlatformAccessMode } from '../../hooks/usePlatformAccessMode';
import { PlatformAccessModePill } from '../platform/PlatformAccessModePill';
import { BandieLogo } from '../brand/BandieLogo';

type AppHeaderProps = {
  bandId?: string;
};

export function AppHeader({ bandId }: AppHeaderProps) {
  const location = useLocation();
  const { displayName, logout, adminModeActive, workspaceMode, canSwitchWorkspaceMode, session, isAppAdmin } =
    useAuth();
  const { access: playerAccess } = usePlayerWorkspaceAccess();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [planPill, setPlanPill] = useState<ReturnType<typeof resolveWorkspacePlanPill> | null>(null);
  const platformAccessMode = usePlatformAccessMode();
  const navItems = getAppNavItems({
    bandId,
    workspaceMode,
    adminModeActive,
    notificationCount,
    canBrowseBandDirectory: playerAccess.canBrowseBandDirectory,
    canBrowsePlayerDirectory: playerAccess.canBrowsePlayerDirectory,
  });

  useEffect(() => {
    if (!session) {
      setNotificationCount(0);
      return;
    }

    getCommunicationSummary()
      .then((summary) => setNotificationCount(summary.total))
      .catch(() => setNotificationCount(0));
  }, [session, workspaceMode, bandId, location.pathname]);

  useEffect(() => {
    if (!session) {
      setPlanPill(null);
      return;
    }

    listUserSubscriptions()
      .then((subscriptions) => setPlanPill(resolveWorkspacePlanPill(subscriptions, workspaceMode)))
      .catch(() =>
        setPlanPill(resolveWorkspacePlanPill([], workspaceMode)),
      );
  }, [session, workspaceMode, location.pathname]);

  const planPillTitle = useMemo(() => {
    if (!planPill) {
      return undefined;
    }

    if (planPill.planName) {
      return `${planPill.planName} plan — view billing`;
    }

    return `${planPill.label} plan — view billing`;
  }, [planPill]);

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
          {platformAccessMode ? <PlatformAccessModePill status={platformAccessMode} /> : null}
          {planPill ? (
            <Link
              to="/app/profile"
              className={`app-plan-pill app-plan-pill-${planPill.tone}`}
              title={planPillTitle}
              onClick={() => setMenuOpen(false)}
            >
              {planPill.label}
            </Link>
          ) : null}
          {isAppAdmin ? (
            <Link to="/admin" className="app-header-nav-link" onClick={() => setMenuOpen(false)}>
              Admin portal
            </Link>
          ) : null}
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
