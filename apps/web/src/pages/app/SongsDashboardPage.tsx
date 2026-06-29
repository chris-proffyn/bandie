import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  collectSongGenres,
  collectSongKeys,
  computeReadinessSnapshots,
  computeSongDashboardMetrics,
  formatActivityTimestamp,
  formatSongDuration,
  formatSongPartActivityLabel,
  formatSongReadinessStatus,
  listBandSongs,
  listRecentSongPartActivity,
  songTitleInitials,
  type SongListFilters,
  type SongPartFileActivity,
  type SongWithReadiness,
} from '@bandie/data';
import { useAuth } from '../../context/AuthContext';
import { AddSongDialog } from '../../components/songs/AddSongDialog';
import '../../styles/songs.css';

function partsPillClass(song: SongWithReadiness): string {
  if (song.partsRequired === 0) {
    return 'songs-pill';
  }

  if (song.partsComplete >= song.partsRequired) {
    return 'songs-pill green';
  }

  if (song.partsComplete > 0) {
    return 'songs-pill amber';
  }

  return 'songs-pill red';
}

export function SongsDashboardPage() {
  const { bandId } = useParams();
  const { bands, adminModeActive } = useAuth();
  const membership = bands.find((item) => item.id === bandId);
  const canAccessBand = Boolean(membership) || adminModeActive;

  const [songs, setSongs] = useState<SongWithReadiness[]>([]);
  const [activity, setActivity] = useState<SongPartFileActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showAddSong, setShowAddSong] = useState(false);
  const [filters, setFilters] = useState<SongListFilters>({
    search: '',
    genre: 'all',
    readiness: 'all',
    key: 'all',
    sort: 'recent',
  });

  const loadDashboard = useCallback(async () => {
    if (!bandId) {
      return;
    }

    setLoading(true);
    setLoadError(null);

    try {
      const [songRows, activityRows] = await Promise.all([
        listBandSongs(bandId, filters),
        listRecentSongPartActivity(bandId),
      ]);
      setSongs(songRows);
      setActivity(activityRows);
    } catch (err) {
      setSongs([]);
      setActivity([]);
      setLoadError(err instanceof Error ? err.message : 'Unable to load songs dashboard.');
    } finally {
      setLoading(false);
    }
  }, [bandId, filters]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const metrics = useMemo(() => computeSongDashboardMetrics(songs), [songs]);
  const snapshots = useMemo(() => computeReadinessSnapshots(songs), [songs]);
  const genres = useMemo(() => collectSongGenres(songs), [songs]);
  const keys = useMemo(() => collectSongKeys(songs), [songs]);

  if (!bandId) {
    return null;
  }

  if (!canAccessBand) {
    return (
      <div className="songs-page">
        <div className="panel">
          <p>You do not have access to this band workspace.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="songs-page">
      <header className="songs-header">
        <div>
          <p className="my-bands-eyebrow">Songs management</p>
          <h1>Band songbook dashboard</h1>
          <p className="my-bands-lead">
            Upload, organise and prepare the working repertoire for {membership?.name ?? 'this band'}.
            Track readiness, keys, parts and file activity in one secure member-only area.
          </p>
        </div>
        <div className="songs-header-actions">
          <Link to={`/app/${bandId}`} className="directory-btn directory-btn-secondary">
            Band overview
          </Link>
          <button
            type="button"
            className="directory-btn directory-btn-primary"
            onClick={() => setShowAddSong(true)}
          >
            Add song
          </button>
        </div>
      </header>

      {loadError ? <div className="songs-error">{loadError}</div> : null}

      <section className="songs-metrics" aria-label="Song metrics">
        <article className="songs-metric">
          <small>Total songs</small>
          <strong>{metrics.totalSongs}</strong>
          {metrics.songsAddedThisMonth > 0 ? (
            <span>+{metrics.songsAddedThisMonth} this month</span>
          ) : (
            <span>{metrics.repertoireReadinessPercent}% avg readiness</span>
          )}
        </article>
        <article className="songs-metric">
          <small>Gig ready</small>
          <strong>{metrics.gigReadyCount}</strong>
          <span>
            {metrics.totalSongs > 0
              ? `${Math.round((metrics.gigReadyCount / metrics.totalSongs) * 100)}% repertoire`
              : 'No songs yet'}
          </span>
        </article>
        <article className="songs-metric">
          <small>Missing parts</small>
          <strong>{metrics.missingPartsCount}</strong>
          {metrics.missingPartsCount > 0 ? (
            <span className="warn">Needs attention</span>
          ) : (
            <span>All parts covered</span>
          )}
        </article>
        <article className="songs-metric">
          <small>Gig-ready duration</small>
          <strong>{snapshots.totalPlayableMinutes}m</strong>
          <span>From gig-ready songs</span>
        </article>
      </section>

      <section className="songs-content-grid">
        <div className="panel">
          <div className="songs-side-card-header">
            <div>
              <h2>Song directory</h2>
              <p>Search and filter by genre, readiness, key and usage.</p>
            </div>
          </div>

          <div className="songs-filters">
            <input
              placeholder="Search songs, artist, notes…"
              value={filters.search ?? ''}
              onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
            />
            <select
              value={filters.genre ?? 'all'}
              onChange={(event) => setFilters((current) => ({ ...current, genre: event.target.value }))}
            >
              <option value="all">All genres</option>
              {genres.map((genre) => (
                <option key={genre} value={genre}>
                  {genre}
                </option>
              ))}
            </select>
            <select
              value={filters.readiness ?? 'all'}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  readiness: event.target.value as SongListFilters['readiness'],
                }))
              }
            >
              <option value="all">Any readiness</option>
              <option value="gig_ready">Gig ready</option>
              <option value="in_progress">In progress</option>
              <option value="not_started">Not started</option>
              <option value="needs_review">Needs review</option>
            </select>
            <select
              value={filters.key ?? 'all'}
              onChange={(event) => setFilters((current) => ({ ...current, key: event.target.value }))}
            >
              <option value="all">Any key</option>
              {keys.map((key) => (
                <option key={key} value={key}>
                  {key}
                </option>
              ))}
            </select>
            <select
              value={filters.sort ?? 'recent'}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  sort: event.target.value as SongListFilters['sort'],
                }))
              }
            >
              <option value="recent">Sort: Recently added</option>
              <option value="title">Sort: Title</option>
              <option value="played">Sort: Most played</option>
              <option value="readiness">Sort: Readiness</option>
            </select>
          </div>

          {loading ? (
            <p>Loading songs…</p>
          ) : songs.length === 0 ? (
            <div className="directory-empty-state">
              <strong>No songs yet</strong>
              <p>Add your first song to start building the band repertoire and part folders.</p>
              <button
                type="button"
                className="directory-btn directory-btn-primary"
                onClick={() => setShowAddSong(true)}
              >
                Add your first song
              </button>
            </div>
          ) : (
            <div className="songs-table-wrap">
              <table className="songs-table">
                <thead>
                  <tr>
                    <th>Song</th>
                    <th className="songs-hide-sm">Genre</th>
                    <th className="songs-hide-sm">Played</th>
                    <th>Readiness</th>
                    <th className="songs-hide-sm">Length</th>
                    <th className="songs-hide-sm">Key</th>
                    <th>Parts</th>
                  </tr>
                </thead>
                <tbody>
                  {songs.map((song) => (
                    <tr key={song.id}>
                      <td>
                        <Link className="songs-table-link" to={`/app/${bandId}/songs/${song.id}`}>
                          <span className="songs-art">{songTitleInitials(song.title)}</span>
                          <span>
                            {song.title}
                            {song.artist ? <small className="songs-artist">{song.artist}</small> : null}
                          </span>
                        </Link>
                      </td>
                      <td className="songs-hide-sm">
                        {song.genre ? <span className="songs-pill blue">{song.genre}</span> : '—'}
                      </td>
                      <td className="songs-hide-sm">{song.times_played}</td>
                      <td>
                        <div className="songs-progress" aria-label={`${song.readinessPercent}% ready`}>
                          <span style={{ width: `${song.readinessPercent}%` }} />
                        </div>
                        <small>{formatSongReadinessStatus(song.readiness_status)}</small>
                      </td>
                      <td className="songs-hide-sm">{formatSongDuration(song.duration_seconds)}</td>
                      <td className="songs-hide-sm">{song.song_key ?? '—'}</td>
                      <td>
                        <span className={partsPillClass(song)}>
                          {song.partsRequired > 0
                            ? `${song.partsComplete}/${song.partsRequired}`
                            : '—'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <aside className="songs-side-stack">
          <div className="songs-side-card dark">
            <div className="songs-side-card-header">
              <h2>Readiness snapshot</h2>
              <span className="songs-pill green">Live</span>
            </div>
            <div className="songs-list-item">
              <div>
                <strong>Ready for next gig</strong>
                <small>
                  {snapshots.gigReadyCount} songs, {snapshots.totalPlayableMinutes} minutes of playable material
                </small>
              </div>
              <span className="songs-pill green">{snapshots.gigReadyCount > 0 ? 'Good' : 'Build'}</span>
            </div>
            <div className="songs-list-item">
              <div>
                <strong>Songs missing parts</strong>
                <small>{snapshots.missingPartsCount} songs need current part files</small>
              </div>
              <span className={snapshots.missingPartsCount > 0 ? 'songs-pill amber' : 'songs-pill green'}>
                {snapshots.missingPartsCount > 0 ? 'Review' : 'Clear'}
              </span>
            </div>
          </div>

          <div className="songs-side-card">
            <div className="songs-side-card-header">
              <h2>Recent activity</h2>
            </div>
            {activity.length === 0 ? (
              <p>No song-part activity yet. Uploads and previews will appear here.</p>
            ) : (
              <div className="songs-timeline">
                {activity.map((item) => (
                  <div key={item.id} className="songs-timeline-item">
                    <div className="time">{formatActivityTimestamp(item.created_at)}</div>
                    <div className="body">
                      <strong>{item.action.replaceAll('_', ' ')}</strong>
                      <small>{formatSongPartActivityLabel(item)}</small>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </section>

      {showAddSong ? (
        <AddSongDialog
          bandId={bandId}
          onClose={() => setShowAddSong(false)}
          onCreated={() => void loadDashboard()}
        />
      ) : null}
    </div>
  );
}
