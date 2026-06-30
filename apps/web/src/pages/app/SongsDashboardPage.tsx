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
  isBandLeaderRole,
  listBandSongSuggestionGroups,
  listBandSongs,
  listRecentSongPartActivity,
  SONG_SUGGESTION_GROUP_STATUS_LABELS,
  songSuggestionGroupStatusClass,
  restoreBandSong,
  SONG_PARTS_LEADER_ONLY_MESSAGE,
  songTitleInitials,
  type SongListFilters,
  type SongPartFileActivity,
  type SongWithReadiness,
} from '@bandie/data';
import { useAuth } from '../../context/AuthContext';
import { AddSongDialog } from '../../components/songs/AddSongDialog';
import { BandSongPartTemplatesPanel } from '../../components/songs/BandSongPartTemplatesPanel';
import { SongsBandContextBar } from '../../components/songs/SongsBandContextBar';
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
  const canManageParts = adminModeActive || isBandLeaderRole(membership?.member_role);

  const [songs, setSongs] = useState<SongWithReadiness[]>([]);
  const [activity, setActivity] = useState<SongPartFileActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showAddSong, setShowAddSong] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [suggestionGroups, setSuggestionGroups] = useState<
    Awaited<ReturnType<typeof listBandSongSuggestionGroups>>
  >([]);
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
      const [songRows, activityRows, groupRows] = await Promise.all([
        listBandSongs(bandId, { ...filters, includeDeleted: showDeleted }),
        listRecentSongPartActivity(bandId),
        listBandSongSuggestionGroups(bandId),
      ]);
      setSongs(songRows);
      setActivity(activityRows);
      setSuggestionGroups(groupRows);
    } catch (err) {
      setSongs([]);
      setActivity([]);
      setLoadError(err instanceof Error ? err.message : 'Unable to load songs dashboard.');
    } finally {
      setLoading(false);
    }
  }, [bandId, filters, showDeleted]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  async function handleRestoreSong(songId: string) {
    if (!bandId) {
      return;
    }

    setRestoringId(songId);
    setLoadError(null);

    try {
      await restoreBandSong(bandId, songId);
      await loadDashboard();
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Unable to restore song.');
    } finally {
      setRestoringId(null);
    }
  }

  const activeSongCount = useMemo(() => songs.filter((song) => !song.is_deleted).length, [songs]);

  const metrics = useMemo(() => computeSongDashboardMetrics(songs.filter((song) => !song.is_deleted)), [songs]);
  const snapshots = useMemo(() => computeReadinessSnapshots(songs.filter((song) => !song.is_deleted)), [songs]);
  const genres = useMemo(() => collectSongGenres(songs.filter((song) => !song.is_deleted)), [songs]);
  const keys = useMemo(() => collectSongKeys(songs.filter((song) => !song.is_deleted)), [songs]);

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
      <SongsBandContextBar bandId={bandId} bandName={membership?.name} />

      <header className="songs-header">
        <div>
          <p className="my-bands-eyebrow">Songs management</p>
          <h1>Band songbook dashboard</h1>
          <p className="my-bands-lead">
            Upload, organise and prepare the working repertoire for this band.
            Track readiness, keys, parts and file activity in one secure member-only area.
          </p>
        </div>
        <div className="songs-header-actions">
          <Link to={`/app/${bandId}/songs/suggestions`} className="directory-btn directory-btn-secondary">
            Song suggestions
          </Link>
          <Link to={`/app/${bandId}`} className="directory-btn directory-btn-secondary">
            Band overview
          </Link>
          {canManageParts ? (
            <button
              type="button"
              className="directory-btn directory-btn-primary"
              onClick={() => setShowAddSong(true)}
            >
              Add song
            </button>
          ) : null}
        </div>
      </header>

      {!canManageParts ? (
        <p className="my-bands-lead songs-leader-only-note">{SONG_PARTS_LEADER_ONLY_MESSAGE}</p>
      ) : null}

      {loadError ? <div className="songs-error">{loadError}</div> : null}

      <section className="songs-metrics" aria-label="Song metrics">
        <article className="songs-metric surface-light">
          <small>Total songs</small>
          <strong>{metrics.totalSongs}</strong>
          {metrics.songsAddedThisMonth > 0 ? (
            <span>+{metrics.songsAddedThisMonth} this month</span>
          ) : (
            <span>{metrics.repertoireReadinessPercent}% avg readiness</span>
          )}
        </article>
        <article className="songs-metric surface-light">
          <small>Gig ready</small>
          <strong>{metrics.gigReadyCount}</strong>
          <span>
            {metrics.totalSongs > 0
              ? `${Math.round((metrics.gigReadyCount / metrics.totalSongs) * 100)}% repertoire`
              : 'No songs yet'}
          </span>
        </article>
        <article className="songs-metric surface-light">
          <small>Missing parts</small>
          <strong>{metrics.missingPartsCount}</strong>
          {metrics.missingPartsCount > 0 ? (
            <span className="warn">Needs attention</span>
          ) : (
            <span>All parts covered</span>
          )}
        </article>
        <article className="songs-metric surface-light">
          <small>Gig-ready duration</small>
          <strong>{snapshots.totalPlayableMinutes}m</strong>
          <span>From gig-ready songs</span>
        </article>
      </section>

      {suggestionGroups.some((group) =>
        ['open_for_suggestions', 'suggestions_closed', 'voting_closed'].includes(group.status),
      ) ? (
        <section className="panel">
          <div className="songs-side-card-header">
            <div>
              <h2>Active song suggestions</h2>
              <p>Groups where the band is suggesting and voting on new repertoire.</p>
            </div>
            <Link to={`/app/${bandId}/songs/suggestions`} className="directory-btn directory-btn-secondary">
              View all
            </Link>
          </div>
          <div className="song-suggestions-grid">
            {suggestionGroups
              .filter((group) =>
                ['open_for_suggestions', 'suggestions_closed', 'voting_closed'].includes(
                  group.status,
                ),
              )
              .slice(0, 3)
              .map((group) => (
                <Link
                  key={group.id}
                  to={`/app/${bandId}/songs/suggestions/${group.id}`}
                  className="song-suggestion-card"
                >
                  <div className="song-suggestion-card-head">
                    <div>
                      <h3>{group.name}</h3>
                      <p className="song-suggestion-meta">
                        {group.suggestion_count} suggestions · target {group.target_song_count}
                      </p>
                    </div>
                    <span className={songSuggestionGroupStatusClass(group.status)}>
                      {SONG_SUGGESTION_GROUP_STATUS_LABELS[group.status]}
                    </span>
                  </div>
                </Link>
              ))}
          </div>
        </section>
      ) : null}

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
            <label className="songs-show-deleted-checkbox">
              <input
                type="checkbox"
                checked={showDeleted}
                onChange={(event) => setShowDeleted(event.target.checked)}
              />
              Show deleted songs
            </label>
          </div>

          {loading ? (
            <p>Loading songs…</p>
          ) : activeSongCount === 0 && !showDeleted ? (
            <div className="directory-empty-state">
              <strong>No songs yet</strong>
              <p>Add your first song to start building the band repertoire and part folders.</p>
              {canManageParts ? (
                <button
                  type="button"
                  className="directory-btn directory-btn-primary"
                  onClick={() => setShowAddSong(true)}
                >
                  Add your first song
                </button>
              ) : null}
            </div>
          ) : songs.length === 0 ? (
            <div className="directory-empty-state">
              <strong>No songs yet</strong>
              <p>
                {showDeleted
                  ? 'There are no songs in this band songbook.'
                  : 'Add your first song to start building the band repertoire and part folders.'}
              </p>
              {canManageParts && !showDeleted ? (
                <button
                  type="button"
                  className="directory-btn directory-btn-primary"
                  onClick={() => setShowAddSong(true)}
                >
                  Add your first song
                </button>
              ) : null}
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
                    {showDeleted ? <th>Actions</th> : null}
                  </tr>
                </thead>
                <tbody>
                  {songs.map((song) => (
                    <tr key={song.id} className={song.is_deleted ? 'songs-table-row-deleted' : undefined}>
                      <td>
                        {song.is_deleted ? (
                          <div className="songs-table-link songs-table-link-static">
                            <span className="songs-art">{songTitleInitials(song.title)}</span>
                            <span>
                              {song.title}
                              {song.artist ? <small className="songs-artist">{song.artist}</small> : null}
                              <small className="songs-artist">Deleted</small>
                            </span>
                          </div>
                        ) : (
                          <Link className="songs-table-link" to={`/app/${bandId}/songs/${song.id}`}>
                            <span className="songs-art">{songTitleInitials(song.title)}</span>
                            <span>
                              {song.title}
                              {song.artist ? <small className="songs-artist">{song.artist}</small> : null}
                            </span>
                          </Link>
                        )}
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
                      {showDeleted ? (
                        <td>
                          {song.is_deleted && canManageParts ? (
                            <button
                              type="button"
                              className="songs-card-btn"
                              disabled={restoringId === song.id}
                              onClick={() => void handleRestoreSong(song.id)}
                            >
                              {restoringId === song.id ? 'Restoring…' : 'Restore'}
                            </button>
                          ) : (
                            '—'
                          )}
                        </td>
                      ) : null}
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

          <div className="songs-side-card surface-light">
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

      <BandSongPartTemplatesPanel bandId={bandId} canManage={canManageParts} />

      {showAddSong ? (
        <AddSongDialog
          bandId={bandId}
          canManage={canManageParts}
          onClose={() => setShowAddSong(false)}
          onCreated={() => void loadDashboard()}
        />
      ) : null}
    </div>
  );
}
