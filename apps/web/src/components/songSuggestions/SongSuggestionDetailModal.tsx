import { useCallback, useEffect, useState, type FormEvent, type MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import {
  SONG_SUGGESTION_VOTE_EMOJI,
  SONG_SUGGESTION_VOTE_LABELS,
  addSongSuggestionComment,
  listSongSuggestionComments,
  type SongSuggestionComment,
  type SongSuggestionGroup,
  type SongSuggestionVoteState,
  type SongSuggestionWithSummary,
  type VoteVisibility,
} from '@bandie/data';
import { bandInitials } from '../../lib/profileHelpers';
import { SongSuggestionSuggester } from './SongSuggestionSuggester';

type SongSuggestionDetailModalProps = {
  row: SongSuggestionWithSummary;
  group: SongSuggestionGroup;
  open: boolean;
  currentUserId: string | null;
  canComment: boolean;
  votingOpen: boolean;
  voteVisibility: VoteVisibility;
  allowVoteChanges: boolean;
  isLeader: boolean;
  actionBusy: boolean;
  onClose: () => void;
  onCommentAdded: () => void;
  onVote: (suggestionId: string, voteState: SongSuggestionVoteState) => void;
  onClearVote: (suggestionId: string) => void;
};

function commentAuthorLabel(comment: SongSuggestionComment): string {
  return comment.author_display_name?.trim() || comment.author_username?.trim() || 'Member';
}

function formatCommentTime(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function SongSuggestionDetailModal({
  row,
  group,
  open,
  currentUserId,
  canComment,
  votingOpen,
  voteVisibility,
  allowVoteChanges,
  isLeader,
  actionBusy,
  onClose,
  onCommentAdded,
  onVote,
  onClearVote,
}: SongSuggestionDetailModalProps) {
  const [comments, setComments] = useState<SongSuggestionComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [commentBody, setCommentBody] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentSubmitError, setCommentSubmitError] = useState<string | null>(null);

  const canVote = votingOpen && row.status === 'active';
  const canClearVote = canVote && Boolean(row.my_vote) && allowVoteChanges;
  const hideMemberVotes = voteVisibility === 'aggregate_only' && !isLeader;
  const otherMemberVotes = row.votes.filter(
    (vote) => currentUserId == null || vote.member_user_id !== currentUserId,
  );

  const loadComments = useCallback(async () => {
    setCommentsLoading(true);
    setCommentsError(null);
    try {
      const next = await listSongSuggestionComments(row.id);
      setComments(next);
    } catch (err) {
      setComments([]);
      setCommentsError(err instanceof Error ? err.message : 'Unable to load comments.');
    } finally {
      setCommentsLoading(false);
    }
  }, [row.id]);

  useEffect(() => {
    if (!open) {
      return;
    }

    setCommentBody('');
    setCommentSubmitError(null);
    void loadComments();
  }, [loadComments, open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !submittingComment) {
        onClose();
      }
    }

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, open, submittingComment]);

  function stopPropagation(event: MouseEvent) {
    event.stopPropagation();
  }

  async function handleCommentSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = commentBody.trim();
    if (!trimmed || !canComment) {
      return;
    }

    setSubmittingComment(true);
    setCommentSubmitError(null);
    try {
      await addSongSuggestionComment(row.id, trimmed);
      setCommentBody('');
      await loadComments();
      onCommentAdded();
    } catch (err) {
      setCommentSubmitError(err instanceof Error ? err.message : 'Unable to save comment.');
    } finally {
      setSubmittingComment(false);
    }
  }

  if (!open) {
    return null;
  }

  return createPortal(
    <div className="song-suggestion-edit-backdrop" role="presentation" onClick={onClose}>
      <div
        className="song-suggestion-detail-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`song-suggestion-detail-title-${row.id}`}
        onClick={stopPropagation}
      >
        <header className="song-suggestion-edit-dialog-head">
          <div>
            <h2 id={`song-suggestion-detail-title-${row.id}`}>{row.song_title}</h2>
            <p className="song-suggestion-meta">{row.artist}</p>
            <SongSuggestionSuggester row={row} className="song-suggestion-item-suggester" />
          </div>
          <button
            type="button"
            className="song-suggestion-edit-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </header>

        {row.rationale ? <p className="song-suggestion-item-rationale">{row.rationale}</p> : null}

        {(row.youtube_url || row.spotify_url || row.other_media_url) && (
          <div className="song-suggestion-links">
            {row.youtube_url ? (
              <a href={row.youtube_url} target="_blank" rel="noopener noreferrer">
                YouTube
              </a>
            ) : null}
            {row.spotify_url ? (
              <a href={row.spotify_url} target="_blank" rel="noopener noreferrer">
                Spotify
              </a>
            ) : null}
            {row.other_media_url ? (
              <a href={row.other_media_url} target="_blank" rel="noopener noreferrer">
                Media
              </a>
            ) : null}
          </div>
        )}

        <div className="song-suggestion-score-row" aria-label="Vote totals">
          <span className="song-suggestion-score-pill">Score {row.vote_summary.score}</span>
          <span className="song-suggestion-score-pill">
            {SONG_SUGGESTION_VOTE_EMOJI.happy_to_play} {row.vote_summary.happy_count}
          </span>
          <span className="song-suggestion-score-pill">
            {SONG_SUGGESTION_VOTE_EMOJI.meh} {row.vote_summary.meh_count}
          </span>
          <span className="song-suggestion-score-pill">
            {SONG_SUGGESTION_VOTE_EMOJI.rather_not} {row.vote_summary.rather_not_count}
          </span>
        </div>

        {hideMemberVotes ? (
          <p className="song-suggestion-meta">Individual votes are hidden — totals only.</p>
        ) : otherMemberVotes.length > 0 ? (
          <div className="song-suggestion-tags">
            {otherMemberVotes.map((vote) => (
              <span key={vote.id} className="song-suggestion-tag">
                {vote.display_name ?? vote.username ?? 'Member'}:{' '}
                {SONG_SUGGESTION_VOTE_EMOJI[vote.vote_state]}{' '}
                {SONG_SUGGESTION_VOTE_LABELS[vote.vote_state]}
              </span>
            ))}
          </div>
        ) : null}

        {canVote ? (
          <div className="song-suggestion-vote-actions">
            <p className="song-suggestion-vote-now-label">Vote now</p>
            <div className="song-suggestion-vote-buttons" role="group" aria-label="Cast your vote">
              {(['happy_to_play', 'meh', 'rather_not'] as const).map((voteState) => (
                <button
                  key={voteState}
                  type="button"
                  className={`song-suggestion-vote-icon song-suggestion-vote-icon-${voteState}${
                    row.my_vote === voteState ? ' active' : ''
                  }`}
                  disabled={actionBusy}
                  aria-label={SONG_SUGGESTION_VOTE_LABELS[voteState]}
                  aria-pressed={row.my_vote === voteState}
                  onClick={() => onVote(row.id, voteState)}
                >
                  <span className="song-suggestion-vote-icon-glyph" aria-hidden="true">
                    {SONG_SUGGESTION_VOTE_EMOJI[voteState]}
                  </span>
                </button>
              ))}
            </div>
            {canClearVote ? (
              <button
                type="button"
                className="song-suggestion-clear-vote-btn"
                disabled={actionBusy}
                onClick={() => onClearVote(row.id)}
              >
                Clear vote
              </button>
            ) : null}
          </div>
        ) : null}

        <section className="song-suggestion-comments-section" aria-label="Discussion">
          <h3 className="song-suggestion-comments-heading">
            Comments ({commentsLoading ? row.comment_count : comments.length})
          </h3>

          {commentsLoading ? (
            <p className="song-suggestion-meta">Loading comments…</p>
          ) : commentsError ? (
            <p className="auth-message auth-message-error">{commentsError}</p>
          ) : comments.length === 0 ? (
            <p className="song-suggestion-meta">No comments yet. Start the discussion below.</p>
          ) : (
            <ul className="song-suggestion-comments-list">
              {comments.map((comment) => {
                const label = commentAuthorLabel(comment);
                return (
                  <li key={comment.id} className="song-suggestion-comment-item">
                    <div className="song-suggestion-comment-head">
                      <span className="song-suggestion-comment-avatar" aria-hidden="true">
                        {comment.author_profile_image_url ? (
                          <img src={comment.author_profile_image_url} alt="" />
                        ) : (
                          <span>{bandInitials(label)}</span>
                        )}
                      </span>
                      <div>
                        <strong className="song-suggestion-comment-author">{label}</strong>
                        <time
                          className="song-suggestion-comment-time"
                          dateTime={comment.created_at}
                        >
                          {formatCommentTime(comment.created_at)}
                        </time>
                      </div>
                    </div>
                    <p className="song-suggestion-comment-body">{comment.body}</p>
                  </li>
                );
              })}
            </ul>
          )}

          {canComment ? (
            <form className="song-suggestion-comment-form" onSubmit={handleCommentSubmit}>
              <div className="auth-field">
                <label htmlFor={`ss-comment-${row.id}`}>Add a comment</label>
                <textarea
                  id={`ss-comment-${row.id}`}
                  rows={3}
                  value={commentBody}
                  maxLength={2000}
                  placeholder="Share your thoughts on this song choice…"
                  disabled={submittingComment || actionBusy}
                  onChange={(event) => setCommentBody(event.target.value)}
                />
              </div>
              {commentSubmitError ? (
                <p className="auth-message auth-message-error">{commentSubmitError}</p>
              ) : null}
              <button
                type="submit"
                className="directory-btn directory-btn-primary"
                disabled={submittingComment || actionBusy || !commentBody.trim()}
              >
                {submittingComment ? 'Saving…' : 'Post comment'}
              </button>
            </form>
          ) : (
            <p className="song-suggestion-meta">
              {group.status === 'confirmed'
                ? 'Comments are closed for confirmed groups.'
                : 'Comments are only available on active suggestions.'}
            </p>
          )}
        </section>
      </div>
    </div>,
    document.body,
  );
}
