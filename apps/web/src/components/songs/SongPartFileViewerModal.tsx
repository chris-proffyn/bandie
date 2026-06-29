import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { loadSongPartFileInlinePreview } from '@bandie/data';

type SongPartFileViewerModalProps = {
  bandId: string;
  fileId: string;
  displayName: string;
  partLabel: string;
  onClose: () => void;
};

export function SongPartFileViewerModal({
  bandId,
  fileId,
  displayName,
  partLabel,
  onClose,
}: SongPartFileViewerModalProps) {
  const titleId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const blobUrlRef = useRef<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [rendering, setRendering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const revokeBlobUrl = useCallback(() => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
  }, []);

  const loadPreview = useCallback(async () => {
    setLoading(true);
    setRendering(false);
    setError(null);
    revokeBlobUrl();
    setPreviewUrl(null);

    try {
      const preview = await loadSongPartFileInlinePreview(bandId, fileId);
      blobUrlRef.current = preview.blobUrl;
      setPreviewUrl(preview.blobUrl);
      setRendering(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load PDF preview.');
    } finally {
      setLoading(false);
    }
  }, [bandId, fileId, revokeBlobUrl]);

  useEffect(() => {
    void loadPreview();
  }, [loadPreview]);

  useEffect(() => revokeBlobUrl, [revokeBlobUrl]);

  useEffect(() => {
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }

      if (event.key !== 'Tab' || !dialogRef.current) {
        return;
      }

      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], iframe, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) {
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="songs-dialog-backdrop songs-file-viewer-backdrop" role="presentation" onClick={onClose}>
      <div
        ref={dialogRef}
        className="songs-dialog songs-file-viewer-modal surface-light"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="songs-file-viewer-header">
          <div className="songs-file-viewer-header-text">
            <h2 id={titleId}>{displayName}</h2>
            <p>{partLabel}</p>
          </div>
          <div className="songs-file-viewer-header-actions">
            {previewUrl ? (
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="directory-btn directory-btn-secondary"
              >
                Open in new tab
              </a>
            ) : null}
            <button
              ref={closeButtonRef}
              type="button"
              className="directory-btn directory-btn-secondary"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </header>

        <div className="songs-file-viewer-body">
          {loading ? (
            <p className="songs-file-viewer-status">Loading PDF…</p>
          ) : error ? (
            <div className="songs-file-viewer-error">
              <p>{error}</p>
              <button type="button" className="directory-btn directory-btn-primary" onClick={() => void loadPreview()}>
                Try again
              </button>
            </div>
          ) : previewUrl ? (
            <>
              {rendering ? (
                <p className="songs-file-viewer-status songs-file-viewer-status-overlay">Rendering PDF…</p>
              ) : null}
              <iframe
                title={displayName}
                src={previewUrl}
                className="songs-pdf-viewer"
                onLoad={() => setRendering(false)}
              />
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
