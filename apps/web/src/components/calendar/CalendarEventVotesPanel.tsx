import {
  AVAILABILITY_VOTE_LABELS,
  summarizeAvailabilityVotes,
  type AvailabilityVote,
  type CalendarEventVote,
  type CalendarMemberAvailabilityRow,
} from '@bandie/data';

const MEMBER_VOTE_COLUMNS: AvailabilityVote[] = ['available', 'maybe', 'no', 'pending'];

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
          <>
            <div className="calendar-member-vote-table-wrap">
              <table className="calendar-member-vote-table">
                <thead>
                  <tr>
                    <th scope="col">Member</th>
                    {MEMBER_VOTE_COLUMNS.map((vote) => (
                      <th key={vote} scope="col" className="calendar-member-vote-table-status">
                        {AVAILABILITY_VOTE_LABELS[vote]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {memberRows.map((row) => (
                    <tr
                      key={row.userId}
                      className={row.isCurrentUser ? 'is-current-user' : undefined}
                    >
                      <th scope="row" className="calendar-member-vote-table-name">
                        <span>{row.displayName}</span>
                        {row.isCurrentUser ? (
                          <span className="calendar-member-vote-you">You</span>
                        ) : null}
                      </th>
                      {MEMBER_VOTE_COLUMNS.map((vote) => (
                        <td
                          key={vote}
                          className={`calendar-member-vote-table-cell calendar-member-vote-table-cell-${vote}${
                            row.vote === vote ? ' is-active' : ''
                          }`}
                          aria-label={
                            row.vote === vote
                              ? `${row.displayName}: ${AVAILABILITY_VOTE_LABELS[vote]}`
                              : undefined
                          }
                        >
                          {row.vote === vote ? (
                            <span className="calendar-availability-tick" aria-hidden="true">
                              ✓
                            </span>
                          ) : null}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="calendar-member-vote-cards" aria-label="Band member availability">
              {memberRows.map((row) => (
                <li
                  key={row.userId}
                  className={`calendar-member-vote-card${row.isCurrentUser ? ' is-current-user' : ''}`}
                >
                  <div className="calendar-member-vote-card-head">
                    <strong>{row.displayName}</strong>
                    {row.isCurrentUser ? (
                      <span className="calendar-member-vote-you">You</span>
                    ) : null}
                  </div>
                  <span className={`calendar-vote-chip calendar-vote-chip-${row.vote}`}>
                    {AVAILABILITY_VOTE_LABELS[row.vote]}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
