import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  addOpenMicSong,
  approveOpenMicAssignment,
  clearOpenMicSlotAssignment,
  deleteOpenMicSong,
  formatSongReadiness,
  getOpenMicEvent,
  listOpenMicSignups,
  listOpenMicSongSuggestions,
  listOpenMicSongs,
  rejectOpenMicAssignment,
  setOpenMicSongSlotEnabled,
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

  const partNames = useMemo(() => {
    const names = new Set<string>();
    for (const song of songs) {
      for (const slot of song.slots) {
        names.add(slot.slot_name);
      }
    }
    return [...names];
  }, [songs]);

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

  function slotForSong(song: OpenMicSongWithSlots, partName: string) {
    return song.slots.find((slot) => slot.slot_name === partName);
  }

  return (
    <div className="gigs-page">
      <header className="gigs-header">
        <div>
          <p className="my-bands-eyebrow">Song list</p>
          <h1>{eventTitle}</h1>
          <p className="my-bands-lead">
            Songs with auto-assigned parts from your house band template. Toggle parts off per song when
            not needed.
          </p>
        </div>
        <div className="gig-detail-actions">
          <Link to={`/app/open-mic/${eventId}/house-band`} className="directory-btn directory-btn-secondary">
            House band & parts
          </Link>
          <Link to={`/app/open-mic/${eventId}`} className="directory-btn directory-btn-secondary">
            Back to event
          </Link>
        </div>
      </header>

      {error ? <div className="auth-message auth-message-error">{error}</div> : null}
      {loading ? <p className="workspace-empty-note">Loading songs…</p> : null}

      <section className="panel workspace-section">
        <header className="workspace-section-header">
          <div>
            <h2>Add song</h2>
            <p className="workspace-section-intro">Standard parts are applied automatically from your event template.</p>
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
            </div>
          </header>
          <div className="open-mic-table-wrap">
            <table className="open-mic-table">
              <thead>
                <tr>
                  <th>Player</th>
                  <th>Song</th>
                  <th>Part</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {signups.map((signup) => (
                  <tr key={signup.id}>
                    <td>{signup.player.display_name}</td>
                    <td>{signup.song.title}</td>
                    <td>{signup.slot.slot_name}</td>
                    <td>
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {suggestions.length > 0 ? (
        <section className="panel workspace-section">
          <header className="workspace-section-header">
            <div>
              <h2>Requests & suggestions ({suggestions.length})</h2>
            </div>
          </header>
          <div className="open-mic-table-wrap">
            <table className="open-mic-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Detail</th>
                  <th>Notes</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {suggestions.map((suggestion) => (
                  <tr key={suggestion.id}>
                    <td>{suggestion.suggestion_type === 'existing_slot' ? 'Part request' : 'New song'}</td>
                    <td>
                      {suggestion.suggestion_type === 'existing_slot'
                        ? suggestion.preferred_slot_name ?? 'Existing song part'
                        : `${suggestion.title}${suggestion.artist ? ` — ${suggestion.artist}` : ''}`}
                    </td>
                    <td>{suggestion.notes ?? '—'}</td>
                    <td>
                      {suggestion.suggestion_type === 'new_song' ? (
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
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
        {songs.length > 0 ? (
          <div className="open-mic-table-wrap open-mic-table-wrap--scroll">
            <table className="open-mic-table open-mic-table--matrix">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Song</th>
                  <th>Ready</th>
                  {partNames.map((name) => (
                    <th key={name}>{name}</th>
                  ))}
                  <th />
                </tr>
              </thead>
              <tbody>
                {songs.map((song, index) => (
                  <tr key={song.id}>
                    <td>{index + 1}</td>
                    <td>
                      <strong>{song.title}</strong>
                      {song.artist ? <div className="open-mic-table-sub">{song.artist}</div> : null}
                    </td>
                    <td>{formatSongReadiness(song.readiness_status)}</td>
                    {partNames.map((partName) => {
                      const slot = slotForSong(song, partName);
                      if (!slot) {
                        return <td key={partName}>—</td>;
                      }
                      return (
                        <td key={partName} className={!slot.enabled ? 'open-mic-cell--disabled' : undefined}>
                          {slot.enabled ? (
                            <>
                              <div>{slot.playerName ?? 'Open'}</div>
                              <div className="open-mic-table-sub">{slot.status}</div>
                              <div className="open-mic-table-actions">
                                {slot.playerName ? (
                                  <button
                                    type="button"
                                    className="directory-btn directory-btn-secondary"
                                    onClick={() => void clearOpenMicSlotAssignment(slot.id).then(load)}
                                  >
                                    Free
                                  </button>
                                ) : null}
                                <button
                                  type="button"
                                  className="directory-btn directory-btn-secondary"
                                  onClick={() =>
                                    void setOpenMicSongSlotEnabled(slot.id, !slot.enabled).then(load)
                                  }
                                >
                                  {slot.enabled ? 'Off' : 'On'}
                                </button>
                              </div>
                            </>
                          ) : (
                            <button
                              type="button"
                              className="directory-btn directory-btn-secondary"
                              onClick={() => void setOpenMicSongSlotEnabled(slot.id, true).then(load)}
                            >
                              Enable
                            </button>
                          )}
                        </td>
                      );
                    })}
                    <td>
                      <button
                        type="button"
                        className="directory-btn directory-btn-secondary"
                        onClick={() => void deleteOpenMicSong(song.id).then(load)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </div>
  );
}
