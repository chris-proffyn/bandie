import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  SONG_SUGGESTION_GROUP_STATUS_LABELS,
  DEFAULT_SONG_SUGGESTION_LIST_FILTERS,
  closeSongSuggestionVoting,
  closeSongSuggestions,
  collectSongSuggestionFilterOptions,
  confirmSongSuggestionGroup,
  createSkeletonSetlistFromSuggestionGroup,
  filterAndSortSongSuggestions,
  getSongSuggestionGroupDetail,
  isSongSuggestionSubmitOpen,
  isSongSuggestionVotingOpen,
  rankSongSuggestions,
  reopenSongSuggestions,
  resetSongSuggestionVotes,
  songSuggestionGroupStatusClass,
  vetoSongSuggestion,
  withdrawSongSuggestion,
  voteOnSongSuggestion,
  clearSongSuggestionVote,
  type SongSuggestionGroupEvent,
  type SongSuggestionListFilters,
  type SongSuggestionVoteState,
  type SongSuggestionWithSummary,
  isBandLeaderRole,
} from '@bandie/data';
import { useAuth } from '../../context/AuthContext';
import { UpgradePromptModal } from '../../components/entitlements/UpgradePromptModal';
import { SongsBandContextBar } from '../../components/songs/SongsBandContextBar';
import { SongSuggestionListControls } from '../../components/songSuggestions/SongSuggestionListControls';
import { SongSuggestionCard } from '../../components/songSuggestions/SongSuggestionCard';
import { SongSuggestionRankingTable } from '../../components/songSuggestions/SongSuggestionRankingTable';
import { SubmitSongSuggestionPanel } from '../../components/songSuggestions/SubmitSongSuggestionPanel';
import { SongSuggestionGroupFormPanel } from '../../components/songSuggestions/SongSuggestionGroupFormPanel';
import { useUpgradePrompt } from '../../hooks/useUpgradePrompt';
import {
  trackSongSuggestionGroupConfirmed,
  trackSongSuggestionSetlistCreated,
  trackSongSuggestionVoteCast,
  trackSongSuggestionVoteChanged,
  trackSongSuggestionVoteCleared,
  trackSongSuggestionWithdrawn,
  trackSongSuggestionsClosed,
  trackSongSuggestionVotingClosed,
} from '../../lib/analytics';
import '../../styles/songSuggestions.css';

function formatEvent(event: SongSuggestionGroupEvent): string {
  const payload = event.event_payload;
  switch (event.event_type) {
    case 'group_created':
      return 'Group created';
    case 'group_updated':
      return 'Group details updated';
    case 'suggestion_submitted':
      return `Suggestion added: ${String(payload.song_title ?? 'song')}`;
    case 'suggestions_closed':
      return 'Suggestions closed';
    case 'suggestions_reopened':
      return 'Suggestions reopened';
    case 'voting_closed':
      return 'Voting closed';
    case 'votes_reset':
      return payload.message ? `Votes reset — ${String(payload.message)}` : 'Votes reset for re-vote';
    case 'suggestion_vetoed':
      return `Leader vetoed: ${String(payload.song_title ?? 'song')}`;
    case 'suggestion_withdrawn':
      return `Suggestion removed: ${String(payload.song_title ?? 'song')}`;
    case 'group_confirmed':
      return 'Group confirmed';
    case 'setlist_created':
      return 'Skeleton setlist created';
    default:
      return event.event_type.replace(/_/g, ' ');
  }
}

export function SongSuggestionGroupDetailPage() {
  const { bandId, groupId } = useParams();
  const navigate = useNavigate();
  const { bands, adminModeActive, user } = useAuth();
  const membership = bands.find((item) => item.id === bandId);
  const isLeader = adminModeActive || isBandLeaderRole(membership?.member_role);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [showSuggest, setShowSuggest] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [listFilters, setListFilters] = useState<SongSuggestionListFilters>(
    DEFAULT_SONG_SUGGESTION_LIST_FILTERS,
  );
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [overrideReasons, setOverrideReasons] = useState<Record<string, string>>({});
  const [detail, setDetail] = useState<Awaited<ReturnType<typeof getSongSuggestionGroupDetail>>>(null);
  const { upgradeDecision, clearUpgradePrompt, handleEntitlementError } = useUpgradePrompt();

  const loadDetail = useCallback(async () => {
    if (!groupId) {
      return;
    }

    setLoading(true);
    setLoadError(null);
    try {
      const result = await getSongSuggestionGroupDetail(groupId, {
        viewerUserId: user?.id ?? null,
        isLeader,
      });
      setDetail(result);
      if (result && showConfirm) {
        const ranked = rankSongSuggestions(
          result.suggestions.filter((row) => row.status === 'active'),
        );
        const top = ranked.slice(0, result.group.target_song_count);
        setSelectedIds(new Set(top.map((row) => row.id)));
      }
    } catch (err) {
      setDetail(null);
      setLoadError(err instanceof Error ? err.message : 'Unable to load suggestion group.');
    } finally {
      setLoading(false);
    }
  }, [groupId, isLeader, showConfirm, user?.id]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  const group = detail?.group;
  const suggestions = detail?.suggestions ?? [];
  const activeSuggestions = useMemo(
    () => suggestions.filter((row) => row.status === 'active'),
    [suggestions],
  );
  const vetoedCount = useMemo(
    () => suggestions.filter((row) => row.status === 'leader_vetoed').length,
    [suggestions],
  );
  const rankedActive = useMemo(() => rankSongSuggestions(activeSuggestions), [activeSuggestions]);

  const filterOptions = useMemo(
    () => collectSongSuggestionFilterOptions(suggestions),
    [suggestions],
  );

  const submitOpen = group ? isSongSuggestionSubmitOpen(group) : false;
  const votingOpen = group ? isSongSuggestionVotingOpen(group) : false;

  const displayedSuggestions = useMemo(() => {
    if (!group) {
      return suggestions;
    }

    return filterAndSortSongSuggestions(suggestions, listFilters, {
      targetSongCount: group.target_song_count,
      votingOpen,
    });
  }, [group, listFilters, suggestions, votingOpen]);

  const canEditGroup =
    isLeader &&
    group &&
    !['confirmed', 'archived', 'cancelled'].includes(group.status);

  const membersVotedCount = useMemo(() => {
    const voters = new Set<string>();
    for (const row of activeSuggestions) {
      for (const vote of row.votes) {
        voters.add(vote.member_user_id);
      }
    }
    return voters.size;
  }, [activeSuggestions]);

  async function runAction(action: () => Promise<void>) {
    setActionBusy(true);
    setActionError(null);
    try {
      await action();
      await loadDetail();
    } catch (err) {
      if (handleEntitlementError(err)) {
        return;
      }
      setActionError(err instanceof Error ? err.message : 'Action failed.');
    } finally {
      setActionBusy(false);
    }
  }

  async function handleVote(suggestionId: string, voteState: SongSuggestionVoteState) {
    const previousVote =
      suggestions.find((row) => row.id === suggestionId)?.my_vote ?? null;

    await runAction(async () => {
      await voteOnSongSuggestion(suggestionId, voteState);
      if (!bandId || !groupId) {
        return;
      }

      if (previousVote && previousVote !== voteState) {
        trackSongSuggestionVoteChanged({
          bandId,
          groupId,
          suggestionId,
          voteState,
          previousVoteState: previousVote,
        });
      } else if (!previousVote) {
        trackSongSuggestionVoteCast({
          bandId,
          groupId,
          suggestionId,
          voteState,
        });
      }
    });
  }

  async function handleClearVote(suggestionId: string) {
    const previousVote =
      suggestions.find((row) => row.id === suggestionId)?.my_vote ?? null;

    if (!previousVote) {
      return;
    }

    await runAction(async () => {
      await clearSongSuggestionVote(suggestionId);
      if (!bandId || !groupId) {
        return;
      }

      trackSongSuggestionVoteCleared({
        bandId,
        groupId,
        suggestionId,
        previousVoteState: previousVote,
      });
    });
  }

  async function handleWithdraw(suggestion: SongSuggestionWithSummary) {
    if (
      !window.confirm(
        `Remove "${suggestion.song_title}" from this group? You can suggest another song while suggestions are still open.`,
      )
    ) {
      return;
    }

    await runAction(async () => {
      await withdrawSongSuggestion(suggestion.id);
      if (bandId && groupId) {
        trackSongSuggestionWithdrawn({
          bandId,
          groupId,
          suggestionId: suggestion.id,
        });
      }
    });
  }

  async function handleCloseSuggestions() {
    if (!groupId || !window.confirm('Close suggestions? Members will no longer be able to add songs.')) {
      return;
    }
    await runAction(async () => {
      await closeSongSuggestions(groupId);
      if (bandId) {
        trackSongSuggestionsClosed({ bandId, groupId });
      }
    });
  }

  async function handleReopenSuggestions() {
    if (!groupId) {
      return;
    }
    const value = window.prompt('New suggestions close date/time (local):');
    if (!value) {
      return;
    }
    await runAction(() => reopenSongSuggestions(groupId, new Date(value).toISOString()));
  }

  async function handleCloseVoting() {
    if (!groupId || !window.confirm('Close voting for this group?')) {
      return;
    }
    await runAction(async () => {
      await closeSongSuggestionVoting(groupId);
      if (bandId) {
        trackSongSuggestionVotingClosed({ bandId, groupId });
      }
    });
  }

  async function handleResetVotes() {
    if (!groupId) {
      return;
    }
    const message = window.prompt('Optional message to the band about the re-vote:') ?? '';
    if (!window.confirm('Reset all votes? Members will need to vote again.')) {
      return;
    }
    await runAction(() => resetSongSuggestionVotes(groupId, message || null));
  }

  async function handleVeto(suggestion: SongSuggestionWithSummary) {
    const reason = window.prompt(`Veto reason for "${suggestion.song_title}":`);
    if (!reason?.trim()) {
      return;
    }
    await runAction(() => vetoSongSuggestion(suggestion.id, reason.trim()));
  }

  function toggleSelection(suggestionId: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(suggestionId)) {
        next.delete(suggestionId);
      } else {
        next.add(suggestionId);
      }
      return next;
    });
  }

  async function handleConfirm() {
    if (!groupId || !group) {
      return;
    }

    const selections = [...selectedIds].map((suggestionId) => {
      const ranked = rankedActive.find((row) => row.id === suggestionId);
      const inTopN = ranked && ranked.proposed_rank <= group.target_song_count;
      const overrideReason = overrideReasons[suggestionId]?.trim();
      return {
        suggestionId,
        overrideReason: !inTopN && overrideReason ? overrideReason : null,
      };
    });

    if (selections.length === 0) {
      setActionError('Select at least one song to confirm.');
      return;
    }

    for (const selection of selections) {
      const ranked = rankedActive.find((row) => row.id === selection.suggestionId);
      const inTopN = ranked && ranked.proposed_rank <= group.target_song_count;
      if (!inTopN && !selection.overrideReason) {
        setActionError('Provide an override reason for songs outside the top rank.');
        return;
      }
    }

    if (
      membersVotedCount === 0 &&
      !window.confirm('No votes recorded yet. Confirm anyway?')
    ) {
      return;
    }

    await runAction(async () => {
      await confirmSongSuggestionGroup(groupId, selections);
      if (bandId) {
        trackSongSuggestionGroupConfirmed({
          bandId,
          groupId,
          selectedCount: selections.length,
        });
      }
      setShowConfirm(false);
    });
  }

  async function handleCreateSetlist() {
    if (!groupId) {
      return;
    }
    await runAction(async () => {
      const { setlistId } = await createSkeletonSetlistFromSuggestionGroup(groupId);
      if (bandId) {
        trackSongSuggestionSetlistCreated({ bandId, groupId, setlistId });
      }
      navigate(`/app/${bandId}/setlists/${setlistId}`);
    });
  }

  if (!bandId || !groupId) {
    return null;
  }

  if (loading) {
    return (
      <div className="song-suggestions-page">
        <p className="workspace-empty-note">Loading…</p>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="song-suggestions-page">
        <div className="auth-message auth-message-error">{loadError ?? 'Group not found.'}</div>
        <Link to={`/app/${bandId}/songs/suggestions`} className="directory-btn directory-btn-secondary">
          Back to groups
        </Link>
      </div>
    );
  }

  return (
    <div className="song-suggestions-page">
      <SongsBandContextBar bandId={bandId} bandName={membership?.name} sectionNote="Song suggestions" />

      <header className="song-suggestions-header">
        <div>
          <p className="my-bands-eyebrow">Song suggestions</p>
          <h1>{group.name}</h1>
          {group.description ? <p className="my-bands-lead">{group.description}</p> : null}
          <p className="song-suggestion-meta">
            Target {group.target_song_count} songs · suggestions close{' '}
            {new Date(group.suggestion_closes_at).toLocaleString('en-GB', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}
            {group.voting_closes_at
              ? ` · voting closes ${new Date(group.voting_closes_at).toLocaleString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}`
              : ''}
          </p>
        </div>
        <div className="song-suggestions-header-actions">
          <Link
            to={`/app/${bandId}/songs/suggestions`}
            className="directory-btn directory-btn-secondary"
          >
            All groups
          </Link>
          <span className={songSuggestionGroupStatusClass(group.status)}>
            {SONG_SUGGESTION_GROUP_STATUS_LABELS[group.status]}
          </span>
        </div>
      </header>

      {(group.preferred_genres.length > 0 || group.preferred_decades.length > 0) && (
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
      )}

      {loadError ? <div className="auth-message auth-message-error">{loadError}</div> : null}
      {actionError ? <div className="auth-message auth-message-error">{actionError}</div> : null}

      {isLeader && group.status !== 'confirmed' && group.status !== 'cancelled' ? (
        <section className="panel">
          <h2>Leader actions</h2>
          <div className="song-suggestion-leader-actions">
            {canEditGroup ? (
              <button
                type="button"
                className="directory-btn directory-btn-secondary"
                disabled={actionBusy}
                onClick={() => setShowEdit(true)}
              >
                Edit group
              </button>
            ) : null}
            {group.status === 'open_for_suggestions' ? (
              <button
                type="button"
                className="directory-btn directory-btn-secondary"
                disabled={actionBusy}
                onClick={() => void handleCloseSuggestions()}
              >
                Close suggestions
              </button>
            ) : null}
            {group.status === 'suggestions_closed' ? (
              <button
                type="button"
                className="directory-btn directory-btn-secondary"
                disabled={actionBusy}
                onClick={() => void handleReopenSuggestions()}
              >
                Reopen suggestions
              </button>
            ) : null}
            {votingOpen ? (
              <button
                type="button"
                className="directory-btn directory-btn-secondary"
                disabled={actionBusy}
                onClick={() => void handleCloseVoting()}
              >
                Close voting
              </button>
            ) : null}
            {['open_for_suggestions', 'suggestions_closed', 'voting_closed'].includes(
              group.status,
            ) ? (
              <button
                type="button"
                className="directory-btn directory-btn-secondary"
                disabled={actionBusy}
                onClick={() => void handleResetVotes()}
              >
                Reset votes
              </button>
            ) : null}
            {['suggestions_closed', 'voting_closed', 'open_for_suggestions'].includes(
              group.status,
            ) ? (
              <button
                type="button"
                className="auth-button"
                disabled={actionBusy}
                onClick={() => {
                  const top = rankedActive.slice(0, group.target_song_count);
                  setSelectedIds(new Set(top.map((row) => row.id)));
                  setShowConfirm(true);
                }}
              >
                Confirm selections
              </button>
            ) : null}
          </div>
        </section>
      ) : null}

      {group.status === 'confirmed' ? (
        <section className="panel">
          <h2>Confirmed outcome</h2>
          {isLeader && !group.skeleton_setlist_id ? (
            <div className="song-suggestion-leader-actions">
              <button
                type="button"
                className="auth-button"
                disabled={actionBusy}
                onClick={() => void handleCreateSetlist()}
              >
                Create skeleton setlist
              </button>
            </div>
          ) : null}
          {group.skeleton_setlist_id ? (
            <Link
              to={`/app/${bandId}/setlists/${group.skeleton_setlist_id}`}
              className="directory-btn directory-btn-primary"
            >
              Open setlist
            </Link>
          ) : null}
        </section>
      ) : null}

      {showConfirm ? (
        <section className="panel">
          <h2>Confirm top songs</h2>
          <p className="song-suggestion-panel-intro">
            Select up to {group.target_song_count} songs (or override with a reason). Tied scores are
            highlighted.
          </p>
          <ul className="song-suggestion-confirm-list">
            {rankedActive.map((row, index) => {
              const next = rankedActive[index + 1];
              const isTie =
                next &&
                next.vote_summary.score === row.vote_summary.score &&
                next.vote_summary.happy_count === row.vote_summary.happy_count;
              const checked = selectedIds.has(row.id);
              const outOfTop = row.proposed_rank > group.target_song_count;
              return (
                <li
                  key={row.id}
                  className={`song-suggestion-confirm-item${isTie ? ' tie' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleSelection(row.id)}
                    aria-label={`Select ${row.song_title}`}
                  />
                  <div>
                    <strong>
                      #{row.proposed_rank} {row.song_title} — {row.artist}
                    </strong>
                    <p className="song-suggestion-meta">
                      Score {row.vote_summary.score} · 🙂 {row.vote_summary.happy_count} · 😐{' '}
                      {row.vote_summary.meh_count} · 🙁 {row.vote_summary.rather_not_count}
                    </p>
                    {checked && outOfTop ? (
                      <input
                        placeholder="Override reason (required outside top rank)"
                        value={overrideReasons[row.id] ?? ''}
                        onChange={(event) =>
                          setOverrideReasons((current) => ({
                            ...current,
                            [row.id]: event.target.value,
                          }))
                        }
                      />
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="song-suggestion-form-actions">
            <button
              type="button"
              className="auth-button auth-button-secondary"
              onClick={() => setShowConfirm(false)}
              disabled={actionBusy}
            >
              Cancel
            </button>
            <button
              type="button"
              className="auth-button"
              disabled={actionBusy}
              onClick={() => void handleConfirm()}
            >
              {actionBusy ? 'Confirming…' : 'Confirm group'}
            </button>
          </div>
        </section>
      ) : null}

      {submitOpen && !showSuggest ? (
        <div className="song-suggestion-leader-actions">
          <button type="button" className="auth-button" onClick={() => setShowSuggest(true)}>
            Suggest a song
          </button>
        </div>
      ) : null}

      {showEdit && group && bandId ? (
        <SongSuggestionGroupFormPanel
          bandId={bandId}
          group={group}
          onClose={() => setShowEdit(false)}
          onSaved={() => {
            setShowEdit(false);
            void loadDetail();
          }}
        />
      ) : null}

      {showSuggest && groupId ? (
        <SubmitSongSuggestionPanel
          bandId={bandId}
          groupId={groupId}
          onClose={() => setShowSuggest(false)}
          onSubmitted={() => void loadDetail()}
        />
      ) : null}

      <SongSuggestionRankingTable
        bandId={bandId!}
        targetSongCount={group.target_song_count}
        groupStatus={group.status}
        rankedRows={rankedActive}
        confirmedRows={detail?.confirmed ?? []}
        vetoedCount={vetoedCount}
      />

      <section className="panel">
        <h2>Suggestions ({suggestions.length})</h2>
        {suggestions.length > 0 ? (
          <SongSuggestionListControls
            filters={listFilters}
            options={filterOptions}
            resultCount={displayedSuggestions.length}
            totalCount={suggestions.length}
            votingOpen={votingOpen}
            onChange={setListFilters}
          />
        ) : null}
        {suggestions.length === 0 ? (
          <p className="workspace-empty-note">
            No suggestions yet.{submitOpen ? ' Be the first to add one.' : ''}
          </p>
        ) : displayedSuggestions.length === 0 ? (
          <p className="workspace-empty-note">
            No suggestions match these filters. Try clearing filters or broadening your search.
          </p>
        ) : (
          <div className="song-suggestion-cards-grid">
            {displayedSuggestions.map((row) => (
              <SongSuggestionCard
                key={row.id}
                row={row}
                sortBy={listFilters.sortBy}
                suggestionsOpen={submitOpen}
                votingOpen={votingOpen}
                voteVisibility={group.vote_visibility}
                allowVoteChanges={group.allow_vote_changes}
                isLeader={isLeader}
                currentUserId={user?.id ?? null}
                actionBusy={actionBusy}
                onVote={(suggestionId, voteState) => void handleVote(suggestionId, voteState)}
                onClearVote={(suggestionId) => void handleClearVote(suggestionId)}
                onWithdraw={(suggestion) => void handleWithdraw(suggestion)}
                onVeto={(suggestion) => void handleVeto(suggestion)}
              />
            ))}
          </div>
        )}
      </section>

      {detail?.events.length ? (
        <section className="panel">
          <h2>Activity</h2>
          <ul className="song-suggestion-events">
            {detail.events.map((event) => (
              <li key={event.id}>
                {new Date(event.created_at).toLocaleString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}{' '}
                — {formatEvent(event)}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {upgradeDecision ? (
        <UpgradePromptModal decision={upgradeDecision} onClose={clearUpgradePrompt} />
      ) : null}
    </div>
  );
}
