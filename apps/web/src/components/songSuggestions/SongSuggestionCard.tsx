import { useState, type KeyboardEvent, type MouseEvent } from 'react';
import {
  SONG_SUGGESTION_VOTE_EMOJI,
  SONG_SUGGESTION_VOTE_LABELS,
  type SongSuggestionGroup,
  type SongSuggestionSortKey,
  type SongSuggestionVoteState,
  type SongSuggestionWithSummary,
  type UpdateSongSuggestionDetailsInput,
  type VoteVisibility,
  canCommentOnSongSuggestion,
} from '@bandie/data';
import { SongSuggestionSuggester } from './SongSuggestionSuggester';
import { SongSuggestionEditModal } from './SongSuggestionEditModal';
import { SongSuggestionDetailModal } from './SongSuggestionDetailModal';

type SongSuggestionCardProps = {
  row: SongSuggestionWithSummary;
  group: SongSuggestionGroup;
  sortBy: SongSuggestionSortKey;
  suggestionsOpen: boolean;
  votingOpen: boolean;
  voteVisibility: VoteVisibility;
  allowVoteChanges: boolean;
  isLeader: boolean;
  currentUserId: string | null;
  actionBusy: boolean;
  onVote: (suggestionId: string, voteState: SongSuggestionVoteState) => void;
  onClearVote: (suggestionId: string) => void;
  onWithdraw: (row: SongSuggestionWithSummary) => void | Promise<boolean>;
  onVeto: (row: SongSuggestionWithSummary) => void;
  canEdit: boolean;
  onSaveDetails: (suggestionId: string, input: UpdateSongSuggestionDetailsInput) => void | Promise<boolean>;
  onCommentsChanged: () => void;
};

function showRank(
  row: SongSuggestionWithSummary,
  sortBy: SongSuggestionSortKey,
): boolean {
  return sortBy === 'score' && row.proposed_rank > 0 && row.status === 'active';
}

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

export function SongSuggestionCard({
  row,
  group,
  sortBy,
  suggestionsOpen,
  votingOpen,
  voteVisibility,
  allowVoteChanges,
  isLeader,
  currentUserId,
  actionBusy,
  onVote,
  onClearVote,
  onWithdraw,
  onVeto,
  canEdit,
  onSaveDetails,
  onCommentsChanged,
}: SongSuggestionCardProps) {
  const [manageOpen, setManageOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const isVetoed = row.status === 'leader_vetoed';
  const canVote = votingOpen && row.status === 'active';
  const canClearVote = canVote && Boolean(row.my_vote) && allowVoteChanges;
  const canMemberWithdraw =
    suggestionsOpen &&
    row.status === 'active' &&
    currentUserId != null &&
    row.suggested_by === currentUserId;
  const canLeaderRemove =
    suggestionsOpen && row.status === 'active' && isLeader;
  const canDelete = canMemberWithdraw || canLeaderRemove;
  const canManage = canEdit || canDelete;
  const canVeto = isLeader && row.status === 'active' && !suggestionsOpen;
  const isLeaderEditingOther =
    isLeader && currentUserId != null && row.suggested_by !== currentUserId;
  const hideMemberVotes = voteVisibility === 'aggregate_only' && !isLeader;
  const otherMemberVotes = row.votes.filter(
    (vote) => currentUserId == null || vote.member_user_id !== currentUserId,
  );
  const canComment = canCommentOnSongSuggestion(row, group, currentUserId);

  function stopCardOpen(event: MouseEvent | KeyboardEvent) {
    event.stopPropagation();
  }

  function openDetail() {
    setDetailOpen(true);
  }

  return (
    <article
      className={[
        'song-suggestion-item-card',
        'surface-light',
        'song-suggestion-item-card-interactive',
        isVetoed ? 'song-suggestion-item-card-vetoed' : '',
        row.my_vote ? `song-suggestion-item-card-voted song-suggestion-item-card-voted-${row.my_vote}` : '',
        canVote && !row.my_vote ? 'song-suggestion-item-card-needs-vote' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      role="button"
      tabIndex={0}
      aria-label={`Open ${row.song_title} discussion${row.comment_count > 0 ? ` — ${row.comment_count} comments` : ''}`}
      onClick={openDetail}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openDetail();
        }
      }}
    >
      <header className="song-suggestion-item-card-head">
        <div className="song-suggestion-item-card-title-block">
          {showRank(row, sortBy) ? (
            <span className="song-suggestion-rank-badge">#{row.proposed_rank}</span>
          ) : null}
          <div>
            <h3>{row.song_title}</h3>
            <p className="song-suggestion-meta">{row.artist}</p>
            <SongSuggestionSuggester row={row} className="song-suggestion-item-suggester" />
          </div>
        </div>
        <div className="song-suggestion-item-card-actions">
          {canManage ? (
            <button
              type="button"
              className="song-suggestion-manage-btn"
              disabled={actionBusy}
              aria-label={`Manage ${row.song_title}`}
              onClick={(event) => {
                stopCardOpen(event);
                setManageOpen(true);
              }}
            >
              <CogIcon />
            </button>
          ) : null}
          {canVeto ? (
            <button
              type="button"
              className="directory-btn directory-btn-secondary"
              disabled={actionBusy}
              onClick={(event) => {
                stopCardOpen(event);
                onVeto(row);
              }}
            >
              Veto
            </button>
          ) : null}
        </div>
      </header>

      {row.rationale ? <p className="song-suggestion-item-rationale">{row.rationale}</p> : null}

      {isVetoed && row.leader_veto_reason ? (
        <p className="song-suggestion-veto-note">Vetoed: {row.leader_veto_reason}</p>
      ) : null}

      {(row.suggested_genre || row.decade) && (
        <div className="song-suggestion-tags">
          {row.suggested_genre ? (
            <span className="song-suggestion-tag">{row.suggested_genre}</span>
          ) : null}
          {row.decade ? <span className="song-suggestion-tag">{row.decade}</span> : null}
        </div>
      )}

      {(row.youtube_url || row.spotify_url || row.other_media_url) && (
        <div className="song-suggestion-links" onClick={stopCardOpen}>
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

      <div className="song-suggestion-card-footer-meta">
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
        <span
          className={[
            'song-suggestion-comment-count-pill',
            row.comment_count === 0 ? 'song-suggestion-comment-count-pill-empty' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {row.comment_count > 0 ? `💬 ${row.comment_count}` : '💬 Discuss'}
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
        <div className="song-suggestion-vote-actions" onClick={stopCardOpen}>
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

      <SongSuggestionDetailModal
        row={row}
        group={group}
        open={detailOpen}
        currentUserId={currentUserId}
        canComment={canComment}
        votingOpen={votingOpen}
        voteVisibility={voteVisibility}
        allowVoteChanges={allowVoteChanges}
        isLeader={isLeader}
        actionBusy={actionBusy}
        onClose={() => setDetailOpen(false)}
        onCommentAdded={onCommentsChanged}
        onVote={onVote}
        onClearVote={onClearVote}
      />

      <SongSuggestionEditModal
        row={row}
        open={manageOpen}
        actionBusy={actionBusy}
        canDelete={canDelete}
        canEdit={canEdit}
        isLeaderEditingOther={isLeaderEditingOther}
        onClose={() => setManageOpen(false)}
        onSave={onSaveDetails}
        onDelete={onWithdraw}
      />
    </article>
  );
}
