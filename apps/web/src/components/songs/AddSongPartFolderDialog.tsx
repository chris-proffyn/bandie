import { useState } from 'react';
import { createSongPartFolder } from '@bandie/data';

type AddSongPartFolderDialogProps = {
  bandId: string;
  songId: string;
  onClose: () => void;
  onCreated: () => void;
};

export function AddSongPartFolderDialog({
  bandId,
  songId,
  onClose,
  onCreated,
}: AddSongPartFolderDialogProps) {
  const [partLabel, setPartLabel] = useState('');
  const [requiredForReadiness, setRequiredForReadiness] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!partLabel.trim()) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await createSongPartFolder({
        bandId,
        songId,
        partLabel: partLabel.trim(),
        requiredForReadiness,
      });
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to add part folder.');
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
        aria-labelledby="add-part-folder-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="add-part-folder-title">Add part folder</h2>
        <p>Create a folder for charts, lyrics, or other files for a specific band part.</p>

        {error ? <div className="songs-error">{error}</div> : null}

        <form className="songs-form" onSubmit={handleSubmit}>
          <label>
            Part name
            <input
              value={partLabel}
              onChange={(event) => setPartLabel(event.target.value)}
              placeholder="e.g. Keys, Acoustic guitar"
              required
              autoFocus
            />
          </label>

          <label className="songs-template-checkbox">
            <input
              type="checkbox"
              checked={requiredForReadiness}
              onChange={(event) => setRequiredForReadiness(event.target.checked)}
            />
            Required for gig readiness
          </label>

          <div className="songs-form-actions">
            <button type="button" className="directory-btn directory-btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="directory-btn directory-btn-primary"
              disabled={submitting || !partLabel.trim()}
            >
              {submitting ? 'Adding…' : 'Add folder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
