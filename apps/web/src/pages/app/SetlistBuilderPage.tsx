import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  SETLIST_STATUS_OPTIONS,
  SETLIST_VIBE_PRESETS,
  SETLIST_LEADER_ONLY_MESSAGE,
  addSetlistItem,
  archiveBandSetlist,
  duplicateBandSetlist,
  formatSetlistDuration,
  formatSetlistSongMeta,
  formatSetlistStatus,
  formatSongDuration,
  formatSongReadinessLabel,
  getBandSetlist,
  isBandLeaderRole,
  listBandSongs,
  removeSetlistItem,
  reorderSetlistItems,
  setlistStatusPillClass,
  suggestSetlistStatus,
  updateBandSetlist,
  updateSetlistItemNotes,
  songTitleInitials,
  type SetlistItemWithSong,
  type SetlistStatus,
  type SetlistWithDetails,
  type SongWithReadiness,
} from '@bandie/data';
import { useAuth } from '../../context/AuthContext';
import { SongsBandContextBar } from '../../components/songs/SongsBandContextBar';
import '../../styles/setlists.css';

type SongPickerFilter = 'all' | 'gig_ready' | 'needs_rehearsal';

function isSongGigReady(song: SongWithReadiness): boolean {
  return song.readiness_status === 'ready' || song.readinessPercent >= 100;
}

export function SetlistBuilderPage() {
  const { bandId, setlistId } = useParams();
  const navigate = useNavigate();
  const { bands, adminModeActive } = useAuth();
  const membership = bands.find((item) => item.id === bandId);
  const canAccessBand = Boolean(membership) || adminModeActive;
  const canManage = adminModeActive || isBandLeaderRole(membership?.member_role);

  const [setlist, setSetlist] = useState<SetlistWithDetails | null>(null);
  const [availableSongs, setAvailableSongs] = useState<SongWithReadiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [search, setSearch] = useState('');
  const [songFilter, setSongFilter] = useState<SongPickerFilter>('all');
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [vibe, setVibe] = useState('');
  const [status, setStatus] = useState<SetlistStatus>('draft');
  const [notes, setNotes] = useState('');

  const loadBuilder = useCallback(async () => {
    if (!bandId || !setlistId) {
      return;
    }

    setLoading(true);
    setLoadError(null);

    try {
      const [setlistRow, songs] = await Promise.all([
        getBandSetlist(bandId, setlistId),
        listBandSongs(bandId, { sort: 'title' }),
      ]);

      if (!setlistRow) {
        setSetlist(null);
        setLoadError('Setlist not found.');
        return;
      }

      setSetlist(setlistRow);
      setTitle(setlistRow.title);
      setDescription(setlistRow.description ?? '');
      setVibe(setlistRow.vibe ?? '');
      setStatus(setlistRow.status);
      setNotes(setlistRow.notes ?? '');
      setAvailableSongs(songs.filter((song) => !song.is_deleted));
    } catch (err) {
      setSetlist(null);
      setLoadError(err instanceof Error ? err.message : 'Unable to load setlist builder.');
    } finally {
      setLoading(false);
    }
  }, [bandId, setlistId]);

  useEffect(() => {
    void loadBuilder();
  }, [loadBuilder]);

  const setlistSongIds = useMemo(
    () => new Set((setlist?.items ?? []).map((item) => item.song_id)),
    [setlist?.items],
  );

  const pickerSongs = useMemo(() => {
    let rows = availableSongs.filter((song) => !setlistSongIds.has(song.id));
    const query = search.trim().toLowerCase();

    if (query) {
      rows = rows.filter((song) => {
        const haystack = [song.title, song.artist, song.genre, song.notes]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return haystack.includes(query);
      });
    }

    if (songFilter === 'gig_ready') {
      rows = rows.filter(isSongGigReady);
    } else if (songFilter === 'needs_rehearsal') {
      rows = rows.filter((song) => !isSongGigReady(song));
    }

    return rows;
  }, [availableSongs, search, setlistSongIds, songFilter]);

  const suggestedStatus = useMemo(() => {
    if (!setlist) {
      return 'draft' as SetlistStatus;
    }
    return suggestSetlistStatus(setlist.metrics, status);
  }, [setlist, status]);

  async function handleAddSong(songId: string) {
    if (!bandId || !setlistId || !canManage) {
      return;
    }

    setActionError(null);
    try {
      await addSetlistItem(bandId, setlistId, songId);
      await loadBuilder();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to add song.');
    }
  }

  async function handleRemoveItem(itemId: string) {
    if (!bandId || !setlistId || !canManage) {
      return;
    }

    setActionError(null);
    try {
      await removeSetlistItem(bandId, setlistId, itemId);
      await loadBuilder();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to remove song.');
    }
  }

  async function handleItemNotesChange(itemId: string, value: string) {
    if (!bandId || !setlistId || !canManage || !setlist) {
      return;
    }

    setSetlist({
      ...setlist,
      items: setlist.items.map((item) =>
        item.id === itemId ? { ...item, notes: value || null } : item,
      ),
    });
  }

  async function handleItemNotesBlur(itemId: string, value: string) {
    if (!bandId || !setlistId || !canManage) {
      return;
    }

    try {
      await updateSetlistItemNotes(bandId, setlistId, itemId, value || null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to save song note.');
      await loadBuilder();
    }
  }

  async function persistOrder(items: SetlistItemWithSong[]) {
    if (!bandId || !setlistId || !canManage) {
      return;
    }

    const orderedIds = items.map((item) => item.id);
    await reorderSetlistItems(bandId, setlistId, orderedIds);
    await loadBuilder();
  }

  function moveItem(itemId: string, direction: -1 | 1) {
    if (!setlist) {
      return;
    }

    const index = setlist.items.findIndex((item) => item.id === itemId);
    if (index < 0) {
      return;
    }

    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= setlist.items.length) {
      return;
    }

    const nextItems = [...setlist.items];
    const [moved] = nextItems.splice(index, 1);
    nextItems.splice(targetIndex, 0, moved);
    setSetlist({ ...setlist, items: nextItems });
    void persistOrder(nextItems).catch((err) => {
      setActionError(err instanceof Error ? err.message : 'Unable to reorder setlist.');
    });
  }

  function handleDragStart(itemId: string) {
    if (!canManage) {
      return;
    }
    setDraggingItemId(itemId);
  }

  function handleDragOver(event: React.DragEvent, targetItemId: string) {
    if (!canManage || !setlist || !draggingItemId || draggingItemId === targetItemId) {
      return;
    }

    event.preventDefault();
    const dragIndex = setlist.items.findIndex((item) => item.id === draggingItemId);
    const targetIndex = setlist.items.findIndex((item) => item.id === targetItemId);
    if (dragIndex < 0 || targetIndex < 0 || dragIndex === targetIndex) {
      return;
    }

    const nextItems = [...setlist.items];
    const [moved] = nextItems.splice(dragIndex, 1);
    nextItems.splice(targetIndex, 0, moved);
    setSetlist({ ...setlist, items: nextItems });
  }

  async function handleDragEnd() {
    if (!setlist || !draggingItemId || !canManage) {
      setDraggingItemId(null);
      return;
    }

    const itemIds = setlist.items.map((item) => item.id);
    setDraggingItemId(null);

    try {
      if (bandId && setlistId) {
        await reorderSetlistItems(bandId, setlistId, itemIds);
        await loadBuilder();
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to reorder setlist.');
      await loadBuilder();
    }
  }

  async function handleSaveDetails(event: React.FormEvent) {
    event.preventDefault();
    if (!bandId || !setlistId || !canManage) {
      return;
    }

    setSaving(true);
    setActionError(null);

    try {
      await updateBandSetlist(bandId, setlistId, {
        title,
        description: description || null,
        vibe: vibe || null,
        status,
        notes: notes || null,
      });
      await loadBuilder();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to save setlist.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDuplicate() {
    if (!bandId || !setlistId || !canManage) {
      return;
    }

    setDuplicating(true);
    setActionError(null);

    try {
      const duplicate = await duplicateBandSetlist(bandId, setlistId);
      navigate(`/app/${bandId}/setlists/${duplicate.id}`);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to duplicate setlist.');
    } finally {
      setDuplicating(false);
    }
  }

  async function handleArchive() {
    if (!bandId || !setlistId || !canManage) {
      return;
    }

    if (!window.confirm('Archive this setlist? You can show archived sets from the library filters.')) {
      return;
    }

    setActionError(null);
    try {
      await archiveBandSetlist(bandId, setlistId);
      navigate(`/app/${bandId}/setlists`);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to archive setlist.');
    }
  }

  if (!bandId || !setlistId) {
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
          <p className="my-bands-eyebrow">Setlist builder</p>
          <h1>{setlist?.title ?? 'Setlist'}</h1>
          <p className="my-bands-lead">
            Drag songs into a running order, add per-song notes, and track live duration and readiness.
          </p>
        </div>
        <div className="setlists-header-actions">
          <Link to={`/app/${bandId}/setlists`} className="directory-btn directory-btn-secondary">
            Back to library
          </Link>
          {canManage ? (
            <>
              <button
                type="button"
                className="directory-btn directory-btn-secondary"
                disabled={duplicating}
                onClick={() => void handleDuplicate()}
              >
                {duplicating ? 'Duplicating…' : 'Duplicate'}
              </button>
              <button
                type="button"
                className="directory-btn directory-btn-secondary"
                onClick={() => void handleArchive()}
              >
                Archive
              </button>
            </>
          ) : null}
        </div>
      </header>

      {!canManage ? (
        <p className="my-bands-lead setlists-leader-only-note">{SETLIST_LEADER_ONLY_MESSAGE}</p>
      ) : null}

      {loadError ? <div className="setlists-error">{loadError}</div> : null}
      {actionError ? <div className="setlists-error">{actionError}</div> : null}

      {loading ? (
        <p>Loading setlist builder…</p>
      ) : !setlist ? null : (
        <>
          <section className="setlists-metrics" aria-label="Live setlist metrics">
            <article className="setlists-metric surface-light">
              <small>Songs</small>
              <strong>{setlist.metrics.songCount}</strong>
              <span>In running order</span>
            </article>
            <article className="setlists-metric surface-light">
              <small>Total duration</small>
              <strong>{formatSetlistDuration(setlist.metrics.totalDurationSeconds)}</strong>
              <span>{formatSongDuration(setlist.metrics.totalDurationSeconds)}</span>
            </article>
            <article className="setlists-metric surface-light">
              <small>Readiness</small>
              <strong>{setlist.metrics.readinessPercent}%</strong>
              <span>
                {setlist.metrics.notGigReadyCount > 0
                  ? `${setlist.metrics.notGigReadyCount} need rehearsal`
                  : 'All gig ready'}
              </span>
            </article>
            <article className="setlists-metric surface-light">
              <small>Suggested status</small>
              <strong>{formatSetlistStatus(suggestedStatus)}</strong>
              <span className={setlistStatusPillClass(suggestedStatus)}>
                {formatSetlistStatus(status)}
              </span>
            </article>
          </section>

          <section className="setlists-light-panel surface-light setlists-builder-panel">
            <div className="setlists-side-card-header">
              <div>
                <h2>Setlist builder</h2>
                <p>Add songs from the repertoire and reorder the running order.</p>
              </div>
              {canManage ? (
                <button
                  type="submit"
                  form="setlist-details-form"
                  className="directory-btn directory-btn-primary"
                  disabled={saving}
                >
                  {saving ? 'Saving…' : 'Save details'}
                </button>
              ) : null}
            </div>

            <div className="setlists-builder">
              <div className="setlists-builder-column">
                <h3>Available songs</h3>
                <div className="setlists-picker-filters">
                  <input
                    placeholder="Search repertoire"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                  <select
                    value={songFilter}
                    onChange={(event) => setSongFilter(event.target.value as SongPickerFilter)}
                  >
                    <option value="all">All songs</option>
                    <option value="gig_ready">Gig ready only</option>
                    <option value="needs_rehearsal">Needs rehearsal</option>
                  </select>
                </div>

                <div className="setlists-picker-list">
                  {pickerSongs.length === 0 ? (
                    <p>No matching songs to add.</p>
                  ) : (
                    pickerSongs.map((song) => (
                      <div key={song.id} className="setlists-picker-item">
                        <div>
                          <strong>{song.title}</strong>
                          <small>{formatSetlistSongMeta(song)}</small>
                        </div>
                        {canManage ? (
                          <button
                            type="button"
                            className="setlists-card-btn"
                            onClick={() => void handleAddSong(song.id)}
                          >
                            Add
                          </button>
                        ) : null}
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="setlists-builder-column">
                <h3>Current running order</h3>
                <div className="setlists-stat-strip">
                  <div className="setlists-stat">
                    <small>Songs</small>
                    <strong>{setlist.metrics.songCount}</strong>
                  </div>
                  <div className="setlists-stat">
                    <small>Total</small>
                    <strong>{formatSetlistDuration(setlist.metrics.totalDurationSeconds)}</strong>
                  </div>
                  <div className="setlists-stat">
                    <small>Readiness</small>
                    <strong>{setlist.metrics.readinessPercent}%</strong>
                  </div>
                </div>

                <div className="setlists-song-stack setlists-running-order">
                  {setlist.items.length === 0 ? (
                    <div className="setlists-stack-row">
                      <strong>No songs in this set yet</strong>
                      <span>Add from the left</span>
                    </div>
                  ) : (
                    setlist.items.map((item, index) => (
                      <div
                        key={item.id}
                        className={`setlists-stack-row setlists-running-row${draggingItemId === item.id ? ' dragging' : ''}`}
                        draggable={canManage}
                        onDragStart={() => handleDragStart(item.id)}
                        onDragOver={(event) => handleDragOver(event, item.id)}
                        onDragEnd={() => void handleDragEnd()}
                      >
                        <div className="setlists-running-main">
                          <span className="setlists-drag-handle" aria-hidden="true">
                            ☰
                          </span>
                          <span className="songs-art">{songTitleInitials(item.song?.title ?? '?')}</span>
                          <div>
                            <strong>
                              {index + 1}. {item.song?.title ?? 'Missing song'}
                            </strong>
                            <small>
                              {item.song ? formatSetlistSongMeta(item.song) : 'Song removed from songbook'}
                            </small>
                            {canManage ? (
                              <input
                                className="setlists-item-notes"
                                placeholder="Per-song note (e.g. open high energy)"
                                value={item.notes ?? ''}
                                onChange={(event) =>
                                  void handleItemNotesChange(item.id, event.target.value)
                                }
                                onBlur={(event) =>
                                  void handleItemNotesBlur(item.id, event.target.value)
                                }
                              />
                            ) : item.notes ? (
                              <small className="setlists-item-notes-readonly">{item.notes}</small>
                            ) : null}
                          </div>
                        </div>
                        <div className="setlists-running-actions">
                          {item.song && !isSongGigReady(item.song) ? (
                            <span className="setlists-pill amber">
                              {formatSongReadinessLabel(
                                item.song.readiness_status,
                                item.song.readinessPercent,
                              )}
                            </span>
                          ) : (
                            <span className="setlists-pill green">Gig ready</span>
                          )}
                          {canManage ? (
                            <>
                              <button
                                type="button"
                                className="setlists-icon-btn"
                                aria-label="Move up"
                                disabled={index === 0}
                                onClick={() => moveItem(item.id, -1)}
                              >
                                ↑
                              </button>
                              <button
                                type="button"
                                className="setlists-icon-btn"
                                aria-label="Move down"
                                disabled={index === setlist.items.length - 1}
                                onClick={() => moveItem(item.id, 1)}
                              >
                                ↓
                              </button>
                              <button
                                type="button"
                                className="setlists-card-btn"
                                onClick={() => void handleRemoveItem(item.id)}
                              >
                                Remove
                              </button>
                            </>
                          ) : null}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="setlists-light-panel surface-light setlists-details-panel">
            <h2>Setlist details</h2>
            <form id="setlist-details-form" className="setlists-form setlists-details-form" onSubmit={handleSaveDetails}>
              <label>
                Title
                <input value={title} onChange={(event) => setTitle(event.target.value)} disabled={!canManage} />
              </label>
              <label>
                Description
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  disabled={!canManage}
                />
              </label>
              <label>
                Vibe
                <input
                  value={vibe}
                  onChange={(event) => setVibe(event.target.value)}
                  list="setlist-builder-vibe-presets"
                  disabled={!canManage}
                />
                <datalist id="setlist-builder-vibe-presets">
                  {SETLIST_VIBE_PRESETS.map((preset) => (
                    <option key={preset} value={preset} />
                  ))}
                </datalist>
              </label>
              <label>
                Status
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value as SetlistStatus)}
                  disabled={!canManage}
                >
                  {SETLIST_STATUS_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {formatSetlistStatus(option)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="setlists-details-notes">
                Notes
                <textarea value={notes} onChange={(event) => setNotes(event.target.value)} disabled={!canManage} />
              </label>
            </form>
          </section>
        </>
      )}
    </div>
  );
}
