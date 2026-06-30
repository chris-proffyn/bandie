import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  cancelOpenMicEvent,
  duplicateOpenMicEvent,
  formatOpenMicEventStatus,
  formatOpenMicEventType,
  formatOpenMicSignupMode,
  getOpenMicEvent,
  getOpenMicPublicUrl,
  openMicStatusPillClass,
  publishOpenMicEvent,
  resolveOpenMicVenueLabel,
  type OpenMicEventSummary,
} from '@bandie/data';
import '../../styles/openMic.css';

export function OpenMicEventOverviewPage() {
  const { eventId } = useParams();
  const [event, setEvent] = useState<OpenMicEventSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const loadEvent = useCallback(async () => {
    if (!eventId) return;
    setLoading(true);
    setError(null);
    try {
      const row = await getOpenMicEvent(eventId);
      setEvent(row);
    } catch (err) {
      setEvent(null);
      setError(err instanceof Error ? err.message : 'Unable to load event.');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    void loadEvent();
  }, [loadEvent]);

  async function runAction(action: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await action();
      await loadEvent();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed.');
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <p>Loading event…</p>;
  }

  if (!event) {
    return (
      <div className="panel">
        <p>{error ?? 'Event not found.'}</p>
        <Link to="/app/open-mic">Back to open mic events</Link>
      </div>
    );
  }

  const venue = resolveOpenMicVenueLabel(event, event.venue);
  const starts = new Date(event.starts_at).toLocaleString('en-GB', {
    dateStyle: 'full',
    timeStyle: 'short',
  });
  const publicUrl = getOpenMicPublicUrl(event.slug);
  const signupOpen = ['published', 'signup_open', 'in_progress'].includes(event.status);

  return (
    <div className="open-mic-page">
      <div className="open-mic-header">
        <div>
          <p>
            <Link to="/app/open-mic">Open mic events</Link>
          </p>
          <h1>{event.title}</h1>
          <p>
            {formatOpenMicEventType(event.event_type)} · {starts}
            {venue.name ? ` · ${venue.name}` : ''}
          </p>
        </div>
        <span className={openMicStatusPillClass(event.status)}>
          {formatOpenMicEventStatus(event.status)}
        </span>
      </div>

      {error ? <p className="form-error">{error}</p> : null}

      <div className="open-mic-card-grid">
        <div className="open-mic-summary-card">
          <span>Songs planned</span>
          <strong>{event.songCount}</strong>
        </div>
        <div className="open-mic-summary-card">
          <span>Sign-ups</span>
          <strong>{event.signupCount}</strong>
        </div>
        <div className="open-mic-summary-card">
          <span>Sign-up mode</span>
          <strong>{formatOpenMicSignupMode(event.signup_mode)}</strong>
        </div>
        <div className="open-mic-summary-card">
          <span>Public page</span>
          <strong>{event.status === 'draft' ? 'Draft' : 'Live'}</strong>
        </div>
      </div>

      <div className="open-mic-actions">
        {event.status === 'draft' ? (
          <button
            type="button"
            className="auth-button"
            disabled={busy}
            onClick={() => void runAction(() => publishOpenMicEvent(event.id))}
          >
            Publish event
          </button>
        ) : null}
        <Link className="auth-button auth-button--secondary" to={`/app/open-mic/${event.id}/songs`}>
          Manage songs
        </Link>
        <Link className="auth-button auth-button--secondary" to={`/app/open-mic/${event.id}/poster`}>
          Create poster
        </Link>
        {signupOpen ? (
          <a className="auth-button auth-button--secondary" href={publicUrl} target="_blank" rel="noreferrer">
            Open sign-up page
          </a>
        ) : null}
        {event.status === 'signup_open' || event.status === 'published' ? (
          <Link className="auth-button auth-button--secondary" to={`/app/open-mic/${event.id}/live`}>
            Launch live mode
          </Link>
        ) : null}
        {event.status === 'in_progress' ? (
          <Link className="auth-button" to={`/app/open-mic/${event.id}/live`}>
            Live control room
          </Link>
        ) : null}
        <button
          type="button"
          className="auth-button auth-button--secondary"
          disabled={busy}
          onClick={() => void runAction(() => duplicateOpenMicEvent(event.id))}
        >
          Duplicate
        </button>
        {!['cancelled', 'completed', 'archived'].includes(event.status) ? (
          <button
            type="button"
            className="auth-button auth-button--secondary"
            disabled={busy}
            onClick={() => void runAction(() => cancelOpenMicEvent(event.id))}
          >
            Cancel event
          </button>
        ) : null}
      </div>

      {event.description ? (
        <div className="panel">
          <h2>Description</h2>
          <p>{event.description}</p>
        </div>
      ) : null}

      {venue.address ? (
        <div className="panel">
          <h2>Venue</h2>
          <p>
            {venue.name}
            <br />
            {venue.address}
          </p>
        </div>
      ) : null}
    </div>
  );
}
