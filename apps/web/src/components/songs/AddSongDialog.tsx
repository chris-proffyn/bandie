import { useState } from 'react';
import { createBandSong, SONG_PARTS_LEADER_ONLY_MESSAGE } from '@bandie/data';
import { EMPTY_SONG_METADATA, parseDurationFromForm, type SongMetadataFormValues } from '../../lib/songMetadataForm';
import { SongMetadataFormFields } from './SongMetadataFormFields';

type AddSongDialogProps = {
  bandId: string;
  canManage: boolean;
  onClose: () => void;
  onCreated: () => void;
};

export function AddSongDialog({ bandId, canManage, onClose, onCreated }: AddSongDialogProps) {
  const [values, setValues] = useState<SongMetadataFormValues>(EMPTY_SONG_METADATA);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(patch: Partial<SongMetadataFormValues>) {
    setValues((current) => ({ ...current, ...patch }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canManage) {
      setError(SONG_PARTS_LEADER_ONLY_MESSAGE);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const totalSeconds = parseDurationFromForm(values.durationMinutes, values.durationSeconds);

      await createBandSong({
        bandId,
        title: values.title,
        artist: values.artist || undefined,
        genre: values.genre || undefined,
        songKey: values.songKey || undefined,
        durationSeconds: totalSeconds ?? undefined,
        notes: values.notes || undefined,
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
        className="songs-dialog surface-light"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-song-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="add-song-title">Add song</h2>
        <p>Add a new song to the band repertoire. Part folders are created automatically.</p>

        {error ? <div className="songs-error">{error}</div> : null}

        <form className="songs-form" onSubmit={handleSubmit}>
          <SongMetadataFormFields values={values} onChange={handleChange} />

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
