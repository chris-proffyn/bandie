import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  SONG_SUGGESTION_GROUP_STATUS_LABELS,
  SONG_SUGGESTION_LEADER_ONLY_MESSAGE,
  listBandSongSuggestionGroups,
  songSuggestionGroupStatusClass,
  type SongSuggestionGroupListItem,
  isBandLeaderRole,
} from '@bandie/data';
import { useAuth } from '../../context/AuthContext';
import { SongsBandContextBar } from '../../components/songs/SongsBandContextBar';
import { CreateSongSuggestionGroupPanel } from '../../components/songSuggestions/CreateSongSuggestionGroupPanel';
import { HeadingWithHelp } from '../../components/ui/InfoHelp';
import '../../styles/songSuggestions.css';

export function SongSuggestionGroupsPage() {
  const { bandId } = useParams();
  const { bands, adminModeActive } = useAuth();
  const membership = bands.find((item) => item.id === bandId);
  const canManage = adminModeActive || isBandLeaderRole(membership?.member_role);

  const [groups, setGroups] = useState<SongSuggestionGroupListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const loadGroups = useCallback(async (activeBandId: string, cancelled: () => boolean) => {
    setLoading(true);
    setLoadError(null);
    try {
      const rows = await listBandSongSuggestionGroups(activeBandId);
      if (!cancelled()) {
        setGroups(rows);
      }
    } catch (err) {
      if (!cancelled()) {
        setGroups([]);
        setLoadError(err instanceof Error ? err.message : 'Unable to load song suggestion groups.');
      }
    } finally {
      if (!cancelled()) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!bandId) {
      return;
    }

    setGroups([]);
    let cancelled = false;

    void loadGroups(bandId, () => cancelled);

    return () => {
      cancelled = true;
    };
  }, [bandId, loadGroups]);

  if (!bandId) {
    return null;
  }

  return (
    <div className="song-suggestions-page">
      <SongsBandContextBar
        bandId={bandId}
        bandName={membership?.name}
        sectionNote="Song suggestions"
        switchPath={(nextBandId) => `/app/${nextBandId}/songs/suggestions`}
      />

      <header className="song-suggestions-header">
        <div>
          <p className="my-bands-eyebrow">Songs</p>
          <HeadingWithHelp
            as="h1"
            helpLabel="About song suggestions"
            help={
              <p>
                Ask the band for ideas, vote with 🙂 / 😐 / 🙁, and confirm the songs you want to learn
                next.
              </p>
            }
          >
            Song suggestions
          </HeadingWithHelp>
        </div>
        <div className="song-suggestions-header-actions">
          <Link to={`/app/${bandId}/songs`} className="directory-btn directory-btn-secondary">
            Songbook
          </Link>
          {canManage ? (
            <button type="button" className="directory-btn directory-btn-primary" onClick={() => setShowCreate(true)}>
              New suggestion group
            </button>
          ) : null}
        </div>
      </header>

      {!canManage ? (
        <p className="workspace-empty-note">{SONG_SUGGESTION_LEADER_ONLY_MESSAGE}</p>
      ) : null}
      {loadError ? <div className="auth-message auth-message-error">{loadError}</div> : null}

      {showCreate ? (
        <CreateSongSuggestionGroupPanel
          bandId={bandId}
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            if (bandId) {
              void loadGroups(bandId, () => false);
            }
          }}
        />
      ) : null}

      <section className="panel">
        <h2>Song Groups</h2>
        {loading ? <p className="workspace-empty-note">Loading…</p> : null}
        {!loading && groups.length === 0 ? (
          <p className="workspace-empty-note">
            No song suggestion groups yet. Create a group to ask the band for ideas and vote on what
            to learn next.
          </p>
        ) : null}
        <div className="song-suggestions-grid">
          {groups.map((group) => (
            <Link
              key={group.id}
              to={`/app/${bandId}/songs/suggestions/${group.id}`}
              className="song-suggestion-card"
            >
              <div className="song-suggestion-card-head">
                <div>
                  <h3>{group.name}</h3>
                  <p className="song-suggestion-meta">
                    {group.suggestion_count} suggestions · target {group.target_song_count} songs ·
                    suggestions close{' '}
                    {new Date(group.suggestion_closes_at).toLocaleString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <span className={songSuggestionGroupStatusClass(group.status)}>
                  {SONG_SUGGESTION_GROUP_STATUS_LABELS[group.status]}
                </span>
              </div>
              {group.preferred_genres.length > 0 || group.preferred_decades.length > 0 ? (
                <div className="song-suggestion-tags">
                  {group.preferred_genres.map((genre) => (
                    <span key={genre} className="song-suggestion-tag">
                      {genre}
                    </span>
                  ))}
                  {group.preferred_decades.map((decade) => (
                    <span key={decade} className="song-suggestion-tag">
                      {decade}
                    </span>
                  ))}
                </div>
              ) : null}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
