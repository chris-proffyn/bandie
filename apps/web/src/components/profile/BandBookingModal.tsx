import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import {
  ACTIVE_GIG_STATUSES,
  formatGigInviteStatus,
  getOrganiserGig,
  inviteBandToGig,
  isActiveGigInviteStatus,
  listMyOrganiserVenues,
  listOrganiserGigs,
  sendBookingEnquiry,
  type BandDynamicFeeOffer,
  type BandSetOffer,
  type GigBandInviteWithBand,
  type OrganiserGig,
  type OrganiserGigDetail,
  type OrganiserVenue,
  type PublicBandPrimaryContact,
  type UserProfile,
} from '@bandie/data';
import {
  bookingFormValuesFromGig,
  buildSetDurationOptions,
  composeBookingEnquiryMessage,
  emptyBookingEnquiryForm,
  formatBookingVenueSummary,
  formatOrganiserGigOptionLabel,
  isBookingEnquiryFormValid,
  resolveBookingSenderDetails,
  type BookingEnquiryFormValues,
  type BookingSenderDetails,
} from '../../lib/bookingEnquiryHelpers';
import type { User } from '@supabase/supabase-js';
import '../../styles/gigs.css';

type BandBookingModalProps = {
  open: boolean;
  onClose: () => void;
  bandId: string;
  bandName: string;
  primaryContact: PublicBandPrimaryContact;
  setOffers?: BandSetOffer[];
  dynamicFeeOffers?: BandDynamicFeeOffer[];
  initialGigId?: string | null;
  user: User;
  profile: UserProfile | null;
  displayName: string;
  onSent: () => void;
};

export function BandBookingModal({
  open,
  onClose,
  bandId,
  bandName,
  primaryContact,
  setOffers = [],
  dynamicFeeOffers = [],
  initialGigId = null,
  user,
  profile,
  displayName,
  onSent,
}: BandBookingModalProps) {
  const [form, setForm] = useState<BookingEnquiryFormValues>(() => {
    const base = emptyBookingEnquiryForm();
    return initialGigId ? { ...base, selectedGigId: initialGigId } : base;
  });
  const [venues, setVenues] = useState<OrganiserVenue[]>([]);
  const [gigs, setGigs] = useState<OrganiserGig[]>([]);
  const [selectedGigDetail, setSelectedGigDetail] = useState<OrganiserGigDetail | null>(null);
  const [loadingGigs, setLoadingGigs] = useState(false);
  const [loadingGigDetail, setLoadingGigDetail] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setDurationOptions = useMemo(
    () => buildSetDurationOptions(setOffers, dynamicFeeOffers),
    [setOffers, dynamicFeeOffers],
  );

  const sender = useMemo(
    () => resolveBookingSenderDetails(user, profile, displayName),
    [user, profile, displayName],
  );

  const selectedVenue = useMemo(
    () => venues.find((venue) => venue.id === form.selectedVenueId) ?? null,
    [venues, form.selectedVenueId],
  );

  const selectedGig = useMemo(
    () => gigs.find((gig) => gig.id === form.selectedGigId) ?? selectedGigDetail,
    [gigs, form.selectedGigId, selectedGigDetail],
  );

  const existingInvite = useMemo<GigBandInviteWithBand | null>(() => {
    if (!selectedGigDetail) {
      return null;
    }

    return (
      selectedGigDetail.bands.find(
        (invite) => invite.band_id === bandId && isActiveGigInviteStatus(invite.invite_status),
      ) ?? null
    );
  }, [selectedGigDetail, bandId]);

  const slotOptions = useMemo(() => {
    const count = selectedGigDetail?.slot_count ?? 0;
    return Array.from({ length: count }, (_, index) => index + 1);
  }, [selectedGigDetail?.slot_count]);

  const formValid = isBookingEnquiryFormValid(form);
  const willInvite = Boolean(form.selectedGigId && !existingInvite);

  useEffect(() => {
    if (!open) {
      return;
    }

    setError(null);
    setForm(() => {
      const base = emptyBookingEnquiryForm();
      return initialGigId ? { ...base, selectedGigId: initialGigId } : base;
    });
    setSelectedGigDetail(null);
  }, [open, initialGigId]);

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;
    setLoadingGigs(true);

    Promise.all([listOrganiserGigs(), listMyOrganiserVenues()])
      .then(([gigRows, venueRows]) => {
        if (cancelled) {
          return;
        }

        setGigs(gigRows.filter((gig) => ACTIVE_GIG_STATUSES.includes(gig.status)));
        setVenues(venueRows);
      })
      .catch(() => {
        if (!cancelled) {
          setGigs([]);
          setVenues([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingGigs(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open || !form.selectedGigId) {
      setSelectedGigDetail(null);
      return;
    }

    let cancelled = false;
    setLoadingGigDetail(true);

    getOrganiserGig(form.selectedGigId)
      .then((detail) => {
        if (cancelled) {
          return;
        }

        setSelectedGigDetail(detail);
        if (detail) {
          setForm((current) => ({
            ...current,
            ...bookingFormValuesFromGig(detail, setDurationOptions),
            budget: current.budget,
            additionalNotes: current.additionalNotes,
            slotNumber: current.slotNumber,
          }));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSelectedGigDetail(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingGigDetail(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [open, form.selectedGigId, setDurationOptions]);

  function updateField<K extends keyof BookingEnquiryFormValues>(
    key: K,
    value: BookingEnquiryFormValues[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleGigSelect(gigId: string) {
    if (!gigId) {
      setForm((current) => ({
        ...emptyBookingEnquiryForm(),
        budget: current.budget,
        additionalNotes: current.additionalNotes,
      }));
      setSelectedGigDetail(null);
      return;
    }

    updateField('selectedGigId', gigId);
  }

  function handleVenueSelect(venueId: string) {
    if (!venueId) {
      setForm((current) => ({ ...current, selectedVenueId: '' }));
      return;
    }

    const venue = venues.find((item) => item.id === venueId);
    if (!venue) {
      return;
    }

    setForm((current) => ({
      ...current,
      selectedVenueId: venueId,
      venue: formatBookingVenueSummary(venue),
    }));
  }

  function handleVenueTextChange(value: string) {
    setForm((current) => ({
      ...current,
      venue: value,
      selectedVenueId: '',
    }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!formValid) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      if (form.selectedGigId && !existingInvite) {
        await inviteBandToGig(form.selectedGigId, {
          bandId,
          slotNumber: form.slotNumber ? Number(form.slotNumber) : null,
          slotDurationMinutes: form.slotDurationMinutes ? Number(form.slotDurationMinutes) : null,
          personalMessage: form.additionalNotes.trim() || null,
        });
      }

      const durationMatch = form.setDuration.match(/(\d+)\s*min/i);
      await sendBookingEnquiry({
        bandId,
        recipientUserId: primaryContact.user_id,
        body: composeBookingEnquiryMessage(
          bandName,
          form,
          sender,
          selectedVenue,
          selectedGig ? { title: selectedGig.title } : null,
        ),
        preferredDate: form.eventDate || null,
        venueSummary: form.venue.trim() || selectedVenue?.name || null,
        setDurationMinutes: durationMatch ? Number(durationMatch[1]) : null,
        metadata: {
          event_time: form.eventTime || null,
          budget: form.budget || null,
          gig_id: form.selectedGigId || null,
          gig_title: selectedGig?.title || null,
        },
      });

      onSent();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send your message.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return null;
  }

  return createPortal(
    <div className="gigs-dialog-backdrop" role="presentation" onClick={onClose}>
      <div
        className="gigs-dialog band-booking-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="band-booking-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="gigs-dialog-header">
          <h2 id="band-booking-modal-title">Book {bandName}</h2>
          <button type="button" className="gigs-dialog-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        <form className="gigs-dialog-body band-profile-booking-form auth-form" onSubmit={handleSubmit}>
          <SenderSummary sender={sender} />

          <div className="auth-field band-profile-booking-field-full">
            <label htmlFor="band-booking-gig">Link to your gig</label>
            {loadingGigs ? <p className="directory-field-hint">Loading your gigs…</p> : null}
            <select
              id="band-booking-gig"
              value={form.selectedGigId}
              onChange={(event) => handleGigSelect(event.target.value)}
              disabled={loadingGigs}
            >
              <option value="">General enquiry (no specific gig)</option>
              {gigs.map((gig) => (
                <option key={gig.id} value={gig.id}>
                  {formatOrganiserGigOptionLabel(gig)}
                </option>
              ))}
            </select>
            {!loadingGigs && gigs.length === 0 ? (
              <p className="directory-field-hint">
                No active gigs yet.{' '}
                <Link to="/app/gigs" onClick={onClose}>
                  Create a gig
                </Link>{' '}
                to invite this band from your planning workflow.
              </p>
            ) : (
              <p className="directory-field-hint">
                Choosing a gig sends a formal gig invite to the band leader alongside this enquiry.
              </p>
            )}
          </div>

          {form.selectedGigId ? (
            <div className="band-booking-gig-context">
              {loadingGigDetail ? <p className="directory-field-hint">Loading gig details…</p> : null}
              {existingInvite ? (
                <p className="gigs-dialog-note">
                  {bandName} is already invited to this gig (
                  {formatGigInviteStatus(existingInvite.invite_status)}). Your enquiry will still be
                  sent.
                </p>
              ) : null}
              {slotOptions.length > 0 ? (
                <div className="band-profile-booking-fields">
                  <div className="auth-field">
                    <label htmlFor="band-booking-slot">Assign slot (optional)</label>
                    <select
                      id="band-booking-slot"
                      value={form.slotNumber}
                      onChange={(event) => updateField('slotNumber', event.target.value)}
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
                    <label htmlFor="band-booking-slot-duration">Slot duration (minutes)</label>
                    <input
                      id="band-booking-slot-duration"
                      type="number"
                      min={5}
                      step={5}
                      value={form.slotDurationMinutes}
                      placeholder={
                        selectedGigDetail?.default_slot_duration_minutes
                          ? String(selectedGigDetail.default_slot_duration_minutes)
                          : '45'
                      }
                      onChange={(event) => updateField('slotDurationMinutes', event.target.value)}
                    />
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="band-profile-booking-fields">
            <div className="auth-field">
              <label htmlFor="band-booking-date">Date</label>
              <input
                id="band-booking-date"
                type="date"
                value={form.eventDate}
                onChange={(event) => updateField('eventDate', event.target.value)}
                required
              />
            </div>
            <div className="auth-field">
              <label htmlFor="band-booking-time">Time</label>
              <input
                id="band-booking-time"
                type="time"
                value={form.eventTime}
                onChange={(event) => updateField('eventTime', event.target.value)}
              />
              <p className="directory-field-hint">Optional — leave blank if not yet confirmed.</p>
            </div>
            <div className="auth-field">
              <label htmlFor="band-booking-duration">Set duration</label>
              <select
                id="band-booking-duration"
                value={form.setDuration}
                onChange={(event) => updateField('setDuration', event.target.value)}
                required
              >
                <option value="">Select set length</option>
                {setDurationOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="auth-field">
              <label htmlFor="band-booking-budget">Budget (£)</label>
              <input
                id="band-booking-budget"
                type="number"
                min={0}
                step={25}
                inputMode="decimal"
                value={form.budget}
                onChange={(event) => updateField('budget', event.target.value)}
                placeholder="e.g. 800"
              />
            </div>
            <div className="auth-field band-profile-booking-field-full">
              <label htmlFor="band-booking-venue">Venue</label>
              {venues.length ? (
                <>
                  <select
                    id="band-booking-venue-select"
                    className="band-profile-booking-venue-select"
                    value={form.selectedVenueId}
                    onChange={(event) => handleVenueSelect(event.target.value)}
                  >
                    <option value="">Select one of your venues</option>
                    {venues.map((venue) => (
                      <option key={venue.id} value={venue.id}>
                        {venue.name}
                      </option>
                    ))}
                  </select>
                  <p className="directory-field-hint">
                    Or enter a different venue below. Manage venues in{' '}
                    <Link to="/app/venues" onClick={onClose}>
                      My venues
                    </Link>
                    .
                  </p>
                </>
              ) : null}
              <input
                id="band-booking-venue"
                type="text"
                value={form.venue}
                onChange={(event) => handleVenueTextChange(event.target.value)}
                placeholder="Venue name and town or city"
                required
              />
            </div>
            <div className="auth-field band-profile-booking-field-full">
              <label htmlFor="band-booking-notes">Additional notes</label>
              <textarea
                id="band-booking-notes"
                rows={3}
                value={form.additionalNotes}
                onChange={(event) => updateField('additionalNotes', event.target.value)}
                placeholder="Event type, audience size, load-in times, or anything else the band should know."
              />
            </div>
          </div>

          {error ? <div className="auth-message auth-message-error">{error}</div> : null}

          <footer className="gigs-dialog-actions band-booking-dialog-actions">
            <button
              type="button"
              className="directory-btn directory-btn-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="directory-btn directory-btn-primary"
              disabled={submitting || !formValid}
            >
              {submitting
                ? 'Sending…'
                : willInvite
                  ? `Send enquiry and invite to gig`
                  : `Send enquiry to ${primaryContact.display_name}`}
            </button>
          </footer>
        </form>
      </div>
    </div>,
    document.body,
  );
}

function SenderSummary({ sender }: { sender: BookingSenderDetails }) {
  return (
    <div className="band-profile-booking-sender">
      <p className="band-profile-booking-sender-label">Your details (included automatically)</p>
      <dl className="band-profile-booking-sender-grid">
        <div>
          <dt>Name</dt>
          <dd>{sender.displayName}</dd>
        </div>
        {sender.username ? (
          <div>
            <dt>Bandie</dt>
            <dd>@{sender.username}</dd>
          </div>
        ) : null}
        {sender.email ? (
          <div>
            <dt>Email</dt>
            <dd>{sender.email}</dd>
          </div>
        ) : null}
        {sender.phone ? (
          <div>
            <dt>Phone</dt>
            <dd>{sender.phone}</dd>
          </div>
        ) : null}
        {sender.location ? (
          <div>
            <dt>Location</dt>
            <dd>{sender.location}</dd>
          </div>
        ) : null}
      </dl>
      <p className="band-profile-booking-sender-hint">
        Update your contact details in <Link to="/app/profile">your profile</Link> if anything is
        missing.
      </p>
    </div>
  );
}
