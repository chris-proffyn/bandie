import { useEffect, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import type { SongSuggestionGroup } from '@bandie/data';

type SongSuggestionCarryOverModalProps = {
  open: boolean;
  sourceGroup: SongSuggestionGroup;
  notSelectedCount: number;
  actionBusy: boolean;
  onClose: () => void;
  onSubmit: (input: {
    name: string;
    suggestionClosesAt: string;
    votingClosesAt: string | null;
  }) => void | Promise<void>;
};

function toDatetimeLocalValue(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function defaultCloseDate(daysFromNow: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  date.setHours(23, 59, 0, 0);
  return toDatetimeLocalValue(date);
}

function defaultCarryOverName(sourceName: string): string {
  const trimmed = sourceName.trim();
  return trimmed ? `${trimmed} — carry-over` : 'Carry-over group';
}

export function SongSuggestionCarryOverModal({
  open,
  sourceGroup,
  notSelectedCount,
  actionBusy,
  onClose,
  onSubmit,
}: SongSuggestionCarryOverModalProps) {
  const [name, setName] = useState(defaultCarryOverName(sourceGroup.name));
  const [suggestionClosesAt, setSuggestionClosesAt] = useState(defaultCloseDate(14));
  const [votingClosesAt, setVotingClosesAt] = useState(defaultCloseDate(21));

  useEffect(() => {
    if (!open) {
      return;
    }

    setName(defaultCarryOverName(sourceGroup.name));
    setSuggestionClosesAt(defaultCloseDate(14));
    setVotingClosesAt(defaultCloseDate(21));
  }, [open, sourceGroup.name]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim() || !suggestionClosesAt) {
      return;
    }

    void onSubmit({
      name: name.trim(),
      suggestionClosesAt: new Date(suggestionClosesAt).toISOString(),
      votingClosesAt: votingClosesAt ? new Date(votingClosesAt).toISOString() : null,
    });
  }

  if (!open) {
    return null;
  }

  return createPortal(
    <div className="gigs-dialog-backdrop" role="presentation" onClick={onClose}>
      <div
        className="gigs-dialog surface-light song-suggestion-carry-over-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="song-suggestion-carry-over-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="gigs-dialog-header">
          <h2 id="song-suggestion-carry-over-title">New group from unselected songs</h2>
          <button type="button" className="gigs-dialog-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        <div className="gigs-dialog-body">
          <p className="gigs-dialog-note">
            Create a new suggestion group and copy {notSelectedCount} unselected song
            {notSelectedCount === 1 ? '' : 's'} from this round. Group settings (target count,
            selection mode, vote visibility) are copied from the current group. Members can vote
            again in the new round.
          </p>

          <form className="auth-form song-suggestion-carry-over-form" onSubmit={handleSubmit}>
            <div className="auth-field">
              <label htmlFor="ss-carry-over-name">New group name</label>
              <input
                id="ss-carry-over-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                disabled={actionBusy}
              />
            </div>

            <div className="song-suggestion-form-grid">
              <div className="auth-field">
                <label htmlFor="ss-carry-over-suggestions-close">Suggestions close</label>
                <input
                  id="ss-carry-over-suggestions-close"
                  type="datetime-local"
                  value={suggestionClosesAt}
                  onChange={(event) => setSuggestionClosesAt(event.target.value)}
                  required
                  disabled={actionBusy}
                />
              </div>
              <div className="auth-field">
                <label htmlFor="ss-carry-over-voting-close">Voting closes</label>
                <input
                  id="ss-carry-over-voting-close"
                  type="datetime-local"
                  value={votingClosesAt}
                  onChange={(event) => setVotingClosesAt(event.target.value)}
                  disabled={actionBusy}
                />
              </div>
            </div>

            <div className="song-suggestion-carry-over-actions">
              <button
                type="button"
                className="directory-btn directory-btn-secondary"
                disabled={actionBusy}
                onClick={onClose}
              >
                Cancel
              </button>
              <button type="submit" className="directory-btn directory-btn-primary" disabled={actionBusy}>
                {actionBusy ? 'Creating…' : 'Create group'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body,
  );
}
