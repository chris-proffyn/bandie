import {
  DEFAULT_SONG_SUGGESTION_LIST_FILTERS,
  SONG_SUGGESTION_FILTER_EXCLUDE_ME,
  type SongSuggestionFilterOptions,
  type SongSuggestionListFilters,
  type SongSuggestionSortKey,
  type SongSuggestionVoteFilter,
} from '@bandie/data';

type SongSuggestionListControlsProps = {
  filters: SongSuggestionListFilters;
  options: SongSuggestionFilterOptions;
  resultCount: number;
  totalCount: number;
  votingOpen: boolean;
  currentUserId?: string | null;
  onChange: (filters: SongSuggestionListFilters) => void;
};

const VOTE_FILTER_OPTIONS: Array<{ value: SongSuggestionVoteFilter; label: string }> = [
  { value: 'all', label: 'All vote statuses' },
  { value: 'needs_my_vote', label: 'Needs my vote' },
  { value: 'voted_happy', label: 'I voted happy' },
  { value: 'voted_meh', label: 'I voted meh' },
  { value: 'voted_rather_not', label: 'I voted rather not' },
];

const SORT_OPTIONS: Array<{ value: SongSuggestionSortKey; label: string }> = [
  { value: 'score', label: 'Score (rank)' },
  { value: 'happy_votes', label: 'Happy votes' },
  { value: 'rather_not_votes', label: 'Rather-not votes' },
  { value: 'newest', label: 'Newest' },
  { value: 'artist', label: 'Artist A–Z' },
  { value: 'title', label: 'Title A–Z' },
];

/** Hidden until suggestions routinely capture genre and decade metadata. */
const SHOW_SONG_SUGGESTION_METADATA_FILTERS = false;

export function SongSuggestionListControls({
  filters,
  options,
  resultCount,
  totalCount,
  votingOpen,
  currentUserId,
  onChange,
}: SongSuggestionListControlsProps) {
  function update<K extends keyof SongSuggestionListFilters>(
    key: K,
    value: SongSuggestionListFilters[K],
  ) {
    onChange({ ...filters, [key]: value });
  }

  const hasActiveFilters =
    filters.searchQuery.trim() !== '' ||
    filters.voteFilter !== 'all' ||
    filters.suggestedByUserId !== '' ||
    (SHOW_SONG_SUGGESTION_METADATA_FILTERS && filters.genre !== '') ||
    (SHOW_SONG_SUGGESTION_METADATA_FILTERS && filters.decade !== '') ||
    filters.sortBy !== 'score' ||
    filters.topNOnly;

  return (
    <div className="song-suggestion-filters surface-light">
      <div className="song-suggestion-filters-head">
        <div>
          <h3>Filter and sort</h3>
          <p className="song-suggestion-meta">
            Showing {resultCount} of {totalCount} suggestion{totalCount === 1 ? '' : 's'}
          </p>
        </div>
        {hasActiveFilters ? (
          <button
            type="button"
            className="directory-btn directory-btn-secondary"
            onClick={() => onChange(DEFAULT_SONG_SUGGESTION_LIST_FILTERS)}
          >
            Clear filters
          </button>
        ) : null}
      </div>

      <div className="song-suggestion-filters-grid">
        <div className="auth-field">
          <label htmlFor="ss-filter-search">Search song or artist</label>
          <input
            id="ss-filter-search"
            type="search"
            value={filters.searchQuery}
            placeholder="e.g. Dakota"
            onChange={(event) => update('searchQuery', event.target.value)}
          />
        </div>

        <div className="auth-field">
          <label htmlFor="ss-filter-vote">Vote status</label>
          <select
            id="ss-filter-vote"
            value={filters.voteFilter}
            onChange={(event) =>
              update('voteFilter', event.target.value as SongSuggestionVoteFilter)
            }
          >
            {VOTE_FILTER_OPTIONS.filter(
              (option) => votingOpen || option.value !== 'needs_my_vote',
            ).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="auth-field">
          <label htmlFor="ss-filter-suggester">Suggested by</label>
          <select
            id="ss-filter-suggester"
            value={filters.suggestedByUserId}
            onChange={(event) => update('suggestedByUserId', event.target.value)}
          >
            <option value="">Anyone</option>
            {currentUserId ? (
              <option value={SONG_SUGGESTION_FILTER_EXCLUDE_ME}>Exclude me</option>
            ) : null}
            {options.suggesters.map((suggester) => (
              <option key={suggester.userId} value={suggester.userId}>
                {suggester.label}
              </option>
            ))}
          </select>
        </div>

        {SHOW_SONG_SUGGESTION_METADATA_FILTERS ? (
          <>
            <div className="auth-field">
              <label htmlFor="ss-filter-genre">Genre</label>
              <select
                id="ss-filter-genre"
                value={filters.genre}
                onChange={(event) => update('genre', event.target.value)}
              >
                <option value="">Any genre</option>
                {options.genres.map((genre) => (
                  <option key={genre} value={genre}>
                    {genre}
                  </option>
                ))}
              </select>
            </div>

            <div className="auth-field">
              <label htmlFor="ss-filter-decade">Decade</label>
              <select
                id="ss-filter-decade"
                value={filters.decade}
                onChange={(event) => update('decade', event.target.value)}
              >
                <option value="">Any decade</option>
                {options.decades.map((decade) => (
                  <option key={decade} value={decade}>
                    {decade}
                  </option>
                ))}
              </select>
            </div>
          </>
        ) : null}

        <div className="auth-field">
          <label htmlFor="ss-filter-sort">Sort by</label>
          <select
            id="ss-filter-sort"
            value={filters.sortBy}
            onChange={(event) => update('sortBy', event.target.value as SongSuggestionSortKey)}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <label className="song-suggestion-filter-checkbox">
        <input
          type="checkbox"
          checked={filters.topNOnly}
          onChange={(event) => update('topNOnly', event.target.checked)}
        />
        Show top target rank only
      </label>
    </div>
  );
}
