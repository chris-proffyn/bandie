import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  canPreviewSongPartFile,
  checkBandSongPartStorageHealth,
  deleteSongPartFolder,
  downloadSongPartFile,
  formatSongPartFileStatus,
  getBandSong,
  getSongPartDisplay,
  isBandLeaderRole,
  listSongPartFiles,
  listSongPartFolders,
  updateSongPartFolder,
  type SongPartFile,
  type SongPartFolderWithStats,
  type SongWithReadiness,
} from '@bandie/data';
import { useAuth } from '../../context/AuthContext';
import { SongPartFileViewerModal } from '../../components/songs/SongPartFileViewerModal';
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

export function SongPartFolderPage() {
  const { bandId, songId, partFolderId } = useParams();
  const navigate = useNavigate();
  const { bands, adminModeActive } = useAuth();
  const membership = bands.find((item) => item.id === bandId);
  const canAccessBand = Boolean(membership) || adminModeActive;
  const canManageSongParts = adminModeActive || isBandLeaderRole(membership?.member_role);

  const [song, setSong] = useState<SongWithReadiness | null>(null);
  const [partFolder, setPartFolder] = useState<SongPartFolderWithStats | null>(null);
  const [files, setFiles] = useState<SongPartFile[]>([]);
  const [storageActive, setStorageActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [viewerFile, setViewerFile] = useState<SongPartFile | null>(null);
  const [folderActionId, setFolderActionId] = useState<string | null>(null);

  const partLabel = partFolder?.part_label ?? 'Part';
  const partDisplay = useMemo(
    () => getSongPartDisplay(partFolder?.part_key ?? '', partLabel),
    [partFolder?.part_key, partLabel],
  );

  const loadFolderWorkspace = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!bandId || !songId || !partFolderId) {
        return;
      }

      if (!options?.silent) {
        setLoading(true);
      }
      setLoadError(null);

      try {
        const [songResult, folderRows, fileRows, health] = await Promise.all([
          getBandSong(bandId, songId),
          listSongPartFolders(bandId, songId),
          listSongPartFiles(bandId, songId),
          checkBandSongPartStorageHealth(bandId).catch(() => ({ status: 'not_configured' as const })),
        ]);

        const folder = folderRows.find((row) => row.id === partFolderId) ?? null;
        setSong(songResult);
        setPartFolder(folder);
        setFiles(fileRows.filter((file) => file.song_part_folder_id === partFolderId));
        setStorageActive(health.status === 'active');
      } catch (err) {
        setSong(null);
        setPartFolder(null);
        setFiles([]);
        setLoadError(err instanceof Error ? err.message : 'Unable to load part folder.');
      } finally {
        if (!options?.silent) {
          setLoading(false);
        }
      }
    },
    [bandId, songId, partFolderId],
  );

  useEffect(() => {
    void loadFolderWorkspace();
  }, [loadFolderWorkspace]);

  async function handleDownload(file: SongPartFile) {
    if (!bandId) {
      return;
    }

    setActionId(file.id);
    setActionError(null);

    try {
      await downloadSongPartFile(bandId, file.id, file.display_name);
      await loadFolderWorkspace({ silent: true });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to download file.');
    } finally {
      setActionId(null);
    }
  }

  async function handleToggleRequired() {
    if (!bandId || !songId || !partFolder) {
      return;
    }

    setFolderActionId(partFolder.id);
    setActionError(null);

    try {
      await updateSongPartFolder(bandId, songId, partFolder.id, {
        requiredForReadiness: !partFolder.required_for_readiness,
      });
      await loadFolderWorkspace({ silent: true });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to update part folder.');
    } finally {
      setFolderActionId(null);
    }
  }

  async function handleDeleteFolder() {
    if (!bandId || !songId || !partFolder) {
      return;
    }

    if (
      !window.confirm(
        `Remove the "${partFolder.part_label}" folder from this song? Files must be removed first.`,
      )
    ) {
      return;
    }

    setFolderActionId(partFolder.id);
    setActionError(null);

    try {
      await deleteSongPartFolder(bandId, songId, partFolder.id);
      navigate(`/app/${bandId}/songs/${songId}`, { replace: true });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to delete part folder.');
      setFolderActionId(null);
    }
  }

  if (!bandId || !songId || !partFolderId) {
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

  if (loading && !viewerFile) {
    return (
      <div className="songs-page">
        <div className="panel">
          <p>Loading part folder…</p>
        </div>
      </div>
    );
  }

  if (!song || !partFolder) {
    return (
      <div className="songs-page">
        <div className="panel">
          <p>{loadError ?? 'Part folder not found.'}</p>
          <Link to={`/app/${bandId}/songs/${songId}`} className="directory-btn directory-btn-secondary">
            Back to song
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
          <p className="my-bands-eyebrow">
            <Link to={`/app/${bandId}/songs/${songId}`} className="songs-breadcrumb-link">
              {song.title}
            </Link>
            {' / '}
            {partDisplay.partLabel}
          </p>
          <h1>
            <span className="songs-folder-page-icon" aria-hidden="true">
              {partDisplay.icon}
            </span>
            {partDisplay.partLabel}
          </h1>
          <p className="my-bands-lead">{partDisplay.description}</p>
        </div>
        <div className="songs-header-actions">
          {canManageSongParts ? (
            <>
              <button
                type="button"
                className="directory-btn directory-btn-secondary"
                disabled={folderActionId === partFolder.id}
                onClick={() => void handleToggleRequired()}
              >
                {partFolder.required_for_readiness ? 'Mark optional' : 'Mark required'}
              </button>
              <button
                type="button"
                className="directory-btn directory-btn-secondary"
                disabled={folderActionId === partFolder.id}
                onClick={() => void handleDeleteFolder()}
              >
                Remove folder
              </button>
            </>
          ) : null}
          <Link to={`/app/${bandId}/songs/${songId}`} className="directory-btn directory-btn-secondary">
            Back to song
          </Link>
        </div>
      </header>

      {loadError ? <div className="songs-error">{loadError}</div> : null}
      {actionError ? <div className="songs-error">{actionError}</div> : null}

      <section className="songs-content-grid songs-part-folder-layout">
        <div className="songs-side-card surface-light songs-part-files-card">
          <div className="songs-side-card-header">
            <div>
              <h2>Files</h2>
              <p>View PDFs in Bandie or download any file — no Dropbox account needed.</p>
            </div>
            <span
              className={
                partFolder.hasCurrentFile
                  ? 'songs-pill green'
                  : partFolder.required_for_readiness
                    ? 'songs-pill amber'
                    : 'songs-pill blue'
              }
            >
              {partFolder.hasCurrentFile
                ? `${partFolder.currentFileCount} file${partFolder.currentFileCount === 1 ? '' : 's'}`
                : partFolder.required_for_readiness
                  ? 'Needs upload'
                  : 'Optional'}
            </span>
          </div>

          {files.length === 0 ? (
            <p className="songs-part-files-empty">
              No files in this folder yet.
              {canManageSongParts
                ? ' Use the upload panel to add a chart, lyric sheet, or other part file.'
                : ' Ask your band leader to upload files for this part.'}
            </p>
          ) : (
            <ul className="songs-part-file-list">
              {files.map((file) => (
                <li key={file.id} className="songs-part-file-item">
                  <div className="songs-part-file-main">
                    <span className="songs-file-icon">{fileTypeLabel(file)}</span>
                    <div className="songs-part-file-copy">
                      <strong>{file.display_name}</strong>
                      <small>
                        {new Date(file.created_at).toLocaleDateString(undefined, {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </small>
                    </div>
                  </div>
                  <div className="songs-part-file-meta">
                    <span className={`songs-pill ${file.status === 'current' ? 'green' : 'amber'}`}>
                      {formatSongPartFileStatus(file.status)}
                    </span>
                    <div className="songs-part-file-actions">
                      {canPreviewSongPartFile(file) ? (
                        <button
                          type="button"
                          className="directory-btn directory-btn-secondary songs-part-file-action-btn"
                          disabled={file.status === 'unavailable'}
                          onClick={() => setViewerFile(file)}
                        >
                          View
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className="directory-btn directory-btn-secondary songs-part-file-action-btn"
                        disabled={actionId === file.id || file.status === 'unavailable'}
                        onClick={() => void handleDownload(file)}
                      >
                        Download
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <aside className="songs-side-stack songs-part-folder-aside">
          <SongPartUploadPanel
            bandId={bandId}
            songId={songId}
            partFolderId={partFolder.id}
            storageActive={storageActive}
            canManage={canManageSongParts}
            onUploaded={() => void loadFolderWorkspace({ silent: true })}
          />
        </aside>
      </section>

      {viewerFile ? (
        <SongPartFileViewerModal
          bandId={bandId}
          fileId={viewerFile.id}
          displayName={viewerFile.display_name}
          partLabel={partLabel}
          onClose={() => {
            setViewerFile(null);
            void loadFolderWorkspace({ silent: true });
          }}
        />
      ) : null}
    </div>
  );
}
