import { useEffect, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import type { SongSuggestionWithSummary, UpdateSongSuggestionDetailsInput } from '@bandie/data';

type SongSuggestionEditModalProps = {
  row: SongSuggestionWithSummary;
  open: boolean;
  actionBusy: boolean;
  canDelete: boolean;
  canEdit: boolean;
  isLeaderEditingOther: boolean;
  onClose: () => void;
  onSave: (suggestionId: string, input: UpdateSongSuggestionDetailsInput) => void | Promise<boolean>;
  onDelete: (row: SongSuggestionWithSummary) => void | Promise<boolean>;
};

export function SongSuggestionEditModal({
  row,
  open,
  actionBusy,
  canDelete,
  canEdit,
  isLeaderEditingOther,
  onClose,
  onSave,
  onDelete,
}: SongSuggestionEditModalProps) {
  const [artist, setArtist] = useState(row.artist);
  const [suggestedGenre, setSuggestedGenre] = useState(row.suggested_genre ?? '');
  const [decade, setDecade] = useState(row.decade ?? '');
  const [youtubeUrl, setYoutubeUrl] = useState(row.youtube_url ?? '');
  const [spotifyUrl, setSpotifyUrl] = useState(row.spotify_url ?? '');
  const [otherMediaUrl, setOtherMediaUrl] = useState(row.other_media_url ?? '');
  const [rationale, setRationale] = useState(row.rationale ?? '');

  useEffect(() => {
    if (!open) {
      return;
    }

    setArtist(row.artist);
    setSuggestedGenre(row.suggested_genre ?? '');
    setDecade(row.decade ?? '');
    setYoutubeUrl(row.youtube_url ?? '');
    setSpotifyUrl(row.spotify_url ?? '');
    setOtherMediaUrl(row.other_media_url ?? '');
    setRationale(row.rationale ?? '');
  }, [open, row]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!artist.trim() || !canEdit) {
      return;
    }

    void (async () => {
      const saved = await onSave(row.id, {
        artist: artist.trim(),
        suggestedGenre: suggestedGenre.trim() || null,
        decade: decade.trim() || null,
        youtubeUrl: youtubeUrl.trim() || null,
        spotifyUrl: spotifyUrl.trim() || null,
        otherMediaUrl: otherMediaUrl.trim() || null,
        rationale: rationale.trim() || null,
      });
      if (saved) {
        onClose();
      }
    })();
  }

  function handleDelete() {
    void (async () => {
      const deleted = await onDelete(row);
      if (deleted) {
        onClose();
      }
    })();
  }

  if (!open) {
    return null;
  }

  return createPortal(
    <div className="song-suggestion-edit-backdrop" role="presentation" onClick={onClose}>
      <div
        className="song-suggestion-edit-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`song-suggestion-edit-title-${row.id}`}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="song-suggestion-edit-dialog-head">
          <h2 id={`song-suggestion-edit-title-${row.id}`}>Edit suggestion</h2>
          <button
            type="button"
            className="song-suggestion-edit-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </header>

        <p className="song-suggestion-edit-note">
          {isLeaderEditingOther
            ? 'You are editing this suggestion as band leader. Song title cannot be changed.'
            : 'Song title cannot be changed. To use a different title, delete this suggestion and submit a new one.'}
        </p>

        <form className="song-suggestion-edit-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor={`ss-edit-title-${row.id}`}>Song title</label>
            <input id={`ss-edit-title-${row.id}`} value={row.song_title} readOnly disabled />
          </div>

          <div className="song-suggestion-form-grid">
            <div className="auth-field">
              <label htmlFor={`ss-edit-artist-${row.id}`}>Artist</label>
              <input
                id={`ss-edit-artist-${row.id}`}
                value={artist}
                onChange={(event) => setArtist(event.target.value)}
                required
                disabled={actionBusy || !canEdit}
              />
            </div>
            <div className="auth-field">
              <label htmlFor={`ss-edit-genre-${row.id}`}>Genre</label>
              <input
                id={`ss-edit-genre-${row.id}`}
                value={suggestedGenre}
                onChange={(event) => setSuggestedGenre(event.target.value)}
                disabled={actionBusy || !canEdit}
              />
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor={`ss-edit-decade-${row.id}`}>Decade</label>
            <input
              id={`ss-edit-decade-${row.id}`}
              value={decade}
              onChange={(event) => setDecade(event.target.value)}
              placeholder="e.g. 1990s"
              disabled={actionBusy || !canEdit}
            />
          </div>

          <div className="song-suggestion-form-grid">
            <div className="auth-field">
              <label htmlFor={`ss-edit-youtube-${row.id}`}>YouTube link</label>
              <input
                id={`ss-edit-youtube-${row.id}`}
                type="url"
                value={youtubeUrl}
                onChange={(event) => setYoutubeUrl(event.target.value)}
                placeholder="https://"
                disabled={actionBusy || !canEdit}
              />
            </div>
            <div className="auth-field">
              <label htmlFor={`ss-edit-spotify-${row.id}`}>Spotify link</label>
              <input
                id={`ss-edit-spotify-${row.id}`}
                type="url"
                value={spotifyUrl}
                onChange={(event) => setSpotifyUrl(event.target.value)}
                placeholder="https://"
                disabled={actionBusy || !canEdit}
              />
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor={`ss-edit-other-${row.id}`}>Other media link</label>
            <input
              id={`ss-edit-other-${row.id}`}
              type="url"
              value={otherMediaUrl}
              onChange={(event) => setOtherMediaUrl(event.target.value)}
              placeholder="https://"
              disabled={actionBusy || !canEdit}
            />
          </div>

          <div className="auth-field">
            <label htmlFor={`ss-edit-rationale-${row.id}`}>Why this song?</label>
            <textarea
              id={`ss-edit-rationale-${row.id}`}
              rows={3}
              value={rationale}
              onChange={(event) => setRationale(event.target.value)}
              disabled={actionBusy || !canEdit}
            />
          </div>

          <div className="song-suggestion-edit-actions">
            <button
              type="button"
              className="directory-btn directory-btn-secondary"
              disabled={actionBusy}
              onClick={onClose}
            >
              Cancel
            </button>
            {canEdit ? (
              <button type="submit" className="directory-btn directory-btn-primary" disabled={actionBusy}>
                {actionBusy ? 'Saving…' : 'Save changes'}
              </button>
            ) : null}
          </div>
        </form>

        {canDelete ? (
          <div className="song-suggestion-edit-danger-zone">
            <button
              type="button"
              className="song-suggestion-delete-btn"
              disabled={actionBusy}
              onClick={handleDelete}
            >
              Delete suggestion
            </button>
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
