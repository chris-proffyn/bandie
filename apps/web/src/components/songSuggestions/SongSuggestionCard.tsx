import {
  SONG_SUGGESTION_VOTE_LABELS,
  type SongSuggestionSortKey,
  type SongSuggestionVoteState,
  type SongSuggestionWithSummary,
  type VoteVisibility,
} from '@bandie/data';

const VOTE_EMOJI: Record<SongSuggestionVoteState, string> = {
  happy_to_play: '🙂',
  meh: '😐',
  rather_not: '🙁',
};

type SongSuggestionCardProps = {
  row: SongSuggestionWithSummary;
  sortBy: SongSuggestionSortKey;
  votingOpen: boolean;
  voteVisibility: VoteVisibility;
  isLeader: boolean;
  currentUserId: string | null;
  actionBusy: boolean;
  onVote: (suggestionId: string, voteState: SongSuggestionVoteState) => void;
  onVeto: (row: SongSuggestionWithSummary) => void;
};

function showRank(
  row: SongSuggestionWithSummary,
  sortBy: SongSuggestionSortKey,
): boolean {
  return sortBy === 'score' && row.proposed_rank > 0 && row.status === 'active';
}

export function SongSuggestionCard({
  row,
  sortBy,
  votingOpen,
  voteVisibility,
  isLeader,
  currentUserId,
  actionBusy,
  onVote,
  onVeto,
}: SongSuggestionCardProps) {
  const isVetoed = row.status === 'leader_vetoed';
  const canVote = votingOpen && row.status === 'active';
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
          </div>
        </div>
        {isLeader && row.status === 'active' ? (
          <button
            type="button"
            className="directory-btn directory-btn-secondary"
            disabled={actionBusy}
            onClick={() => onVeto(row)}
          >
            Veto
          </button>
        ) : null}
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

      {(row.suggested_genre || row.decade || row.suggester_display_name) && (
        <div className="song-suggestion-tags">
          {row.suggester_display_name ? (
            <span className="song-suggestion-tag">Suggested by {row.suggester_display_name}</span>
          ) : null}
          {row.suggested_genre ? (
            <span className="song-suggestion-tag">{row.suggested_genre}</span>
          ) : null}
          {row.decade ? <span className="song-suggestion-tag">{row.decade}</span> : null}
        </div>
      )}

      {(row.youtube_url || row.spotify_url) && (
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
        </div>
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
      ) : null}
    </article>
  );
}
