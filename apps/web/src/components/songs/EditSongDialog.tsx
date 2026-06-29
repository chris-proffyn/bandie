import { useState } from 'react';
import { softDeleteBandSong, updateBandSong, type SongWithReadiness } from '@bandie/data';
import {
  parseDurationFromForm,
  songToMetadataFormValues,
  type SongMetadataFormValues,
} from '../../lib/songMetadataForm';
import { SongMetadataFormFields } from './SongMetadataFormFields';

type EditSongDialogProps = {
  bandId: string;
  song: SongWithReadiness;
  canManage: boolean;
  onClose: () => void;
  onSaved: () => void;
  onDeleted?: () => void;
};

export function EditSongDialog({
  bandId,
  song,
  canManage,
  onClose,
  onSaved,
  onDeleted,
}: EditSongDialogProps) {
  const [values, setValues] = useState<SongMetadataFormValues>(() => songToMetadataFormValues(song));
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(patch: Partial<SongMetadataFormValues>) {
    setValues((current) => ({ ...current, ...patch }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await updateBandSong(bandId, song.id, {
        title: values.title,
        artist: values.artist || null,
        genre: values.genre || null,
        songKey: values.songKey || null,
        durationSeconds: parseDurationFromForm(values.durationMinutes, values.durationSeconds),
        notes: values.notes || null,
      });

      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update song.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (
      !window.confirm(
        `Delete "${song.title}" from the band songbook? Part files stay in Dropbox but the song will be hidden until restored.`,
      )
    ) {
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      await softDeleteBandSong(bandId, song.id);
      onDeleted?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete song.');
    } finally {
      setDeleting(false);
    }
  }

  const busy = submitting || deleting;

  return (
    <div className="songs-dialog-backdrop" role="presentation" onClick={onClose}>
      <div
        className="songs-dialog surface-light"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-song-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="edit-song-title">Edit song details</h2>
        <p>Update title, key, duration and other metadata for this song.</p>

        {error ? <div className="songs-error">{error}</div> : null}

        <form className="songs-form" onSubmit={handleSubmit}>
          <SongMetadataFormFields values={values} onChange={handleChange} />

          <div className="songs-form-actions songs-form-actions-split">
            {canManage ? (
              <button
                type="button"
                className="songs-card-btn songs-card-btn-danger"
                disabled={busy}
                onClick={() => void handleDelete()}
              >
                {deleting ? 'Deleting…' : 'Delete song'}
              </button>
            ) : (
              <span />
            )}
            <div className="songs-form-actions-main">
              <button
                type="button"
                className="directory-btn directory-btn-secondary"
                disabled={busy}
                onClick={onClose}
              >
                Cancel
              </button>
              <button type="submit" className="directory-btn directory-btn-primary" disabled={busy}>
                {submitting ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
