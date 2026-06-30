import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  SONG_SUGGESTION_DECADE_OPTIONS,
  SONG_SUGGESTION_GENRE_OPTIONS,
  createSongSuggestionGroup,
  type VocalSuitability,
  type VoteVisibility,
} from '@bandie/data';

type CreateSongSuggestionGroupPanelProps = {
  bandId: string;
  onClose: () => void;
  onCreated: () => void;
};

export function CreateSongSuggestionGroupPanel({
  bandId,
  onClose,
  onCreated,
}: CreateSongSuggestionGroupPanelProps) {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    targetSongCount: '8',
    suggestionClosesAt: '',
    votingClosesAt: '',
    voteVisibility: 'member_visible' as VoteVisibility,
    vocalSuitability: 'any' as VocalSuitability,
    preferredGenres: [] as string[],
    preferredDecades: [] as string[],
  });

  function toggleGenre(genre: string) {
    setForm((current) => ({
      ...current,
      preferredGenres: current.preferredGenres.includes(genre)
        ? current.preferredGenres.filter((item) => item !== genre)
        : [...current.preferredGenres, genre],
    }));
  }

  function toggleDecade(decade: string) {
    setForm((current) => ({
      ...current,
      preferredDecades: current.preferredDecades.includes(decade)
        ? current.preferredDecades.filter((item) => item !== decade)
        : [...current.preferredDecades, decade],
    }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form.name.trim() || !form.suggestionClosesAt) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const group = await createSongSuggestionGroup({
        bandId,
        name: form.name,
        description: form.description,
        targetSongCount: Number(form.targetSongCount),
        suggestionClosesAt: new Date(form.suggestionClosesAt).toISOString(),
        votingClosesAt: form.votingClosesAt
          ? new Date(form.votingClosesAt).toISOString()
          : null,
        voteVisibility: form.voteVisibility,
        vocalSuitability: form.vocalSuitability,
        preferredGenres: form.preferredGenres,
        preferredDecades: form.preferredDecades,
      });
      onCreated();
      navigate(`/app/${bandId}/songs/suggestions/${group.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create suggestion group.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="panel">
      <h2>New song suggestion group</h2>
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="auth-field">
          <label htmlFor="ssg-name">Group name</label>
          <input
            id="ssg-name"
            value={form.name}
            onChange={(event) => setForm((c) => ({ ...c, name: event.target.value }))}
            placeholder="e.g. Summer swing songs"
            required
          />
        </div>
        <div className="auth-field">
          <label htmlFor="ssg-description">Brief</label>
          <textarea
            id="ssg-description"
            rows={3}
            value={form.description}
            onChange={(event) => setForm((c) => ({ ...c, description: event.target.value }))}
          />
        </div>
        <div className="song-suggestion-form-grid">
          <div className="auth-field">
            <label htmlFor="ssg-target">Target number of songs</label>
            <input
              id="ssg-target"
              type="number"
              min={1}
              value={form.targetSongCount}
              onChange={(event) => setForm((c) => ({ ...c, targetSongCount: event.target.value }))}
              required
            />
          </div>
          <div className="auth-field">
            <label htmlFor="ssg-vote-visibility">Vote visibility</label>
            <select
              id="ssg-vote-visibility"
              value={form.voteVisibility}
              onChange={(event) =>
                setForm((c) => ({
                  ...c,
                  voteVisibility: event.target.value as VoteVisibility,
                }))
              }
            >
              <option value="member_visible">Show who voted how</option>
              <option value="aggregate_only">Aggregate counts only</option>
            </select>
          </div>
        </div>
        <div className="song-suggestion-form-grid">
          <div className="auth-field">
            <label htmlFor="ssg-suggestion-close">Suggestions close</label>
            <input
              id="ssg-suggestion-close"
              type="datetime-local"
              value={form.suggestionClosesAt}
              onChange={(event) =>
                setForm((c) => ({ ...c, suggestionClosesAt: event.target.value }))
              }
              required
            />
          </div>
          <div className="auth-field">
            <label htmlFor="ssg-voting-close">Voting close (optional)</label>
            <input
              id="ssg-voting-close"
              type="datetime-local"
              value={form.votingClosesAt}
              onChange={(event) =>
                setForm((c) => ({ ...c, votingClosesAt: event.target.value }))
              }
            />
          </div>
        </div>
        <fieldset className="auth-field">
          <legend>Preferred genres (optional)</legend>
          <div className="song-suggestion-tags">
            {SONG_SUGGESTION_GENRE_OPTIONS.map((genre) => (
              <label key={genre} className="song-suggestion-tag">
                <input
                  type="checkbox"
                  checked={form.preferredGenres.includes(genre)}
                  onChange={() => toggleGenre(genre)}
                />{' '}
                {genre}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset className="auth-field">
          <legend>Preferred decades (optional)</legend>
          <div className="song-suggestion-tags">
            {SONG_SUGGESTION_DECADE_OPTIONS.map((decade) => (
              <label key={decade} className="song-suggestion-tag">
                <input
                  type="checkbox"
                  checked={form.preferredDecades.includes(decade)}
                  onChange={() => toggleDecade(decade)}
                />{' '}
                {decade}
              </label>
            ))}
          </div>
        </fieldset>
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
            {submitting ? 'Creating…' : 'Create group'}
          </button>
        </div>
      </form>
    </section>
  );
}
