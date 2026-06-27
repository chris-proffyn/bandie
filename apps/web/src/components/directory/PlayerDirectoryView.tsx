import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  collectPlayerDirectoryGenres,
  collectPlayerDirectoryInstruments,
  computePlayerDirectoryStats,
  DEFAULT_PLAYER_DIRECTORY_FILTERS,
  filterPlayerDirectory,
  listPublishedPlayersForDirectory,
  sortPlayerDirectory,
  playerDirectoryModeLabel,
  type PlayerDirectoryFilters,
  type PlayerDirectoryListing,
  type PlayerDirectorySort,
} from '@bandie/data';
import {
  buildPlayerActiveFilterPills,
  PlayerDirectoryFiltersPanel,
  PlayerDirectorySortControl,
} from './PlayerDirectoryFiltersPanel';
import { DirectoryPlayerCard } from './DirectoryPlayerCard';
import { useAuth } from '../../context/AuthContext';
import type { BackNavigationState } from '../../lib/backNavigation';

type PlayerDirectoryViewProps = {
  variant: 'public' | 'workspace';
  initialFilters?: PlayerDirectoryFilters;
};

export function PlayerDirectoryView({
  variant,
  initialFilters = DEFAULT_PLAYER_DIRECTORY_FILTERS,
}: PlayerDirectoryViewProps) {
  const { session } = useAuth();
  const location = useLocation();
  const [players, setPlayers] = useState<PlayerDirectoryListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<PlayerDirectoryFilters>(initialFilters);
  const [sort, setSort] = useState<PlayerDirectorySort>('recommended');

  useEffect(() => {
    const state = location.state as BackNavigationState | null;
    if (state?.playerMode) {
      setFilters((current) => ({ ...current, mode: state.playerMode! }));
    }
  }, [location.pathname, location.state]);

  useEffect(() => {
    listPublishedPlayersForDirectory()
      .then(setPlayers)
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load directory.'))
      .finally(() => setLoading(false));
  }, []);

  const genres = useMemo(() => collectPlayerDirectoryGenres(players), [players]);
  const instruments = useMemo(() => collectPlayerDirectoryInstruments(players), [players]);
  const stats = useMemo(() => computePlayerDirectoryStats(players), [players]);

  const filteredPlayers = useMemo(() => {
    const filtered = filterPlayerDirectory(players, filters);
    return sortPlayerDirectory(filtered, sort, filters.mode);
  }, [players, filters, sort]);

  const activePills = buildPlayerActiveFilterPills(filters);
  const modeLabel = playerDirectoryModeLabel(filters.mode);
  const isWorkspace = variant === 'workspace';

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
        <div className="directory-stat">
          <strong>{stats.instrumentCount}</strong>
          <span>instruments represented</span>
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
        onChange={setFilters}
        onReset={() => setFilters(initialFilters)}
      />

      <section aria-label="Player directory results">
        <div className="directory-results-head">
          <div>
            <h2>Available players</h2>
            <p>
              Showing {filteredPlayers.length} of {players.length}{' '}
              {players.length === 1 ? 'player' : 'players'} for {modeLabel} roles
            </p>
          </div>
          <PlayerDirectorySortControl sort={sort} mode={filters.mode} onChange={setSort} />
        </div>

        <div className="directory-active-filters" aria-label="Active filters">
          {activePills.map((pill) => (
            <span key={pill} className="directory-filter-pill">
              {pill}
            </span>
          ))}
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
            ) : (
              <p>
                Try broadening your instrument, location or filters, or switch search mode.
              </p>
            )}
          </div>
        ) : (
          <div className="directory-band-grid">
            {filteredPlayers.map((player) => (
              <DirectoryPlayerCard
                key={player.id}
                player={player}
                mode={filters.mode}
                variant={variant}
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
            <span className="directory-brand-mark">B</span>
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
