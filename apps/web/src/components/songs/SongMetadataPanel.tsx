import { formatSongDuration, formatSongReadinessStatus, type SongWithReadiness } from '@bandie/data';

type SongMetadataPanelProps = {
  song: SongWithReadiness;
  onEdit: () => void;
};

export function SongMetadataPanel({ song, onEdit }: SongMetadataPanelProps) {
  return (
    <section className="songs-side-card surface-light songs-metadata-panel">
      <div className="songs-side-card-header">
        <div>
          <h2>Song metadata</h2>
          <p>Key, duration, genre and readiness details for this song.</p>
        </div>
        <div className="songs-side-card-header-actions">
          <button
            type="button"
            className="directory-btn directory-btn-secondary songs-metadata-edit-btn"
            onClick={onEdit}
          >
            Edit
          </button>
          <span className="songs-pill green">{formatSongReadinessStatus(song.readiness_status)}</span>
        </div>
      </div>

      <div className="songs-metadata-grid">
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
          <div className="songs-list-item songs-metadata-notes">
            <div>
              <strong>Notes</strong>
              <small>{song.notes}</small>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
