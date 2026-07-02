import {
  SONG_SUGGESTION_VOTE_EMOJI,
  SONG_SUGGESTION_VOTE_LABELS,
  SONG_SUGGESTION_VOTE_STATES,
  type SongSuggestionVote,
} from '@bandie/data';
import { bandInitials } from '../../lib/profileHelpers';

type SongSuggestionVoteMatrixProps = {
  votes: SongSuggestionVote[];
  currentUserId?: string | null;
  className?: string;
};

function voteMemberLabel(vote: SongSuggestionVote): string {
  return vote.display_name?.trim() || vote.username?.trim() || 'Member';
}

export function SongSuggestionVoteMatrix({
  votes,
  currentUserId = null,
  className,
}: SongSuggestionVoteMatrixProps) {
  if (votes.length === 0) {
    return null;
  }

  const sortedVotes = [...votes].sort((a, b) => {
    const aIsMe = currentUserId != null && a.member_user_id === currentUserId;
    const bIsMe = currentUserId != null && b.member_user_id === currentUserId;
    if (aIsMe !== bIsMe) {
      return aIsMe ? -1 : 1;
    }
    return voteMemberLabel(a).localeCompare(voteMemberLabel(b), undefined, { sensitivity: 'base' });
  });

  return (
    <div
      className={['song-suggestion-vote-matrix-wrap', className].filter(Boolean).join(' ')}
      aria-label="Individual member votes"
    >
      <table className="song-suggestion-vote-matrix">
        <thead>
          <tr>
            <th scope="col" className="song-suggestion-vote-matrix-member-col">
              <span className="song-suggestion-vote-matrix-sr-only">Member</span>
            </th>
            {SONG_SUGGESTION_VOTE_STATES.map((voteState) => (
              <th
                key={voteState}
                scope="col"
                className="song-suggestion-vote-matrix-heading"
                aria-label={SONG_SUGGESTION_VOTE_LABELS[voteState]}
              >
                <span aria-hidden="true">{SONG_SUGGESTION_VOTE_EMOJI[voteState]}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedVotes.map((vote) => {
            const label = voteMemberLabel(vote);
            const isMe = currentUserId != null && vote.member_user_id === currentUserId;
            const avatarTitle = isMe ? `${label} (you)` : label;

            return (
              <tr key={vote.id}>
                <th scope="row" className="song-suggestion-vote-matrix-member-cell">
                  <span
                    className="song-suggestion-vote-matrix-avatar"
                    title={avatarTitle}
                    aria-label={avatarTitle}
                  >
                    {vote.profile_image_url ? (
                      <img src={vote.profile_image_url} alt="" />
                    ) : (
                      <span>{bandInitials(label)}</span>
                    )}
                  </span>
                </th>
                {SONG_SUGGESTION_VOTE_STATES.map((voteState) => (
                  <td key={voteState} className="song-suggestion-vote-matrix-vote-cell">
                    {vote.vote_state === voteState ? (
                      <span
                        className="song-suggestion-vote-matrix-tick"
                        aria-label={`${label} voted ${SONG_SUGGESTION_VOTE_LABELS[voteState]}`}
                      >
                        ✓
                      </span>
                    ) : (
                      <span className="song-suggestion-vote-matrix-empty" aria-hidden="true" />
                    )}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
