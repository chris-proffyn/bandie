import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  findSimilarSongSuggestions,
  listBandMembersWithProfiles,
  submitSongSuggestion,
  type BandMemberWithProfile,
  type SubmitSongSuggestionInput,
} from '@bandie/data';
import { trackSongSuggestionAdded } from '../../lib/analytics';

function memberLabel(member: BandMemberWithProfile): string {
  return member.profile?.display_name?.trim() || member.profile?.preferred_instrument || member.user_id;
}

type SubmitSongSuggestionPanelProps = {
  bandId: string;
  groupId: string;
  isLeader?: boolean;
  currentUserId?: string | null;
  onClose: () => void;
  onSubmitted: () => void;
};

export function SubmitSongSuggestionPanel({
  bandId,
  groupId,
  isLeader = false,
  currentUserId,
  onClose,
  onSubmitted,
}: SubmitSongSuggestionPanelProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [members, setMembers] = useState<BandMemberWithProfile[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [suggestedByUserId, setSuggestedByUserId] = useState('');
  const [form, setForm] = useState<SubmitSongSuggestionInput>({
    songTitle: '',
    artist: '',
    youtubeUrl: '',
    spotifyUrl: '',
    rationale: '',
  });

  useEffect(() => {
    if (!isLeader || !bandId) {
      setMembers([]);
      return;
    }

    let cancelled = false;
    setMembersLoading(true);

    listBandMembersWithProfiles(bandId)
      .then((rows) => {
        if (!cancelled) {
          setMembers(rows);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setMembers([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setMembersLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [bandId, isLeader]);

  useEffect(() => {
    if (currentUserId) {
      setSuggestedByUserId(currentUserId);
    }
  }, [currentUserId]);

  const memberOptions = useMemo(() => {
    return members.map((member) => ({
      userId: member.user_id,
      label: memberLabel(member),
    }));
  }, [members]);

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
      const suggestionId = await submitSongSuggestion(groupId, {
        ...form,
        suggestedByUserId:
          isLeader && suggestedByUserId && suggestedByUserId !== currentUserId
            ? suggestedByUserId
            : null,
      });
      trackSongSuggestionAdded({ bandId, groupId, suggestionId });
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
        {isLeader && memberOptions.length > 0 ? (
          <div className="auth-field">
            <label htmlFor="ss-suggested-by">Suggest on behalf of</label>
            <select
              id="ss-suggested-by"
              value={suggestedByUserId}
              onChange={(event) => setSuggestedByUserId(event.target.value)}
              disabled={membersLoading || submitting}
            >
              {memberOptions.map((member) => (
                <option key={member.userId} value={member.userId}>
                  {member.userId === currentUserId ? `${member.label} (you)` : member.label}
                </option>
              ))}
            </select>
            <p className="workspace-section-intro song-suggestion-on-behalf-note">
              The suggestion and automatic happy-to-play vote are attributed to the selected member.
            </p>
          </div>
        ) : null}
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
            className="directory-btn directory-btn-secondary"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </button>
          <button type="submit" className="directory-btn directory-btn-primary" disabled={submitting}>
            {submitting ? 'Saving…' : 'Submit suggestion'}
          </button>
        </div>
      </form>
    </section>
  );
}
