import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getCommunicationSummary, listUserSubscriptions, WORKSPACE_MODE_LABELS } from '@bandie/data';
import { useAuth } from '../../context/AuthContext';
import { usePlayerWorkspaceAccess } from '../../hooks/usePlayerWorkspaceAccess';
import { getBandNavItems, getGlobalNavItems } from '../../lib/appNavigation';
import { BANDIE_BRAND_NAME } from '../../lib/brand';
import { resolveWorkspacePlanPill } from '../../lib/planPill';
import { usePlatformAccessMode } from '../../hooks/usePlatformAccessMode';
import { PlatformAccessModePill } from '../platform/PlatformAccessModePill';
import { BandieLogo } from '../brand/BandieLogo';
import { AppAccountMenu } from './AppAccountMenu';
import { AppNavLinks } from './AppNavLinks';

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

  const navOptions = {
    bandId,
    workspaceMode,
    adminModeActive,
    notificationCount,
    canBrowseBandDirectory: playerAccess.canBrowseBandDirectory,
    canBrowsePlayerDirectory: playerAccess.canBrowsePlayerDirectory,
  };

  const globalNavItems = getGlobalNavItems(navOptions);
  const bandNavItems = getBandNavItems(navOptions);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    }

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

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

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <header className="app-header">
      <div className="app-header-inner">
        <div className="app-header-primary">
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
            className={`app-header-nav app-header-nav-global ${menuOpen ? 'app-header-nav-open' : ''}`}
            aria-label="Workspace"
          >
            <AppNavLinks items={globalNavItems} onNavigate={closeMenu} />
            {menuOpen && bandNavItems.length > 0 ? (
              <div className="app-header-mobile-band-nav">
                <p className="app-header-mobile-band-label">This band</p>
                <AppNavLinks items={bandNavItems} onNavigate={closeMenu} />
              </div>
            ) : null}
          </nav>

          <div className={`app-header-account app-header-account-desktop ${menuOpen ? 'app-header-account-open' : ''}`}>
            <AppAccountMenu
              displayName={displayName}
              planPill={planPill}
              planPillTitle={planPillTitle}
              adminModeActive={adminModeActive}
              isAppAdmin={isAppAdmin}
              canSwitchWorkspaceMode={canSwitchWorkspaceMode}
              workspaceMode={workspaceMode}
              platformAccessMode={platformAccessMode}
              onSignOut={handleLogout}
              onNavigate={closeMenu}
            />
          </div>

          <div className={`app-header-account app-header-account-mobile ${menuOpen ? 'app-header-account-open' : ''}`}>
            <div className="app-header-account-mobile-badges">
              {adminModeActive ? <span className="app-admin-badge">Admin mode</span> : null}
              {platformAccessMode ? <PlatformAccessModePill status={platformAccessMode} /> : null}
              {planPill ? (
                <Link
                  to="/app/profile"
                  className={`app-plan-pill app-plan-pill-${planPill.tone}`}
                  title={planPillTitle}
                  onClick={closeMenu}
                >
                  {planPill.label}
                </Link>
              ) : null}
              {!adminModeActive && canSwitchWorkspaceMode ? (
                <span className="app-workspace-mode-badge">{WORKSPACE_MODE_LABELS[workspaceMode]}</span>
              ) : null}
            </div>
            {isAppAdmin ? (
              <Link to="/admin" className="app-header-nav-link" onClick={closeMenu}>
                Admin portal
              </Link>
            ) : null}
            <Link to="/app/profile" className="app-header-account-name" onClick={closeMenu}>
              {displayName}
            </Link>
            <button type="button" className="app-header-sign-out" onClick={handleLogout}>
              Sign out
            </button>
          </div>
        </div>

        {bandNavItems.length > 0 ? (
          <nav className="app-header-band-nav" aria-label="Band">
            <AppNavLinks
              items={bandNavItems}
              linkClassName="app-header-nav-link app-header-band-nav-link"
            />
          </nav>
        ) : null}
      </div>
    </header>
  );
}
