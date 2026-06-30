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

  async function handleAddSong(event: FormEvent) {
    event.preventDefault();
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
    <div className="open-mic-page">
      <div className="open-mic-header">
        <div>
          <p>
            <Link to={`/app/open-mic/${eventId}`}>{eventTitle}</Link>
          </p>
          <h1>Song list</h1>
        </div>
      </div>

      {error ? <p className="form-error">{error}</p> : null}
      {loading ? <p>Loading songs…</p> : null}

      <form className="panel" onSubmit={handleAddSong}>
        <h2>Add song</h2>
        <div className="open-mic-header-actions" style={{ alignItems: 'end' }}>
          <label style={{ flex: 1 }}>
            Title
            <input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </label>
          <label style={{ flex: 1 }}>
            Artist
            <input value={artist} onChange={(e) => setArtist(e.target.value)} />
          </label>
          <button type="submit" className="auth-button">
            Add
          </button>
        </div>
      </form>

      {signups.length > 0 ? (
        <div className="panel">
          <h2>Pending sign-ups ({signups.length})</h2>
          <ul className="open-mic-list">
            {signups.map((signup) => (
              <li key={signup.id} className="open-mic-song-row">
                <div>
                  <strong>{signup.player.display_name}</strong>
                  <p>
                    {signup.song.title} · {signup.slot.slot_name}
                  </p>
                </div>
                <div className="open-mic-header-actions">
                  <button
                    type="button"
                    className="auth-button"
                    onClick={() => void approveOpenMicAssignment(signup.id).then(load)}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    className="auth-button auth-button--secondary"
                    onClick={() => void rejectOpenMicAssignment(signup.id).then(load)}
                  >
                    Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {suggestions.length > 0 ? (
        <div className="panel">
          <h2>Song suggestions ({suggestions.length})</h2>
          <ul className="open-mic-list">
            {suggestions.map((suggestion) => (
              <li key={suggestion.id} className="open-mic-song-row">
                <div>
                  <strong>
                    {suggestion.title}
                    {suggestion.artist ? ` — ${suggestion.artist}` : ''}
                  </strong>
                  {suggestion.notes ? <p>{suggestion.notes}</p> : null}
                </div>
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
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="open-mic-song-list">
        {songs.map((song) => (
          <article key={song.id} className="open-mic-song-row">
            <div className="open-mic-header">
              <div>
                <strong>
                  {song.title}
                  {song.artist ? ` — ${song.artist}` : ''}
                </strong>
                <p>{formatSongReadiness(song.readiness_status)}</p>
              </div>
              <button
                type="button"
                className="auth-button auth-button--secondary"
                onClick={() => void deleteOpenMicSong(song.id).then(load)}
              >
                Delete
              </button>
            </div>
            <div className="open-mic-slot-chips">
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
              <div className="open-mic-header-actions">
                <button
                  type="button"
                  className="auth-button auth-button--secondary"
                  onClick={() => void handleApplyTemplate(song.id, 'rock')}
                >
                  Rock template
                </button>
                <button
                  type="button"
                  className="auth-button auth-button--secondary"
                  onClick={() => void handleApplyTemplate(song.id, 'acoustic')}
                >
                  Acoustic template
                </button>
                <button
                  type="button"
                  className="auth-button auth-button--secondary"
                  onClick={() => void handleApplyTemplate(song.id, 'blues')}
                >
                  Blues template
                </button>
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}
