import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BandieLogo } from '../brand/BandieLogo';
import {
  collectDirectoryGenres,
  computeDirectoryStats,
  DEFAULT_DIRECTORY_FILTERS,
  filterDirectoryBands,
  listPublishedBandsForDirectory,
  loadGeographyIndex,
  sortDirectoryBands,
  type DirectoryBandListing,
  type DirectoryFilters,
  type DirectorySort,
  type GeographyIndex,
} from '@bandie/data';
import {
  createDefaultDirectoryAreaFilters,
  resolveDirectoryAreaFilters,
} from '../../lib/directoryAreaDefaults';
import {
  buildActiveFilterPills,
  DirectoryFiltersPanel,
  DirectorySortControl,
} from './DirectoryFiltersPanel';
import { DirectoryBandCard } from './DirectoryBandCard';
import { useAuth } from '../../context/AuthContext';

type BandDirectoryViewProps = {
  variant: 'public' | 'workspace';
  initialFilters?: DirectoryFilters;
};

export function BandDirectoryView({
  variant,
  initialFilters = DEFAULT_DIRECTORY_FILTERS,
}: BandDirectoryViewProps) {
  const { session } = useAuth();
  const [bands, setBands] = useState<DirectoryBandListing[]>([]);
  const [geography, setGeography] = useState<GeographyIndex | null>(null);
  const [geographyLoading, setGeographyLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const detectedAreaDefaults = useMemo(() => createDefaultDirectoryAreaFilters(), []);
  const [filters, setFilters] = useState<DirectoryFilters>(() =>
    resolveDirectoryAreaFilters(initialFilters, detectedAreaDefaults),
  );
  const [sort, setSort] = useState<DirectorySort>('recommended');

  useEffect(() => {
    loadGeographyIndex()
      .then(setGeography)
      .catch((err) => {
        console.error('Unable to load geography reference data.', err);
      })
      .finally(() => setGeographyLoading(false));
  }, []);

  useEffect(() => {
    listPublishedBandsForDirectory()
      .then(setBands)
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load directory.'))
      .finally(() => setLoading(false));
  }, []);

  const genres = useMemo(() => collectDirectoryGenres(bands), [bands]);
  const stats = useMemo(() => computeDirectoryStats(bands), [bands]);

  const filteredBands = useMemo(() => {
    const filtered = filterDirectoryBands(bands, filters, geography ?? undefined);
    return sortDirectoryBands(filtered, sort);
  }, [bands, filters, sort, geography]);

  const activePills = buildActiveFilterPills(filters, geography);
  const resetFilters = () =>
    setFilters(resolveDirectoryAreaFilters(initialFilters, detectedAreaDefaults));
  const isWorkspace = variant === 'workspace';

  if (loading) {
    return (
      <div className={isWorkspace ? 'workspace-directory-loading panel' : 'directory-page directory-loading'}>
        <p>Loading band directory…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={isWorkspace ? 'panel' : 'directory-page directory-error'}>
        <div>
          <h1>{isWorkspace ? 'Unable to load band directory' : 'Unable to load directory'}</h1>
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
          {isWorkspace ? 'Find bands to book' : 'Bandie directory for event organisers'}
        </div>
        <h1>{isWorkspace ? 'Band directory' : 'Find the right band for the right night.'}</h1>
        <p className={isWorkspace ? 'my-bands-lead' : 'directory-lead'}>
          {isWorkspace
            ? 'Search local bands by genre, location, price and availability. Compare profiles and send booking enquiries from one place.'
            : 'Search local bands by genre, location, price and availability. Compare profiles and send booking enquiries from one place.'}
        </p>
      </div>
      <aside className="directory-stats" aria-label="Directory summary">
        <div className="directory-stat">
          <strong>{stats.bandCount}</strong>
          <span>{stats.bandCount === 1 ? 'published band' : 'published bands'}</span>
        </div>
        <div className="directory-stat">
          <strong>{stats.genreCount}</strong>
          <span>genres represented</span>
        </div>
        {stats.lowestFee != null ? (
          <div className="directory-stat">
            <strong>£{stats.lowestFee.toLocaleString('en-GB')}+</strong>
            <span>starting fee guidance shown</span>
          </div>
        ) : null}
        <div className="directory-stat">
          <strong>Live</strong>
          <span>profiles link to full band pages</span>
        </div>
      </aside>
    </section>
  );

  const results = (
    <section
      className={isWorkspace ? 'workspace-directory-layout' : 'directory-shell directory-layout'}
      aria-label="Band directory"
    >
      <DirectoryFiltersPanel
        filters={filters}
        genres={genres}
        geography={geography}
        geographyLoading={geographyLoading}
        onChange={setFilters}
        onReset={resetFilters}
      />

      <section aria-label="Band directory results">
        <div className="directory-results-head">
          <div>
            <h2>Available bands</h2>
            <p>
              Showing {filteredBands.length} of {bands.length}{' '}
              {bands.length === 1 ? 'band' : 'bands'}
            </p>
          </div>
          <DirectorySortControl sort={sort} onChange={setSort} />
        </div>

        <div className="directory-active-filters" aria-label="Active filters">
          {activePills.length ? (
            activePills.map((pill) => (
              <span key={pill} className="directory-filter-pill">
                {pill}
              </span>
            ))
          ) : (
            <span className="directory-filter-pill">Showing all published bands</span>
          )}
        </div>

        {filteredBands.length === 0 ? (
          <div className="directory-empty-state">
            <strong>No bands found</strong>
            {bands.length === 0 ? (
              <p>
                No bands have published their profile yet. If you are in a band, create an account
                and publish your public profile to appear here.
              </p>
            ) : (
              <p>Try broadening your country, area, town, price range or genre filters.</p>
            )}
          </div>
        ) : (
          <div className="directory-band-grid directory-band-listing-grid">
            {filteredBands.map((band) => (
              <DirectoryBandCard key={band.id} band={band} variant={variant} />
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
            <Link to="/players" className="directory-btn directory-btn-secondary">
              Find a player
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
            <strong>Bandie</strong> — band profiles, promotion, setlists, gigs and booking discovery.
          </div>
          <div className="directory-footer-links">
            <Link to="/players">Player directory</Link>
            <Link to="/">Homepage</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
