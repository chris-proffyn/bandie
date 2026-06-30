import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import type {
  BandDynamicFeeOffer,
  BandSetOffer,
  PublicBandPrimaryContact,
} from '@bandie/data';
import { useAuth } from '../../context/AuthContext';
import { bandInitials } from '../../lib/profileHelpers';
import { BandBookingModal } from './BandBookingModal';

type BandBookingContactCardProps = {
  bandId: string;
  bandName: string;
  primaryContact: PublicBandPrimaryContact | null;
  setOffers?: BandSetOffer[];
  dynamicFeeOffers?: BandDynamicFeeOffer[];
  initialGigId?: string | null;
  variant?: 'public' | 'workspace';
};

export function BandBookingContactCard({
  bandId,
  bandName,
  primaryContact,
  setOffers = [],
  dynamicFeeOffers = [],
  initialGigId = null,
  variant = 'public',
}: BandBookingContactCardProps) {
  const { user, profile, displayName, workspaceMode } = useAuth();
  const location = useLocation();
  const [modalOpen, setModalOpen] = useState(false);
  const [sent, setSent] = useState(false);

  const isOrganiser =
    Boolean(profile?.is_organiser) && (variant !== 'workspace' || workspaceMode === 'organiser');

  const loginRedirect = `/login?redirect=${encodeURIComponent(`${location.pathname}${location.search}#book`)}`;

  useEffect(() => {
    if (location.hash === '#book' && primaryContact && isOrganiser) {
      setModalOpen(true);
    }
  }, [location.hash, primaryContact, isOrganiser]);

  if (!isOrganiser) {
    if (!user && variant === 'public' && primaryContact) {
      return (
        <section className="band-profile-booking" id="book" aria-labelledby="band-booking-title">
          <h2 id="band-booking-title">Book {bandName}</h2>
          <p className="band-profile-booking-lead">
            Event organisers can send structured booking enquiries through Bandie.
          </p>
          <Link className="band-profile-button band-profile-button-primary" to={loginRedirect}>
            Sign in to contact the band
          </Link>
        </section>
      );
    }

    return null;
  }

  if (!primaryContact) {
    return (
      <section className="band-profile-booking" id="book" aria-labelledby="band-booking-title">
        <h2 id="band-booking-title">Book {bandName}</h2>
        <p className="band-workspace-placeholder">
          This band has not assigned a primary contact yet. Check back soon or browse other bands.
        </p>
      </section>
    );
  }

  return (
    <>
      <section
        className="band-profile-booking"
        id="book"
        aria-labelledby="band-booking-title"
      >
        <div className="band-profile-booking-summary">
          <h2 id="band-booking-title">Book {bandName}</h2>

          <div className="band-profile-booking-contact">
            <div className="band-profile-booking-contact-avatar">
              {primaryContact.profile_image_url ? (
                <img src={primaryContact.profile_image_url} alt="" />
              ) : (
                <span>{bandInitials(primaryContact.display_name)}</span>
              )}
            </div>
            <div>
              <p className="band-profile-booking-contact-label">Primary contact</p>
              <strong>{primaryContact.display_name}</strong>
              {primaryContact.username ? (
                <p className="band-profile-booking-contact-meta">@{primaryContact.username}</p>
              ) : null}
            </div>
          </div>

          <p className="band-profile-booking-lead">
            Send booking details and optionally link one of your gigs to invite {bandName} formally.
            Your message is delivered privately through Bandie to {primaryContact.display_name}.
          </p>
        </div>

        {sent ? (
          <div className="band-profile-booking-panel">
            <div className="auth-message auth-message-success band-profile-booking-success">
              <p>Your booking enquiry was sent to {primaryContact.display_name}.</p>
              {user ? (
                <Link className="band-profile-button band-profile-button-secondary" to="/app/communications">
                  View communications
                </Link>
              ) : null}
            </div>
          </div>
        ) : user ? (
          <button
            type="button"
            className="band-profile-button band-profile-button-primary band-profile-booking-cta"
            aria-haspopup="dialog"
            onClick={() => setModalOpen(true)}
          >
            Book {bandName}
          </button>
        ) : (
          <div className="band-profile-booking-panel">
            <div className="band-profile-booking-signin">
              <p>Sign in with your organiser account to contact this band.</p>
              <Link className="band-profile-button band-profile-button-primary" to={loginRedirect}>
                Sign in to contact the band
              </Link>
            </div>
          </div>
        )}
      </section>

      {user ? (
        <BandBookingModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          bandId={bandId}
          bandName={bandName}
          primaryContact={primaryContact}
          setOffers={setOffers}
          dynamicFeeOffers={dynamicFeeOffers}
          initialGigId={initialGigId}
          user={user}
          profile={profile}
          displayName={displayName}
          onSent={() => setSent(true)}
        />
      ) : null}
    </>
  );
}
