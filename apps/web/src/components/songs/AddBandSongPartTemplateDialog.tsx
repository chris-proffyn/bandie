import { useState } from 'react';
import { createBandSongPartTemplate } from '@bandie/data';

type AddBandSongPartTemplateDialogProps = {
  bandId: string;
  onClose: () => void;
  onCreated: () => void;
};

export function AddBandSongPartTemplateDialog({
  bandId,
  onClose,
  onCreated,
}: AddBandSongPartTemplateDialogProps) {
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
      await createBandSongPartTemplate({
        bandId,
        partLabel: partLabel.trim(),
        requiredForReadiness,
      });
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to add part template.');
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
        aria-labelledby="add-band-part-template-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="add-band-part-template-title">Add part folder</h2>
        <p>Add a default part folder for new songs in this band.</p>

        {error ? <div className="songs-error">{error}</div> : null}

        <form className="songs-form" onSubmit={handleSubmit}>
          <label>
            Part name
            <input
              value={partLabel}
              onChange={(event) => setPartLabel(event.target.value)}
              placeholder="e.g. Guitar, Keys, Backing vocals"
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
              {submitting ? 'Adding…' : 'Add part'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
