import type { ReactNode } from 'react';
import { bandCardGradient } from '../../lib/directoryHelpers';
import { bandInitials } from '../../lib/profileHelpers';

export type BandCardVisual = {
  name: string;
  description?: string | null;
  logo_url?: string | null;
  hero_image_url?: string | null;
};

type BandCardProps = {
  band: BandCardVisual;
  badgeLabel: string;
  badgeVariant?: 'status' | 'role';
  badgeDotClass?: string;
  meta: string;
  tags: string[];
  footerLabel: string;
  footerValue: string;
  actions: ReactNode;
};

export function BandCard({
  band,
  badgeLabel,
  badgeVariant = 'status',
  badgeDotClass = '',
  meta,
  tags,
  footerLabel,
  footerValue,
  actions,
}: BandCardProps) {
  const heroStyle = band.hero_image_url
    ? { backgroundImage: `url(${band.hero_image_url})` }
    : { background: bandCardGradient(band.name) };

  return (
    <article className="directory-band-card">
      <div className="directory-band-hero" style={heroStyle}>
        <div className="directory-band-logo">
          {band.logo_url ? <img src={band.logo_url} alt="" /> : bandInitials(band.name)}
        </div>
        <div
          className={`directory-availability-badge ${
            badgeVariant === 'role' ? 'directory-role-badge' : ''
          }`}
        >
          {badgeDotClass ? (
            <span className={`directory-availability-dot ${badgeDotClass}`} />
          ) : null}
          {badgeLabel}
        </div>
      </div>
      <div className="directory-band-body">
        <div className="directory-band-title-row">
          <h3>{band.name}</h3>
        </div>
        <p className="directory-band-meta">{meta}</p>
        {band.description ? <p className="directory-band-desc">{band.description}</p> : null}
        {tags.length ? (
          <div className="directory-tag-row">
            {tags.map((tag) => (
              <span key={tag} className="directory-tag">
                {tag}
              </span>
            ))}
          </div>
        ) : null}
        <div className="directory-band-footer">
          <div className="directory-price">
            <strong>{footerValue}</strong>
            {footerLabel}
          </div>
          <div className="band-card-actions">{actions}</div>
        </div>
      </div>
    </article>
  );
}
