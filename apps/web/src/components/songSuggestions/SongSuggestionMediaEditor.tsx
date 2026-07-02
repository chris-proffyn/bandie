import { useState, type FormEvent } from 'react';
import type { SongSuggestionWithSummary, UpdateSongSuggestionMediaInput } from '@bandie/data';

type SongSuggestionMediaEditorProps = {
  row: SongSuggestionWithSummary;
  actionBusy: boolean;
  onSave: (suggestionId: string, input: UpdateSongSuggestionMediaInput) => void;
  onCancel: () => void;
};

export function SongSuggestionMediaEditor({
  row,
  actionBusy,
  onSave,
  onCancel,
}: SongSuggestionMediaEditorProps) {
  const [youtubeUrl, setYoutubeUrl] = useState(row.youtube_url ?? '');
  const [spotifyUrl, setSpotifyUrl] = useState(row.spotify_url ?? '');
  const [otherMediaUrl, setOtherMediaUrl] = useState(row.other_media_url ?? '');

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSave(row.id, {
      youtubeUrl: youtubeUrl.trim() || null,
      spotifyUrl: spotifyUrl.trim() || null,
      otherMediaUrl: otherMediaUrl.trim() || null,
    });
  }

  return (
    <form className="song-suggestion-media-editor" onSubmit={handleSubmit}>
      <p className="song-suggestion-media-editor-note">
        Song title and artist are fixed. To change them, remove this suggestion and submit a new one.
      </p>
      <div className="song-suggestion-form-grid">
        <div className="auth-field">
          <label htmlFor={`ss-media-youtube-${row.id}`}>YouTube link</label>
          <input
            id={`ss-media-youtube-${row.id}`}
            type="url"
            value={youtubeUrl}
            onChange={(event) => setYoutubeUrl(event.target.value)}
            placeholder="https://"
            disabled={actionBusy}
          />
        </div>
        <div className="auth-field">
          <label htmlFor={`ss-media-spotify-${row.id}`}>Spotify link</label>
          <input
            id={`ss-media-spotify-${row.id}`}
            type="url"
            value={spotifyUrl}
            onChange={(event) => setSpotifyUrl(event.target.value)}
            placeholder="https://"
            disabled={actionBusy}
          />
        </div>
      </div>
      <div className="auth-field">
        <label htmlFor={`ss-media-other-${row.id}`}>Other media link</label>
        <input
          id={`ss-media-other-${row.id}`}
          type="url"
          value={otherMediaUrl}
          onChange={(event) => setOtherMediaUrl(event.target.value)}
          placeholder="https://"
          disabled={actionBusy}
        />
      </div>
      <div className="song-suggestion-media-editor-actions">
        <button
          type="button"
          className="directory-btn directory-btn-secondary"
          disabled={actionBusy}
          onClick={onCancel}
        >
          Cancel
        </button>
        <button type="submit" className="directory-btn directory-btn-primary" disabled={actionBusy}>
          {actionBusy ? 'Saving…' : 'Save links'}
        </button>
      </div>
    </form>
  );
}
