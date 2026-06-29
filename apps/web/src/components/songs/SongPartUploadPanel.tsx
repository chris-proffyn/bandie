import { useRef, useState } from 'react';
import {
  getSongPartDisplay,
  SONG_PARTS_LEADER_ONLY_MESSAGE,
  uploadSongPartFile,
  type SongPartFolderWithStats,
} from '@bandie/data';

type SongPartUploadPanelProps = {
  bandId: string;
  songId: string;
  partFolders: SongPartFolderWithStats[];
  onUploaded: () => void;
  storageActive: boolean;
  canManage: boolean;
};

const ACCEPTED_TYPES =
  '.pdf,.png,.jpg,.jpeg,.gif,.webp,.txt,.md,.cho,.chopro,.pro,.gp,.gp3,.gp4,.gp5,.gpx,.mp3,.wav';

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        reject(new Error('Unable to read file.'));
        return;
      }

      const base64 = result.split(',')[1];
      if (!base64) {
        reject(new Error('Unable to encode file.'));
        return;
      }

      resolve(base64);
    };
    reader.onerror = () => reject(new Error('Unable to read file.'));
    reader.readAsDataURL(file);
  });
}

export function SongPartUploadPanel({
  bandId,
  songId,
  partFolders,
  onUploaded,
  storageActive,
  canManage,
}: SongPartUploadPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [partFolderId, setPartFolderId] = useState(partFolders[0]?.id ?? '');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files?.length || !partFolderId) {
      return;
    }

    if (!canManage) {
      setError(SONG_PARTS_LEADER_ONLY_MESSAGE);
      return;
    }

    if (!storageActive) {
      setError('Song-part storage is not active. Ask your band leader to connect Dropbox in Band details.');
      return;
    }

    setUploading(true);
    setError(null);
    setMessage(null);

    try {
      const file = files[0];
      const contentBase64 = await fileToBase64(file);
      await uploadSongPartFile({
        bandId,
        songId,
        partFolderId,
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        contentBase64,
      });
      setMessage(`${file.name} uploaded.`);
      onUploaded();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to upload file.');
    } finally {
      setUploading(false);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  }

  return (
    <div className="songs-side-card surface-light">
      <div className="songs-side-card-header">
        <h2>Upload file</h2>
      </div>

      {error ? <div className="songs-error" style={{ marginBottom: '0.75rem' }}>{error}</div> : null}
      {message ? <div className="songs-success" style={{ marginBottom: '0.75rem' }}>{message}</div> : null}

      {canManage ? (
        <>
      <div
        className="songs-upload-zone surface-light"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          void handleFiles(event.dataTransfer.files);
        }}
      >
        <h3>Drop a file here</h3>
        <p>PDF, image, audio, Guitar Pro, ChordPro, or text — max 4 MB on web.</p>
        <button
          type="button"
          className="directory-btn directory-btn-primary"
          disabled={uploading || !partFolders.length}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? 'Uploading…' : 'Choose file'}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES}
          hidden
          onChange={(event) => void handleFiles(event.target.files)}
        />
      </div>

      <div className="songs-filters" style={{ gridTemplateColumns: '1fr', marginTop: '0.85rem' }}>
        <label>
          Part folder
          <select value={partFolderId} onChange={(event) => setPartFolderId(event.target.value)}>
            {partFolders.map((folder) => (
              <option key={folder.id} value={folder.id}>
                {folder.part_label}
              </option>
            ))}
          </select>
        </label>
      </div>
        </>
      ) : (
        <p className="my-bands-lead songs-leader-only-note" style={{ margin: 0 }}>
          {SONG_PARTS_LEADER_ONLY_MESSAGE}
        </p>
      )}
    </div>
  );
}

export function SongPartFolderGrid({ partFolders }: { partFolders: SongPartFolderWithStats[] }) {
  return (
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
          </article>
        );
      })}
    </div>
  );
}
