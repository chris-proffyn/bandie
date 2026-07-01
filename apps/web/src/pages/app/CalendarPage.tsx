import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  AVAILABILITY_STATUS_LABELS,
  AVAILABILITY_VOTE_LABELS,
  CALENDAR_DEFAULT_OCCURRENCE_COUNT,
  CALENDAR_LEADER_ONLY_MESSAGE,
  CALENDAR_MAX_OCCURRENCE_COUNT,
  CALENDAR_REPEAT_ORDINAL_OPTIONS,
  availabilityStatusClass,
  castAvailabilityVote,
  clampOccurrenceCount,
  createCalendarEvent,
  deleteCalendarEvent,
  deleteCalendarEventSeries,
  formatCalendarEventType,
  formatCalendarRepeatPattern,
  getBandCalendarTier,
  parseCalendarRepeatPattern,
  isBandLeaderRole,
  listBandCalendarEventsWithVotes,
  PLAN_CODES,
  PLAN_DISPLAY_NAMES,
  summarizeAvailabilityVotes,
  type AvailabilityVote,
  type CalendarEventType,
  type CalendarEventWithVotes,
  type CalendarRepeatInput,
} from '@bandie/data';
import { useAuth } from '../../context/AuthContext';
import { SongsBandContextBar } from '../../components/songs/SongsBandContextBar';
import '../../styles/calendar.css';

const EVENT_TYPE_OPTIONS: { value: CalendarEventType; label: string }[] = [
  { value: 'rehearsal', label: 'Rehearsal' },
  { value: 'gig_availability', label: 'Gig availability' },
];

const REPEAT_KIND_OPTIONS: { value: CalendarRepeatInput['kind']; label: string }[] = [
  { value: 'none', label: 'Does not repeat' },
  { value: 'weekly', label: 'Every week' },
  { value: 'monthly_nth_weekday', label: 'Every month (nth weekday)' },
];

type CalendarFormState = {
  eventType: CalendarEventType;
  title: string;
  startsAt: string;
  endsAt: string;
  location: string;
  notes: string;
  repeatKind: CalendarRepeatInput['kind'];
  repeatOrdinal: number;
  occurrenceCount: string;
};

const INITIAL_FORM: CalendarFormState = {
  eventType: 'rehearsal',
  title: '',
  startsAt: '',
  endsAt: '',
  location: '',
  notes: '',
  repeatKind: 'none',
  repeatOrdinal: 1,
  occurrenceCount: String(CALENDAR_DEFAULT_OCCURRENCE_COUNT),
};

function buildRepeatInput(form: CalendarFormState): CalendarRepeatInput {
  const occurrenceCount = clampOccurrenceCount(Number(form.occurrenceCount));

  if (form.repeatKind === 'weekly') {
    return { kind: 'weekly', occurrenceCount };
  }

  if (form.repeatKind === 'monthly_nth_weekday') {
    return {
      kind: 'monthly_nth_weekday',
      ordinal: form.repeatOrdinal,
      occurrenceCount,
    };
  }

  return { kind: 'none' };
}

function repeatPreview(form: CalendarFormState): string | null {
  if (form.repeatKind === 'none' || !form.startsAt) {
    return null;
  }

  const anchor = new Date(form.startsAt);
  if (Number.isNaN(anchor.getTime())) {
    return null;
  }

  if (form.repeatKind === 'weekly') {
    return formatCalendarRepeatPattern({ kind: 'weekly' }, anchor);
  }

  return formatCalendarRepeatPattern(
    { kind: 'monthly_nth_weekday', ordinal: form.repeatOrdinal },
    anchor,
  );
}

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
  const [form, setForm] = useState<CalendarFormState>(INITIAL_FORM);

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

  const repeatSummary = useMemo(() => repeatPreview(form), [form]);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    if (!bandId || !form.title.trim() || !form.startsAt) {
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const created = await createCalendarEvent({
        bandId,
        eventType: form.eventType,
        title: form.title,
        startsAt: new Date(form.startsAt).toISOString(),
        endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
        location: form.location,
        notes: form.notes,
        repeat: buildRepeatInput(form),
      });
      setShowCreate(false);
      setForm(INITIAL_FORM);
      if (created.length > 1) {
        setLoadError(null);
      }
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

  async function handleDelete(event: CalendarEventWithVotes) {
    if (event.series_key) {
      const deleteSeries = window.confirm(
        'Delete the entire repeating series? Click Cancel to delete only this occurrence.',
      );
      if (deleteSeries) {
        try {
          await deleteCalendarEventSeries(event.series_key);
          await loadEvents();
        } catch (err) {
          setLoadError(err instanceof Error ? err.message : 'Unable to delete series.');
        }
        return;
      }
    }

    if (!window.confirm('Delete this calendar event?')) {
      return;
    }

    try {
      await deleteCalendarEvent(event.id);
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
            Propose rehearsals internally or gig date windows for the band to vote on. Repeating
            sessions (for example every Tuesday rehearsal or first Monday of the month gig slot) can
            be created in one step.
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
            <button
              type="button"
              className="directory-btn directory-btn-primary"
              onClick={() => setShowCreate(true)}
            >
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
                placeholder="e.g. Studio rehearsal or The London Stone residency"
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
                placeholder="e.g. Powerhouse Studios"
              />
            </div>
            <div className="calendar-form-grid">
              <div className="auth-field">
                <label htmlFor="calendar-repeat-kind">Repeat</label>
                <select
                  id="calendar-repeat-kind"
                  value={form.repeatKind}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      repeatKind: event.target.value as CalendarRepeatInput['kind'],
                    }))
                  }
                >
                  {REPEAT_KIND_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              {form.repeatKind !== 'none' ? (
                <div className="auth-field">
                  <label htmlFor="calendar-occurrence-count">Number of sessions</label>
                  <input
                    id="calendar-occurrence-count"
                    type="number"
                    min={1}
                    max={CALENDAR_MAX_OCCURRENCE_COUNT}
                    value={form.occurrenceCount}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, occurrenceCount: event.target.value }))
                    }
                    required
                  />
                </div>
              ) : null}
            </div>
            {form.repeatKind === 'monthly_nth_weekday' ? (
              <div className="auth-field">
                <label htmlFor="calendar-repeat-ordinal">Which weekday in the month</label>
                <select
                  id="calendar-repeat-ordinal"
                  value={form.repeatOrdinal}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      repeatOrdinal: Number(event.target.value),
                    }))
                  }
                >
                  {CALENDAR_REPEAT_ORDINAL_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
            {repeatSummary ? (
              <p className="calendar-repeat-preview">
                {repeatSummary}
                {form.repeatKind !== 'none'
                  ? ` · ${clampOccurrenceCount(Number(form.occurrenceCount))} sessions`
                  : ''}
              </p>
            ) : null}
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
                {submitting
                  ? 'Saving…'
                  : form.repeatKind === 'none'
                    ? 'Create event'
                    : 'Create series'}
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
            const repeatPattern = parseCalendarRepeatPattern(event.repeat_pattern);
            const repeatLabel = formatCalendarRepeatPattern(repeatPattern, event.starts_at);

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
                      {event.ends_at
                        ? ` – ${new Date(event.ends_at).toLocaleTimeString('en-GB', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}`
                        : ''}
                      {event.location ? ` · ${event.location}` : ''}
                    </p>
                    {repeatLabel ? <p className="calendar-event-repeat">{repeatLabel}</p> : null}
                  </div>
                  {event.event_type === 'gig_availability' ? (
                    <span className={availabilityStatusClass(event.availability_status)}>
                      {AVAILABILITY_STATUS_LABELS[event.availability_status]}
                    </span>
                  ) : null}
                </div>

                {event.notes ? <p className="calendar-event-notes">{event.notes}</p> : null}

                <div className="calendar-votes">
                  <p className="calendar-vote-summary">
                    {voteSummary.available} available · {voteSummary.maybe} maybe · {voteSummary.no} no ·{' '}
                    {voteSummary.pending} pending
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

                {canManage ? (
                  <button
                    type="button"
                    className="calendar-delete-btn"
                    onClick={() => void handleDelete(event)}
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
