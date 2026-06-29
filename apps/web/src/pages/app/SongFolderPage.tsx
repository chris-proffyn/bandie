import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  checkBandSongPartStorageHealth,
  downloadSongPartFile,
  formatSongDuration,
  formatSongPartFileStatus,
  formatSongReadinessStatus,
  getBandSong,
  getSongPartDisplay,
  getSongPartFilePreviewUrl,
  listSongPartFiles,
  listSongPartFolders,
  type SongPartFile,
  type SongPartFolderWithStats,
  type SongWithReadiness,
} from '@bandie/data';
import { useAuth } from '../../context/AuthContext';
import { SongPartFoldersEditor } from '../../components/songs/SongPartFoldersEditor';
import { EditSongDialog } from '../../components/songs/EditSongDialog';
import { SongPartUploadPanel } from '../../components/songs/SongPartUploadPanel';
import { SongsBandContextBar } from '../../components/songs/SongsBandContextBar';
import '../../styles/songs.css';

function fileTypeLabel(file: SongPartFile): string {
  const name = file.display_name.toLowerCase();
  if (name.endsWith('.pdf')) return 'PDF';
  if (name.match(/\.(gp|gp3|gp4|gp5|gpx)$/)) return 'GP';
  if (name.match(/\.(mp3|wav|m4a)$/)) return 'AUD';
  if (name.match(/\.(png|jpg|jpeg|gif|webp)$/)) return 'IMG';
  return 'FILE';
}

export function SongFolderPage() {
  const { bandId, songId } = useParams();
  const { bands, adminModeActive } = useAuth();
  const membership = bands.find((item) => item.id === bandId);
  const canAccessBand = Boolean(membership) || adminModeActive;

  const [song, setSong] = useState<SongWithReadiness | null>(null);
  const [partFolders, setPartFolders] = useState<SongPartFolderWithStats[]>([]);
  const [files, setFiles] = useState<SongPartFile[]>([]);
  const [storageActive, setStorageActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [showEditSong, setShowEditSong] = useState(false);

  const folderLabelById = useMemo(() => {
    const map = new Map<string, string>();
    for (const folder of partFolders) {
      map.set(folder.id, folder.part_label);
    }
    return map;
  }, [partFolders]);

  const loadSongWorkspace = useCallback(async () => {
    if (!bandId || !songId) {
      return;
    }

    setLoading(true);
    setLoadError(null);

    try {
      const [songResult, folderRows, fileRows, health] = await Promise.all([
        getBandSong(bandId, songId),
        listSongPartFolders(bandId, songId),
        listSongPartFiles(bandId, songId),
        checkBandSongPartStorageHealth(bandId).catch(() => ({ status: 'not_configured' as const })),
      ]);

      setSong(songResult);
      setPartFolders(folderRows);
      setFiles(fileRows);
      setStorageActive(health.status === 'active');
    } catch (err) {
      setSong(null);
      setPartFolders([]);
      setFiles([]);
      setLoadError(err instanceof Error ? err.message : 'Unable to load song workspace.');
    } finally {
      setLoading(false);
    }
  }, [bandId, songId]);

  useEffect(() => {
    void loadSongWorkspace();
  }, [loadSongWorkspace]);

  async function handlePreview(file: SongPartFile) {
    if (!bandId) {
      return;
    }

    setActionId(file.id);
    setActionError(null);

    try {
      const preview = await getSongPartFilePreviewUrl(bandId, file.id);
      window.open(preview.previewUrl, '_blank', 'noopener,noreferrer');
      await loadSongWorkspace();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to preview file.');
    } finally {
      setActionId(null);
    }
  }

  async function handleDownload(file: SongPartFile) {
    if (!bandId) {
      return;
    }

    setActionId(file.id);
    setActionError(null);

    try {
      await downloadSongPartFile(bandId, file.id, file.display_name);
      await loadSongWorkspace();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to download file.');
    } finally {
      setActionId(null);
    }
  }

  if (!bandId || !songId) {
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

  if (loading) {
    return (
      <div className="songs-page">
        <div className="panel">
          <p>Loading song workspace…</p>
        </div>
      </div>
    );
  }

  if (!song) {
    return (
      <div className="songs-page">
        <div className="panel">
          <p>{loadError ?? 'Song not found.'}</p>
          <Link to={`/app/${bandId}/songs`} className="directory-btn directory-btn-secondary">
            Back to songs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="songs-page">
      <SongsBandContextBar bandId={bandId} bandName={membership?.name} />

      <header className="songs-header">
        <div>
          <p className="my-bands-eyebrow">Song folder</p>
          <h1>
            {song.title}
            {song.artist ? ` — ${song.artist}` : ''}
          </h1>
          <p className="my-bands-lead">
            One place for the band to store music sheets, lyrics, tabs, notes and part-specific files for this song.
          </p>
        </div>
        <div className="songs-header-actions">
          <button
            type="button"
            className="directory-btn directory-btn-secondary"
            onClick={() => setShowEditSong(true)}
          >
            Edit details
          </button>
          <Link to={`/app/${bandId}/songs`} className="directory-btn directory-btn-secondary">
            Back to songs
          </Link>
        </div>
      </header>

      {loadError ? <div className="songs-error">{loadError}</div> : null}
      {actionError ? <div className="songs-error">{actionError}</div> : null}

      <section className="songs-metrics" aria-label="Song metrics">
        <article className="songs-metric surface-light">
          <small>Gig readiness</small>
          <strong>{song.readinessPercent}%</strong>
          <span>{formatSongReadinessStatus(song.readiness_status)}</span>
        </article>
        <article className="songs-metric surface-light">
          <small>Times played</small>
          <strong>{song.times_played}</strong>
          <span>Band history</span>
        </article>
        <article className="songs-metric surface-light">
          <small>Song length</small>
          <strong>{formatSongDuration(song.duration_seconds)}</strong>
          <span>Setlist safe</span>
        </article>
        <article className="songs-metric surface-light">
          <small>Current key</small>
          <strong>{song.song_key ?? '—'}</strong>
          <span>Arrangement key</span>
        </article>
      </section>

      <section className="songs-content-grid">
        <div className="panel">
          <div className="songs-side-card-header">
            <div>
              <h2>Part folders</h2>
              <p>Each member can upload files for their part. Required parts count toward gig readiness.</p>
            </div>
          </div>
          <SongPartFoldersEditor
            bandId={bandId}
            songId={songId}
            partFolders={partFolders}
            canManage={canAccessBand}
            onChanged={() => void loadSongWorkspace()}
          />
        </div>

        <aside className="songs-side-stack">
          <div className="songs-side-card dark">
            <div className="songs-side-card-header">
              <h2>Song metadata</h2>
              <div className="songs-side-card-header-actions">
                <button
                  type="button"
                  className="directory-btn directory-btn-secondary songs-metadata-edit-btn"
                  onClick={() => setShowEditSong(true)}
                >
                  Edit
                </button>
                <span className="songs-pill green">{formatSongReadinessStatus(song.readiness_status)}</span>
              </div>
            </div>
            <div className="songs-list-item">
              <div>
                <strong>Key</strong>
                <small>{song.song_key ?? 'Not set'}</small>
              </div>
            </div>
            <div className="songs-list-item">
              <div>
                <strong>Duration</strong>
                <small>{formatSongDuration(song.duration_seconds)}</small>
              </div>
            </div>
            <div className="songs-list-item">
              <div>
                <strong>Genre</strong>
                <small>{song.genre ?? 'Not set'}</small>
              </div>
            </div>
            <div className="songs-list-item">
              <div>
                <strong>Parts complete</strong>
                <small>
                  {song.partsRequired > 0
                    ? `${song.partsComplete} of ${song.partsRequired} required parts have a current file`
                    : 'No required parts configured'}
                </small>
              </div>
            </div>
            {song.notes ? (
              <div className="songs-list-item">
                <div>
                  <strong>Notes</strong>
                  <small>{song.notes}</small>
                </div>
              </div>
            ) : null}
          </div>

          <SongPartUploadPanel
            bandId={bandId}
            songId={songId}
            partFolders={partFolders}
            storageActive={storageActive}
            onUploaded={() => void loadSongWorkspace()}
          />
        </aside>
      </section>

      <section className="panel" style={{ marginTop: '1rem' }}>
        <div className="songs-side-card-header">
          <div>
            <h2>Files in this song</h2>
            <p>Grouped by part. Preview or download through Bandie — no Dropbox account needed.</p>
          </div>
        </div>

        {files.length === 0 ? (
          <p>No files uploaded yet. Connect Dropbox and upload your first part file above.</p>
        ) : (
          files.map((file) => {
            const partLabel = folderLabelById.get(file.song_part_folder_id) ?? 'Part';
            const folder = partFolders.find((item) => item.id === file.song_part_folder_id);
            const display = getSongPartDisplay(folder?.part_key ?? '', partLabel);

            return (
              <div key={file.id} className="songs-file-row">
                <div className="songs-table-link">
                  <span className="songs-file-icon">{fileTypeLabel(file)}</span>
                  <div>
                    {file.display_name}
                    <small className="songs-artist">
                      {display.icon} {partLabel}
                    </small>
                  </div>
                </div>
                <span className="songs-hide-sm">{file.added_by_user_id ? 'Member' : '—'}</span>
                <span className="songs-hide-sm">
                  {new Date(file.created_at).toLocaleDateString(undefined, {
                    day: 'numeric',
                    month: 'short',
                  })}
                </span>
                <span className={`songs-pill ${file.status === 'current' ? 'green' : 'amber'}`}>
                  {formatSongPartFileStatus(file.status)}
                </span>
                <div style={{ display: 'flex', gap: '0.45rem' }}>
                  <button
                    type="button"
                    className="directory-btn directory-btn-secondary"
                    disabled={actionId === file.id || file.status === 'unavailable'}
                    onClick={() => void handlePreview(file)}
                  >
                    View
                  </button>
                  <button
                    type="button"
                    className="directory-btn directory-btn-secondary"
                    disabled={actionId === file.id || file.status === 'unavailable'}
                    onClick={() => void handleDownload(file)}
                  >
                    Download
                  </button>
                </div>
              </div>
            );
          })
        )}
      </section>

      {showEditSong ? (
        <EditSongDialog
          bandId={bandId}
          song={song}
          onClose={() => setShowEditSong(false)}
          onSaved={() => void loadSongWorkspace()}
        />
      ) : null}
    </div>
  );
}
