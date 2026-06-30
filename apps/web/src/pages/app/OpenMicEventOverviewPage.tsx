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
import '../../styles/gigs.css';
import '../../styles/workspace.css';
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
    return <p className="workspace-empty-note">Loading event…</p>;
  }

  if (!event) {
    return (
      <div className="gigs-page">
        <div className="panel">
          <p>{error ?? 'Event not found.'}</p>
          <Link to="/app/open-mic" className="directory-btn directory-btn-secondary">
            Back to open mic events
          </Link>
        </div>
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
    <div className="gigs-page">
      <header className="gigs-header">
        <div>
          <p className="my-bands-eyebrow">Open mic event</p>
          <h1>{event.title}</h1>
          <p className="my-bands-lead">
            {formatOpenMicEventType(event.event_type)} · {starts}
            {venue.name ? ` · ${venue.name}` : ''}
          </p>
          <p className="my-bands-lead">
            <span className={openMicStatusPillClass(event.status)}>
              {formatOpenMicEventStatus(event.status)}
            </span>
          </p>
        </div>
        <Link to="/app/open-mic" className="directory-btn directory-btn-secondary">
          Back to events
        </Link>
      </header>

      {error ? <div className="auth-message auth-message-error">{error}</div> : null}

      <div className="gigs-metrics">
        <article className="gigs-metric-card">
          <span>Songs planned</span>
          <strong>{event.songCount}</strong>
        </article>
        <article className="gigs-metric-card">
          <span>Sign-ups</span>
          <strong>{event.signupCount}</strong>
        </article>
        <article className="gigs-metric-card">
          <span>Sign-up mode</span>
          <strong>{formatOpenMicSignupMode(event.signup_mode)}</strong>
        </article>
        <article className="gigs-metric-card">
          <span>Public page</span>
          <strong>{event.status === 'draft' ? 'Draft' : 'Live'}</strong>
        </article>
      </div>

      <section className="panel workspace-section">
        <header className="workspace-section-header">
          <div>
            <h2>Next steps</h2>
            <p className="workspace-section-intro">
              Publish when ready, then build your song list and share the sign-up page.
            </p>
          </div>
        </header>
        <div className="gig-detail-actions">
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
          <Link className="directory-btn directory-btn-secondary" to={`/app/open-mic/${event.id}/songs`}>
            Manage songs
          </Link>
          <Link className="directory-btn directory-btn-secondary" to={`/app/open-mic/${event.id}/poster`}>
            Create poster
          </Link>
          {signupOpen ? (
            <a
              className="directory-btn directory-btn-secondary"
              href={publicUrl}
              target="_blank"
              rel="noreferrer"
            >
              Open sign-up page
            </a>
          ) : null}
          {event.status === 'signup_open' || event.status === 'published' ? (
            <Link className="directory-btn directory-btn-secondary" to={`/app/open-mic/${event.id}/live`}>
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
            className="directory-btn directory-btn-secondary"
            disabled={busy}
            onClick={() => void runAction(() => duplicateOpenMicEvent(event.id))}
          >
            Duplicate
          </button>
          {!['cancelled', 'completed', 'archived'].includes(event.status) ? (
            <button
              type="button"
              className="directory-btn directory-btn-secondary"
              disabled={busy}
              onClick={() => void runAction(() => cancelOpenMicEvent(event.id))}
            >
              Cancel event
            </button>
          ) : null}
        </div>
      </section>

      {event.description ? (
        <section className="panel workspace-section">
          <header className="workspace-section-header">
            <div>
              <h2>Description</h2>
            </div>
          </header>
          <p className="workspace-section-note">{event.description}</p>
        </section>
      ) : null}

      {venue.name || venue.address ? (
        <section className="panel workspace-section">
          <header className="workspace-section-header">
            <div>
              <h2>Venue</h2>
            </div>
          </header>
          <p className="workspace-section-note">
            {venue.name}
            {venue.address ? (
              <>
                <br />
                {venue.address}
              </>
            ) : null}
          </p>
        </section>
      ) : null}
    </div>
  );
}
