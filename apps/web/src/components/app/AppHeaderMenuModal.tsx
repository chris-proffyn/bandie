import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import type { AppNavMenuSection } from '../../lib/appNavigation';
import '../../styles/auth.css';
import { AppNavLinks } from './AppNavLinks';

type AppHeaderMenuModalProps = {
  open: boolean;
  onClose: () => void;
  sections: AppNavMenuSection[];
  workspaceModeLabel: string | null;
  showAdminPortal: boolean;
  onLogout: () => void;
};

export function AppHeaderMenuModal({
  open,
  onClose,
  sections,
  workspaceModeLabel,
  showAdminPortal,
  onLogout,
}: AppHeaderMenuModalProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return createPortal(
    <div className="app-header-menu-backdrop" role="presentation" onClick={onClose}>
      <div
        id="app-header-menu"
        className="app-header-menu-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="app-header-menu-dialog-head">
          <h2 className="app-header-menu-dialog-title">Menu</h2>
          <button
            type="button"
            className="app-header-menu-close"
            onClick={onClose}
            aria-label="Close menu"
          >
            ×
          </button>
        </header>

        <div className="app-header-menu-panel">
          {sections.map((section) => (
            <section key={section.id} className="app-header-menu-section">
              <h3 className="app-header-menu-section-label">{section.label}</h3>
              <nav className="app-header-menu-section-nav" aria-label={section.label}>
                <AppNavLinks items={section.items} onNavigate={onClose} />
              </nav>
            </section>
          ))}

          <div className="app-header-menu-footer">
            {workspaceModeLabel ? (
              <span className="app-workspace-mode-badge">{workspaceModeLabel}</span>
            ) : null}
            {showAdminPortal ? (
              <Link to="/admin" className="app-header-nav-link" onClick={onClose}>
                Admin portal
              </Link>
            ) : null}
            <button type="button" className="app-header-sign-out" onClick={onLogout}>
              Sign out
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
