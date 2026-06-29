import { useEffect, useMemo, useState } from 'react';
import {
  formatGigInviteNotificationBody,
  formatGigInviteStatus,
  formatGigStatus,
  formatSlotDuration,
  getCurrentUserProfile,
  getOrganiserGig,
  inviteBandToGig,
  type GigBandInviteWithBand,
  type OrganiserGigDetail,
  type UserProfile,
} from '@bandie/data';
import type { FindGigContext } from '../../lib/findGigNavigation';
import '../../styles/gigs.css';

type GigInviteModalProps = {
  open: boolean;
  onClose: () => void;
  findGig: FindGigContext;
  bandId: string;
  bandName: string;
  organiserEmail?: string | null;
  existingInvite?: GigBandInviteWithBand | null;
  onInvited?: () => void;
};

export function GigInviteModal({
  open,
  onClose,
  findGig,
  bandId,
  bandName,
  organiserEmail,
  existingInvite,
  onInvited,
}: GigInviteModalProps) {
  const [gig, setGig] = useState<OrganiserGigDetail | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slotNumber, setSlotNumber] = useState('');
  const [slotDuration, setSlotDuration] = useState('');
  const [personalMessage, setPersonalMessage] = useState('');

  useEffect(() => {
    if (!open) {
      return;
    }

    setLoading(true);
    setError(null);

    Promise.all([getOrganiserGig(findGig.gigId), getCurrentUserProfile()])
      .then(([gigRow, profileRow]) => {
        setGig(gigRow);
        setProfile(profileRow);
        if (!gigRow) {
          setError('Gig not found.');
        }
      })
      .catch((err) => {
        setGig(null);
        setError(err instanceof Error ? err.message : 'Unable to load gig details.');
      })
      .finally(() => setLoading(false));
  }, [open, findGig.gigId]);

  const slotOptions = useMemo(() => {
    const count = gig?.slot_count ?? 0;
    return Array.from({ length: count }, (_, index) => index + 1);
  }, [gig?.slot_count]);

  const previewBody = useMemo(() => {
    if (!gig || !profile) {
      return '';
    }

    return formatGigInviteNotificationBody({
      gig,
      organiser: {
        displayName: profile.display_name?.trim() || 'Organiser',
        username: profile.username,
        email: organiserEmail,
        contactPhone: profile.contact_phone,
      },
      slotNumber: slotNumber ? Number(slotNumber) : null,
      slotDurationMinutes: slotDuration ? Number(slotDuration) : null,
      personalMessage,
    });
  }, [gig, profile, organiserEmail, slotNumber, slotDuration, personalMessage]);

  if (!open) {
    return null;
  }

  async function handleSubmit() {
    if (!gig || existingInvite) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await inviteBandToGig(findGig.gigId, {
        bandId,
        slotNumber: slotNumber ? Number(slotNumber) : null,
        slotDurationMinutes: slotDuration ? Number(slotDuration) : null,
        personalMessage: personalMessage.trim() || null,
      });
      onInvited?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send gig invite.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="gigs-dialog-backdrop" role="presentation" onClick={onClose}>
      <div
        className="gigs-dialog surface-light"
        role="dialog"
        aria-modal="true"
        aria-labelledby="gig-invite-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="gigs-dialog-header">
          <h2 id="gig-invite-modal-title">Invite {bandName} to gig</h2>
          <button type="button" className="gigs-dialog-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        {loading ? <p>Loading gig details…</p> : null}
        {error ? <div className="auth-message auth-message-error">{error}</div> : null}

        {existingInvite ? (
          <p className="workspace-empty-note">
            {bandName} is already invited ({formatGigInviteStatus(existingInvite.invite_status)}).
          </p>
        ) : null}

        {gig && !existingInvite ? (
          <>
            <section className="gig-invite-modal-summary" aria-label="Gig summary">
              <h3>{gig.title}</h3>
              <p>
                {formatGigStatus(gig.status)} ·{' '}
                {new Date(gig.starts_at).toLocaleString('en-GB', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
              {gig.venue_name ? <p>Venue: {gig.venue_name}</p> : null}
              {gig.venue_address ? <p>{gig.venue_address}</p> : null}
              {gig.default_slot_duration_minutes ? (
                <p>Default slot: {formatSlotDuration(gig.default_slot_duration_minutes)}</p>
              ) : null}
            </section>

            {profile ? (
              <section className="gig-invite-modal-summary" aria-label="Your contact details">
                <h3>Your contact details</h3>
                <p>{profile.display_name?.trim() || 'Organiser'}</p>
                {profile.username ? <p>@{profile.username}</p> : null}
                {organiserEmail ? <p>{organiserEmail}</p> : null}
                {profile.contact_phone ? <p>{profile.contact_phone}</p> : null}
              </section>
            ) : null}

            {slotOptions.length > 0 ? (
              <div className="gig-invite-modal-fields">
                <div className="auth-field">
                  <label htmlFor="gig-invite-slot">Assign slot (optional)</label>
                  <select
                    id="gig-invite-slot"
                    value={slotNumber}
                    onChange={(event) => setSlotNumber(event.target.value)}
                  >
                    <option value="">Unassigned</option>
                    {slotOptions.map((slot) => (
                      <option key={slot} value={slot}>
                        Slot {slot}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="auth-field">
                  <label htmlFor="gig-invite-duration">Slot duration override (minutes)</label>
                  <input
                    id="gig-invite-duration"
                    type="number"
                    min={5}
                    step={5}
                    value={slotDuration}
                    placeholder={
                      gig.default_slot_duration_minutes
                        ? String(gig.default_slot_duration_minutes)
                        : '45'
                    }
                    onChange={(event) => setSlotDuration(event.target.value)}
                  />
                </div>
              </div>
            ) : null}

            <div className="auth-field">
              <label htmlFor="gig-invite-message">Personal message (optional)</label>
              <textarea
                id="gig-invite-message"
                rows={3}
                value={personalMessage}
                onChange={(event) => setPersonalMessage(event.target.value)}
                placeholder="Add a note for the band leader…"
              />
            </div>

            <section className="gig-invite-modal-preview" aria-label="Notification preview">
              <h3>Notification preview</h3>
              <pre>{previewBody}</pre>
            </section>

            <div className="gigs-dialog-actions">
              <button type="button" className="auth-button auth-button-secondary" onClick={onClose}>
                Cancel
              </button>
              <button
                type="button"
                className="auth-button"
                disabled={submitting || gig.status === 'confirmed'}
                onClick={() => void handleSubmit()}
              >
                {submitting ? 'Sending…' : 'Send gig invite'}
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
