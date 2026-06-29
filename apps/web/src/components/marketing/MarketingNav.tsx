import { useState } from 'react';
import { Link } from 'react-router-dom';
import { homepageContent } from '../../content/homepageContent';
import { useAuth } from '../../context/AuthContext';
import { trackNavClick } from '../../lib/analytics';
import { BandieLogo } from '../brand/BandieLogo';

export function MarketingNav() {
  const { nav } = homepageContent;
  const { session, displayName, isAppAdmin, adminModeActive, loading, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  function handleLogout() {
    setMenuOpen(false);
    void logout();
  }

  return (
    <nav className="nav" aria-label="Main navigation">
      <div className="nav-start">
        <Link
          to="/"
          className="brand"
          aria-label="Bandie home"
          onClick={() => trackNavClick('Bandie', '/')}
        >
          <BandieLogo className="brand-mark" />
          <span>{nav.brand}</span>
        </Link>

        <div id="main-nav-links" className={`nav-links ${menuOpen ? 'nav-links-open' : ''}`}>
          {nav.links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => {
                trackNavClick(link.label, link.href);
                setMenuOpen(false);
              }}
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>

      <div className={`nav-actions ${menuOpen ? 'nav-actions-open' : ''}`}>
        {loading ? (
          <span className="nav-auth-placeholder" aria-hidden="true" />
        ) : session ? (
          <>
            {isAppAdmin && adminModeActive ? (
              <span className="nav-admin-badge">Admin mode</span>
            ) : null}
            <Link
              to="/app"
              className="nav-account"
              onClick={() => {
                trackNavClick('Workspace', '/app');
                setMenuOpen(false);
              }}
            >
              {displayName}
            </Link>
            <button type="button" className="nav-sign-out" onClick={handleLogout}>
              Sign out
            </button>
          </>
        ) : (
          <Link
            to="/login"
            onClick={() => {
              trackNavClick('Log in', '/login');
              setMenuOpen(false);
            }}
          >
            Log in
          </Link>
        )}
      </div>

      <button
        type="button"
        className="nav-toggle"
        aria-expanded={menuOpen}
        aria-controls="main-nav-links"
        onClick={() => setMenuOpen((open) => !open)}
      >
        {menuOpen ? 'Close menu' : 'Open menu'}
      </button>
    </nav>
  );
}
