import { useState } from 'react';
import { Link } from 'react-router-dom';
import { homepageContent } from '../../content/homepageContent';
import { trackNavClick } from '../../lib/analytics';

export function MarketingNav() {
  const { nav } = homepageContent;
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="nav" aria-label="Main navigation">
      <Link
        to="/"
        className="brand"
        aria-label="Bandie home"
        onClick={() => trackNavClick('Bandie', '/')}
      >
        <span className="brand-mark">{nav.brandMark}</span>
        <span>{nav.brand}</span>
      </Link>

      <button
        type="button"
        className="nav-toggle"
        aria-expanded={menuOpen}
        aria-controls="main-nav-links"
        onClick={() => setMenuOpen((open) => !open)}
      >
        {menuOpen ? 'Close menu' : 'Open menu'}
      </button>

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
    </nav>
  );
}
