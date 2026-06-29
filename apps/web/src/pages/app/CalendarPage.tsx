import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  AVAILABILITY_STATUS_LABELS,
  AVAILABILITY_VOTE_LABELS,
  CALENDAR_LEADER_ONLY_MESSAGE,
  availabilityStatusClass,
  castAvailabilityVote,
  createCalendarEvent,
  deleteCalendarEvent,
  formatCalendarEventType,
  getBandCalendarTier,
  isBandLeaderRole,
  listBandCalendarEventsWithVotes,
  PLAN_CODES,
  PLAN_DISPLAY_NAMES,
  summarizeAvailabilityVotes,
  type AvailabilityVote,
  type CalendarEventType,
  type CalendarEventWithVotes,
} from '@bandie/data';
import { useAuth } from '../../context/AuthContext';
import { SongsBandContextBar } from '../../components/songs/SongsBandContextBar';
import '../../styles/calendar.css';

const EVENT_TYPE_OPTIONS: { value: CalendarEventType; label: string }[] = [
  { value: 'rehearsal', label: 'Rehearsal' },
  { value: 'gig_availability', label: 'Gig availability' },
];

export function CalendarPage() {
  const { bandId } = useParams();
  const { bands, adminModeActive, user } = useAuth();
  const membership = bands.find((item) => item.id === bandId);
  const canAccessBand = Boolean(membership) || adminModeActive;
  const canManage = adminModeActive || isBandLeaderRole(membership?.member_role);

  const [events, setEvents] = useState<CalendarEventWithVotes[]>([]);
  const [calendarTier, setCalendarTier] = useState<'basic' | 'full'>('full');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState({
    eventType: 'rehearsal' as CalendarEventType,
    title: '',
    startsAt: '',
    endsAt: '',
    location: '',
    notes: '',
  });

  const loadEvents = useCallback(async () => {
    if (!bandId) {
      return;
    }

    setLoading(true);
    setLoadError(null);

    try {
      const [rows, tier] = await Promise.all([
        listBandCalendarEventsWithVotes(bandId),
        getBandCalendarTier(bandId),
      ]);
      setEvents(rows);
      setCalendarTier(tier);
    } catch (err) {
      setEvents([]);
      setLoadError(err instanceof Error ? err.message : 'Unable to load calendar.');
    } finally {
      setLoading(false);
    }
  }, [bandId]);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  const upcoming = useMemo(
    () => events.filter((event) => new Date(event.starts_at).getTime() >= Date.now()),
    [events],
  );

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    if (!bandId || !form.title.trim() || !form.startsAt) {
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      await createCalendarEvent({
        bandId,
        eventType: form.eventType,
        title: form.title,
        startsAt: new Date(form.startsAt).toISOString(),
        endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
        location: form.location,
        notes: form.notes,
      });
      setShowCreate(false);
      setForm({
        eventType: 'rehearsal',
        title: '',
        startsAt: '',
        endsAt: '',
        location: '',
        notes: '',
      });
      await loadEvents();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to create event.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVote(eventId: string, vote: Exclude<AvailabilityVote, 'pending'>) {
    try {
      await castAvailabilityVote(eventId, vote);
      await loadEvents();
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Unable to save vote.');
    }
  }

  async function handleDelete(eventId: string) {
    if (!window.confirm('Delete this calendar event?')) {
      return;
    }

    try {
      await deleteCalendarEvent(eventId);
      await loadEvents();
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Unable to delete event.');
    }
  }

  if (!bandId) {
    return null;
  }

  if (!canAccessBand) {
    return (
      <div className="calendar-page">
        <div className="panel">
          <p>You do not have access to this band workspace.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="calendar-page">
      <SongsBandContextBar
        bandId={bandId}
        bandName={membership?.name}
        sectionNote="Rehearsals and gig availability"
        switchPath={(nextBandId) => `/app/${nextBandId}/calendar`}
      />

      <header className="calendar-header">
        <div>
          <p className="my-bands-eyebrow">Calendar</p>
          <h1>Rehearsals and gig availability</h1>
          <p className="my-bands-lead">
            Propose rehearsals internally or gig date windows for the band to vote on.
            {calendarTier === 'basic'
              ? ` Public calendar publishing unlocks on ${PLAN_DISPLAY_NAMES[PLAN_CODES.PLAYER_PLUS]} when entitlements are enforced.`
              : ' Confirmed and provisional gig availability can publish to your public profile.'}
          </p>
        </div>
        <div className="calendar-header-actions">
          <Link to={`/app/${bandId}/gigs`} className="directory-btn directory-btn-secondary">
            Gigs
          </Link>
          {canManage ? (
            <button type="button" className="auth-button" onClick={() => setShowCreate(true)}>
              Add event
            </button>
          ) : null}
        </div>
      </header>

      {!canManage ? <p className="workspace-empty-note">{CALENDAR_LEADER_ONLY_MESSAGE}</p> : null}
      {loadError ? <div className="auth-message auth-message-error">{loadError}</div> : null}

      {showCreate ? (
        <section className="panel calendar-create-panel">
          <h2>New calendar event</h2>
          <form className="auth-form" onSubmit={handleCreate}>
            <div className="auth-field">
              <label htmlFor="calendar-event-type">Type</label>
              <select
                id="calendar-event-type"
                value={form.eventType}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    eventType: event.target.value as CalendarEventType,
                  }))
                }
              >
                {EVENT_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="auth-field">
              <label htmlFor="calendar-title">Title</label>
              <input
                id="calendar-title"
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                required
              />
            </div>
            <div className="calendar-form-grid">
              <div className="auth-field">
                <label htmlFor="calendar-starts">Starts</label>
                <input
                  id="calendar-starts"
                  type="datetime-local"
                  value={form.startsAt}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, startsAt: event.target.value }))
                  }
                  required
                />
              </div>
              <div className="auth-field">
                <label htmlFor="calendar-ends">Ends (optional)</label>
                <input
                  id="calendar-ends"
                  type="datetime-local"
                  value={form.endsAt}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, endsAt: event.target.value }))
                  }
                />
              </div>
            </div>
            <div className="auth-field">
              <label htmlFor="calendar-location">Location</label>
              <input
                id="calendar-location"
                value={form.location}
                onChange={(event) =>
                  setForm((current) => ({ ...current, location: event.target.value }))
                }
              />
            </div>
            <div className="auth-field">
              <label htmlFor="calendar-notes">Notes</label>
              <textarea
                id="calendar-notes"
                rows={3}
                value={form.notes}
                onChange={(event) =>
                  setForm((current) => ({ ...current, notes: event.target.value }))
                }
              />
            </div>
            {formError ? <div className="auth-message auth-message-error">{formError}</div> : null}
            <div className="calendar-form-actions">
              <button
                type="button"
                className="auth-button auth-button-secondary"
                onClick={() => setShowCreate(false)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button type="submit" className="auth-button" disabled={submitting}>
                {submitting ? 'Saving…' : 'Create event'}
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <section className="panel calendar-events-panel">
        <h2>Upcoming events</h2>
        {loading ? <p className="workspace-empty-note">Loading calendar…</p> : null}
        {!loading && upcoming.length === 0 ? (
          <p className="workspace-empty-note">No upcoming events yet.</p>
        ) : null}
        <ul className="calendar-event-list">
          {upcoming.map((event) => {
            const voteSummary = summarizeAvailabilityVotes(event.votes);
            const myVote = event.votes.find((vote) => vote.user_id === user?.id);

            return (
              <li key={event.id} className="calendar-event-card">
                <div className="calendar-event-head">
                  <div>
                    <span className="calendar-event-type">{formatCalendarEventType(event.event_type)}</span>
                    <h3>{event.title}</h3>
                    <p className="calendar-event-meta">
                      {new Date(event.starts_at).toLocaleString('en-GB', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {event.location ? ` · ${event.location}` : ''}
                    </p>
                  </div>
                  {event.event_type === 'gig_availability' ? (
                    <span className={availabilityStatusClass(event.availability_status)}>
                      {AVAILABILITY_STATUS_LABELS[event.availability_status]}
                    </span>
                  ) : null}
                </div>

                {event.notes ? <p className="calendar-event-notes">{event.notes}</p> : null}

                {event.event_type === 'gig_availability' ? (
                  <div className="calendar-votes">
                    <p className="calendar-vote-summary">
                      {voteSummary.available} available · {voteSummary.maybe} maybe · {voteSummary.no}{' '}
                      no · {voteSummary.pending} pending
                    </p>
                    <div className="calendar-vote-actions">
                      {(['available', 'maybe', 'no'] as const).map((vote) => (
                        <button
                          key={vote}
                          type="button"
                          className={`directory-btn directory-btn-secondary ${myVote?.vote === vote ? 'active' : ''}`}
                          onClick={() => void handleVote(event.id, vote)}
                        >
                          {AVAILABILITY_VOTE_LABELS[vote]}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                {canManage ? (
                  <button
                    type="button"
                    className="calendar-delete-btn"
                    onClick={() => void handleDelete(event.id)}
                  >
                    Delete
                  </button>
                ) : null}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
