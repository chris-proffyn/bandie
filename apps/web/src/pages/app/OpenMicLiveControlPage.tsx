import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  endOpenMicEvent,
  getOpenMicEvent,
  getOpenMicEventSummary,
  getOpenMicLiveDashboard,
  startOpenMicEvent,
  subscribeOpenMicEvent,
  updateOpenMicSongLiveStatus,
  type OpenMicEventSummary,
  type OpenMicLiveDashboard,
  type OpenMicEventSummaryStats,
} from '@bandie/data';
import '../../styles/gigs.css';
import '../../styles/workspace.css';
import '../../styles/openMic.css';

export function OpenMicLiveControlPage() {
  const { eventId } = useParams();
  const [event, setEvent] = useState<OpenMicEventSummary | null>(null);
  const [dashboard, setDashboard] = useState<OpenMicLiveDashboard | null>(null);
  const [summary, setSummary] = useState<OpenMicEventSummaryStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!eventId) return;
    setLoading(true);
    try {
      const [eventRow, dashboardRow, summaryRow] = await Promise.all([
        getOpenMicEvent(eventId),
        getOpenMicLiveDashboard(eventId),
        getOpenMicEventSummary(eventId),
      ]);
      setEvent(eventRow);
      setDashboard(dashboardRow);
      setSummary(summaryRow);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load live dashboard.');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    void load();
    if (!eventId) return undefined;

    const unsubscribe = subscribeOpenMicEvent(eventId, () => {
      void load();
    });
    const poll = window.setInterval(() => void load(), 8000);

    return () => {
      unsubscribe();
      window.clearInterval(poll);
    };
  }, [eventId, load]);

  async function markSong(songId: string, status: 'playing' | 'completed' | 'skipped') {
    try {
      await updateOpenMicSongLiveStatus(songId, status);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update song.');
    }
  }

  if (loading && !dashboard) {
    return <p className="workspace-empty-note">Loading live control room…</p>;
  }

  if (!event || !dashboard) {
    return (
      <div className="gigs-page">
        <div className="panel">
          <p>{error ?? 'Event not found.'}</p>
          <Link to="/app/open-mic" className="directory-btn directory-btn-secondary">
            Back to events
          </Link>
        </div>
      </div>
    );
  }

  const isLive = event.status === 'in_progress';

  return (
    <div className="gigs-page">
      <header className="gigs-header open-mic-no-print">
        <div>
          <p className="my-bands-eyebrow">Live control room</p>
          <h1>{event.title}</h1>
          <p className="my-bands-lead">Run the evening — mark songs playing, complete, or skip.</p>
        </div>
        <Link to={`/app/open-mic/${eventId}`} className="directory-btn directory-btn-secondary">
          Back to event
        </Link>
      </header>

      <div className="gig-detail-actions open-mic-no-print">
        {!isLive ? (
          <button type="button" className="auth-button" onClick={() => void startOpenMicEvent(event.id).then(load)}>
            Start event
          </button>
        ) : (
          <button
            type="button"
            className="directory-btn directory-btn-secondary"
            onClick={() => void endOpenMicEvent(event.id).then(load)}
          >
            End event
          </button>
        )}
        <button type="button" className="directory-btn directory-btn-secondary" onClick={() => window.print()}>
          Export PDF
        </button>
      </div>

      {error ? <div className="auth-message auth-message-error">{error}</div> : null}

      <section className="open-mic-live-now open-mic-no-print">
        <p className="open-mic-live-now-label">Now playing</p>
        <h2>{dashboard.nowPlaying ? dashboard.nowPlaying.title : 'Nothing playing yet'}</h2>
        {dashboard.nowPlaying ? (
          <div className="gig-detail-actions" style={{ marginTop: '0.75rem' }}>
            <button
              type="button"
              className="auth-button"
              onClick={() => void markSong(dashboard.nowPlaying!.id, 'completed')}
            >
              Complete
            </button>
            <button
              type="button"
              className="directory-btn directory-btn-secondary"
              onClick={() => void markSong(dashboard.nowPlaying!.id, 'skipped')}
            >
              Skip
            </button>
          </div>
        ) : null}
      </section>

      {dashboard.issues.length > 0 ? (
        <section className="panel workspace-section open-mic-no-print">
          <header className="workspace-section-header">
            <div>
              <h2>Issues</h2>
            </div>
          </header>
          <ul className="workspace-section-note">
            {dashboard.issues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="panel workspace-section">
        <header className="workspace-section-header open-mic-no-print">
          <div>
            <h2>Running order</h2>
          </div>
        </header>
        <div className="open-mic-live-list">
          {dashboard.songs.map((song) => (
            <div
              key={song.id}
              className={`open-mic-live-row ${song.live_status === 'playing' ? 'open-mic-live-row--playing' : ''}`}
            >
              <div>
                <strong>
                  {song.title}
                  {song.artist ? ` — ${song.artist}` : ''}
                </strong>
                <p className="workspace-empty-note">{song.live_status}</p>
              </div>
              <div className="gig-detail-actions open-mic-no-print">
                {song.live_status !== 'playing' ? (
                  <button
                    type="button"
                    className="directory-btn directory-btn-secondary"
                    onClick={() => void markSong(song.id, 'playing')}
                  >
                    Play
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </section>

      {summary ? (
        <div className="gigs-metrics open-mic-no-print">
          <article className="gigs-metric-card">
            <span>Songs</span>
            <strong>{summary.totalSongs}</strong>
          </article>
          <article className="gigs-metric-card">
            <span>Completed</span>
            <strong>{summary.completedSongs}</strong>
          </article>
          <article className="gigs-metric-card">
            <span>Sign-ups</span>
            <strong>{summary.approvedSignups}</strong>
          </article>
        </div>
      ) : null}
    </div>
  );
}
