import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  SONG_SUGGESTION_DECADE_OPTIONS,
  SONG_SUGGESTION_GENRE_OPTIONS,
  SONG_SUGGESTION_SELECTION_MODE_BRIEF,
  SONG_SUGGESTION_INCLUSIVE_SELECTION_EXPLANATION,
  songSuggestionInclusiveSelectionPendingExplanation,
  createSongSuggestionGroup,
  listBandMembersWithProfiles,
  updateSongSuggestionGroup,
  type SongSuggestionGroup,
  type SongSuggestionSelectionMode,
  type VocalSuitability,
  type VoteVisibility,
} from '@bandie/data';
import { trackSongSuggestionGroupCreated } from '../../lib/analytics';

function toDatetimeLocalValue(iso: string): string {
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

type SongSuggestionGroupFormPanelProps = {
  bandId: string;
  group?: SongSuggestionGroup;
  onClose: () => void;
  onSaved: () => void;
};

export function SongSuggestionGroupFormPanel({
  bandId,
  group,
  onClose,
  onSaved,
}: SongSuggestionGroupFormPanelProps) {
  const navigate = useNavigate();
  const isEdit = Boolean(group);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bandMemberCount, setBandMemberCount] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: group?.name ?? '',
    description: group?.description ?? '',
    targetSongCount: String(group?.target_song_count ?? 8),
    suggestionClosesAt: group ? toDatetimeLocalValue(group.suggestion_closes_at) : '',
    votingClosesAt: group?.voting_closes_at ? toDatetimeLocalValue(group.voting_closes_at) : '',
    voteVisibility: (group?.vote_visibility ?? 'member_visible') as VoteVisibility,
    vocalSuitability: (group?.vocal_suitability ?? 'any') as VocalSuitability,
    preferredGenres: group?.preferred_genres ?? [],
    preferredDecades: group?.preferred_decades ?? [],
    selectionMode: (group?.selection_mode ?? 'best') as SongSuggestionSelectionMode,
  });

  useEffect(() => {
    let cancelled = false;

    async function loadMemberCount() {
      try {
        const members = await listBandMembersWithProfiles(bandId);
        if (!cancelled) {
          setBandMemberCount(members.length);
        }
      } catch {
        if (!cancelled) {
          setBandMemberCount(null);
        }
      }
    }

    void loadMemberCount();
    return () => {
      cancelled = true;
    };
  }, [bandId]);

  const targetSongCountNumber = Number(form.targetSongCount) || 0;
  const inclusiveEligible =
    bandMemberCount != null &&
    bandMemberCount > 0 &&
    targetSongCountNumber >= bandMemberCount;

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

    const payload = {
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
      selectionMode: form.selectionMode,
    };

    try {
      if (isEdit && group) {
        await updateSongSuggestionGroup(group.id, payload);
        onSaved();
        onClose();
      } else {
        const created = await createSongSuggestionGroup({ bandId, ...payload });
        trackSongSuggestionGroupCreated({
          bandId,
          groupId: created.id,
          targetSongCount: created.target_song_count,
        });
        onSaved();
        navigate(`/app/${bandId}/songs/suggestions/${created.id}`);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `Unable to ${isEdit ? 'update' : 'create'} suggestion group.`,
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="panel">
      <h2>{isEdit ? 'Edit song suggestion group' : 'New song suggestion group'}</h2>
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
          <p className="song-suggestion-mode-brief">{SONG_SUGGESTION_SELECTION_MODE_BRIEF}</p>
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
          <div className="auth-field song-suggestion-selection-field">
            <div className="song-suggestion-selection-row">
              <span className="song-suggestion-selection-field-label" id="ssg-selection-mode-label">
                Selection mode
              </span>
              <label className="song-suggestion-selection-toggle" htmlFor="ssg-selection-mode">
                <input
                  id="ssg-selection-mode"
                  type="checkbox"
                  checked={form.selectionMode === 'inclusive'}
                  aria-labelledby="ssg-selection-mode-label ssg-selection-mode-text"
                  onChange={(event) =>
                    setForm((c) => ({
                      ...c,
                      selectionMode: event.target.checked ? 'inclusive' : 'best',
                    }))
                  }
                />
                <span id="ssg-selection-mode-text">Inclusive</span>
              </label>
            </div>
            <p className="song-suggestion-mode-note">
              {form.selectionMode === 'inclusive'
                ? inclusiveEligible
                  ? `Active for this band (${bandMemberCount} members): ${SONG_SUGGESTION_INCLUSIVE_SELECTION_EXPLANATION}`
                  : bandMemberCount != null
                    ? songSuggestionInclusiveSelectionPendingExplanation(bandMemberCount)
                    : 'Inclusive selection activates when the target is at least the band size.'
                : 'Best ranks purely by score — the top songs win.'}
            </p>
          </div>
        </div>
        <div className="song-suggestion-form-grid">
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
            className="directory-btn directory-btn-secondary"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </button>
          <button type="submit" className="directory-btn directory-btn-primary" disabled={submitting}>
            {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create group'}
          </button>
        </div>
      </form>
    </section>
  );
}
