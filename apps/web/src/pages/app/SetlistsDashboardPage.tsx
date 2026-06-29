import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  SETLIST_STATUS_OPTIONS,
  SETLIST_LEADER_ONLY_MESSAGE,
  computeSetlistLibraryMetrics,
  formatSetlistDuration,
  formatSetlistLastUsed,
  formatSetlistSongMeta,
  formatSetlistStatus,
  isBandLeaderRole,
  isSetlistRecentlyUsed,
  listBandSetlists,
  setlistStatusPillClass,
  type SetlistLibraryEntry,
  type SetlistListFilters,
} from '@bandie/data';
import { useAuth } from '../../context/AuthContext';
import { CreateSetlistDialog } from '../../components/setlists/CreateSetlistDialog';
import { SongsBandContextBar } from '../../components/songs/SongsBandContextBar';
import '../../styles/setlists.css';

export function SetlistsDashboardPage() {
  const { bandId } = useParams();
  const { bands, adminModeActive } = useAuth();
  const membership = bands.find((item) => item.id === bandId);
  const canAccessBand = Boolean(membership) || adminModeActive;
  const canManage = adminModeActive || isBandLeaderRole(membership?.member_role);

  const [setlists, setSetlists] = useState<SetlistLibraryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [filters, setFilters] = useState<SetlistListFilters>({
    search: '',
    status: 'all',
    sort: 'recent',
    includeArchived: false,
  });

  const loadSetlists = useCallback(async () => {
    if (!bandId) {
      return;
    }

    setLoading(true);
    setLoadError(null);

    try {
      const rows = await listBandSetlists(bandId, filters);
      setSetlists(rows);
    } catch (err) {
      setSetlists([]);
      setLoadError(err instanceof Error ? err.message : 'Unable to load setlists.');
    } finally {
      setLoading(false);
    }
  }, [bandId, filters]);

  useEffect(() => {
    void loadSetlists();
  }, [loadSetlists]);

  const metrics = useMemo(() => computeSetlistLibraryMetrics(setlists), [setlists]);

  if (!bandId) {
    return null;
  }

  if (!canAccessBand) {
    return (
      <div className="setlists-page">
        <div className="panel">
          <p>You do not have access to this band workspace.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="setlists-page">
      <SongsBandContextBar
        bandId={bandId}
        bandName={membership?.name}
        sectionNote="Member-only setlists for this band"
        switchPath={(nextBandId) => `/app/${nextBandId}/setlists`}
      />

      <header className="setlists-header">
        <div>
          <p className="my-bands-eyebrow">Setlist management</p>
          <h1>Create, compare and reuse setlists</h1>
          <p className="my-bands-lead">
            Build gig-specific running orders, check total duration, balance the overall vibe,
            and track how often each setlist has been used.
          </p>
        </div>
        <div className="setlists-header-actions">
          <Link to={`/app/${bandId}/songs`} className="directory-btn directory-btn-secondary">
            Songs dashboard
          </Link>
          {canManage ? (
            <button
              type="button"
              className="directory-btn directory-btn-primary"
              onClick={() => setShowCreate(true)}
            >
              New setlist
            </button>
          ) : null}
        </div>
      </header>

      {!canManage ? (
        <p className="my-bands-lead setlists-leader-only-note">{SETLIST_LEADER_ONLY_MESSAGE}</p>
      ) : null}

      {loadError ? <div className="setlists-error">{loadError}</div> : null}

      <section className="setlists-metrics" aria-label="Setlist metrics">
        <article className="setlists-metric surface-light">
          <small>Active setlists</small>
          <strong>{metrics.activeCount}</strong>
          <span>{metrics.gigReadyCount} gig ready</span>
        </article>
        <article className="setlists-metric surface-light">
          <small>Most used</small>
          <strong>{metrics.mostUsedTitle ?? '—'}</strong>
          <span>{metrics.mostUsedCount > 0 ? `${metrics.mostUsedCount} uses` : 'No usage yet'}</span>
        </article>
        <article className="setlists-metric surface-light">
          <small>Longest set</small>
          <strong>{formatSetlistDuration(metrics.longestDurationSeconds)}</strong>
          <span>{metrics.longestSetlistTitle ?? 'Add songs to sets'}</span>
        </article>
        <article className="setlists-metric surface-light">
          <small>Showing</small>
          <strong>{setlists.length}</strong>
          <span>Matching filters</span>
        </article>
      </section>

      <section className="panel">
        <div className="setlists-side-card-header">
          <div>
            <h2>Setlist library</h2>
            <p>Search and filter by status, usage and duration.</p>
          </div>
        </div>

        <div className="setlists-filters">
          <input
            placeholder="Search setlists, vibe, notes…"
            value={filters.search ?? ''}
            onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
          />
          <select
            value={filters.status ?? 'all'}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                status: event.target.value as SetlistListFilters['status'],
              }))
            }
          >
            <option value="all">Any status</option>
            {SETLIST_STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {formatSetlistStatus(status)}
              </option>
            ))}
            <option value="recently_used">Recently used</option>
          </select>
          <select
            value={filters.sort ?? 'recent'}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                sort: event.target.value as SetlistListFilters['sort'],
              }))
            }
          >
            <option value="recent">Sort: Recently updated</option>
            <option value="title">Sort: Title</option>
            <option value="used">Sort: Most used</option>
            <option value="duration">Sort: Duration</option>
          </select>
          <label className="setlists-show-archived-checkbox">
            <input
              type="checkbox"
              checked={filters.includeArchived ?? false}
              onChange={(event) =>
                setFilters((current) => ({ ...current, includeArchived: event.target.checked }))
              }
            />
            Show archived
          </label>
        </div>

        {loading ? (
          <p>Loading setlists…</p>
        ) : setlists.length === 0 ? (
          <div className="directory-empty-state">
            <strong>No setlists yet</strong>
            <p>Create your first running order from the band songbook.</p>
            {canManage ? (
              <button
                type="button"
                className="directory-btn directory-btn-primary"
                onClick={() => setShowCreate(true)}
              >
                Create your first setlist
              </button>
            ) : null}
          </div>
        ) : (
          <div className="setlists-grid">
            {setlists.map((setlist) => (
              <article key={setlist.id} className="setlists-card surface-light">
                <div className="setlists-card-top">
                  <div>
                    <Link className="setlists-card-title" to={`/app/${bandId}/setlists/${setlist.id}`}>
                      {setlist.title}
                    </Link>
                    {setlist.description ? <p>{setlist.description}</p> : null}
                  </div>
                  <span className={setlistStatusPillClass(setlist.status)}>
                    {formatSetlistStatus(setlist.status)}
                  </span>
                </div>

                <div className="setlists-stat-strip">
                  <div className="setlists-stat">
                    <small>Used</small>
                    <strong>{setlist.times_used}×</strong>
                  </div>
                  <div className="setlists-stat">
                    <small>Last used</small>
                    <strong>{formatSetlistLastUsed(setlist.last_used_at)}</strong>
                  </div>
                  <div className="setlists-stat">
                    <small>Duration</small>
                    <strong>{formatSetlistDuration(setlist.metrics.totalDurationSeconds)}</strong>
                  </div>
                </div>

                {setlist.vibe ? <span className="setlists-pill">{setlist.vibe}</span> : null}
                {isSetlistRecentlyUsed(setlist.last_used_at) ? (
                  <span className="setlists-pill green">Recently used</span>
                ) : null}

                <div className="setlists-song-stack">
                  {setlist.previewItems.length === 0 ? (
                    <div className="setlists-stack-row">
                      <strong>No songs yet</strong>
                      <span>Open to build</span>
                    </div>
                  ) : (
                    setlist.previewItems.map((item, index) => (
                      <div key={item.id} className="setlists-stack-row">
                        <strong>
                          {index + 1}. {item.song?.title ?? 'Missing song'}
                        </strong>
                        <span>{item.song ? formatSetlistSongMeta(item.song) : 'Removed'}</span>
                      </div>
                    ))
                  )}
                  {setlist.metrics.songCount > setlist.previewItems.length ? (
                    <div className="setlists-stack-row">
                      <strong>+{setlist.metrics.songCount - setlist.previewItems.length} more</strong>
                      <span>Open setlist</span>
                    </div>
                  ) : null}
                </div>

                <div className="setlists-card-footer">
                  <span>{setlist.metrics.songCount} songs</span>
                  <span>{setlist.metrics.readinessPercent}% ready</span>
                  <Link to={`/app/${bandId}/setlists/${setlist.id}`} className="setlists-card-btn">
                    Open builder
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {showCreate ? (
        <CreateSetlistDialog
          bandId={bandId}
          canManage={canManage}
          onClose={() => setShowCreate(false)}
        />
      ) : null}
    </div>
  );
}
