import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  checkUserOrganiserCapability,
  computeOpenMicDashboardMetrics,
  createOpenMicEvent,
  createOrganiserVenue,
  EntitlementGateError,
  formatOpenMicEventStatus,
  listMyOrganiserVenues,
  listOrganiserOpenMicEvents,
  openMicStatusPillClass,
  type OpenMicEventSummary,
  type OrganiserVenue,
} from '@bandie/data';
import { useAuth } from '../../context/AuthContext';
import { UpgradePromptModal } from '../../components/entitlements/UpgradePromptModal';
import { useUpgradePrompt } from '../../hooks/useUpgradePrompt';
import '../../styles/openMic.css';

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
      void listMyOrganiserVenues()
        .then(setVenues)
        .catch(() => setVenues([]));
    }
  }, [showCreate]);

  const metrics = useMemo(() => computeOpenMicDashboardMetrics(events), [events]);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    if (!form.title.trim() || !form.startsAt) {
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
          address_line1: form.newVenueAddress.trim() || undefined,
        });
        venueId = venue.id;
        venueName = venue.name;
      } else if (form.venueChoice) {
        const venue = venues.find((row) => row.id === form.venueChoice);
        venueId = form.venueChoice;
        venueName = venue?.name ?? null;
      }

      const created = await createOpenMicEvent({
        title: form.title,
        startsAt: new Date(form.startsAt).toISOString(),
        venueId,
        venueName,
        venueAddress,
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
    <div className="open-mic-page">
      <div className="open-mic-header">
        <div>
          <h1>Open mic / jam nights</h1>
          <p>Create events, build song lists, and run the evening from a live control room.</p>
        </div>
        <div className="open-mic-header-actions">
          {canCreate ? (
            <button type="button" className="auth-button" onClick={() => setShowCreate((value) => !value)}>
              {showCreate ? 'Cancel' : 'New event'}
            </button>
          ) : (
            <button
              type="button"
              className="auth-button auth-button--secondary"
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
      </div>

      <div className="open-mic-metrics">
        <div className="open-mic-metric-card">
          <span>Total events</span>
          <strong>{metrics.total}</strong>
        </div>
        <div className="open-mic-metric-card">
          <span>Upcoming</span>
          <strong>{metrics.upcoming}</strong>
        </div>
        <div className="open-mic-metric-card">
          <span>Drafts</span>
          <strong>{metrics.drafts}</strong>
        </div>
        <div className="open-mic-metric-card">
          <span>Live now</span>
          <strong>{metrics.live}</strong>
        </div>
      </div>

      {showCreate && canCreate ? (
        <form className="panel" onSubmit={handleCreate}>
          <h2>Create open mic event</h2>
          {formError ? <p className="form-error">{formError}</p> : null}
          <label>
            Event title
            <input
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              required
            />
          </label>
          <label>
            Starts
            <input
              type="datetime-local"
              value={form.startsAt}
              onChange={(e) => setForm((prev) => ({ ...prev, startsAt: e.target.value }))}
              required
            />
          </label>
          <label>
            Venue
            <select
              value={form.venueChoice}
              onChange={(e) => setForm((prev) => ({ ...prev, venueChoice: e.target.value as VenueChoice }))}
            >
              <option value="">Ad hoc venue later</option>
              <option value="new">Add new venue…</option>
              {venues.map((venue) => (
                <option key={venue.id} value={venue.id}>
                  {venue.name}
                </option>
              ))}
            </select>
          </label>
          {form.venueChoice === 'new' ? (
            <>
              <label>
                Venue name
                <input
                  value={form.newVenueName}
                  onChange={(e) => setForm((prev) => ({ ...prev, newVenueName: e.target.value }))}
                  required
                />
              </label>
              <label>
                Address
                <input
                  value={form.newVenueAddress}
                  onChange={(e) => setForm((prev) => ({ ...prev, newVenueAddress: e.target.value }))}
                />
              </label>
            </>
          ) : null}
          <div className="open-mic-header-actions">
            <button type="submit" className="auth-button" disabled={submitting}>
              {submitting ? 'Creating…' : 'Create draft'}
            </button>
          </div>
        </form>
      ) : null}

      {loading ? <p>Loading events…</p> : null}
      {loadError ? <p className="form-error">{loadError}</p> : null}

      {!loading && events.length === 0 ? (
        <div className="panel">
          <p>No open mic events yet. Create your first event to get a public sign-up page and poster.</p>
        </div>
      ) : null}

      <ul className="open-mic-list">
        {events.map((event) => {
          const venueLabel = event.venue?.name ?? event.venue_name ?? 'Venue TBC';
          const starts = new Date(event.starts_at).toLocaleString('en-GB', {
            dateStyle: 'medium',
            timeStyle: 'short',
          });
          return (
            <li key={event.id}>
              <Link className="open-mic-list-item" to={`/app/open-mic/${event.id}`}>
                <div>
                  <strong>{event.title}</strong>
                  <p>
                    {starts} · {venueLabel} · {event.songCount} songs · {event.signupCount} sign-ups
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

      {upgradeDecision ? (
        <UpgradePromptModal decision={upgradeDecision} onClose={clearUpgradePrompt} />
      ) : null}
    </div>
  );
}
