import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  addOpenMicSong,
  applyInstrumentTemplate,
  deleteOpenMicSong,
  formatSongReadiness,
  getOpenMicEvent,
  listOpenMicSignups,
  listOpenMicSongSuggestions,
  approveOpenMicAssignment,
  rejectOpenMicAssignment,
  listOpenMicSongs,
  type OpenMicAssignmentWithDetails,
  type OpenMicSongSuggestion,
  type OpenMicSongWithSlots,
} from '@bandie/data';
import '../../styles/gigs.css';
import '../../styles/workspace.css';
import '../../styles/openMic.css';

export function OpenMicSongListPage() {
  const { eventId } = useParams();
  const [songs, setSongs] = useState<OpenMicSongWithSlots[]>([]);
  const [signups, setSignups] = useState<OpenMicAssignmentWithDetails[]>([]);
  const [suggestions, setSuggestions] = useState<OpenMicSongSuggestion[]>([]);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eventTitle, setEventTitle] = useState('');

  const load = useCallback(async () => {
    if (!eventId) return;
    setLoading(true);
    setError(null);
    try {
      const [event, songRows, signupRows, suggestionRows] = await Promise.all([
        getOpenMicEvent(eventId),
        listOpenMicSongs(eventId),
        listOpenMicSignups(eventId),
        listOpenMicSongSuggestions(eventId),
      ]);
      setEventTitle(event?.title ?? 'Event');
      setSongs(songRows);
      setSignups(signupRows.filter((row) => row.status === 'requested'));
      setSuggestions(suggestionRows.filter((row) => row.status === 'pending'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load songs.');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleAddSong(formEvent: FormEvent) {
    formEvent.preventDefault();
    if (!eventId || !title.trim()) return;
    try {
      await addOpenMicSong(eventId, { title, artist: artist || null });
      setTitle('');
      setArtist('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to add song.');
    }
  }

  async function handleApplyTemplate(songId: string, templateCode: string) {
    try {
      await applyInstrumentTemplate(songId, templateCode);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to apply template.');
    }
  }

  return (
    <div className="gigs-page">
      <header className="gigs-header">
        <div>
          <p className="my-bands-eyebrow">Song list</p>
          <h1>{eventTitle}</h1>
          <p className="my-bands-lead">Add songs, apply instrument templates, and review sign-ups.</p>
        </div>
        <Link to={`/app/open-mic/${eventId}`} className="directory-btn directory-btn-secondary">
          Back to event
        </Link>
      </header>

      {error ? <div className="auth-message auth-message-error">{error}</div> : null}
      {loading ? <p className="workspace-empty-note">Loading songs…</p> : null}

      <section className="panel workspace-section">
        <header className="workspace-section-header">
          <div>
            <h2>Add song</h2>
            <p className="workspace-section-intro">Songs appear in running order on the live control room.</p>
          </div>
        </header>
        <form className="auth-form" onSubmit={handleAddSong}>
          <div className="gig-detail-grid">
            <div className="auth-field">
              <label htmlFor="open-mic-song-title">Title</label>
              <input
                id="open-mic-song-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="auth-field">
              <label htmlFor="open-mic-song-artist">Artist (optional)</label>
              <input
                id="open-mic-song-artist"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
              />
            </div>
          </div>
          <div className="gig-detail-actions">
            <button type="submit" className="auth-button">
              Add song
            </button>
          </div>
        </form>
      </section>

      {signups.length > 0 ? (
        <section className="panel workspace-section">
          <header className="workspace-section-header">
            <div>
              <h2>Pending sign-ups ({signups.length})</h2>
              <p className="workspace-section-intro">Approve or reject player requests.</p>
            </div>
          </header>
          <ul className="gigs-list">
            {signups.map((signup) => (
              <li key={signup.id} className="open-mic-queue-item">
                <div>
                  <strong>{signup.player.display_name}</strong>
                  <p>
                    {signup.song.title} · {signup.slot.slot_name}
                  </p>
                </div>
                <div className="gig-detail-actions">
                  <button
                    type="button"
                    className="auth-button"
                    onClick={() => void approveOpenMicAssignment(signup.id).then(load)}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    className="directory-btn directory-btn-secondary"
                    onClick={() => void rejectOpenMicAssignment(signup.id).then(load)}
                  >
                    Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {suggestions.length > 0 ? (
        <section className="panel workspace-section">
          <header className="workspace-section-header">
            <div>
              <h2>Song suggestions ({suggestions.length})</h2>
            </div>
          </header>
          <ul className="gigs-list">
            {suggestions.map((suggestion) => (
              <li key={suggestion.id} className="open-mic-queue-item">
                <div>
                  <strong>
                    {suggestion.title}
                    {suggestion.artist ? ` — ${suggestion.artist}` : ''}
                  </strong>
                  {suggestion.notes ? <p>{suggestion.notes}</p> : null}
                </div>
                <div className="gig-detail-actions">
                  <button
                    type="button"
                    className="auth-button"
                    onClick={() =>
                      void addOpenMicSong(eventId!, {
                        title: suggestion.title,
                        artist: suggestion.artist,
                        notes: suggestion.notes,
                      }).then(load)
                    }
                  >
                    Add to list
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="panel workspace-section">
        <header className="workspace-section-header">
          <div>
            <h2>Running order</h2>
            {!loading && songs.length === 0 ? (
              <p className="workspace-section-intro">No songs yet. Add your first song above.</p>
            ) : null}
          </div>
        </header>
        <ul className="gigs-list">
          {songs.map((song) => (
            <li key={song.id}>
              <article className="open-mic-song-card">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <strong>
                    {song.title}
                    {song.artist ? ` — ${song.artist}` : ''}
                  </strong>
                  <p>{formatSongReadiness(song.readiness_status)}</p>
                  <div className="open-mic-slot-chips" style={{ marginTop: '0.5rem' }}>
                    {song.slots.map((slot) => (
                      <span
                        key={slot.id}
                        className={`open-mic-slot-chip ${
                          slot.status === 'open' ? 'open-mic-slot-chip--open' : 'open-mic-slot-chip--filled'
                        }`}
                      >
                        {slot.slot_name} ({slot.status})
                      </span>
                    ))}
                  </div>
                  {song.slots.length === 0 ? (
                    <div className="gig-detail-actions" style={{ marginTop: '0.75rem' }}>
                      <button
                        type="button"
                        className="directory-btn directory-btn-secondary"
                        onClick={() => void handleApplyTemplate(song.id, 'rock')}
                      >
                        Rock template
                      </button>
                      <button
                        type="button"
                        className="directory-btn directory-btn-secondary"
                        onClick={() => void handleApplyTemplate(song.id, 'acoustic')}
                      >
                        Acoustic template
                      </button>
                      <button
                        type="button"
                        className="directory-btn directory-btn-secondary"
                        onClick={() => void handleApplyTemplate(song.id, 'blues')}
                      >
                        Blues template
                      </button>
                    </div>
                  ) : null}
                </div>
                <div className="gig-detail-actions">
                  <button
                    type="button"
                    className="directory-btn directory-btn-secondary"
                    onClick={() => void deleteOpenMicSong(song.id).then(load)}
                  >
                    Delete
                  </button>
                </div>
              </article>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
