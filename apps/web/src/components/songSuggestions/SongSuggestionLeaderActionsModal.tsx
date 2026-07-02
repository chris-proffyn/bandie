import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { SongSuggestionGroup } from '@bandie/data';

type SongSuggestionLeaderActionsModalProps = {
  open: boolean;
  group: SongSuggestionGroup;
  canEditGroup: boolean;
  votingOpen: boolean;
  actionBusy: boolean;
  activeSuggestionCount: number;
  onClose: () => void;
  onEditGroup: () => void;
  onClearAll: () => void;
  onCloseSuggestions: () => void;
  onReopenSuggestions: () => void;
  onCloseVoting: () => void;
  onResetVotes: () => void;
  onConfirmSelections: () => void;
};

function CogIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path
        d="M19.4 13a7.9 7.9 0 0 0 .1-2l2-1.2-2-3.5-2.3 1a8 8 0 0 0-1.7-1L15 3h-6l-.5 2.8a8 8 0 0 0-1.7 1l-2.3-1-2 3.5 2 1.2a7.9 7.9 0 0 0 .1 2l-2 1.2 2 3.5 2.3-1a8 8 0 0 0 1.7 1L9 21h6l.5-2.8a8 8 0 0 0 1.7-1l2.3 1 2-3.5-2-1.2Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SongSuggestionLeaderActionsModal({
  open,
  group,
  canEditGroup,
  votingOpen,
  actionBusy,
  activeSuggestionCount,
  onClose,
  onEditGroup,
  onClearAll,
  onCloseSuggestions,
  onReopenSuggestions,
  onCloseVoting,
  onResetVotes,
  onConfirmSelections,
}: SongSuggestionLeaderActionsModalProps) {
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

  if (!open) {
    return null;
  }

  const showClearAll = group.status === 'open_for_suggestions' && activeSuggestionCount > 0;
  const showCloseSuggestions = group.status === 'open_for_suggestions';
  const showReopenSuggestions = group.status === 'suggestions_closed';
  const showResetVotes = ['open_for_suggestions', 'suggestions_closed', 'voting_closed'].includes(
    group.status,
  );
  const showConfirmSelections = ['suggestions_closed', 'voting_closed', 'open_for_suggestions'].includes(
    group.status,
  );

  return createPortal(
    <div className="gigs-dialog-backdrop" role="presentation" onClick={onClose}>
      <div
        className="gigs-dialog surface-light song-suggestion-leader-actions-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="song-suggestion-leader-actions-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="gigs-dialog-header">
          <h2 id="song-suggestion-leader-actions-title">Leader actions</h2>
          <button type="button" className="gigs-dialog-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        <div className="gigs-dialog-body">
          <p className="gigs-dialog-note">
            Manage this suggestion group, control voting phases, and confirm the final song list.
          </p>

          <div className="song-suggestion-leader-actions song-suggestion-leader-actions--stacked">
            {canEditGroup ? (
              <button
                type="button"
                className="directory-btn directory-btn-secondary"
                disabled={actionBusy}
                onClick={onEditGroup}
              >
                Edit group
              </button>
            ) : null}
            {showClearAll ? (
              <button
                type="button"
                className="directory-btn directory-btn-secondary"
                disabled={actionBusy}
                onClick={onClearAll}
              >
                Clear all
              </button>
            ) : null}
            {showCloseSuggestions ? (
              <button
                type="button"
                className="directory-btn directory-btn-secondary"
                disabled={actionBusy}
                onClick={onCloseSuggestions}
              >
                Close suggestions
              </button>
            ) : null}
            {showReopenSuggestions ? (
              <button
                type="button"
                className="directory-btn directory-btn-secondary"
                disabled={actionBusy}
                onClick={onReopenSuggestions}
              >
                Reopen suggestions
              </button>
            ) : null}
            {votingOpen ? (
              <button
                type="button"
                className="directory-btn directory-btn-secondary"
                disabled={actionBusy}
                onClick={onCloseVoting}
              >
                Close voting
              </button>
            ) : null}
            {showResetVotes ? (
              <button
                type="button"
                className="directory-btn directory-btn-secondary"
                disabled={actionBusy}
                onClick={onResetVotes}
              >
                Reset votes
              </button>
            ) : null}
            {showConfirmSelections ? (
              <button
                type="button"
                className="directory-btn directory-btn-primary"
                disabled={actionBusy}
                onClick={onConfirmSelections}
              >
                Confirm selections
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export { CogIcon };
