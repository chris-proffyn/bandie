import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getCommunicationSummary, listUserSubscriptions, WORKSPACE_MODE_LABELS } from '@bandie/data';
import { useAuth } from '../../context/AuthContext';
import { usePlayerWorkspaceAccess } from '../../hooks/usePlayerWorkspaceAccess';
import { getAppNavMenuSections } from '../../lib/appNavigation';
import { BANDIE_BRAND_NAME } from '../../lib/brand';
import { resolveWorkspacePlanPill } from '../../lib/planPill';
import { usePlatformAccessMode } from '../../hooks/usePlatformAccessMode';
import { PlatformAccessModePill } from '../platform/PlatformAccessModePill';
import { BandieLogo } from '../brand/BandieLogo';
import { AppHeaderMenuModal } from './AppHeaderMenuModal';
import { FeedbackDialog } from './FeedbackDialog';

type AppHeaderProps = {
  bandId?: string;
};

function MenuIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M6 6l12 12M18 6L6 18"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function AppHeader({ bandId }: AppHeaderProps) {
  const location = useLocation();
  const { displayName, logout, adminModeActive, workspaceMode, canSwitchWorkspaceMode, session, isAppAdmin, user } =
    useAuth();
  const { access: playerAccess } = usePlayerWorkspaceAccess();
  const [menuOpen, setMenuOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
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

  const menuSections = getAppNavMenuSections(navOptions);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

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
      return `${planPill.planName} plan`;
    }

    return `${planPill.label} plan`;
  }, [planPill]);

  function openFeedback() {
    setMenuOpen(false);
    setFeedbackOpen(true);
  }

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
        <div className="app-header-toolbar">
          <Link to="/" className="app-header-brand" aria-label="Bandie home">
            <BandieLogo className="app-header-brand-mark" />
            <span>{BANDIE_BRAND_NAME}</span>
          </Link>

          <div className="app-header-status">
            {adminModeActive ? <span className="app-admin-badge">Admin mode</span> : null}
            {platformAccessMode ? <PlatformAccessModePill status={platformAccessMode} /> : null}
            {planPill ? (
              <span
                className={`app-plan-pill app-plan-pill-${planPill.tone}`}
                title={planPillTitle}
              >
                {planPill.label}
              </span>
            ) : null}
          </div>

          <div className="app-header-identity">
            {session ? (
              <button
                type="button"
                className="app-header-feedback-btn"
                onClick={openFeedback}
              >
                Feedback
              </button>
            ) : null}
            <span className="app-header-display-name">{displayName}</span>
            <button
              type="button"
              className="app-header-menu-toggle"
              aria-expanded={menuOpen}
              aria-controls="app-header-menu"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <MenuIcon open={menuOpen} />
            </button>
          </div>
        </div>

      </div>

      <AppHeaderMenuModal
        open={menuOpen}
        onClose={closeMenu}
        sections={menuSections}
        workspaceModeLabel={
          !adminModeActive && canSwitchWorkspaceMode ? WORKSPACE_MODE_LABELS[workspaceMode] : null
        }
        showAdminPortal={isAppAdmin}
        onLogout={handleLogout}
      />

      {session ? (
        <FeedbackDialog
          open={feedbackOpen}
          onClose={() => setFeedbackOpen(false)}
          displayName={displayName}
          email={user?.email ?? null}
          pageUrl={`${window.location.origin}${location.pathname}${location.search}`}
        />
      ) : null}
    </header>
  );
}
