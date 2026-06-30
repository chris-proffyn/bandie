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

  function handlePrintRunningOrder() {
    window.print();
  }

  if (loading && !dashboard) {
    return <p>Loading live control room…</p>;
  }

  if (!event || !dashboard) {
    return (
      <div className="panel">
        <p>{error ?? 'Event not found.'}</p>
        <Link to="/app/open-mic">Back</Link>
      </div>
    );
  }

  const isLive = event.status === 'in_progress';

  return (
    <div className="open-mic-live-page">
      <div className="open-mic-header open-mic-no-print">
        <div>
          <p>
            <Link to={`/app/open-mic/${eventId}`}>{event.title}</Link>
          </p>
          <h1>Live control room</h1>
        </div>
        <div className="open-mic-header-actions">
          {!isLive ? (
            <button type="button" className="auth-button" onClick={() => void startOpenMicEvent(event.id).then(load)}>
              Start event
            </button>
          ) : (
            <button type="button" className="auth-button auth-button-secondary" onClick={() => void endOpenMicEvent(event.id).then(load)}>
              End event
            </button>
          )}
          <button type="button" className="auth-button auth-button-secondary" onClick={handlePrintRunningOrder}>
            Export PDF
          </button>
        </div>
      </div>

      {error ? <p className="form-error">{error}</p> : null}

      <section className="open-mic-live-now open-mic-no-print">
        <p style={{ margin: 0, opacity: 0.75 }}>Now playing</p>
        <h2 style={{ margin: '0.35rem 0 0' }}>
          {dashboard.nowPlaying ? dashboard.nowPlaying.title : 'Nothing playing yet'}
        </h2>
        {dashboard.nowPlaying ? (
          <div className="open-mic-header-actions" style={{ marginTop: '0.75rem' }}>
            <button
              type="button"
              className="auth-button"
              onClick={() => void markSong(dashboard.nowPlaying!.id, 'completed')}
            >
              Complete
            </button>
            <button
              type="button"
              className="auth-button auth-button-secondary"
              onClick={() => void markSong(dashboard.nowPlaying!.id, 'skipped')}
            >
              Skip
            </button>
          </div>
        ) : null}
      </section>

      {dashboard.issues.length > 0 ? (
        <div className="panel open-mic-no-print">
          <h2>Issues</h2>
          <ul>
            {dashboard.issues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <section className="panel">
        <h2 className="open-mic-no-print">Running order</h2>
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
                <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)' }}>{song.live_status}</p>
              </div>
              <div className="open-mic-header-actions open-mic-no-print">
                {song.live_status !== 'playing' ? (
                  <button
                    type="button"
                    className="auth-button auth-button-secondary"
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
        <div className="open-mic-card-grid open-mic-no-print">
          <div className="open-mic-summary-card">
            <span>Songs</span>
            <strong>{summary.totalSongs}</strong>
          </div>
          <div className="open-mic-summary-card">
            <span>Completed</span>
            <strong>{summary.completedSongs}</strong>
          </div>
          <div className="open-mic-summary-card">
            <span>Sign-ups</span>
            <strong>{summary.approvedSignups}</strong>
          </div>
        </div>
      ) : null}
    </div>
  );
}
