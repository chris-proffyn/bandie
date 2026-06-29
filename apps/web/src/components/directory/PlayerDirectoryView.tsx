import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BandieLogo } from '../brand/BandieLogo';
import {
  collectPlayerDirectoryGenres,
  collectPlayerDirectoryPrimaryInstruments,
  computePlayerDirectoryStats,
  DEFAULT_PLAYER_DIRECTORY_FILTERS,
  filterPlayerDirectory,
  listPublishedPlayersForDirectory,
  loadGeographyIndex,
  PLAYER_DIRECTORY_INSTRUMENT_CATEGORY_LABELS,
  PLAYER_DIRECTORY_INSTRUMENT_CATEGORY_ORDER,
  sortPlayerDirectory,
  playerDirectoryModeLabel,
  type PlayerDirectoryFilters,
  type PlayerDirectoryListing,
  type PlayerDirectorySort,
  type GeographyIndex,
} from '@bandie/data';
import {
  createDefaultDirectoryAreaFilters,
  resolveDirectoryAreaFilters,
} from '../../lib/directoryAreaDefaults';
import {
  buildPlayerActiveFilterPills,
  PlayerDirectoryFiltersPanel,
  PlayerDirectorySortControl,
} from './PlayerDirectoryFiltersPanel';
import { DirectoryPlayerCard } from './DirectoryPlayerCard';
import { DirectoryTestDataToggle } from './DirectoryTestDataToggle';
import {
  AdminRecruitingBandSelector,
  adminRecruitingBandContext,
} from '../band/AdminRecruitingBandSelector';
import { useAuth } from '../../context/AuthContext';
import type { BackNavigationState } from '../../lib/backNavigation';
import {
  applyDirectoryTestDataFilter,
  countDirectoryTestRows,
  readDirectoryHideTestData,
  saveDirectoryHideTestData,
  showDirectoryTestDataToggle,
} from '../../lib/directoryTestDataPreference';
import {
  loadPlayerDirectoryNavigation,
  savePlayerDirectoryNavigation,
} from '../../lib/playerDirectoryNavigation';

import type { FindPlayersContext } from '../../lib/findPlayersNavigation';

type PlayerDirectoryViewProps = {
  variant: 'public' | 'workspace';
  initialFilters?: PlayerDirectoryFilters;
  findPlayersContext?: FindPlayersContext | null;
};

export function PlayerDirectoryView({
  variant,
  initialFilters = DEFAULT_PLAYER_DIRECTORY_FILTERS,
  findPlayersContext = null,
}: PlayerDirectoryViewProps) {
  const { session, adminModeActive, bands } = useAuth();
  const location = useLocation();
  const [adminRecruitBandId, setAdminRecruitBandId] = useState(findPlayersContext?.bandId ?? '');
  const storedNavigation = loadPlayerDirectoryNavigation(variant, initialFilters);
  const [players, setPlayers] = useState<PlayerDirectoryListing[]>([]);
  const [geography, setGeography] = useState<GeographyIndex | null>(null);
  const [geographyLoading, setGeographyLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const detectedAreaDefaults = useMemo(() => createDefaultDirectoryAreaFilters(), []);
  const [filters, setFilters] = useState<PlayerDirectoryFilters>(() => {
    const state = location.state as BackNavigationState | null;
    if (state?.playerFilters) {
      return resolveDirectoryAreaFilters(state.playerFilters, detectedAreaDefaults);
    }
    if (findPlayersContext?.instrument) {
      return resolveDirectoryAreaFilters(
        {
          ...initialFilters,
          mode: 'permanent',
          instrument: findPlayersContext.instrument,
          primaryInstrumentOnly: true,
        },
        detectedAreaDefaults,
      );
    }
    return storedNavigation.filters;
  });
  const [sort, setSort] = useState<PlayerDirectorySort>(() => {
    const state = location.state as BackNavigationState | null;
    return state?.playerSort ?? storedNavigation.sort;
  });
  const [hideTestData, setHideTestData] = useState(readDirectoryHideTestData);

  useEffect(() => {
    const state = location.state as BackNavigationState | null;
    if (state?.playerFilters) {
      setFilters(resolveDirectoryAreaFilters(state.playerFilters, detectedAreaDefaults));
    } else if (state?.playerMode) {
      setFilters((current) => ({ ...current, mode: state.playerMode! }));
    }
    if (state?.playerSort) {
      setSort(state.playerSort);
    }
  }, [location.pathname, location.state, detectedAreaDefaults]);

  useEffect(() => {
    loadGeographyIndex()
      .then(setGeography)
      .catch((err) => {
        console.error('Unable to load geography reference data.', err);
      })
      .finally(() => setGeographyLoading(false));
  }, []);

  useEffect(() => {
    savePlayerDirectoryNavigation(variant, filters, sort);
  }, [variant, filters, sort]);

  useEffect(() => {
    listPublishedPlayersForDirectory()
      .then(setPlayers)
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load directory.'))
      .finally(() => setLoading(false));
  }, []);

  const visiblePlayers = useMemo(
    () => applyDirectoryTestDataFilter(players, hideTestData),
    [players, hideTestData],
  );
  const testPlayerCount = useMemo(() => countDirectoryTestRows(players), [players]);
  const showTestDataToggle = useMemo(() => showDirectoryTestDataToggle(players), [players]);

  const genres = useMemo(() => collectPlayerDirectoryGenres(visiblePlayers), [visiblePlayers]);
  const instruments = useMemo(
    () => collectPlayerDirectoryPrimaryInstruments(visiblePlayers),
    [visiblePlayers],
  );
  const stats = useMemo(() => computePlayerDirectoryStats(visiblePlayers), [visiblePlayers]);

  const filteredPlayers = useMemo(() => {
    const filtered = filterPlayerDirectory(visiblePlayers, filters, geography ?? undefined);
    return sortPlayerDirectory(filtered, sort, filters.mode);
  }, [visiblePlayers, filters, sort, geography]);

  function handleHideTestDataChange(nextHidden: boolean) {
    setHideTestData(nextHidden);
    saveDirectoryHideTestData(nextHidden);
  }

  const activePills = buildPlayerActiveFilterPills(filters, geography);
  const resetFilters = () => {
    setFilters(resolveDirectoryAreaFilters(initialFilters, detectedAreaDefaults));
    setSort('recommended');
  };
  const modeLabel = playerDirectoryModeLabel(filters.mode);
  const isWorkspace = variant === 'workspace';
  const effectiveFindPlayersContext =
    findPlayersContext ??
    (adminModeActive ? adminRecruitingBandContext(bands, adminRecruitBandId) : null);

  if (loading) {
    return (
      <div className={isWorkspace ? 'workspace-directory-loading panel' : 'directory-page directory-loading'}>
        <p>Loading player directory…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={isWorkspace ? 'panel' : 'directory-page directory-error'}>
        <div>
          <h1>{isWorkspace ? 'Unable to load player directory' : 'Unable to load directory'}</h1>
          <p>{error}</p>
          {isWorkspace ? null : (
            <Link to="/" className="directory-btn directory-btn-primary">
              Back to homepage
            </Link>
          )}
        </div>
      </div>
    );
  }

  const hero = (
    <section className={isWorkspace ? 'workspace-directory-hero' : 'directory-shell directory-hero'}>
      <div>
        <div className={isWorkspace ? 'my-bands-eyebrow' : 'directory-eyebrow'}>
          {isWorkspace ? 'Find band members' : 'Bandie player directory for band leaders'}
        </div>
        <h1>{isWorkspace ? 'Player directory' : 'Find the right player for your band.'}</h1>
        {effectiveFindPlayersContext ? (
          <p className="workspace-recruiting-banner">
            Recruiting for <strong>{effectiveFindPlayersContext.bandName ?? 'your band'}</strong>
            {effectiveFindPlayersContext.partTitle ? (
              <>
                {' '}
                · <strong>{effectiveFindPlayersContext.partTitle}</strong>
              </>
            ) : null}
            {effectiveFindPlayersContext.instrument ? (
              <> · {effectiveFindPlayersContext.instrument}</>
            ) : null}
          </p>
        ) : null}
        {adminModeActive && isWorkspace && !findPlayersContext ? (
          <AdminRecruitingBandSelector
            bands={bands}
            bandId={adminRecruitBandId}
            onChange={setAdminRecruitBandId}
          />
        ) : null}
        <p className={isWorkspace ? 'my-bands-lead' : 'directory-lead'}>
          {isWorkspace
            ? 'Search musicians who are open to joining a band permanently or covering a one-off gig. Filter by instrument, genre, location and experience.'
            : 'Need a dep for one gig or a new permanent member? Search musicians by instrument, genre, location and the details that matter for temporary or long-term roles.'}
        </p>
      </div>
      <aside className="directory-stats" aria-label="Directory summary">
        <div className="directory-stat">
          <strong>{stats.playerCount}</strong>
          <span>{stats.playerCount === 1 ? 'listed player' : 'listed players'}</span>
        </div>
        <div className="directory-stat">
          <strong>{stats.deputyCount}</strong>
          <span>open to deputy gigs</span>
        </div>
        <div className="directory-stat">
          <strong>{stats.memberCount}</strong>
          <span>open to join a band</span>
        </div>
        <div className="directory-stats-instruments">
          <p className="directory-stats-instruments-heading">Instruments represented</p>
          <div className="directory-stats-instrument-grid">
            {PLAYER_DIRECTORY_INSTRUMENT_CATEGORY_ORDER.map((category) => (
              <div key={category} className="directory-stat directory-stat-compact">
                <strong>{stats.instrumentCategories[category]}</strong>
                <span>{PLAYER_DIRECTORY_INSTRUMENT_CATEGORY_LABELS[category]}</span>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </section>
  );

  const results = (
    <section
      className={isWorkspace ? 'workspace-directory-layout' : 'directory-shell directory-layout'}
      aria-label="Player directory"
    >
      <PlayerDirectoryFiltersPanel
        filters={filters}
        genres={genres}
        instruments={instruments}
        geography={geography}
        geographyLoading={geographyLoading}
        onChange={setFilters}
        onReset={resetFilters}
        showPrimaryInstrumentToggle
      />

      <section aria-label="Player directory results">
        <div className="directory-results-head">
          <div>
            <h2>Available players</h2>
            <p>
              Showing {filteredPlayers.length} of {visiblePlayers.length}{' '}
              {visiblePlayers.length === 1 ? 'player' : 'players'} for {modeLabel} roles
            </p>
          </div>
          <div className="directory-results-actions">
            {showTestDataToggle ? (
              <DirectoryTestDataToggle
                hideTestData={hideTestData}
                testItemCount={testPlayerCount}
                itemLabel="players"
                onChange={handleHideTestDataChange}
              />
            ) : null}
            <PlayerDirectorySortControl sort={sort} mode={filters.mode} onChange={setSort} />
          </div>
        </div>

        <div className="directory-active-filters" aria-label="Active filters">
          {activePills.map((pill) => (
            <span key={pill} className="directory-filter-pill">
              {pill}
            </span>
          ))}
          {hideTestData && showTestDataToggle ? (
            <span className="directory-filter-pill">Test data hidden</span>
          ) : null}
        </div>

        {filteredPlayers.length === 0 ? (
          <div className="directory-empty-state">
            <strong>No players found</strong>
            {players.length === 0 ? (
              <p>
                No musicians have listed themselves in the player directory yet. Musicians can enable
                their public player profile from{' '}
                {isWorkspace ? (
                  <Link to="/app/profile">My profile</Link>
                ) : (
                  'their workspace'
                )}
                .
              </p>
            ) : visiblePlayers.length === 0 && hideTestData && testPlayerCount > 0 ? (
              <p>Test data is hidden. Choose Show test data to view seeded players.</p>
            ) : (
              <p>
                Try broadening your country, area, town or filters, or switch search mode.
              </p>
            )}
          </div>
        ) : (
          <div className="directory-band-grid directory-player-grid">
            {filteredPlayers.map((player) => (
              <DirectoryPlayerCard
                key={player.id}
                player={player}
                mode={filters.mode}
                variant={variant}
                filters={filters}
                sort={sort}
                findPlayersContext={effectiveFindPlayersContext}
              />
            ))}
          </div>
        )}
      </section>
    </section>
  );

  if (isWorkspace) {
    return (
      <div className="workspace-directory-page">
        {hero}
        {results}
      </div>
    );
  }

  return (
    <div className="directory-page">
      <header className="directory-header">
        <div className="directory-header-inner">
          <Link to="/" className="directory-brand" aria-label="Bandie home">
            <BandieLogo className="directory-brand-mark" />
            <span>Bandie</span>
          </Link>
          <div className="directory-header-actions">
            <Link to="/bands" className="directory-btn directory-btn-secondary">
              Find a band
            </Link>
            {session ? (
              <Link to="/app" className="directory-btn directory-btn-secondary">
                My workspace
              </Link>
            ) : null}
          </div>
        </div>
      </header>

      <main id="directory">
        {hero}
        {results}
      </main>

      <footer className="directory-shell directory-footer">
        <div className="directory-footer-row">
          <div>
            <strong>Bandie</strong> — find players, build your band, and keep everyone aligned.
          </div>
          <div className="directory-footer-links">
            <Link to="/bands">Band directory</Link>
            <Link to="/">Homepage</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
