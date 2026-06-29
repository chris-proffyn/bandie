import { useState } from 'react';
import {
  createSongPartFolder,
  deleteSongPartFolder,
  getSongPartDisplay,
  updateSongPartFolder,
  type SongPartFolderWithStats,
} from '@bandie/data';

type SongPartFoldersEditorProps = {
  bandId: string;
  songId: string;
  partFolders: SongPartFolderWithStats[];
  canManage: boolean;
  onChanged: () => void;
};

export function SongPartFoldersEditor({
  bandId,
  songId,
  partFolders,
  canManage,
  onChanged,
}: SongPartFoldersEditorProps) {
  const [newLabel, setNewLabel] = useState('');
  const [newRequired, setNewRequired] = useState(true);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAddPart(event: React.FormEvent) {
    event.preventDefault();
    if (!newLabel.trim()) {
      return;
    }

    setSubmittingId('new');
    setError(null);

    try {
      await createSongPartFolder({
        bandId,
        songId,
        partLabel: newLabel.trim(),
        requiredForReadiness: newRequired,
      });
      setNewLabel('');
      setNewRequired(true);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to add part folder.');
    } finally {
      setSubmittingId(null);
    }
  }

  async function handleToggleRequired(folder: SongPartFolderWithStats) {
    setSubmittingId(folder.id);
    setError(null);

    try {
      await updateSongPartFolder(bandId, songId, folder.id, {
        requiredForReadiness: !folder.required_for_readiness,
      });
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update part folder.');
    } finally {
      setSubmittingId(null);
    }
  }

  async function handleDelete(folder: SongPartFolderWithStats) {
    if (
      !window.confirm(
        `Remove the "${folder.part_label}" folder from this song? Files must be removed first.`,
      )
    ) {
      return;
    }

    setSubmittingId(folder.id);
    setError(null);

    try {
      await deleteSongPartFolder(bandId, songId, folder.id);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete part folder.');
    } finally {
      setSubmittingId(null);
    }
  }

  return (
    <div className="songs-part-folders-editor">
      {error ? <div className="songs-error">{error}</div> : null}

      <div className="songs-folder-grid">
        {partFolders.map((folder) => {
          const display = getSongPartDisplay(folder.part_key, folder.part_label);
          const pillClass = folder.hasCurrentFile
            ? 'songs-pill green'
            : folder.required_for_readiness
              ? 'songs-pill amber'
              : 'songs-pill blue';

          return (
            <article key={folder.id} className="songs-folder-card surface-light">
              <div className="songs-folder-icon">{display.icon}</div>
              <h3>{display.partLabel}</h3>
              <p>{display.description}</p>
              <span className={pillClass}>
                {folder.hasCurrentFile
                  ? `${folder.currentFileCount} file${folder.currentFileCount === 1 ? '' : 's'}`
                  : folder.required_for_readiness
                    ? 'Needs upload'
                    : 'Optional'}
              </span>
              {canManage ? (
                <div className="songs-folder-card-actions">
                  <button
                    type="button"
                    className="directory-btn directory-btn-secondary"
                    disabled={submittingId === folder.id}
                    onClick={() => void handleToggleRequired(folder)}
                  >
                    {folder.required_for_readiness ? 'Optional' : 'Required'}
                  </button>
                  <button
                    type="button"
                    className="directory-btn directory-btn-secondary"
                    disabled={submittingId === folder.id || partFolders.length <= 1}
                    onClick={() => void handleDelete(folder)}
                  >
                    Remove
                  </button>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>

      {canManage ? (
        <form className="songs-template-add-form" onSubmit={handleAddPart}>
          <label>
            Add part for this song
            <input
              value={newLabel}
              onChange={(event) => setNewLabel(event.target.value)}
              placeholder="e.g. Keys, Acoustic guitar"
            />
          </label>
          <label className="songs-template-checkbox">
            <input
              type="checkbox"
              checked={newRequired}
              onChange={(event) => setNewRequired(event.target.checked)}
            />
            Required for gig readiness
          </label>
          <button
            type="submit"
            className="directory-btn directory-btn-primary"
            disabled={submittingId === 'new' || !newLabel.trim()}
          >
            Add part folder
          </button>
        </form>
      ) : null}
    </div>
  );
}
