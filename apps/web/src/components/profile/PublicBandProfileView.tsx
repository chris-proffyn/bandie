import { Link } from 'react-router-dom';
import {
  availabilityLabel,
  bandNameFontFamily,
  bandPaletteCssVariables,
  formatBandLocation,
  formatBandSubtitle,
  formatFeeRange,
  type PublicBandProfile,
} from '@bandie/data';
import { BackLink } from '../navigation/BackLink';
import {
  bandInitials,
  formatDisplayDate,
  socialPlatformLabel,
  youtubeEmbedUrl,
} from '../../lib/profileHelpers';
import { useBandNameFont } from '../../lib/useBandNameFont';
import type { CSSProperties } from 'react';

type PublicBandProfileViewProps = {
  profile: PublicBandProfile;
  variant?: 'public' | 'workspace';
};

export function PublicBandProfileView({ profile, variant = 'public' }: PublicBandProfileViewProps) {
  const isWorkspace = variant === 'workspace';
  const tagline = formatBandSubtitle(profile);
  const locationLabel = formatBandLocation(profile);
  const genreLabel = profile.genres.filter(Boolean).join(' · ');
  const feeRange = formatFeeRange(profile.fee_guidance_min, profile.fee_guidance_max);
  const photos = profile.media.filter((item) => item.kind === 'photo');
  const videos = profile.media.filter((item) => item.kind === 'video');
  const tracks = profile.media.filter((item) => item.kind === 'track');
  const bookingEmail = profile.booking_email?.trim();
  const bookingPhone = profile.booking_phone?.trim();
  const hasMeta = Boolean(profile.band_size || profile.set_length_minutes || feeRange);

  useBandNameFont(profile.name_font);

  const paletteStyle = bandPaletteCssVariables(profile.color_palette) as CSSProperties;

  return (
    <div className="band-profile-page" style={paletteStyle}>
      {!isWorkspace ? (
        <header className="band-profile-header">
          <div className="band-profile-header-inner">
            <Link to="/" className="band-profile-brand">
              <span className="band-profile-brand-mark">B</span>
              <span>Bandie</span>
            </Link>
            {bookingEmail ? (
              <a className="band-profile-button band-profile-button-primary" href={`mailto:${bookingEmail}`}>
                Book this band
              </a>
            ) : (
              <Link className="band-profile-button band-profile-button-secondary" to="/bands">
                Find more bands
              </Link>
            )}
          </div>
        </header>
      ) : null}

      <div className="band-profile-shell">
        <BackLink
          fallbackTo="/bands"
          workspaceFallbackTo="/app/bands"
          label="Back to band directory"
        />

        {profile.hero_image_url ? (
          <div className="band-profile-hero-banner">
            <img src={profile.hero_image_url} alt="" />
          </div>
        ) : null}

        <section className="band-profile-identity" aria-labelledby="band-profile-title">
          <div className="band-profile-logo-mark" aria-hidden={Boolean(profile.logo_url)}>
            {profile.logo_url ? (
              <img src={profile.logo_url} alt={`${profile.name} logo`} />
            ) : (
              bandInitials(profile.name)
            )}
          </div>

          <h1
            id="band-profile-title"
            className="band-profile-name"
            style={{ fontFamily: bandNameFontFamily(profile.name_font) }}
          >
            {profile.name}
          </h1>

          <div className="band-profile-eyebrow">{availabilityLabel(profile.availability_status)}</div>
          {tagline ? <p className="band-profile-subtitle">{tagline}</p> : null}
          {locationLabel ? <p className="band-profile-location">{locationLabel}</p> : null}
          {genreLabel ? <p className="band-profile-genres">{genreLabel}</p> : null}
          {profile.description ? <p className="band-profile-lead">{profile.description}</p> : null}

          {hasMeta ? (
            <div className="band-profile-meta-grid">
              {profile.band_size ? (
                <div className="band-profile-meta-card">
                  <strong>{profile.band_size}</strong>
                  <span>Band members</span>
                </div>
              ) : null}
              {profile.set_length_minutes ? (
                <div className="band-profile-meta-card">
                  <strong>{profile.set_length_minutes} min</strong>
                  <span>Typical set length</span>
                </div>
              ) : null}
              {feeRange ? (
                <div className="band-profile-meta-card">
                  <strong>{feeRange}</strong>
                  <span>Fee guidance</span>
                </div>
              ) : null}
            </div>
          ) : null}
        </section>

        {profile.equipment_notes ? (
          <section className="band-profile-section" id="equipment">
            <h2>Equipment & setup</h2>
            <p>{profile.equipment_notes}</p>
          </section>
        ) : null}

        {tracks.length ? (
          <section className="band-profile-section" id="tracks">
            <h2>Listen</h2>
            <div className="band-profile-grid">
              {tracks.map((item) => (
                <article key={item.id} className="band-profile-card">
                  <h3>{item.title || 'Track'}</h3>
                  <a href={item.url} target="_blank" rel="noreferrer">
                    Open track
                  </a>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {videos.length ? (
          <section className="band-profile-section" id="videos">
            <h2>Videos</h2>
            <div className="band-profile-grid">
              {videos.map((item) => {
                const embedUrl = youtubeEmbedUrl(item.url);
                return (
                  <article key={item.id} className="band-profile-card">
                    <h3>{item.title || 'Video'}</h3>
                    {embedUrl ? (
                      <iframe
                        className="band-profile-video"
                        src={embedUrl}
                        title={item.title || `${profile.name} video`}
                        loading="lazy"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <a href={item.url} target="_blank" rel="noreferrer">
                        Watch video
                      </a>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        ) : null}

        {photos.length ? (
          <section className="band-profile-section" id="photos">
            <h2>Photos</h2>
            <div className="band-profile-grid">
              {photos.map((item) => (
                <article key={item.id} className="band-profile-card">
                  <h3>{item.title || 'Photo'}</h3>
                  <a href={item.url} target="_blank" rel="noreferrer">
                    View photo
                  </a>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {profile.socialLinks.length ? (
          <section className="band-profile-section" id="socials">
            <h2>Links & socials</h2>
            <div className="band-profile-socials">
              {profile.socialLinks.map((link) => (
                <a
                  key={link.id}
                  className="band-profile-social-link"
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {socialPlatformLabel(link.platform, link.label)}
                </a>
              ))}
            </div>
          </section>
        ) : null}

        {profile.publicDates.length ? (
          <section className="band-profile-section" id="availability">
            <h2>Public availability</h2>
            <p>
              {profile.availability_note ||
                'These dates are published for organisers. Enquire to confirm booking details.'}
            </p>
            <div className="band-profile-grid">
              {profile.publicDates.map((entry) => (
                <article key={entry.id} className="band-profile-card">
                  <h3>{formatDisplayDate(entry.event_date)}</h3>
                  <p>
                    {entry.title || (entry.status === 'confirmed' ? 'Confirmed date' : 'Provisional date')}
                  </p>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <section className="band-profile-booking" id="book">
          <h2>Book {profile.name}</h2>
          <p>
            Send booking details including date, venue, event type and budget. The band will respond from
            their private Bandie workspace.
          </p>
          <div className="band-profile-actions">
            {bookingEmail ? (
              <a className="band-profile-button band-profile-button-primary" href={`mailto:${bookingEmail}`}>
                Email {profile.name}
              </a>
            ) : null}
            {bookingPhone ? (
              <a className="band-profile-button band-profile-button-secondary" href={`tel:${bookingPhone}`}>
                Call {bookingPhone}
              </a>
            ) : null}
            {!bookingEmail && !bookingPhone ? (
              <Link className="band-profile-button band-profile-button-secondary" to="/bands">
                Browse the band directory
              </Link>
            ) : null}
          </div>
        </section>
      </div>

      <footer className="band-profile-shell band-profile-footer">
        <p>
          Powered by <Link to="/">Bandie</Link> · Public profile for {profile.name}
        </p>
      </footer>
    </div>
  );
}
