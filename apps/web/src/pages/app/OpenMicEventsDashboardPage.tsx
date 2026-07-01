import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  checkUserOrganiserCapability,
  computeOpenMicDashboardMetrics,
  createOpenMicEvent,
  createOrganiserVenue,
  EntitlementGateError,
  formatOpenMicEventStatus,
  formatOpenMicEventType,
  formatOrganiserVenueAddress,
  listMyOrganiserVenues,
  listOrganiserOpenMicEvents,
  OPEN_MIC_EVENT_TYPE_OPTIONS,
  openMicStatusPillClass,
  type OpenMicEventSummary,
  type OpenMicEventType,
  type OrganiserVenue,
} from '@bandie/data';
import { useAuth } from '../../context/AuthContext';
import { UpgradePromptModal } from '../../components/entitlements/UpgradePromptModal';
import { useUpgradePrompt } from '../../hooks/useUpgradePrompt';
import '../../styles/gigs.css';
import '../../styles/workspace.css';

type VenueChoice = '' | 'new' | string;

export function OpenMicEventsDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { upgradeDecision, clearUpgradePrompt, handleEntitlementError } = useUpgradePrompt();
  const [events, setEvents] = useState<OpenMicEventSummary[]>([]);
  const [venues, setVenues] = useState<OrganiserVenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [canCreate, setCanCreate] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    startsAt: '',
    eventType: 'open_mic' as OpenMicEventType,
    slotCount: '8',
    slotDuration: '20',
    venueChoice: '' as VenueChoice,
    newVenueName: '',
    newVenueAddress: '',
  });

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const rows = await listOrganiserOpenMicEvents();
      setEvents(rows);
    } catch (err) {
      setEvents([]);
      setLoadError(err instanceof Error ? err.message : 'Unable to load open mic events.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadVenues = useCallback(async () => {
    try {
      const rows = await listMyOrganiserVenues();
      setVenues(rows);
    } catch {
      setVenues([]);
    }
  }, []);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    if (!user) {
      setCanCreate(false);
      return;
    }
    checkUserOrganiserCapability(user.id, 'open_mic.create')
      .then((decision) => setCanCreate(decision.allowed))
      .catch(() => setCanCreate(false));
  }, [user]);

  useEffect(() => {
    if (showCreate) {
      void loadVenues();
    }
  }, [showCreate, loadVenues]);

  const metrics = useMemo(() => computeOpenMicDashboardMetrics(events), [events]);

  const selectedVenue = useMemo(
    () => venues.find((venue) => venue.id === form.venueChoice) ?? null,
    [form.venueChoice, venues],
  );

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    if (!form.title.trim() || !form.startsAt) {
      return;
    }

    if (form.venueChoice === 'new' && !form.newVenueName.trim()) {
      setFormError('Enter a name for the new venue or choose a saved venue.');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      let venueId: string | null = null;
      let venueName: string | null = null;
      let venueAddress: string | null = null;

      if (form.venueChoice === 'new') {
        const venue = await createOrganiserVenue({
          name: form.newVenueName.trim(),
          address_line1: form.newVenueAddress.trim() || null,
        });
        venueId = venue.id;
        venueName = venue.name;
        venueAddress = formatOrganiserVenueAddress(venue);
        await loadVenues();
      } else if (selectedVenue) {
        venueId = selectedVenue.id;
        venueName = selectedVenue.name;
        venueAddress = formatOrganiserVenueAddress(selectedVenue);
      }

      const created = await createOpenMicEvent({
        title: form.title,
        startsAt: new Date(form.startsAt).toISOString(),
        eventType: form.eventType,
        slotCount: form.eventType === 'jam_night' ? Number(form.slotCount) || 8 : null,
        defaultSlotDurationMinutes:
          form.eventType === 'jam_night' ? Number(form.slotDuration) || 20 : null,
        venueId,
        venueName,
        venueAddress,
      });

      setShowCreate(false);
      setForm({
        title: '',
        startsAt: '',
        eventType: 'open_mic',
        slotCount: '8',
        slotDuration: '20',
        venueChoice: '',
        newVenueName: '',
        newVenueAddress: '',
      });
      navigate(`/app/open-mic/${created.id}`);
    } catch (err) {
      if (!handleEntitlementError(err)) {
        setFormError(err instanceof Error ? err.message : 'Unable to create event.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="gigs-page">
      <header className="gigs-header">
        <div>
          <p className="my-bands-eyebrow">Open mic / jam nights</p>
          <h1>Plan evenings and run sign-ups</h1>
          <p className="my-bands-lead">
            Create events, build song lists with instrument slots, and run the evening from a live
            control room.
          </p>
        </div>
        <div className="gigs-header-actions">
          <Link to="/app/venues" className="directory-btn directory-btn-secondary">
            My venues
          </Link>
          {canCreate ? (
            <button type="button" className="auth-button" onClick={() => setShowCreate(true)}>
              New event
            </button>
          ) : (
            <button
              type="button"
              className="directory-btn directory-btn-secondary"
              onClick={() => {
                if (!user) return;
                void checkUserOrganiserCapability(user.id, 'open_mic.create').then((decision) => {
                  if (!decision.allowed) {
                    handleEntitlementError(new EntitlementGateError(decision));
                  }
                });
              }}
            >
              Upgrade to create
            </button>
          )}
        </div>
      </header>

      <div className="gigs-metrics">
        <article className="gigs-metric-card">
          <span>Total events</span>
          <strong>{metrics.total}</strong>
        </article>
        <article className="gigs-metric-card">
          <span>Upcoming</span>
          <strong>{metrics.upcoming}</strong>
        </article>
        <article className="gigs-metric-card">
          <span>Drafts</span>
          <strong>{metrics.drafts}</strong>
        </article>
        <article className="gigs-metric-card">
          <span>Live now</span>
          <strong>{metrics.live}</strong>
        </article>
      </div>

      {loadError ? <div className="auth-message auth-message-error">{loadError}</div> : null}

      {showCreate && canCreate ? (
        <section className="panel gigs-create-panel">
          <h2>New event</h2>
          <p className="workspace-empty-note">
            Choose open mic (songs & parts) or jam night (band performance slots). You&apos;ll refine
            settings on the next screen.
          </p>
          <form className="auth-form" onSubmit={handleCreate}>
            <div className="auth-field">
              <label htmlFor="open-mic-type">Event type</label>
              <select
                id="open-mic-type"
                value={form.eventType}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, eventType: e.target.value as OpenMicEventType }))
                }
              >
                {OPEN_MIC_EVENT_TYPE_OPTIONS.filter((type) =>
                  ['open_mic', 'jam_night'].includes(type),
                ).map((type) => (
                  <option key={type} value={type}>
                    {formatOpenMicEventType(type)}
                  </option>
                ))}
              </select>
            </div>
            <div className="auth-field">
              <label htmlFor="open-mic-title">Title</label>
              <input
                id="open-mic-title"
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="e.g. Tuesday open mic"
                required
              />
            </div>
            <div className="auth-field">
              <label htmlFor="open-mic-starts">Date and time</label>
              <input
                id="open-mic-starts"
                type="datetime-local"
                value={form.startsAt}
                onChange={(e) => setForm((prev) => ({ ...prev, startsAt: e.target.value }))}
                required
              />
            </div>
            {form.eventType === 'jam_night' ? (
              <div className="gig-detail-grid">
                <div className="auth-field">
                  <label htmlFor="open-mic-slot-count">Performance slots</label>
                  <input
                    id="open-mic-slot-count"
                    type="number"
                    min={1}
                    value={form.slotCount}
                    onChange={(e) => setForm((prev) => ({ ...prev, slotCount: e.target.value }))}
                  />
                </div>
                <div className="auth-field">
                  <label htmlFor="open-mic-slot-duration">Minutes per slot</label>
                  <input
                    id="open-mic-slot-duration"
                    type="number"
                    min={5}
                    value={form.slotDuration}
                    onChange={(e) => setForm((prev) => ({ ...prev, slotDuration: e.target.value }))}
                  />
                </div>
              </div>
            ) : null}
            <div className="auth-field">
              <label htmlFor="open-mic-venue">Venue (optional)</label>
              <select
                id="open-mic-venue"
                value={form.venueChoice}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, venueChoice: e.target.value as VenueChoice }))
                }
              >
                <option value="">No venue yet</option>
                {venues.map((venue) => (
                  <option key={venue.id} value={venue.id}>
                    {venue.name}
                    {venue.city ? ` · ${venue.city}` : ''}
                  </option>
                ))}
                <option value="new">Add new venue…</option>
              </select>
            </div>
            {form.venueChoice === 'new' ? (
              <>
                <div className="auth-field">
                  <label htmlFor="open-mic-new-venue-name">New venue name</label>
                  <input
                    id="open-mic-new-venue-name"
                    value={form.newVenueName}
                    onChange={(e) => setForm((prev) => ({ ...prev, newVenueName: e.target.value }))}
                    required
                  />
                </div>
                <div className="auth-field">
                  <label htmlFor="open-mic-new-venue-address">Address (optional)</label>
                  <input
                    id="open-mic-new-venue-address"
                    value={form.newVenueAddress}
                    onChange={(e) => setForm((prev) => ({ ...prev, newVenueAddress: e.target.value }))}
                    placeholder="Street, city or postcode"
                  />
                </div>
                <p className="workspace-empty-note">
                  The venue will be saved to My venues and linked to this event.
                </p>
              </>
            ) : selectedVenue ? (
              <p className="workspace-empty-note">
                {formatOrganiserVenueAddress(selectedVenue) ?? 'No address saved for this venue.'}
              </p>
            ) : null}
            {formError ? <div className="auth-message auth-message-error">{formError}</div> : null}
            <div className="gigs-form-actions">
              <button
                type="button"
                className="auth-button auth-button-secondary"
                onClick={() => setShowCreate(false)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button type="submit" className="auth-button" disabled={submitting}>
                {submitting ? 'Creating…' : 'Create draft'}
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <section className="panel">
        <h2>Your events</h2>
        {loading ? <p className="workspace-empty-note">Loading events…</p> : null}
        {!loading && events.length === 0 ? (
          <p className="workspace-empty-note">
            No open mic events yet. Create your first event to get a public sign-up page and poster.
          </p>
        ) : null}
        <ul className="gigs-list">
          {events.map((event) => {
            const venueLabel = event.venue?.name ?? event.venue_name ?? 'Venue TBC';
            const starts = new Date(event.starts_at).toLocaleString('en-GB', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            });
            return (
              <li key={event.id}>
                <Link className="gigs-list-item" to={`/app/open-mic/${event.id}`}>
                  <div>
                    <strong>{event.title}</strong>
                    <p>
                      {starts} · {venueLabel} · {event.songCount} songs · {event.signupCount}{' '}
                      sign-ups
                    </p>
                  </div>
                  <span className={openMicStatusPillClass(event.status)}>
                    {formatOpenMicEventStatus(event.status)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {upgradeDecision ? (
        <UpgradePromptModal decision={upgradeDecision} onClose={clearUpgradePrompt} />
      ) : null}
    </div>
  );
}
