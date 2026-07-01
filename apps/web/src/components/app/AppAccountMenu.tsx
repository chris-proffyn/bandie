import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { WORKSPACE_MODE_LABELS, type PlatformAccessModeStatus, type WorkspaceMode } from '@bandie/data';
import { resolveWorkspacePlanPill } from '../../lib/planPill';
import { PlatformAccessModePill } from '../platform/PlatformAccessModePill';

type AppAccountMenuProps = {
  displayName: string;
  planPill: ReturnType<typeof resolveWorkspacePlanPill> | null;
  planPillTitle?: string;
  adminModeActive: boolean;
  isAppAdmin: boolean;
  canSwitchWorkspaceMode: boolean;
  workspaceMode: WorkspaceMode;
  platformAccessMode: PlatformAccessModeStatus | null;
  onSignOut: () => void;
  onNavigate: () => void;
};

export function AppAccountMenu({
  displayName,
  planPill,
  planPillTitle,
  adminModeActive,
  isAppAdmin,
  canSwitchWorkspaceMode,
  workspaceMode,
  platformAccessMode,
  onSignOut,
  onNavigate,
}: AppAccountMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }

    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  function close() {
    setOpen(false);
    onNavigate();
  }

  return (
    <div className="app-header-account-menu" ref={menuRef}>
      <button
        type="button"
        className="app-header-account-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="app-header-account-trigger-name">{displayName}</span>
        <span className="app-header-account-trigger-chevron" aria-hidden="true">
          ▾
        </span>
      </button>

      {open ? (
        <div className="app-header-account-dropdown" role="menu">
          <div className="app-header-account-dropdown-head">
            <span className="app-header-account-dropdown-name">{displayName}</span>
            <div className="app-header-account-dropdown-badges">
              {adminModeActive ? <span className="app-admin-badge">Admin mode</span> : null}
              {platformAccessMode ? <PlatformAccessModePill status={platformAccessMode} /> : null}
              {planPill ? (
                <Link
                  to="/app/profile"
                  className={`app-plan-pill app-plan-pill-${planPill.tone}`}
                  title={planPillTitle}
                  onClick={close}
                >
                  {planPill.label}
                </Link>
              ) : null}
              {!adminModeActive && canSwitchWorkspaceMode ? (
                <span className="app-workspace-mode-badge">
                  {WORKSPACE_MODE_LABELS[workspaceMode]}
                </span>
              ) : null}
            </div>
          </div>

          <Link to="/app/profile" className="app-header-account-dropdown-item" role="menuitem" onClick={close}>
            My profile
          </Link>
          {isAppAdmin ? (
            <Link to="/admin" className="app-header-account-dropdown-item" role="menuitem" onClick={close}>
              Admin portal
            </Link>
          ) : null}
          <button
            type="button"
            className="app-header-account-dropdown-item app-header-account-dropdown-sign-out"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onSignOut();
            }}
          >
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}
