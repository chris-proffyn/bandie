import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  SETLIST_STATUS_OPTIONS,
  SETLIST_VIBE_PRESETS,
  SETLIST_LEADER_ONLY_MESSAGE,
  createBandSetlist,
  formatSetlistStatus,
  type SetlistStatus,
} from '@bandie/data';
import { UpgradePromptModal } from '../entitlements/UpgradePromptModal';
import { useUpgradePrompt } from '../../hooks/useUpgradePrompt';

type CreateSetlistDialogProps = {
  bandId: string;
  canManage: boolean;
  onClose: () => void;
};

export function CreateSetlistDialog({ bandId, canManage, onClose }: CreateSetlistDialogProps) {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [vibe, setVibe] = useState('');
  const [status, setStatus] = useState<SetlistStatus>('draft');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { upgradeDecision, clearUpgradePrompt, handleEntitlementError } = useUpgradePrompt();

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canManage) {
      setError(SETLIST_LEADER_ONLY_MESSAGE);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const setlist = await createBandSetlist({
        bandId,
        title,
        description: description || undefined,
        vibe: vibe || undefined,
        status,
      });
      navigate(`/app/${bandId}/setlists/${setlist.id}`);
    } catch (err) {
      if (handleEntitlementError(err)) {
        return;
      }
      setError(err instanceof Error ? err.message : 'Unable to create setlist.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="setlists-dialog-backdrop" role="presentation" onClick={onClose}>
      <div
        className="setlists-dialog surface-light"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-setlist-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="create-setlist-title">New setlist</h2>
        <p>Create a named running order you can reuse for gigs and rehearsals.</p>

        {error ? <div className="setlists-error">{error}</div> : null}

        <form className="setlists-form" onSubmit={handleSubmit}>
          <label>
            Title
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Post-punk 45"
              required
            />
          </label>

          <label>
            Description
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Short note about when to use this set"
            />
          </label>

          <label>
            Vibe
            <input
              value={vibe}
              onChange={(event) => setVibe(event.target.value)}
              list="setlist-vibe-presets"
              placeholder="Rock, funk, high energy…"
            />
            <datalist id="setlist-vibe-presets">
              {SETLIST_VIBE_PRESETS.map((preset) => (
                <option key={preset} value={preset} />
              ))}
            </datalist>
          </label>

          <label>
            Status
            <select value={status} onChange={(event) => setStatus(event.target.value as SetlistStatus)}>
              {SETLIST_STATUS_OPTIONS.filter((option) => option !== 'archived').map((option) => (
                <option key={option} value={option}>
                  {formatSetlistStatus(option)}
                </option>
              ))}
            </select>
          </label>

          <div className="setlists-form-actions">
            <button type="button" className="directory-btn directory-btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="directory-btn directory-btn-primary" disabled={submitting}>
              {submitting ? 'Creating…' : 'Create setlist'}
            </button>
          </div>
        </form>
      </div>

      {upgradeDecision ? (
        <UpgradePromptModal decision={upgradeDecision} onClose={clearUpgradePrompt} />
      ) : null}
    </div>
  );
}
