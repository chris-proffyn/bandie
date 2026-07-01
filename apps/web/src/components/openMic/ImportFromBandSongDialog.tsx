import { useEffect, useMemo, useState } from 'react';
import {
  importOpenMicSongsFromBand,
  isBandLeaderRole,
  listBandSongs,
  listUserBands,
  type BandSong,
  type UserBand,
} from '@bandie/data';

type ImportFromBandSongDialogProps = {
  eventId: string;
  importedSourceSongIds: string[];
  onClose: () => void;
  onImported: () => void;
};

export function ImportFromBandSongDialog({
  eventId,
  importedSourceSongIds,
  onClose,
  onImported,
}: ImportFromBandSongDialogProps) {
  const [bands, setBands] = useState<UserBand[]>([]);
  const [bandId, setBandId] = useState('');
  const [songs, setSongs] = useState<BandSong[]>([]);
  const [selectedSongIds, setSelectedSongIds] = useState<string[]>([]);
  const [loadingBands, setLoadingBands] = useState(true);
  const [loadingSongs, setLoadingSongs] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  const leaderBands = useMemo(
    () => bands.filter((band) => isBandLeaderRole(band.member_role)),
    [bands],
  );

  const importedSet = useMemo(() => new Set(importedSourceSongIds), [importedSourceSongIds]);

  const availableSongs = useMemo(
    () => songs.filter((song) => !importedSet.has(song.id)),
    [songs, importedSet],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadBands() {
      setLoadingBands(true);
      setError(null);
      try {
        const rows = await listUserBands();
        if (cancelled) return;
        const leaders = rows.filter((band) => isBandLeaderRole(band.member_role));
        setBands(rows);
        setBandId(leaders[0]?.id ?? '');
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unable to load bands.');
        }
      } finally {
        if (!cancelled) {
          setLoadingBands(false);
        }
      }
    }

    void loadBands();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!bandId) {
      setSongs([]);
      setSelectedSongIds([]);
      return;
    }

    let cancelled = false;

    async function loadSongs() {
      setLoadingSongs(true);
      setError(null);
      setResultMessage(null);
      try {
        const rows = await listBandSongs(bandId);
        if (cancelled) return;
        setSongs(rows);
        setSelectedSongIds([]);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unable to load band songs.');
        }
      } finally {
        if (!cancelled) {
          setLoadingSongs(false);
        }
      }
    }

    void loadSongs();
    return () => {
      cancelled = true;
    };
  }, [bandId]);

  function toggleSong(songId: string) {
    setSelectedSongIds((current) =>
      current.includes(songId) ? current.filter((id) => id !== songId) : [...current, songId],
    );
  }

  function selectAllAvailable() {
    setSelectedSongIds(availableSongs.map((song) => song.id));
  }

  function clearSelection() {
    setSelectedSongIds([]);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!bandId || selectedSongIds.length === 0) {
      return;
    }

    setSubmitting(true);
    setError(null);
    setResultMessage(null);

    try {
      const result = await importOpenMicSongsFromBand(eventId, bandId, selectedSongIds);
      const parts: string[] = [];
      if (result.imported.length > 0) {
        parts.push(
          `Imported ${result.imported.length} song${result.imported.length === 1 ? '' : 's'}.`,
        );
      }
      if (result.skippedCount > 0) {
        parts.push(
          `${result.skippedCount} skipped (already on the list or unavailable).`,
        );
      }
      setResultMessage(parts.join(' ') || 'No songs were imported.');
      setSelectedSongIds([]);
      onImported();
      if (result.imported.length > 0 && result.skippedCount === 0) {
        onClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to import songs.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="songs-dialog-backdrop" role="presentation" onClick={onClose}>
      <div
        className="songs-dialog surface-light"
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-band-songs-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="import-band-songs-title">Import from band song list</h2>
        <p>
          Copy songs from a band you lead. Metadata and instrument slots come from each song&apos;s
          part folders, or your band&apos;s standard part template when folders are not set up yet.
        </p>

        {loadingBands ? <p className="my-bands-lead">Loading bands…</p> : null}

        {!loadingBands && leaderBands.length === 0 ? (
          <p className="my-bands-lead">
            You need to lead at least one band with songs before you can import.
          </p>
        ) : null}

        {error ? <div className="songs-error">{error}</div> : null}
        {resultMessage ? <div className="auth-message auth-message-success">{resultMessage}</div> : null}

        <form className="songs-form" onSubmit={handleSubmit}>
          <label>
            Band
            <select
              value={bandId}
              onChange={(event) => setBandId(event.target.value)}
              disabled={leaderBands.length === 0 || submitting || loadingBands}
              required
            >
              {leaderBands.map((band) => (
                <option key={band.id} value={band.id}>
                  {band.name}
                </option>
              ))}
            </select>
          </label>

          {bandId ? (
            <div className="open-mic-import-song-list">
              <div className="open-mic-import-song-list-header">
                <span>Songs</span>
                <div className="gig-detail-actions">
                  <button
                    type="button"
                    className="directory-btn directory-btn-secondary"
                    onClick={selectAllAvailable}
                    disabled={availableSongs.length === 0 || submitting || loadingSongs}
                  >
                    Select all
                  </button>
                  <button
                    type="button"
                    className="directory-btn directory-btn-secondary"
                    onClick={clearSelection}
                    disabled={selectedSongIds.length === 0 || submitting}
                  >
                    Clear
                  </button>
                </div>
              </div>

              {loadingSongs ? <p className="my-bands-lead">Loading songs…</p> : null}

              {!loadingSongs && songs.length === 0 ? (
                <p className="my-bands-lead">This band has no songs yet.</p>
              ) : null}

              {!loadingSongs && songs.length > 0 && availableSongs.length === 0 ? (
                <p className="my-bands-lead">All band songs are already on this event list.</p>
              ) : null}

              {!loadingSongs && availableSongs.length > 0 ? (
                <ul className="open-mic-import-song-options">
                  {availableSongs.map((song) => (
                    <li key={song.id}>
                      <label className="open-mic-import-song-option">
                        <input
                          type="checkbox"
                          checked={selectedSongIds.includes(song.id)}
                          onChange={() => toggleSong(song.id)}
                          disabled={submitting}
                        />
                        <span>
                          <strong>{song.title}</strong>
                          {song.artist ? ` — ${song.artist}` : ''}
                          {song.song_key ? ` (${song.song_key})` : ''}
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              ) : null}

              {songs.length > availableSongs.length ? (
                <p className="workspace-empty-note">
                  {songs.length - availableSongs.length} song
                  {songs.length - availableSongs.length === 1 ? '' : 's'} already on this event list.
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="songs-form-actions">
            <button type="button" className="directory-btn directory-btn-secondary" onClick={onClose}>
              {resultMessage ? 'Close' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="directory-btn directory-btn-primary"
              disabled={
                submitting ||
                leaderBands.length === 0 ||
                !bandId ||
                selectedSongIds.length === 0
              }
            >
              {submitting
                ? 'Importing…'
                : selectedSongIds.length > 0
                  ? `Import ${selectedSongIds.length} song${selectedSongIds.length === 1 ? '' : 's'}`
                  : 'Import songs'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
