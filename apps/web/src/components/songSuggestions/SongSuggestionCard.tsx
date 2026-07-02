import {
  SONG_SUGGESTION_VOTE_LABELS,
  type SongSuggestionSortKey,
  type SongSuggestionVoteState,
  type SongSuggestionWithSummary,
  type VoteVisibility,
} from '@bandie/data';
import { SongSuggestionSuggester } from './SongSuggestionSuggester';
import { SongSuggestionMediaEditor } from './SongSuggestionMediaEditor';
import type { UpdateSongSuggestionMediaInput } from '@bandie/data';

const VOTE_EMOJI: Record<SongSuggestionVoteState, string> = {
  happy_to_play: '🙂',
  meh: '😐',
  rather_not: '🙁',
};

type SongSuggestionCardProps = {
  row: SongSuggestionWithSummary;
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
  onWithdraw: (row: SongSuggestionWithSummary) => void;
  onVeto: (row: SongSuggestionWithSummary) => void;
  canEditMedia: boolean;
  editingMedia: boolean;
  onEditMedia: (row: SongSuggestionWithSummary) => void;
  onCancelEditMedia: () => void;
  onSaveMedia: (suggestionId: string, input: UpdateSongSuggestionMediaInput) => void;
};

function showRank(
  row: SongSuggestionWithSummary,
  sortBy: SongSuggestionSortKey,
): boolean {
  return sortBy === 'score' && row.proposed_rank > 0 && row.status === 'active';
}

function TrashIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-8 0h8m-9 4v7a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-7M10 11v6M14 11v6"
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
  canEditMedia,
  editingMedia,
  onEditMedia,
  onCancelEditMedia,
  onSaveMedia,
}: SongSuggestionCardProps) {
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
  const canRemove = canMemberWithdraw || canLeaderRemove;
  const canVeto = isLeader && row.status === 'active' && !suggestionsOpen;
  const hideMemberVotes = voteVisibility === 'aggregate_only' && !isLeader;

  return (
    <article
      className={[
        'song-suggestion-item-card',
        'surface-light',
        isVetoed ? 'song-suggestion-item-card-vetoed' : '',
        row.my_vote ? `song-suggestion-item-card-voted song-suggestion-item-card-voted-${row.my_vote}` : '',
        canVote && !row.my_vote ? 'song-suggestion-item-card-needs-vote' : '',
      ]
        .filter(Boolean)
        .join(' ')}
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
          {canRemove ? (
            <button
              type="button"
              className="song-suggestion-withdraw-btn"
              disabled={actionBusy}
              aria-label={`Remove ${row.song_title}`}
              onClick={() => onWithdraw(row)}
            >
              <TrashIcon />
            </button>
          ) : null}
          {canVeto ? (
            <button
              type="button"
              className="directory-btn directory-btn-secondary"
              disabled={actionBusy}
              onClick={() => onVeto(row)}
            >
              Veto
            </button>
          ) : null}
        </div>
      </header>

      {row.my_vote ? (
        <div
          className={`song-suggestion-my-vote-badge song-suggestion-my-vote-badge-${row.my_vote}`}
          aria-label={`Your vote: ${SONG_SUGGESTION_VOTE_LABELS[row.my_vote]}`}
        >
          <span className="song-suggestion-my-vote-label">Your vote</span>
          <span className="song-suggestion-my-vote-value">
            {VOTE_EMOJI[row.my_vote]} {SONG_SUGGESTION_VOTE_LABELS[row.my_vote]}
          </span>
        </div>
      ) : canVote ? (
        <p className="song-suggestion-needs-vote-note">Tap a reaction below to vote.</p>
      ) : null}

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

      {editingMedia ? (
        <SongSuggestionMediaEditor
          row={row}
          actionBusy={actionBusy}
          onSave={onSaveMedia}
          onCancel={onCancelEditMedia}
        />
      ) : (
        <>
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
          {canEditMedia ? (
            <button
              type="button"
              className="song-suggestion-edit-links-btn"
              disabled={actionBusy}
              onClick={() => onEditMedia(row)}
            >
              {row.youtube_url || row.spotify_url || row.other_media_url ? 'Edit links' : 'Add links'}
            </button>
          ) : null}
        </>
      )}

      <div className="song-suggestion-score-row" aria-label="Vote totals">
        <span className="song-suggestion-score-pill">Score {row.vote_summary.score}</span>
        <span className="song-suggestion-score-pill">🙂 {row.vote_summary.happy_count}</span>
        <span className="song-suggestion-score-pill">😐 {row.vote_summary.meh_count}</span>
        <span className="song-suggestion-score-pill">🙁 {row.vote_summary.rather_not_count}</span>
      </div>

      {hideMemberVotes ? (
        <p className="song-suggestion-meta">Individual votes are hidden — totals only.</p>
      ) : row.votes.length > 0 ? (
        <div className="song-suggestion-tags">
          {row.votes.map((vote) => {
            const isMine = currentUserId != null && vote.member_user_id === currentUserId;
            return (
              <span
                key={vote.id}
                className={`song-suggestion-tag${isMine ? ' song-suggestion-tag-mine' : ''}`}
              >
                {isMine ? 'You' : (vote.display_name ?? vote.username ?? 'Member')}:{' '}
                {VOTE_EMOJI[vote.vote_state]} {SONG_SUGGESTION_VOTE_LABELS[vote.vote_state]}
              </span>
            );
          })}
        </div>
      ) : null}

      {canVote ? (
        <div className="song-suggestion-vote-actions">
          <div className="song-suggestion-vote-buttons" role="group" aria-label="Cast your vote">
            {(['happy_to_play', 'meh', 'rather_not'] as const).map((voteState) => (
              <button
                key={voteState}
                type="button"
                className={`song-suggestion-vote-btn song-suggestion-vote-btn-${voteState}${
                  row.my_vote === voteState ? ' active' : ''
                }`}
                disabled={actionBusy}
                aria-pressed={row.my_vote === voteState}
                onClick={() => onVote(row.id, voteState)}
              >
                {VOTE_EMOJI[voteState]} {SONG_SUGGESTION_VOTE_LABELS[voteState]}
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
    </article>
  );
}
