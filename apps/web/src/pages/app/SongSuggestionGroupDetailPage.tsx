import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  SONG_SUGGESTION_GROUP_STATUS_LABELS,
  DEFAULT_SONG_SUGGESTION_LIST_FILTERS,
  closeSongSuggestionVoting,
  closeSongSuggestions,
  clearAllSongSuggestions,
  collectSongSuggestionFilterOptions,
  computeSongSuggestionAutoSelection,
  confirmSongSuggestionGroup,
  createSkeletonSetlistFromSuggestionGroup,
  filterAndSortSongSuggestions,
  getSongSuggestionGroupDetail,
  isInclusiveSelectionActive,
  isSongSuggestionSubmitOpen,
  isSongSuggestionVotingOpen,
  rankSongSuggestions,
  reopenSongSuggestions,
  resetSongSuggestionVotes,
  SONG_SUGGESTION_SELECTION_MODE_LABELS,
  SONG_SUGGESTION_INCLUSIVE_SELECTION_EXPLANATION,
  songSuggestionInclusiveSelectionPendingExplanation,
  songSuggestionGroupStatusClass,
  vetoSongSuggestion,
  withdrawSongSuggestion,
  updateSongSuggestionDetails,
  canEditSongSuggestionDetails,
  voteOnSongSuggestion,
  clearSongSuggestionVote,
  type SongSuggestionGroupEvent,
  type SongSuggestionListFilters,
  type SongSuggestionVoteState,
  type SongSuggestionWithSummary,
  type UpdateSongSuggestionDetailsInput,
  isBandLeaderRole,
} from '@bandie/data';
import { useAuth } from '../../context/AuthContext';
import { UpgradePromptModal } from '../../components/entitlements/UpgradePromptModal';
import { SongsBandContextBar } from '../../components/songs/SongsBandContextBar';
import { SongSuggestionListControls } from '../../components/songSuggestions/SongSuggestionListControls';
import {
  SongSuggestionLeaderActionsModal,
  CogIcon,
} from '../../components/songSuggestions/SongSuggestionLeaderActionsModal';
import { SongSuggestionCard } from '../../components/songSuggestions/SongSuggestionCard';
import { SongSuggestionRankingTable } from '../../components/songSuggestions/SongSuggestionRankingTable';
import { SubmitSongSuggestionPanel } from '../../components/songSuggestions/SubmitSongSuggestionPanel';
import { SongSuggestionGroupFormPanel } from '../../components/songSuggestions/SongSuggestionGroupFormPanel';
import { HeadingWithHelp } from '../../components/ui/InfoHelp';
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
    case 'suggestion_media_updated':
      return `Media links updated: ${String(payload.song_title ?? 'song')}`;
    case 'suggestions_closed':
      return 'Suggestions closed';
    case 'suggestions_reopened':
      return 'Suggestions reopened';
    case 'suggestions_cleared':
      return payload.cleared_count
        ? `Leader cleared ${String(payload.cleared_count)} suggestion${Number(payload.cleared_count) === 1 ? '' : 's'}`
        : 'Leader cleared all suggestions';
    case 'voting_closed':
      return 'Voting closed';
    case 'votes_reset':
      return payload.message ? `Votes reset — ${String(payload.message)}` : 'Votes reset for re-vote';
    case 'suggestion_vetoed':
      return `Leader vetoed: ${String(payload.song_title ?? 'song')}`;
    case 'suggestion_withdrawn':
      return payload.removed_by_leader
        ? `Leader removed suggestion: ${String(payload.song_title ?? 'song')}`
        : `Suggestion removed: ${String(payload.song_title ?? 'song')}`;
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
  const [showLeaderActions, setShowLeaderActions] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [listFilters, setListFilters] = useState<SongSuggestionListFilters>(
    DEFAULT_SONG_SUGGESTION_LIST_FILTERS,
  );
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [overrideReasons, setOverrideReasons] = useState<Record<string, string>>({});
  const [detail, setDetail] = useState<Awaited<ReturnType<typeof getSongSuggestionGroupDetail>>>(null);
  const { upgradeDecision, clearUpgradePrompt, handleEntitlementError } = useUpgradePrompt();

  const loadDetail = useCallback(async (cancelled: () => boolean) => {
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

      if (cancelled()) {
        return;
      }

      if (result && bandId && result.group.band_id !== bandId) {
        navigate(`/app/${result.group.band_id}/songs/suggestions/${groupId}`, { replace: true });
        return;
      }

      setDetail(result);
      if (result && showConfirm) {
        const ranked = rankSongSuggestions(
          result.suggestions.filter((row) => row.status === 'active'),
        );
        const autoSelected = computeSongSuggestionAutoSelection(ranked, {
          targetSongCount: result.group.target_song_count,
          selectionMode: result.group.selection_mode,
          bandMemberCount: result.bandMemberCount,
        });
        setSelectedIds(new Set(autoSelected));
      }
    } catch (err) {
      if (!cancelled()) {
        setDetail(null);
        setLoadError(err instanceof Error ? err.message : 'Unable to load suggestion group.');
      }
    } finally {
      if (!cancelled()) {
        setLoading(false);
      }
    }
  }, [bandId, groupId, isLeader, navigate, showConfirm, user?.id]);

  useEffect(() => {
    if (!groupId) {
      return;
    }

    setDetail(null);
    let cancelled = false;

    void loadDetail(() => cancelled);

    return () => {
      cancelled = true;
    };
  }, [groupId, bandId, loadDetail]);

  const group = detail?.group;
  const bandMemberCount = detail?.bandMemberCount ?? 0;
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

  const autoSelectedIds = useMemo(() => {
    if (!group) {
      return [];
    }
    return computeSongSuggestionAutoSelection(rankedActive, {
      targetSongCount: group.target_song_count,
      selectionMode: group.selection_mode,
      bandMemberCount,
    });
  }, [bandMemberCount, group, rankedActive]);

  const autoSelectedIdSet = useMemo(() => new Set(autoSelectedIds), [autoSelectedIds]);

  const inclusiveSelectionActive = group
    ? isInclusiveSelectionActive(group.selection_mode, group.target_song_count, bandMemberCount)
    : false;

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
      currentUserId: user?.id ?? null,
    });
  }, [group, listFilters, suggestions, user?.id, votingOpen]);

  const { yourSuggestions, otherSuggestions } = useMemo(() => {
    const userId = user?.id ?? null;
    const yours: SongSuggestionWithSummary[] = [];
    const others: SongSuggestionWithSummary[] = [];

    for (const row of displayedSuggestions) {
      if (userId && row.suggested_by === userId) {
        yours.push(row);
      } else {
        others.push(row);
      }
    }

    return { yourSuggestions: yours, otherSuggestions: others };
  }, [displayedSuggestions, user?.id]);

  const canEditGroup = Boolean(
    isLeader &&
      group &&
      !['confirmed', 'archived', 'cancelled'].includes(group.status),
  );

  const showLeaderActionsEntry =
    isLeader && group && !['confirmed', 'cancelled'].includes(group.status);

  const membersVotedCount = useMemo(() => {
    const voters = new Set<string>();
    for (const row of activeSuggestions) {
      for (const vote of row.votes) {
        voters.add(vote.member_user_id);
      }
    }
    return voters.size;
  }, [activeSuggestions]);

  async function runAction(action: () => Promise<void>): Promise<boolean> {
    setActionBusy(true);
    setActionError(null);
    try {
      await action();
      await loadDetail(() => false);
      return true;
    } catch (err) {
      if (handleEntitlementError(err)) {
        return false;
      }
      setActionError(err instanceof Error ? err.message : 'Action failed.');
      return false;
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

  async function handleWithdraw(suggestion: SongSuggestionWithSummary): Promise<boolean> {
    const isOwn = user?.id != null && suggestion.suggested_by === user.id;
    const message =
      isLeader && !isOwn
        ? `Remove "${suggestion.song_title}" from this group? The member can suggest another song while suggestions are still open.`
        : `Remove "${suggestion.song_title}" from this group? You can suggest another song while suggestions are still open.`;

    if (!window.confirm(message)) {
      return false;
    }

    return runAction(async () => {
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

  async function handleUpdateDetails(
    suggestionId: string,
    input: UpdateSongSuggestionDetailsInput,
  ): Promise<boolean> {
    return runAction(async () => {
      await updateSongSuggestionDetails(suggestionId, input);
    });
  }

  async function handleClearAllSuggestions() {
    if (!groupId || activeSuggestions.length === 0) {
      return;
    }

    const message =
      activeSuggestions.length === 1
        ? 'Remove the only suggestion from this group? Members can suggest again while suggestions are still open.'
        : `Remove all ${activeSuggestions.length} suggestions from this group? Members can suggest again while suggestions are still open.`;

    if (!window.confirm(message)) {
      return;
    }

    await runAction(() => clearAllSongSuggestions(groupId));
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
      const inAutoSelection = autoSelectedIdSet.has(suggestionId);
      const overrideReason = overrideReasons[suggestionId]?.trim();
      return {
        suggestionId,
        overrideReason: !inAutoSelection && overrideReason ? overrideReason : null,
      };
    });

    if (selections.length === 0) {
      setActionError('Select at least one song to confirm.');
      return;
    }

    for (const selection of selections) {
      const inAutoSelection = autoSelectedIdSet.has(selection.suggestionId);
      if (!inAutoSelection && !selection.overrideReason) {
        setActionError('Provide an override reason for songs outside the proposed selection.');
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
      <SongsBandContextBar
        bandId={bandId}
        bandName={membership?.name}
        sectionNote="Song suggestions"
        switchPath={(nextBandId) => `/app/${nextBandId}/songs/suggestions`}
      />

      <header className="song-suggestions-header">
        <div>
          <p className="my-bands-eyebrow">Song suggestions</p>
          <div className="song-suggestions-title-row">
            <h1>{group.name}</h1>
            <span className={songSuggestionGroupStatusClass(group.status)}>
              {SONG_SUGGESTION_GROUP_STATUS_LABELS[group.status]}
            </span>
          </div>
          {group.description ? <p className="my-bands-lead">{group.description}</p> : null}
          <p className="song-suggestion-meta">
            {SONG_SUGGESTION_SELECTION_MODE_LABELS[group.selection_mode]} selection · Target{' '}
            {group.target_song_count} songs · suggestions close{' '}
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
          {group.selection_mode === 'inclusive' ? (
            <p className="song-suggestion-mode-note">
              {inclusiveSelectionActive
                ? SONG_SUGGESTION_INCLUSIVE_SELECTION_EXPLANATION
                : songSuggestionInclusiveSelectionPendingExplanation(bandMemberCount)}
            </p>
          ) : null}
        </div>
        <div className="song-suggestions-header-actions">
          {showLeaderActionsEntry ? (
            <button
              type="button"
              className="song-suggestion-leader-settings-btn"
              aria-label="Leader actions"
              onClick={() => setShowLeaderActions(true)}
            >
              <CogIcon />
            </button>
          ) : null}
          <Link
            to={`/app/${bandId}/songs/suggestions`}
            className="directory-btn directory-btn-secondary"
          >
            All groups
          </Link>
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

      {showLeaderActionsEntry && group ? (
        <SongSuggestionLeaderActionsModal
          open={showLeaderActions}
          group={group}
          canEditGroup={canEditGroup}
          votingOpen={votingOpen}
          actionBusy={actionBusy}
          activeSuggestionCount={activeSuggestions.length}
          onClose={() => setShowLeaderActions(false)}
          onEditGroup={() => {
            setShowLeaderActions(false);
            setShowEdit(true);
          }}
          onClearAll={() => void handleClearAllSuggestions()}
          onCloseSuggestions={() => void handleCloseSuggestions()}
          onReopenSuggestions={() => void handleReopenSuggestions()}
          onCloseVoting={() => void handleCloseVoting()}
          onResetVotes={() => void handleResetVotes()}
          onConfirmSelections={() => {
            setShowLeaderActions(false);
            setSelectedIds(new Set(autoSelectedIds));
            setShowConfirm(true);
          }}
        />
      ) : null}

      {group.status === 'confirmed' ? (
        <section className="panel">
          <h2>Confirmed outcome</h2>
          {isLeader && !group.skeleton_setlist_id ? (
            <div className="song-suggestion-leader-actions">
              <button
                type="button"
                className="directory-btn directory-btn-primary"
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
          <HeadingWithHelp
            as="h2"
            helpLabel="About confirming songs"
            help={
              <p>
                Select up to {group.target_song_count} songs (or override with a reason).
                {inclusiveSelectionActive
                  ? ` ${SONG_SUGGESTION_INCLUSIVE_SELECTION_EXPLANATION}`
                  : ' Tied scores are highlighted.'}
              </p>
            }
          >
            Confirm top songs
          </HeadingWithHelp>
          <ul className="song-suggestion-confirm-list">
            {rankedActive.map((row, index) => {
              const next = rankedActive[index + 1];
              const isTie =
                next &&
                next.vote_summary.score === row.vote_summary.score &&
                next.vote_summary.happy_count === row.vote_summary.happy_count;
              const checked = selectedIds.has(row.id);
              const inAutoSelection = autoSelectedIdSet.has(row.id);
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
                    {checked && !inAutoSelection ? (
                      <input
                        placeholder="Override reason (required outside proposed selection)"
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
              className="directory-btn directory-btn-secondary"
              onClick={() => setShowConfirm(false)}
              disabled={actionBusy}
            >
              Cancel
            </button>
            <button
              type="button"
              className="directory-btn directory-btn-primary"
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
          <button
            type="button"
            className="directory-btn directory-btn-primary"
            onClick={() => setShowSuggest(true)}
          >
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
            void loadDetail(() => false);
          }}
        />
      ) : null}

      {showSuggest && groupId ? (
        <SubmitSongSuggestionPanel
          bandId={bandId}
          groupId={groupId}
          isLeader={isLeader}
          currentUserId={user?.id ?? null}
          onClose={() => setShowSuggest(false)}
          onSubmitted={() => void loadDetail(() => false)}
        />
      ) : null}

      <SongSuggestionRankingTable
        bandId={bandId!}
        targetSongCount={group.target_song_count}
        selectionMode={group.selection_mode}
        bandMemberCount={bandMemberCount}
        autoSelectedIds={autoSelectedIds}
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
            currentUserId={user?.id ?? null}
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
          <>
            {yourSuggestions.length > 0 ? (
              <section className="song-suggestion-list-section" aria-label="Your suggestions">
                <h3>Your suggestions ({yourSuggestions.length})</h3>
                <div className="song-suggestion-cards-grid">
                  {yourSuggestions.map((row) => (
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
                      onWithdraw={(suggestion) => handleWithdraw(suggestion)}
                      onVeto={(suggestion) => void handleVeto(suggestion)}
                      canEdit={
                        group
                          ? canEditSongSuggestionDetails(row, group, user?.id ?? null, isLeader)
                          : false
                      }
                      onSaveDetails={(suggestionId, input) => handleUpdateDetails(suggestionId, input)}
                    />
                  ))}
                </div>
              </section>
            ) : null}
            {otherSuggestions.length > 0 ? (
              <section className="song-suggestion-list-section" aria-label="Other suggestions">
                <h3>Others ({otherSuggestions.length})</h3>
                <div className="song-suggestion-cards-grid">
                  {otherSuggestions.map((row) => (
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
                      onWithdraw={(suggestion) => handleWithdraw(suggestion)}
                      onVeto={(suggestion) => void handleVeto(suggestion)}
                      canEdit={
                        group
                          ? canEditSongSuggestionDetails(row, group, user?.id ?? null, isLeader)
                          : false
                      }
                      onSaveDetails={(suggestionId, input) => handleUpdateDetails(suggestionId, input)}
                    />
                  ))}
                </div>
              </section>
            ) : null}
          </>
        )}
      </section>

      {detail?.events.length ? (
        <details className="panel song-suggestion-collapsible-section">
          <summary className="song-suggestion-collapsible-summary">
            <div className="song-suggestion-collapsible-summary-text">
              <h2>Activity</h2>
              <p>
                {detail.events.length} event{detail.events.length === 1 ? '' : 's'}
              </p>
            </div>
            <span className="song-suggestion-collapsible-chevron" aria-hidden="true" />
          </summary>
          <div className="song-suggestion-collapsible-body">
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
          </div>
        </details>
      ) : null}

      {upgradeDecision ? (
        <UpgradePromptModal decision={upgradeDecision} onClose={clearUpgradePrompt} />
      ) : null}
    </div>
  );
}
