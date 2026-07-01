import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import {
  isSongSuggestionCutoffTieCandidate,
  isSongSuggestionInAutoSelection,
  isInclusiveSelectionActive,
  SONG_SUGGESTION_SELECTION_MODE_LABELS,
  type SongSuggestionConfirmedSong,
  type SongSuggestionGroupStatus,
  type SongSuggestionSelectionMode,
  type SongSuggestionWithSummary,
} from '@bandie/data';
import { SongSuggestionSuggester } from './SongSuggestionSuggester';

type SongSuggestionRankingTableProps = {
  bandId: string;
  targetSongCount: number;
  selectionMode: SongSuggestionSelectionMode;
  bandMemberCount: number;
  autoSelectedIds: string[];
  groupStatus: SongSuggestionGroupStatus;
  rankedRows: SongSuggestionWithSummary[];
  confirmedRows?: SongSuggestionConfirmedSong[];
  vetoedCount?: number;
};

export function SongSuggestionRankingTable({
  bandId,
  targetSongCount,
  selectionMode,
  bandMemberCount,
  autoSelectedIds,
  groupStatus,
  rankedRows,
  confirmedRows = [],
  vetoedCount = 0,
}: SongSuggestionRankingTableProps) {
  const isConfirmed = groupStatus === 'confirmed';
  const inclusiveActive = isInclusiveSelectionActive(
    selectionMode,
    targetSongCount,
    bandMemberCount,
  );
  const selectionModeLabel = SONG_SUGGESTION_SELECTION_MODE_LABELS[selectionMode];

  if (isConfirmed) {
    if (confirmedRows.length === 0) {
      return (
        <section className="panel surface-light song-suggestion-ranking-panel">
          <h2>Final ranking</h2>
          <p className="workspace-empty-note">No confirmed songs recorded.</p>
        </section>
      );
    }

    return (
      <section className="panel surface-light song-suggestion-ranking-panel">
        <div className="song-suggestion-ranking-head">
          <div>
            <h2>Final ranking</h2>
            <p className="song-suggestion-ranking-intro">
              {confirmedRows.length} song{confirmedRows.length === 1 ? '' : 's'} confirmed for this
              group.
            </p>
          </div>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table admin-table-compact song-suggestion-ranking-table">
            <thead>
              <tr>
                <th scope="col">Rank</th>
                <th scope="col">Song</th>
                <th scope="col">Score</th>
                <th scope="col">Notes</th>
              </tr>
            </thead>
            <tbody>
              {confirmedRows.map((row) => (
                <tr key={row.id} className="song-suggestion-ranking-row-selected">
                  <td>#{row.final_rank}</td>
                  <td>
                    <strong>{row.song_title}</strong>
                    <div className="song-suggestion-ranking-artist">{row.artist}</div>
                  </td>
                  <td>{row.final_score}</td>
                  <td>
                    {row.selection_override && row.selection_override_reason
                      ? `Override: ${row.selection_override_reason}`
                      : '—'}
                    {row.created_catalogue_song_id ? (
                      <div className="song-suggestion-ranking-catalogue-link">
                        <Link to={`/app/${bandId}/songs/${row.created_catalogue_song_id}`}>
                          View in songbook
                        </Link>
                      </div>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    );
  }

  if (rankedRows.length === 0) {
    return (
      <section className="panel surface-light song-suggestion-ranking-panel">
        <h2>Live ranking</h2>
        <p className="workspace-empty-note">
          Rankings appear once members start suggesting and voting.
        </p>
      </section>
    );
  }

  const showCutoff = !inclusiveActive && rankedRows.length > targetSongCount;

  return (
    <section className="panel surface-light song-suggestion-ranking-panel">
      <div className="song-suggestion-ranking-head">
        <div>
          <h2>Live ranking</h2>
          <p className="song-suggestion-ranking-intro">
            {inclusiveActive
              ? `${selectionModeLabel} mode: each member who suggested gets their highest-scoring song, then remaining slots fill by score up to ${targetSongCount}.`
              : `${selectionModeLabel} mode: songs ranked by score (highest first). The top ${targetSongCount} are proposed when voting closes unless the leader adjusts the final selection.`}
          </p>
        </div>
        <span className="song-suggestion-ranking-target-badge">
          {selectionModeLabel} · Target {targetSongCount}
        </span>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table admin-table-compact song-suggestion-ranking-table">
          <thead>
            <tr>
              <th scope="col">Rank</th>
              <th scope="col">Song</th>
              <th scope="col">Suggested by</th>
              <th scope="col">Score</th>
              <th scope="col">Votes</th>
              <th scope="col">Selection</th>
            </tr>
          </thead>
          <tbody>
            {rankedRows.map((row) => {
              const inSelection = isSongSuggestionInAutoSelection(
                row.proposed_rank,
                targetSongCount,
                { suggestionId: row.id, autoSelectedIds },
              );
              const isTie = isSongSuggestionCutoffTieCandidate(
                row,
                rankedRows,
                targetSongCount,
              );

              return (
                <Fragment key={row.id}>
                  <tr
                    className={[
                      inSelection ? 'song-suggestion-ranking-row-selected' : 'song-suggestion-ranking-row-below',
                      isTie ? 'song-suggestion-ranking-row-tie' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    <td>
                      <span className="song-suggestion-ranking-rank">#{row.proposed_rank}</span>
                    </td>
                    <td>
                      <strong>{row.song_title}</strong>
                      <div className="song-suggestion-ranking-artist">{row.artist}</div>
                    </td>
                    <td>
                      <SongSuggestionSuggester row={row} />
                    </td>
                    <td>{row.vote_summary.score}</td>
                    <td>
                      <span className="song-suggestion-ranking-votes">
                        🙂 {row.vote_summary.happy_count} · 😐 {row.vote_summary.meh_count} · 🙁{' '}
                        {row.vote_summary.rather_not_count}
                      </span>
                    </td>
                    <td>
                      {inSelection ? (
                        <span className="song-suggestion-ranking-status song-suggestion-ranking-status-in">
                          {inclusiveActive ? 'In selection' : `In top ${targetSongCount}`}
                        </span>
                      ) : (
                        <span className="song-suggestion-ranking-status song-suggestion-ranking-status-out">
                          Below cutoff
                        </span>
                      )}
                      {isTie ? (
                        <span className="song-suggestion-ranking-status song-suggestion-ranking-status-tie">
                          Tie at cutoff
                        </span>
                      ) : null}
                    </td>
                  </tr>
                  {showCutoff && row.proposed_rank === targetSongCount ? (
                    <tr className="song-suggestion-ranking-cutoff-row" aria-hidden="true">
                      <td colSpan={6}>
                        <div className="song-suggestion-ranking-cutoff-line">
                          <span>Selection cutoff</span>
                          <span className="song-suggestion-ranking-cutoff-detail">
                            {inclusiveActive
                              ? `${selectionModeLabel} selection (${autoSelectedIds.length} songs)`
                              : `Top ${targetSongCount} proceed when voting closes`}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {vetoedCount > 0 ? (
        <p className="song-suggestion-ranking-footnote">
          {vetoedCount} vetoed suggestion{vetoedCount === 1 ? '' : 's'} excluded from ranking.
        </p>
      ) : null}
    </section>
  );
}
