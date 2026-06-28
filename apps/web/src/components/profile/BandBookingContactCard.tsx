import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  listMyOrganiserVenues,
  sendDirectMessageToUser,
  type BandDynamicFeeOffer,
  type BandSetOffer,
  type OrganiserVenue,
  type PublicBandPrimaryContact,
} from '@bandie/data';
import { useAuth } from '../../context/AuthContext';
import {
  buildSetDurationOptions,
  composeBookingEnquiryMessage,
  emptyBookingEnquiryForm,
  formatBookingVenueSummary,
  isBookingEnquiryFormValid,
  resolveBookingSenderDetails,
} from '../../lib/bookingEnquiryHelpers';
import { bandInitials } from '../../lib/profileHelpers';

type BandBookingContactCardProps = {
  bandName: string;
  primaryContact: PublicBandPrimaryContact | null;
  setOffers?: BandSetOffer[];
  dynamicFeeOffers?: BandDynamicFeeOffer[];
};

export function BandBookingContactCard({
  bandName,
  primaryContact,
  setOffers = [],
  dynamicFeeOffers = [],
}: BandBookingContactCardProps) {
  const { user, profile, displayName } = useAuth();
  const location = useLocation();
  const [expanded, setExpanded] = useState(false);
  const [form, setForm] = useState(emptyBookingEnquiryForm);
  const [venues, setVenues] = useState<OrganiserVenue[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const loginRedirect = `/login?redirect=${encodeURIComponent(`${location.pathname}${location.search}#book`)}`;
  const setDurationOptions = useMemo(
    () => buildSetDurationOptions(setOffers, dynamicFeeOffers),
    [setOffers, dynamicFeeOffers],
  );

  const sender = useMemo(() => {
    if (!user) {
      return null;
    }
    return resolveBookingSenderDetails(user, profile, displayName);
  }, [user, profile, displayName]);

  const selectedVenue = useMemo(
    () => venues.find((venue) => venue.id === form.selectedVenueId) ?? null,
    [venues, form.selectedVenueId],
  );

  const formValid = isBookingEnquiryFormValid(form);
  const canBook = Boolean(primaryContact);
  const showExpanded = expanded || sent;

  useEffect(() => {
    if (location.hash === '#book' && canBook) {
      setExpanded(true);
    }
  }, [location.hash, canBook]);

  useEffect(() => {
    if (!user || !showExpanded) {
      return;
    }

    let cancelled = false;

    listMyOrganiserVenues()
      .then((data) => {
        if (!cancelled) {
          setVenues(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setVenues([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user, showExpanded]);

  function updateField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
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

  function openForm() {
    setExpanded(true);
    setError(null);
  }

  function closeForm() {
    if (submitting) {
      return;
    }
    setExpanded(false);
    setError(null);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!primaryContact || !user || !sender || !formValid) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await sendDirectMessageToUser(
        primaryContact.user_id,
        composeBookingEnquiryMessage(bandName, form, sender, selectedVenue),
      );
      setSent(true);
      setForm(emptyBookingEnquiryForm());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send your message.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section
      className={`band-profile-booking${showExpanded ? ' band-profile-booking-expanded' : ''}`}
      id="book"
      aria-labelledby="band-booking-title"
    >
      <div className="band-profile-booking-summary">
        <h2 id="band-booking-title">Book {bandName}</h2>

        {primaryContact ? (
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
        ) : null}

        <p className="band-profile-booking-lead">
          Send booking details including date, venue, event type and budget. Your message is delivered
          privately through Bandie to {primaryContact?.display_name ?? "the band's primary contact"}.
        </p>
      </div>

      {!primaryContact ? (
        <p className="band-workspace-placeholder">
          This band has not assigned a primary contact yet. Check back soon or browse other bands.
        </p>
      ) : sent ? (
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
      ) : !showExpanded ? (
        <button
          type="button"
          className="band-profile-button band-profile-button-primary band-profile-booking-cta"
          aria-expanded={false}
          aria-controls="band-booking-panel"
          onClick={openForm}
        >
          Book {bandName}
        </button>
      ) : (
        <div className="band-profile-booking-panel" id="band-booking-panel">
          {user && sender ? (
            <form className="band-profile-booking-form auth-form" onSubmit={handleSubmit}>
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
                  Update your contact details in{' '}
                  <Link to="/app/profile">your profile</Link> if anything is missing.
                </p>
              </div>

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
                        <Link to="/app/venues">My venues</Link>.
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
                  {selectedVenue ? (
                    <p className="directory-field-hint">
                      Venue details from your profile will be included in the enquiry.
                    </p>
                  ) : null}
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

              <div className="band-profile-booking-actions">
                <button type="submit" className="auth-button" disabled={submitting || !formValid}>
                  {submitting ? 'Sending…' : `Send enquiry to ${primaryContact.display_name}`}
                </button>
                <button
                  type="button"
                  className="band-profile-booking-cancel"
                  onClick={closeForm}
                  disabled={submitting}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="band-profile-booking-signin">
              <p>Sign in to send a booking enquiry through Bandie.</p>
              <div className="band-profile-booking-actions">
                <Link className="band-profile-button band-profile-button-primary" to={loginRedirect}>
                  Sign in to contact the band
                </Link>
                <button type="button" className="band-profile-booking-cancel" onClick={closeForm}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
