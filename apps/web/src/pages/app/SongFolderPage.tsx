import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  formatSongDuration,
  formatSongReadinessStatus,
  getBandSong,
  isBandLeaderRole,
  listSongPartFolders,
  SONG_PARTS_LEADER_ONLY_MESSAGE,
  type SongPartFolderWithStats,
  type SongWithReadiness,
} from '@bandie/data';
import { useAuth } from '../../context/AuthContext';
import { AddSongPartFolderDialog } from '../../components/songs/AddSongPartFolderDialog';
import { CopySongToBandDialog } from '../../components/songs/CopySongToBandDialog';
import { EditSongDialog } from '../../components/songs/EditSongDialog';
import { SongMetadataPanel } from '../../components/songs/SongMetadataPanel';
import { SongPartFolderCards } from '../../components/songs/SongPartFolderCards';
import { SongsBandContextBar } from '../../components/songs/SongsBandContextBar';
import { HeadingWithHelp } from '../../components/ui/InfoHelp';
import '../../styles/songs.css';

export function SongFolderPage() {
  const { bandId, songId } = useParams();
  const navigate = useNavigate();
  const { bands, adminModeActive } = useAuth();
  const membership = bands.find((item) => item.id === bandId);
  const canAccessBand = Boolean(membership) || adminModeActive;
  const canManageSongParts = adminModeActive || isBandLeaderRole(membership?.member_role);

  const [song, setSong] = useState<SongWithReadiness | null>(null);
  const [partFolders, setPartFolders] = useState<SongPartFolderWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showEditSong, setShowEditSong] = useState(false);
  const [showAddFolder, setShowAddFolder] = useState(false);
  const [showCopySong, setShowCopySong] = useState(false);

  const loadSongWorkspace = useCallback(async () => {
    if (!bandId || !songId) {
      return;
    }

    setLoading(true);
    setLoadError(null);

    try {
      const [songResult, folderRows] = await Promise.all([
        getBandSong(bandId, songId),
        listSongPartFolders(bandId, songId),
      ]);

      setSong(songResult);
      setPartFolders(folderRows);
    } catch (err) {
      setSong(null);
      setPartFolders([]);
      setLoadError(err instanceof Error ? err.message : 'Unable to load song workspace.');
    } finally {
      setLoading(false);
    }
  }, [bandId, songId]);

  useEffect(() => {
    void loadSongWorkspace();
  }, [loadSongWorkspace]);

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
          <HeadingWithHelp
            as="h1"
            helpLabel="About song folder"
            help={
              <p>
                One place for the band to store music sheets, lyrics, tabs, notes and part-specific files for this song.
              </p>
            }
          >
            {song.title}
            {song.artist ? ` — ${song.artist}` : ''}
          </HeadingWithHelp>
        </div>
        <div className="songs-header-actions">
          {canManageSongParts ? (
            <button
              type="button"
              className="directory-btn directory-btn-secondary"
              onClick={() => setShowCopySong(true)}
            >
              Copy to another band
            </button>
          ) : null}
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

      <SongMetadataPanel song={song} onEdit={() => setShowEditSong(true)} />

      <details className="panel songs-part-folders-section songs-collapsible-section" open>
        <summary className="songs-collapsible-summary">
          <div className="songs-collapsible-summary-text">
            <h2>Part folders</h2>
            <p>
              {partFolders.length > 0
                ? `${partFolders.length} folder${partFolders.length === 1 ? '' : 's'} — open one to view, upload, or download files`
                : 'Open a folder to view, upload, or download files for that part'}
            </p>
          </div>
          <span className="songs-collapsible-chevron" aria-hidden="true" />
        </summary>

        <div className="songs-collapsible-body">
          {!canManageSongParts ? (
            <p className="my-bands-lead songs-leader-only-note">{SONG_PARTS_LEADER_ONLY_MESSAGE}</p>
          ) : null}

          <SongPartFolderCards bandId={bandId} songId={songId} partFolders={partFolders} />

          {canManageSongParts ? (
            <div className="songs-part-folders-actions">
              <button
                type="button"
                className="directory-btn directory-btn-primary"
                onClick={() => setShowAddFolder(true)}
              >
                Add folder
              </button>
            </div>
          ) : null}
        </div>
      </details>

      {showAddFolder ? (
        <AddSongPartFolderDialog
          bandId={bandId}
          songId={songId}
          onClose={() => setShowAddFolder(false)}
          onCreated={() => void loadSongWorkspace()}
        />
      ) : null}

      {showEditSong ? (
        <EditSongDialog
          bandId={bandId}
          song={song}
          canManage={canManageSongParts}
          onClose={() => setShowEditSong(false)}
          onSaved={() => void loadSongWorkspace()}
          onDeleted={() => navigate(`/app/${bandId}/songs`)}
        />
      ) : null}

      {showCopySong ? (
        <CopySongToBandDialog
          sourceBandId={bandId}
          sourceSongId={songId}
          sourceSongTitle={song.title}
          bands={bands}
          onClose={() => setShowCopySong(false)}
        />
      ) : null}
    </div>
  );
}
