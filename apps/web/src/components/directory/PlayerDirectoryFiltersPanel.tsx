import {
  DEFAULT_PLAYER_DIRECTORY_FILTERS,
  PLAYER_GENDER_OPTIONS,
  PRIMARY_INSTRUMENT_OPTIONS,
  formatPlayerGenderLabel,
  isPrimaryInstrumentOption,
  type PlayerDirectoryFilters,
  type PlayerDirectorySort,
  type PlayerSearchMode,
} from '@bandie/data';

type PlayerDirectoryFiltersPanelProps = {
  filters: PlayerDirectoryFilters;
  genres: string[];
  instruments: string[];
  onChange: (filters: PlayerDirectoryFilters) => void;
  onReset: () => void;
  showPrimaryInstrumentToggle?: boolean;
};

function modePillLabel(mode: PlayerSearchMode): string {
  switch (mode) {
    case 'temporary':
      return 'Temporary gig';
    case 'permanent':
      return 'Permanent member';
    case 'any':
      return 'Any role';
  }
}

function modeHint(mode: PlayerSearchMode): string {
  switch (mode) {
    case 'temporary':
      return 'Cover a one-off gig, dep for a rehearsal, or stand in while someone is away.';
    case 'permanent':
      return 'Find someone to join your band long-term — regular rehearsals and gigs.';
    case 'any':
      return 'Browse every listed musician. Use deputy or member filters below to narrow results.';
  }
}

export function PlayerDirectoryFiltersPanel({
  filters,
  genres,
  instruments,
  onChange,
  onReset,
  showPrimaryInstrumentToggle = false,
}: PlayerDirectoryFiltersPanelProps) {
  function update<K extends keyof PlayerDirectoryFilters>(key: K, value: PlayerDirectoryFilters[K]) {
    onChange({ ...filters, [key]: value });
  }

  function setMode(mode: PlayerSearchMode) {
    onChange({ ...filters, mode });
  }

  const showDeputyFilters = filters.mode === 'temporary' || filters.mode === 'any';
  const showMemberFilters = filters.mode === 'permanent' || filters.mode === 'any';

  return (
    <aside className="directory-filters" id="filters" aria-label="Player directory filters">
      <h2>Find a player</h2>
      <p className="directory-filters-intro">
        Search for musicians open to deputy gigs, permanent band membership, or both. Switch mode
        to see the filters that matter for your situation.
      </p>

      <div className="directory-filter-group">
        <span className="directory-filter-label">What are you looking for?</span>
        <div className="directory-mode-toggle" role="group" aria-label="Search mode">
          <button
            type="button"
            className={`directory-mode-btn ${filters.mode === 'any' ? 'active' : ''}`}
            onClick={() => setMode('any')}
          >
            Any role
          </button>
          <button
            type="button"
            className={`directory-mode-btn ${filters.mode === 'temporary' ? 'active' : ''}`}
            onClick={() => setMode('temporary')}
          >
            Temporary gig
          </button>
          <button
            type="button"
            className={`directory-mode-btn ${filters.mode === 'permanent' ? 'active' : ''}`}
            onClick={() => setMode('permanent')}
          >
            Permanent member
          </button>
        </div>
        <p className="directory-mode-hint">{modeHint(filters.mode)}</p>
      </div>

      <div className="directory-filter-group">
        <label htmlFor="playerNameFilter">Player name</label>
        <input
          id="playerNameFilter"
          type="search"
          placeholder="e.g. Alex"
          value={filters.name}
          onChange={(event) => update('name', event.target.value)}
        />
      </div>

      <div className="directory-filter-group">
        <label htmlFor="instrumentFilter">Primary instrument</label>
        <select
          id="instrumentFilter"
          value={filters.instrument}
          onChange={(event) => {
            const value = event.target.value;
            onChange({
              ...filters,
              instrument: value,
              primaryInstrumentOnly: value ? true : false,
            });
          }}
        >
          <option value="">Any instrument</option>
          {PRIMARY_INSTRUMENT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
          {instruments
            .filter((instrument) => !isPrimaryInstrumentOption(instrument))
            .map((instrument) => (
              <option key={instrument} value={instrument}>
                {instrument}
              </option>
            ))}
        </select>
        {showPrimaryInstrumentToggle ? (
          <>
            <button
              type="button"
              className={`directory-chip directory-chip-block ${!filters.primaryInstrumentOnly ? 'active' : ''}`}
              onClick={() => update('primaryInstrumentOnly', !filters.primaryInstrumentOnly)}
              disabled={!filters.instrument.trim()}
            >
              Include secondary instruments
            </button>
            <p className="directory-field-hint">
              {filters.instrument.trim()
                ? filters.primaryInstrumentOnly
                  ? 'Matching players whose primary role fits your search.'
                  : 'Also matching players who list this instrument as a secondary role.'
                : 'Choose an instrument above to filter by primary role.'}
            </p>
          </>
        ) : (
          <p className="directory-field-hint">
            Matches players by the primary instrument on their profile.
          </p>
        )}
      </div>

      <div className="directory-filter-group">
        <label htmlFor="playerGenderFilter">Gender</label>
        <select
          id="playerGenderFilter"
          value={filters.gender}
          onChange={(event) => update('gender', event.target.value)}
        >
          <option value="">Any gender</option>
          {PLAYER_GENDER_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="directory-filter-group">
        <label htmlFor="playerGenreFilter">Genre</label>
        <select
          id="playerGenreFilter"
          value={filters.genre}
          onChange={(event) => update('genre', event.target.value)}
        >
          <option value="">Any genre</option>
          {genres.map((genre) => (
            <option key={genre} value={genre}>
              {genre}
            </option>
          ))}
        </select>
      </div>

      <div className="directory-filter-group">
        <label htmlFor="playerLocationFilter">Location / area</label>
        <input
          id="playerLocationFilter"
          type="search"
          placeholder="e.g. Surrey, Manchester"
          value={filters.location}
          onChange={(event) => update('location', event.target.value)}
        />
      </div>

      {showDeputyFilters ? (
        <>
          <div className="directory-filter-group">
            <span className="directory-filter-label">
              {filters.mode === 'any' ? 'Deputy / stand-in filters' : 'Gig details'}
            </span>
          </div>

          <div className="directory-filter-group">
            <label htmlFor="gigDateFilter">Gig date</label>
            <input
              id="gigDateFilter"
              type="date"
              value={filters.gigDate}
              onChange={(event) => update('gigDate', event.target.value)}
            />
            <p className="directory-field-hint">
              Helps you plan — confirm availability directly with the player.
            </p>
          </div>

          <div className="directory-filter-group">
            <label>Budget for the gig (£)</label>
            <div className="directory-range-row">
              <input
                type="number"
                min={0}
                step={25}
                placeholder="Min"
                value={filters.budgetMin ?? ''}
                onChange={(event) =>
                  update('budgetMin', event.target.value ? Number(event.target.value) : null)
                }
              />
              <input
                type="number"
                min={0}
                step={25}
                placeholder="Max"
                value={filters.budgetMax ?? ''}
                onChange={(event) =>
                  update('budgetMax', event.target.value ? Number(event.target.value) : null)
                }
              />
            </div>
          </div>

          <div className="directory-filter-group">
            <label htmlFor="maxTravelFilter">Player should travel at least (miles)</label>
            <input
              id="maxTravelFilter"
              type="number"
              min={0}
              step={5}
              placeholder="e.g. 30"
              value={filters.maxTravelMiles ?? ''}
              onChange={(event) =>
                update('maxTravelMiles', event.target.value ? Number(event.target.value) : null)
              }
            />
            <p className="directory-field-hint">
              Matches players who cover at least this distance from their home area.
            </p>
          </div>
        </>
      ) : null}

      {showMemberFilters ? (
        <>
          <div className="directory-filter-group">
            <span className="directory-filter-label">
              {filters.mode === 'any' ? 'Permanent member filters' : 'Experience'}
            </span>
          </div>

          <div className="directory-filter-group">
            <label htmlFor="minYearsFilter">Minimum years playing</label>
            <input
              id="minYearsFilter"
              type="number"
              min={0}
              step={1}
              placeholder="e.g. 5"
              value={filters.minYearsPlaying ?? ''}
              onChange={(event) =>
                update('minYearsPlaying', event.target.value ? Number(event.target.value) : null)
              }
            />
          </div>

          {filters.mode === 'permanent' ? (
            <div className="directory-filter-group">
              <span className="directory-filter-label">Commitment</span>
              <p className="directory-field-hint">
                Results show players who have opted in to permanent member invitations — regular
                rehearsals, shared repertoire, and ongoing gigs.
              </p>
            </div>
          ) : null}
        </>
      ) : null}

      {genres.length ? (
        <div className="directory-filter-group">
          <label>Quick genre picks</label>
          <div className="directory-genre-chips">
            {genres.slice(0, 6).map((genre) => (
              <button
                key={genre}
                type="button"
                className={`directory-chip ${filters.genre === genre ? 'active' : ''}`}
                onClick={() => update('genre', filters.genre === genre ? '' : genre)}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="directory-filter-actions">
        <button type="button" className="directory-btn directory-btn-secondary" onClick={onReset}>
          Reset
        </button>
      </div>
    </aside>
  );
}

export function buildPlayerActiveFilterPills(filters: PlayerDirectoryFilters): string[] {
  const pills: string[] = [modePillLabel(filters.mode)];

  if (filters.name.trim()) pills.push(`Name: ${filters.name.trim()}`);
  if (filters.instrument.trim()) {
    pills.push(
      filters.primaryInstrumentOnly
        ? `Primary: ${filters.instrument.trim()}`
        : `Instrument: ${filters.instrument.trim()}`,
    );
  }
  if (!filters.primaryInstrumentOnly && filters.instrument.trim()) {
    pills.push('Including secondary instruments');
  }
  if (filters.genre) pills.push(`Genre: ${filters.genre}`);
  if (filters.gender) {
    pills.push(`Gender: ${formatPlayerGenderLabel(filters.gender) ?? filters.gender}`);
  }
  if (filters.location.trim()) pills.push(`Location: ${filters.location.trim()}`);

  if (filters.mode === 'temporary' || filters.mode === 'any') {
    if (filters.gigDate) {
      pills.push(`Gig date: ${filters.gigDate}`);
    }
    if (filters.budgetMin != null && filters.budgetMin > 0) {
      pills.push(`Budget min: £${filters.budgetMin}`);
    }
    if (filters.budgetMax != null) pills.push(`Budget max: £${filters.budgetMax}`);
    if (filters.maxTravelMiles != null && filters.maxTravelMiles > 0) {
      pills.push(`Travel: ${filters.maxTravelMiles}+ miles`);
    }
  }

  if (
    (filters.mode === 'permanent' || filters.mode === 'any') &&
    filters.minYearsPlaying != null &&
    filters.minYearsPlaying > 0
  ) {
    pills.push(`Min experience: ${filters.minYearsPlaying} years`);
  }

  return pills;
}

type PlayerDirectorySortControlProps = {
  sort: PlayerDirectorySort;
  mode: PlayerSearchMode;
  onChange: (sort: PlayerDirectorySort) => void;
};

export function PlayerDirectorySortControl({
  sort,
  mode,
  onChange,
}: PlayerDirectorySortControlProps) {
  return (
    <div className="directory-sort-control">
      <label htmlFor="playerSortSelect">Sort</label>
      <select
        id="playerSortSelect"
        value={sort}
        onChange={(event) => onChange(event.target.value as PlayerDirectorySort)}
      >
        <option value="recommended">Recommended</option>
        <option value="nameAsc">Name A–Z</option>
        {mode === 'permanent' || mode === 'any' ? (
          <option value="experienceDesc">Most experience</option>
        ) : null}
        {mode === 'temporary' || mode === 'any' ? (
          <option value="feeAsc">Fee: low to high</option>
        ) : null}
      </select>
    </div>
  );
}

export { DEFAULT_PLAYER_DIRECTORY_FILTERS };
