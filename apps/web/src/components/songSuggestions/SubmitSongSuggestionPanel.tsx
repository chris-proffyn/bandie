import { useState, type FormEvent } from 'react';
import {
  findSimilarSongSuggestions,
  submitSongSuggestion,
  type SubmitSongSuggestionInput,
} from '@bandie/data';

type SubmitSongSuggestionPanelProps = {
  groupId: string;
  onClose: () => void;
  onSubmitted: () => void;
};

export function SubmitSongSuggestionPanel({
  groupId,
  onClose,
  onSubmitted,
}: SubmitSongSuggestionPanelProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<SubmitSongSuggestionInput>({
    songTitle: '',
    artist: '',
    youtubeUrl: '',
    spotifyUrl: '',
    rationale: '',
  });

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form.songTitle.trim() || !form.artist.trim()) {
      return;
    }

    const duplicates = await findSimilarSongSuggestions(
      groupId,
      form.songTitle,
      form.artist,
    );
    if (
      duplicates.length > 0 &&
      !window.confirm(
        'A similar song is already suggested in this group. Submit anyway? Consider voting on the existing suggestion instead.',
      )
    ) {
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await submitSongSuggestion(groupId, form);
      onSubmitted();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit suggestion.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="panel">
      <h2>Add song suggestion</h2>
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="song-suggestion-form-grid">
          <div className="auth-field">
            <label htmlFor="ss-title">Song title</label>
            <input
              id="ss-title"
              value={form.songTitle}
              onChange={(event) => setForm((c) => ({ ...c, songTitle: event.target.value }))}
              required
            />
          </div>
          <div className="auth-field">
            <label htmlFor="ss-artist">Artist</label>
            <input
              id="ss-artist"
              value={form.artist}
              onChange={(event) => setForm((c) => ({ ...c, artist: event.target.value }))}
              required
            />
          </div>
        </div>
        <div className="song-suggestion-form-grid">
          <div className="auth-field">
            <label htmlFor="ss-youtube">YouTube link</label>
            <input
              id="ss-youtube"
              type="url"
              value={form.youtubeUrl ?? ''}
              onChange={(event) => setForm((c) => ({ ...c, youtubeUrl: event.target.value }))}
              placeholder="https://"
            />
          </div>
          <div className="auth-field">
            <label htmlFor="ss-spotify">Spotify link</label>
            <input
              id="ss-spotify"
              type="url"
              value={form.spotifyUrl ?? ''}
              onChange={(event) => setForm((c) => ({ ...c, spotifyUrl: event.target.value }))}
              placeholder="https://"
            />
          </div>
        </div>
        <div className="auth-field">
          <label htmlFor="ss-rationale">Why this song?</label>
          <textarea
            id="ss-rationale"
            rows={3}
            value={form.rationale ?? ''}
            onChange={(event) => setForm((c) => ({ ...c, rationale: event.target.value }))}
          />
        </div>
        {error ? <div className="auth-message auth-message-error">{error}</div> : null}
        <div className="song-suggestion-form-actions">
          <button
            type="button"
            className="auth-button auth-button-secondary"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </button>
          <button type="submit" className="auth-button" disabled={submitting}>
            {submitting ? 'Saving…' : 'Submit suggestion'}
          </button>
        </div>
      </form>
    </section>
  );
}
