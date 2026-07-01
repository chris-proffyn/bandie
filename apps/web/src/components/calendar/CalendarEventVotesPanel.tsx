import {
  AVAILABILITY_VOTE_LABELS,
  availabilityVoteClass,
  summarizeAvailabilityVotes,
  type AvailabilityVote,
  type CalendarEventVote,
  type CalendarMemberAvailabilityRow,
} from '@bandie/data';

type CalendarEventVotesPanelProps = {
  votes: CalendarEventVote[];
  memberRows: CalendarMemberAvailabilityRow[];
  currentUserVote?: AvailabilityVote;
  votingBusy: boolean;
  onVote: (vote: Exclude<AvailabilityVote, 'pending'>) => void;
};

export function CalendarEventVotesPanel({
  votes,
  memberRows,
  currentUserVote,
  votingBusy,
  onVote,
}: CalendarEventVotesPanelProps) {
  const voteSummary = summarizeAvailabilityVotes(votes);

  return (
    <div className="calendar-votes">
      <p className="calendar-vote-summary">
        {voteSummary.available} available · {voteSummary.maybe} maybe · {voteSummary.no} no ·{' '}
        {voteSummary.pending} pending
      </p>

      <div className="calendar-vote-actions">
        <p className="calendar-vote-actions-label">Your availability</p>
        <div className="calendar-vote-actions-row">
          {(['available', 'maybe', 'no'] as const).map((vote) => (
            <button
              key={vote}
              type="button"
              className={`directory-btn directory-btn-secondary ${currentUserVote === vote ? 'active' : ''}`}
              disabled={votingBusy}
              onClick={() => onVote(vote)}
            >
              {AVAILABILITY_VOTE_LABELS[vote]}
            </button>
          ))}
        </div>
      </div>

      <div className="calendar-member-votes">
        <p className="calendar-member-votes-label">Band member availability</p>
        {memberRows.length === 0 ? (
          <p className="calendar-member-votes-empty">No active band members yet.</p>
        ) : (
          <ul className="calendar-member-vote-list">
            {memberRows.map((row) => (
              <li
                key={row.userId}
                className={`calendar-member-vote-row${row.isCurrentUser ? ' is-current-user' : ''}`}
              >
                <span className="calendar-member-vote-name">
                  {row.displayName}
                  {row.isCurrentUser ? <span className="calendar-member-vote-you">You</span> : null}
                </span>
                <span className={availabilityVoteClass(row.vote)}>
                  {AVAILABILITY_VOTE_LABELS[row.vote]}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
