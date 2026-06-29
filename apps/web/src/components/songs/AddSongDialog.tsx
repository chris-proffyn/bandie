import { useState } from 'react';
import { createBandSong } from '@bandie/data';

type AddSongDialogProps = {
  bandId: string;
  onClose: () => void;
  onCreated: () => void;
};

export function AddSongDialog({ bandId, onClose, onCreated }: AddSongDialogProps) {
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [genre, setGenre] = useState('');
  const [songKey, setSongKey] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [durationSeconds, setDurationSeconds] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const minutes = Number.parseInt(durationMinutes, 10) || 0;
      const seconds = Number.parseInt(durationSeconds, 10) || 0;
      const totalSeconds = minutes > 0 || seconds > 0 ? minutes * 60 + seconds : undefined;

      await createBandSong({
        bandId,
        title,
        artist: artist || undefined,
        genre: genre || undefined,
        songKey: songKey || undefined,
        durationSeconds: totalSeconds,
        notes: notes || undefined,
      });

      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to add song.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="songs-dialog-backdrop" role="presentation" onClick={onClose}>
      <div
        className="songs-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-song-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="add-song-title">Add song</h2>
        <p>Add a new song to the band repertoire. Part folders are created automatically.</p>

        {error ? <div className="songs-error">{error}</div> : null}

        <form className="songs-form" onSubmit={handleSubmit}>
          <label>
            Title
            <input value={title} onChange={(event) => setTitle(event.target.value)} required />
          </label>

          <div className="songs-form-grid">
            <label>
              Artist
              <input value={artist} onChange={(event) => setArtist(event.target.value)} />
            </label>
            <label>
              Genre
              <input value={genre} onChange={(event) => setGenre(event.target.value)} />
            </label>
          </div>

          <div className="songs-form-grid">
            <label>
              Key
              <input value={songKey} onChange={(event) => setSongKey(event.target.value)} placeholder="E, Am, etc." />
            </label>
            <div className="songs-form-grid">
              <label>
                Length (min)
                <input
                  type="number"
                  min="0"
                  value={durationMinutes}
                  onChange={(event) => setDurationMinutes(event.target.value)}
                />
              </label>
              <label>
                Length (sec)
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={durationSeconds}
                  onChange={(event) => setDurationSeconds(event.target.value)}
                />
              </label>
            </div>
          </div>

          <label>
            Notes
            <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} />
          </label>

          <div className="songs-form-actions">
            <button type="button" className="directory-btn directory-btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="directory-btn directory-btn-primary" disabled={submitting}>
              {submitting ? 'Adding…' : 'Add song'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
