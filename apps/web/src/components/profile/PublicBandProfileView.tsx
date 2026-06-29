import { Link } from 'react-router-dom';
import { BandieLogo } from '../brand/BandieLogo';
import {
  bandNameFontFamily,
  bandPaletteCssVariables,
  formatBandLocation,
  formatBandSubtitle,
  type PublicBandProfile,
} from '@bandie/data';
import { BackLink } from '../navigation/BackLink';
import { BandBookingContactCard } from './BandBookingContactCard';
import { BandProfileHeroStage } from './BandProfileHeroStage';
import { PublicBandMembersSection } from './PublicBandMembersSection';
import {
  formatDisplayDate,
  socialPlatformLabel,
  youtubeEmbedUrl,
} from '../../lib/profileHelpers';
import { useBandNameFont } from '../../lib/useBandNameFont';
import { BandSetFeesFields } from '../band/BandSetFeesFields';
import { TestDataBadge } from '../common/TestDataBadge';
import { GigInvitePanel } from '../gigs/GigInvitePanel';
import type { FindGigContext } from '../../lib/findGigNavigation';
import { buildFindGigUrl } from '../../lib/findGigNavigation';
import type { GigBandInviteWithBand } from '@bandie/data';
import type { CSSProperties } from 'react';

type PublicBandProfileViewProps = {
  profile: PublicBandProfile;
  variant?: 'public' | 'workspace';
  findGig?: FindGigContext | null;
  existingGigInvite?: GigBandInviteWithBand | null;
  onGigInvited?: () => void;
};

export function PublicBandProfileView({
  profile,
  variant = 'public',
  findGig = null,
  existingGigInvite = null,
  onGigInvited,
}: PublicBandProfileViewProps) {
  const isWorkspace = variant === 'workspace';
  const tagline = formatBandSubtitle(profile);
  const locationLabel = formatBandLocation(profile);
  const photos = profile.media.filter((item) => item.kind === 'photo');
  const videos = profile.media.filter((item) => item.kind === 'video');
  const tracks = profile.media.filter((item) => item.kind === 'track');

  useBandNameFont(profile.name_font);

  const paletteStyle = bandPaletteCssVariables(profile.color_palette) as CSSProperties;

  return (
    <div className="band-profile-page" style={paletteStyle}>
      {!isWorkspace ? (
        <header className="band-profile-header">
          <div className="band-profile-header-inner">
            <Link to="/" className="band-profile-brand">
              <BandieLogo className="band-profile-brand-mark" />
              <span>Bandie</span>
            </Link>
            {profile.primaryContact ? (
              <a className="band-profile-button band-profile-button-primary" href="#book">
                Book {profile.name}
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
          workspaceFallbackTo={findGig ? buildFindGigUrl(findGig) : '/app/bands'}
          label="Back to band directory"
        />

        <div className="band-profile-title-row">
          <h1
            id="band-profile-title"
            className="band-profile-name band-profile-name-lead"
            style={{ fontFamily: bandNameFontFamily(profile.name_font) }}
          >
            {profile.name}
          </h1>
          <TestDataBadge testUser={profile.test_user} />
        </div>

        <BandProfileHeroStage
          bandName={profile.name}
          heroImageUrl={profile.hero_image_url}
          logoUrl={profile.logo_url}
          availabilityStatus={profile.availability_status}
        />

        <section className="band-profile-intro" aria-label="About the band">
          {tagline ? <p className="band-profile-subtitle">{tagline}</p> : null}
          {profile.description ? <p className="band-profile-lead">{profile.description}</p> : null}
          {locationLabel ? <p className="band-profile-location">{locationLabel}</p> : null}
        </section>

        {profile.setOffers.length || profile.dynamicFeeOffers.length ? (
          <section className="band-profile-section" id="fees">
            <h2>Fees</h2>
            <BandSetFeesFields
              mode="view"
              publicDisplay
              setOffers={profile.setOffers}
              dynamicFeeOffers={profile.dynamicFeeOffers}
              draftSetOffers={[]}
              draftDynamicFeeOffers={[]}
              onSetOffersChange={() => undefined}
              onDynamicFeeOffersChange={() => undefined}
            />
          </section>
        ) : null}

        {profile.members.length ? (
          <PublicBandMembersSection members={profile.members} variant={variant} />
        ) : null}

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
            <div className="band-profile-video-grid">
              {videos.map((item) => {
                const embedUrl = youtubeEmbedUrl(item.url);
                return (
                  <article key={item.id} className="band-profile-video-card">
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

        <BandBookingContactCard
          bandId={profile.id}
          bandName={profile.name}
          primaryContact={profile.primaryContact}
          setOffers={profile.setOffers}
          dynamicFeeOffers={profile.dynamicFeeOffers}
        />

        {isWorkspace && findGig ? (
          <GigInvitePanel
            bandId={profile.id}
            bandName={profile.name}
            findGig={findGig}
            existingInvite={existingGigInvite}
            onInvited={onGigInvited}
          />
        ) : null}
      </div>

      <footer className="band-profile-shell band-profile-footer">
        <p>
          Powered by <Link to="/">Bandie</Link> · Public profile for {profile.name}
        </p>
      </footer>
    </div>
  );
}
