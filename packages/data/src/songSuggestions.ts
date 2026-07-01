import { getCurrentSession } from './auth';
import { getBandieClient } from './context';
import { addSetlistItem, createBandSetlist } from './setlists';
import { createBandSong, listBandSongs } from './songs';

export type SongSuggestionGroupStatus =
  | 'draft'
  | 'open_for_suggestions'
  | 'suggestions_closed'
  | 'voting_closed'
  | 'confirmed'
  | 'archived'
  | 'cancelled';

export type SongSuggestionVoteState = 'happy_to_play' | 'meh' | 'rather_not';

export type SongSuggestionStatus =
  | 'active'
  | 'withdrawn'
  | 'leader_vetoed'
  | 'selected'
  | 'not_selected'
  | 'converted_to_catalogue';

export type VoteVisibility = 'member_visible' | 'aggregate_only';

export type VocalSuitability =
  | 'any'
  | 'male_vocal'
  | 'female_vocal'
  | 'mixed_vocal'
  | 'instrumental';

export type SongSuggestionGroup = {
  id: string;
  band_id: string;
  created_by: string;
  updated_by: string | null;
  name: string;
  description: string | null;
  preferred_genres: string[];
  preferred_decades: string[];
  vocal_suitability: VocalSuitability;
  target_song_count: number;
  max_suggestions_per_member: number | null;
  suggestion_closes_at: string;
  voting_closes_at: string | null;
  vote_visibility: VoteVisibility;
  allow_member_comments: boolean;
  allow_vote_changes: boolean;
  tie_break_mode: string;
  status: SongSuggestionGroupStatus;
  suggestions_closed_at: string | null;
  voting_closed_at: string | null;
  confirmed_at: string | null;
  confirmed_by: string | null;
  skeleton_setlist_id: string | null;
  created_at: string;
  updated_at: string;
};

export type SongSuggestion = {
  id: string;
  group_id: string;
  band_id: string;
  suggested_by: string;
  song_title: string;
  artist: string;
  suggested_genre: string | null;
  decade: string | null;
  vocal_suitability: VocalSuitability | null;
  song_key: string | null;
  estimated_length_seconds: number | null;
  difficulty_estimate: string;
  youtube_url: string | null;
  spotify_url: string | null;
  other_media_url: string | null;
  rationale: string | null;
  status: SongSuggestionStatus;
  leader_vetoed_at: string | null;
  leader_vetoed_by: string | null;
  leader_veto_reason: string | null;
  final_rank: number | null;
  final_score: number | null;
  created_at: string;
  updated_at: string;
};

export type SongSuggestionVote = {
  id: string;
  suggestion_id: string;
  group_id: string;
  band_id: string;
  member_user_id: string;
  vote_state: SongSuggestionVoteState;
  comment: string | null;
  display_name: string | null;
  username: string | null;
};

export type SongSuggestionVoteSummary = {
  suggestion_id: string;
  total_votes: number;
  happy_count: number;
  meh_count: number;
  rather_not_count: number;
  score: number;
};

export type SongSuggestionWithSummary = SongSuggestion & {
  vote_summary: SongSuggestionVoteSummary;
  votes: SongSuggestionVote[];
  my_vote: SongSuggestionVoteState | null;
  proposed_rank: number;
  suggester_display_name: string | null;
};

export type SongSuggestionGroupListItem = SongSuggestionGroup & {
  suggestion_count: number;
  vote_count: number;
  active_member_count: number;
};

export type SongSuggestionGroupEvent = {
  id: string;
  group_id: string;
  band_id: string;
  actor_user_id: string | null;
  event_type: string;
  event_payload: Record<string, unknown>;
  created_at: string;
};

export type SongSuggestionConfirmedSong = {
  id: string;
  group_id: string;
  suggestion_id: string;
  final_rank: number;
  final_score: number;
  song_title: string;
  artist: string;
  selection_override: boolean;
  selection_override_reason: string | null;
  created_catalogue_song_id: string | null;
};

export const SONG_SUGGESTION_LEADER_ONLY_MESSAGE =
  'Only band leaders can create or manage song suggestion groups.';

export const SONG_SUGGESTION_GENRE_OPTIONS = [
  'Rock',
  'Blues',
  'Swing',
  'Jazz',
  'Punk',
  'Soul',
  'Indie',
  'Pop',
  'Funk',
  'Acoustic',
] as const;

export const SONG_SUGGESTION_DECADE_OPTIONS = [
  '1960s',
  '1970s',
  '1980s',
  '1990s',
  '2000s',
  '2010s',
  'Current',
] as const;

export const SONG_SUGGESTION_VOTE_LABELS: Record<SongSuggestionVoteState, string> = {
  happy_to_play: 'Happy to play',
  meh: 'Meh',
  rather_not: 'Rather not',
};

export const SONG_SUGGESTION_GROUP_STATUS_LABELS: Record<SongSuggestionGroupStatus, string> = {
  draft: 'Draft',
  open_for_suggestions: 'Open for suggestions',
  suggestions_closed: 'Suggestions closed',
  voting_closed: 'Voting closed',
  confirmed: 'Confirmed',
  archived: 'Archived',
  cancelled: 'Cancelled',
};

export function songSuggestionGroupStatusClass(status: SongSuggestionGroupStatus): string {
  return `song-suggestion-status song-suggestion-status-${status}`;
}

export function rankSongSuggestions(
  rows: SongSuggestionWithSummary[],
): SongSuggestionWithSummary[] {
  return [...rows]
    .sort((a, b) => {
      if (b.vote_summary.score !== a.vote_summary.score) {
        return b.vote_summary.score - a.vote_summary.score;
      }
      if (b.vote_summary.happy_count !== a.vote_summary.happy_count) {
        return b.vote_summary.happy_count - a.vote_summary.happy_count;
      }
      if (a.vote_summary.rather_not_count !== b.vote_summary.rather_not_count) {
        return a.vote_summary.rather_not_count - b.vote_summary.rather_not_count;
      }
      if (b.vote_summary.total_votes !== a.vote_summary.total_votes) {
        return b.vote_summary.total_votes - a.vote_summary.total_votes;
      }
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    })
    .map((row, index) => ({ ...row, proposed_rank: index + 1 }));
}

export function isSongSuggestionSameRankingTier(
  a: SongSuggestionWithSummary,
  b: SongSuggestionWithSummary,
): boolean {
  return (
    a.vote_summary.score === b.vote_summary.score &&
    a.vote_summary.happy_count === b.vote_summary.happy_count
  );
}

export function isSongSuggestionInAutoSelection(
  proposedRank: number,
  targetSongCount: number,
): boolean {
  return proposedRank > 0 && proposedRank <= targetSongCount;
}

export function isSongSuggestionCutoffTieCandidate(
  row: SongSuggestionWithSummary,
  ranked: SongSuggestionWithSummary[],
  targetSongCount: number,
): boolean {
  if (
    row.proposed_rank !== targetSongCount &&
    row.proposed_rank !== targetSongCount + 1
  ) {
    return false;
  }

  const index = ranked.findIndex((entry) => entry.id === row.id);
  if (index < 0) {
    return false;
  }

  const previous = ranked[index - 1];
  const next = ranked[index + 1];
  return (
    (previous != null && isSongSuggestionSameRankingTier(row, previous)) ||
    (next != null && isSongSuggestionSameRankingTier(row, next))
  );
}

function mapGroup(row: Record<string, unknown>): SongSuggestionGroup {
  return row as unknown as SongSuggestionGroup;
}

function mapSuggestion(row: Record<string, unknown>): SongSuggestion {
  return row as unknown as SongSuggestion;
}

async function loadMemberProfiles(userIds: string[]): Promise<
  Map<string, { display_name: string | null; username: string | null }>
> {
  const profileMap = new Map<string, { display_name: string | null; username: string | null }>();
  if (userIds.length === 0) {
    return profileMap;
  }

  const client = getBandieClient();
  const { data, error } = await client
    .from('bandie_profiles')
    .select('user_id, display_name, username')
    .in('user_id', userIds);

  if (error) {
    throw new Error(error.message);
  }

  for (const profile of data ?? []) {
    profileMap.set(profile.user_id as string, {
      display_name: (profile.display_name as string | null) ?? null,
      username: (profile.username as string | null) ?? null,
    });
  }

  return profileMap;
}

export async function listBandSongSuggestionGroups(
  bandId: string,
): Promise<SongSuggestionGroupListItem[]> {
  const client = getBandieClient();
  const { data: groups, error } = await client
    .from('bandie_song_suggestion_groups')
    .select('*')
    .eq('band_id', bandId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const groupRows = (groups ?? []).map((row) => mapGroup(row as Record<string, unknown>));
  if (groupRows.length === 0) {
    return [];
  }

  const groupIds = groupRows.map((group) => group.id);

  const [{ data: suggestions }, { data: votes }, { count: memberCount }] = await Promise.all([
    client
      .from('bandie_song_suggestions')
      .select('id, group_id')
      .in('group_id', groupIds)
      .neq('status', 'withdrawn'),
    client.from('bandie_song_suggestion_votes').select('id, group_id').in('group_id', groupIds),
    client
      .from('bandie_band_members')
      .select('id', { count: 'exact', head: true })
      .eq('band_id', bandId)
      .eq('status', 'active'),
  ]);

  const suggestionCounts = new Map<string, number>();
  for (const row of suggestions ?? []) {
    const groupId = row.group_id as string;
    suggestionCounts.set(groupId, (suggestionCounts.get(groupId) ?? 0) + 1);
  }

  const voteCounts = new Map<string, number>();
  for (const row of votes ?? []) {
    const groupId = row.group_id as string;
    voteCounts.set(groupId, (voteCounts.get(groupId) ?? 0) + 1);
  }

  return groupRows.map((group) => ({
    ...group,
    suggestion_count: suggestionCounts.get(group.id) ?? 0,
    vote_count: voteCounts.get(group.id) ?? 0,
    active_member_count: memberCount ?? 0,
  }));
}

export async function getSongSuggestionGroup(groupId: string): Promise<SongSuggestionGroup | null> {
  const client = getBandieClient();
  const { data, error } = await client
    .from('bandie_song_suggestion_groups')
    .select('*')
    .eq('id', groupId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapGroup(data as Record<string, unknown>) : null;
}

export type CreateSongSuggestionGroupInput = {
  bandId: string;
  name: string;
  description?: string | null;
  preferredGenres?: string[];
  preferredDecades?: string[];
  vocalSuitability?: VocalSuitability;
  targetSongCount: number;
  maxSuggestionsPerMember?: number | null;
  suggestionClosesAt: string;
  votingClosesAt?: string | null;
  voteVisibility?: VoteVisibility;
  allowVoteChanges?: boolean;
};

export async function createSongSuggestionGroup(
  input: CreateSongSuggestionGroupInput,
): Promise<SongSuggestionGroup> {
  const session = await getCurrentSession();
  if (!session?.user) {
    throw new Error('Must be signed in to create a suggestion group.');
  }

  const client = getBandieClient();
  const { data, error } = await client
    .from('bandie_song_suggestion_groups')
    .insert({
      band_id: input.bandId,
      created_by: session.user.id,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      preferred_genres: input.preferredGenres ?? [],
      preferred_decades: input.preferredDecades ?? [],
      vocal_suitability: input.vocalSuitability ?? 'any',
      target_song_count: input.targetSongCount,
      max_suggestions_per_member: input.maxSuggestionsPerMember ?? null,
      suggestion_closes_at: input.suggestionClosesAt,
      voting_closes_at: input.votingClosesAt ?? null,
      vote_visibility: input.voteVisibility ?? 'member_visible',
      allow_vote_changes: input.allowVoteChanges ?? true,
      status: 'open_for_suggestions',
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  await client.rpc('bandie_log_song_suggestion_event', {
    p_group_id: data.id,
    p_band_id: input.bandId,
    p_event_type: 'group_created',
    p_payload: { name: input.name.trim() },
  });

  return mapGroup(data as Record<string, unknown>);
}

export type UpdateSongSuggestionGroupInput = {
  name?: string;
  description?: string | null;
  preferredGenres?: string[];
  preferredDecades?: string[];
  vocalSuitability?: VocalSuitability;
  targetSongCount?: number;
  suggestionClosesAt?: string;
  votingClosesAt?: string | null;
  voteVisibility?: VoteVisibility;
  allowVoteChanges?: boolean;
};

const NON_EDITABLE_GROUP_STATUSES: SongSuggestionGroupStatus[] = [
  'confirmed',
  'archived',
  'cancelled',
];

export async function updateSongSuggestionGroup(
  groupId: string,
  input: UpdateSongSuggestionGroupInput,
): Promise<SongSuggestionGroup> {
  const session = await getCurrentSession();
  if (!session?.user) {
    throw new Error('Must be signed in to update a suggestion group.');
  }

  const existing = await getSongSuggestionGroup(groupId);
  if (!existing) {
    throw new Error('Suggestion group not found.');
  }
  if (NON_EDITABLE_GROUP_STATUSES.includes(existing.status)) {
    throw new Error('This group can no longer be edited.');
  }

  const suggestionClosesAt = input.suggestionClosesAt ?? existing.suggestion_closes_at;
  const votingClosesAt =
    input.votingClosesAt !== undefined ? input.votingClosesAt : existing.voting_closes_at;

  if (votingClosesAt && new Date(votingClosesAt).getTime() < new Date(suggestionClosesAt).getTime()) {
    throw new Error('Voting must close on or after suggestions close.');
  }

  const client = getBandieClient();
  const { data, error } = await client
    .from('bandie_song_suggestion_groups')
    .update({
      updated_by: session.user.id,
      ...(input.name !== undefined && { name: input.name.trim() }),
      ...(input.description !== undefined && { description: input.description?.trim() || null }),
      ...(input.preferredGenres !== undefined && { preferred_genres: input.preferredGenres }),
      ...(input.preferredDecades !== undefined && { preferred_decades: input.preferredDecades }),
      ...(input.vocalSuitability !== undefined && { vocal_suitability: input.vocalSuitability }),
      ...(input.targetSongCount !== undefined && { target_song_count: input.targetSongCount }),
      ...(input.suggestionClosesAt !== undefined && { suggestion_closes_at: input.suggestionClosesAt }),
      ...(input.votingClosesAt !== undefined && { voting_closes_at: input.votingClosesAt }),
      ...(input.voteVisibility !== undefined && { vote_visibility: input.voteVisibility }),
      ...(input.allowVoteChanges !== undefined && { allow_vote_changes: input.allowVoteChanges }),
    })
    .eq('id', groupId)
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  await client.rpc('bandie_log_song_suggestion_event', {
    p_group_id: groupId,
    p_band_id: existing.band_id,
    p_event_type: 'group_updated',
    p_payload: {},
  });

  return mapGroup(data as Record<string, unknown>);
}

export type SubmitSongSuggestionInput = {
  songTitle: string;
  artist: string;
  suggestedGenre?: string | null;
  decade?: string | null;
  vocalSuitability?: VocalSuitability | null;
  songKey?: string | null;
  estimatedLengthSeconds?: number | null;
  difficultyEstimate?: string;
  youtubeUrl?: string | null;
  spotifyUrl?: string | null;
  otherMediaUrl?: string | null;
  rationale?: string | null;
};

export async function findSimilarSongSuggestions(
  groupId: string,
  songTitle: string,
  artist: string,
): Promise<SongSuggestion[]> {
  const client = getBandieClient();
  const title = songTitle.trim().toLowerCase();
  const artistNorm = artist.trim().toLowerCase();

  const { data, error } = await client
    .from('bandie_song_suggestions')
    .select('*')
    .eq('group_id', groupId)
    .in('status', ['active', 'selected', 'not_selected']);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? [])
    .map((row) => mapSuggestion(row as Record<string, unknown>))
    .filter(
      (row) =>
        row.song_title.trim().toLowerCase() === title &&
        row.artist.trim().toLowerCase() === artistNorm,
    );
}

export async function submitSongSuggestion(
  groupId: string,
  input: SubmitSongSuggestionInput,
): Promise<string> {
  const client = getBandieClient();
  const { data, error } = await client.rpc('bandie_submit_song_suggestion', {
    p_group_id: groupId,
    p_song_title: input.songTitle,
    p_artist: input.artist,
    p_suggested_genre: input.suggestedGenre ?? null,
    p_decade: input.decade ?? null,
    p_vocal_suitability: input.vocalSuitability ?? null,
    p_song_key: input.songKey ?? null,
    p_estimated_length_seconds: input.estimatedLengthSeconds ?? null,
    p_difficulty_estimate: input.difficultyEstimate ?? 'unknown',
    p_youtube_url: input.youtubeUrl ?? null,
    p_spotify_url: input.spotifyUrl ?? null,
    p_other_media_url: input.otherMediaUrl ?? null,
    p_rationale: input.rationale ?? null,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data as string;
}

export async function voteOnSongSuggestion(
  suggestionId: string,
  voteState: SongSuggestionVoteState,
  comment?: string | null,
): Promise<void> {
  const client = getBandieClient();
  const { error } = await client.rpc('bandie_vote_on_song_suggestion', {
    p_suggestion_id: suggestionId,
    p_vote_state: voteState,
    p_comment: comment ?? null,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function clearSongSuggestionVote(suggestionId: string): Promise<void> {
  const client = getBandieClient();
  const { error } = await client.rpc('bandie_clear_song_suggestion_vote', {
    p_suggestion_id: suggestionId,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function withdrawSongSuggestion(suggestionId: string): Promise<void> {
  const client = getBandieClient();
  const { error } = await client.rpc('bandie_withdraw_song_suggestion', {
    p_suggestion_id: suggestionId,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function closeSongSuggestions(groupId: string): Promise<void> {
  const client = getBandieClient();
  const { error } = await client.rpc('bandie_close_song_suggestions', { p_group_id: groupId });
  if (error) {
    throw new Error(error.message);
  }
}

export async function reopenSongSuggestions(
  groupId: string,
  newClosesAt: string,
): Promise<void> {
  const client = getBandieClient();
  const { error } = await client.rpc('bandie_reopen_song_suggestions', {
    p_group_id: groupId,
    p_new_closes_at: newClosesAt,
  });
  if (error) {
    throw new Error(error.message);
  }
}

export async function closeSongSuggestionVoting(groupId: string): Promise<void> {
  const client = getBandieClient();
  const { error } = await client.rpc('bandie_close_song_suggestion_voting', {
    p_group_id: groupId,
  });
  if (error) {
    throw new Error(error.message);
  }
}

export async function vetoSongSuggestion(suggestionId: string, reason: string): Promise<void> {
  const client = getBandieClient();
  const { error } = await client.rpc('bandie_veto_song_suggestion', {
    p_suggestion_id: suggestionId,
    p_reason: reason,
  });
  if (error) {
    throw new Error(error.message);
  }
}

export async function resetSongSuggestionVotes(
  groupId: string,
  message?: string | null,
): Promise<void> {
  const client = getBandieClient();
  const { error } = await client.rpc('bandie_reset_song_suggestion_votes', {
    p_group_id: groupId,
    p_message: message ?? null,
  });
  if (error) {
    throw new Error(error.message);
  }
}

export type ConfirmSelectionItem = {
  suggestionId: string;
  overrideReason?: string | null;
};

export async function confirmSongSuggestionGroup(
  groupId: string,
  selections: ConfirmSelectionItem[],
): Promise<void> {
  const client = getBandieClient();
  const { error } = await client.rpc('bandie_confirm_song_suggestion_group', {
    p_group_id: groupId,
    p_selections: selections.map((item) => ({
      suggestion_id: item.suggestionId,
      override_reason: item.overrideReason ?? null,
    })),
  });
  if (error) {
    throw new Error(error.message);
  }
}

export async function listSongSuggestionGroupEvents(
  groupId: string,
): Promise<SongSuggestionGroupEvent[]> {
  const client = getBandieClient();
  const { data, error } = await client
    .from('bandie_song_suggestion_group_events')
    .select('*')
    .eq('group_id', groupId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => ({
    id: row.id as string,
    group_id: row.group_id as string,
    band_id: row.band_id as string,
    actor_user_id: (row.actor_user_id as string | null) ?? null,
    event_type: row.event_type as string,
    event_payload: (row.event_payload as Record<string, unknown>) ?? {},
    created_at: row.created_at as string,
  }));
}

export async function listConfirmedSongSuggestions(
  groupId: string,
): Promise<SongSuggestionConfirmedSong[]> {
  const client = getBandieClient();
  const { data, error } = await client
    .from('bandie_song_suggestion_confirmed_songs')
    .select('*')
    .eq('group_id', groupId)
    .order('final_rank', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => ({
    id: row.id as string,
    group_id: row.group_id as string,
    suggestion_id: row.suggestion_id as string,
    final_rank: row.final_rank as number,
    final_score: row.final_score as number,
    song_title: row.song_title as string,
    artist: row.artist as string,
    selection_override: Boolean(row.selection_override),
    selection_override_reason: (row.selection_override_reason as string | null) ?? null,
    created_catalogue_song_id: (row.created_catalogue_song_id as string | null) ?? null,
  }));
}

export async function getSongSuggestionGroupDetail(
  groupId: string,
  options: { viewerUserId?: string | null; isLeader?: boolean } = {},
): Promise<{
  group: SongSuggestionGroup;
  suggestions: SongSuggestionWithSummary[];
  events: SongSuggestionGroupEvent[];
  confirmed: SongSuggestionConfirmedSong[];
} | null> {
  const group = await getSongSuggestionGroup(groupId);
  if (!group) {
    return null;
  }

  const client = getBandieClient();
  const session = await getCurrentSession();
  const viewerId = options.viewerUserId ?? session?.user?.id ?? null;
  const isLeader = options.isLeader ?? false;

  const [{ data: suggestions }, { data: summaries }, { data: votes }, events, confirmed] =
    await Promise.all([
      client
        .from('bandie_song_suggestions')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: true }),
      client.from('bandie_song_suggestion_vote_summary').select('*').eq('group_id', groupId),
      client.from('bandie_song_suggestion_votes').select('*').eq('group_id', groupId),
      listSongSuggestionGroupEvents(groupId),
      group.status === 'confirmed' ? listConfirmedSongSuggestions(groupId) : Promise.resolve([]),
    ]);

  const summaryMap = new Map<string, SongSuggestionVoteSummary>();
  for (const row of summaries ?? []) {
    summaryMap.set(row.suggestion_id as string, {
      suggestion_id: row.suggestion_id as string,
      total_votes: Number(row.total_votes ?? 0),
      happy_count: Number(row.happy_count ?? 0),
      meh_count: Number(row.meh_count ?? 0),
      rather_not_count: Number(row.rather_not_count ?? 0),
      score: Number(row.score ?? 0),
    });
  }

  const votesBySuggestion = new Map<string, SongSuggestionVote[]>();
  const profileUserIds = new Set<string>();
  for (const row of votes ?? []) {
    profileUserIds.add(row.member_user_id as string);
  }
  for (const row of suggestions ?? []) {
    profileUserIds.add(row.suggested_by as string);
  }
  const profiles = await loadMemberProfiles([...profileUserIds]);

  for (const row of votes ?? []) {
    const suggestionId = row.suggestion_id as string;
    const profile = profiles.get(row.member_user_id as string);
    const vote: SongSuggestionVote = {
      id: row.id as string,
      suggestion_id: suggestionId,
      group_id: row.group_id as string,
      band_id: row.band_id as string,
      member_user_id: row.member_user_id as string,
      vote_state: row.vote_state as SongSuggestionVoteState,
      comment: (row.comment as string | null) ?? null,
      display_name: profile?.display_name ?? null,
      username: profile?.username ?? null,
    };
    const existing = votesBySuggestion.get(suggestionId) ?? [];
    existing.push(vote);
    votesBySuggestion.set(suggestionId, existing);
  }

  const hideMemberVotes = group.vote_visibility === 'aggregate_only' && !isLeader;

  const withSummary: SongSuggestionWithSummary[] = (suggestions ?? [])
    .filter((row) => (row.status as string) !== 'withdrawn')
    .map((row) => {
    const suggestion = mapSuggestion(row as Record<string, unknown>);
    const summary = summaryMap.get(suggestion.id) ?? {
      suggestion_id: suggestion.id,
      total_votes: 0,
      happy_count: 0,
      meh_count: 0,
      rather_not_count: 0,
      score: 0,
    };
    const suggestionVotes = votesBySuggestion.get(suggestion.id) ?? [];
    const myVote =
      suggestionVotes.find((vote) => vote.member_user_id === viewerId)?.vote_state ?? null;
    const suggesterProfile = profiles.get(suggestion.suggested_by);

    return {
      ...suggestion,
      vote_summary: summary,
      votes: hideMemberVotes ? [] : suggestionVotes,
      my_vote: myVote,
      proposed_rank: 0,
      suggester_display_name:
        suggesterProfile?.display_name ?? suggesterProfile?.username ?? null,
    };
  });

  const ranked = rankSongSuggestions(withSummary.filter((row) => row.status === 'active'));

  const rankedIds = new Set(ranked.map((row) => row.id));
  const others = withSummary
    .filter((row) => !rankedIds.has(row.id))
    .map((row, index) => ({ ...row, proposed_rank: ranked.length + index + 1 }));

  return {
    group,
    suggestions: [...ranked, ...others],
    events,
    confirmed,
  };
}

export function isSongSuggestionVotingOpen(group: SongSuggestionGroup): boolean {
  if (!['open_for_suggestions', 'suggestions_closed'].includes(group.status)) {
    return false;
  }
  if (group.voting_closed_at) {
    return false;
  }
  if (group.voting_closes_at && new Date(group.voting_closes_at).getTime() < Date.now()) {
    return false;
  }
  return true;
}

export function isSongSuggestionSubmitOpen(group: SongSuggestionGroup): boolean {
  return (
    group.status === 'open_for_suggestions' &&
    new Date(group.suggestion_closes_at).getTime() > Date.now()
  );
}

export type SongSuggestionVoteFilter =
  | 'all'
  | 'needs_my_vote'
  | 'voted_happy'
  | 'voted_meh'
  | 'voted_rather_not';

export type SongSuggestionSortKey =
  | 'score'
  | 'happy_votes'
  | 'rather_not_votes'
  | 'newest'
  | 'artist'
  | 'title';

export type SongSuggestionListFilters = {
  searchQuery: string;
  voteFilter: SongSuggestionVoteFilter;
  suggestedByUserId: string;
  genre: string;
  decade: string;
  sortBy: SongSuggestionSortKey;
  topNOnly: boolean;
};

export const DEFAULT_SONG_SUGGESTION_LIST_FILTERS: SongSuggestionListFilters = {
  searchQuery: '',
  voteFilter: 'all',
  suggestedByUserId: '',
  genre: '',
  decade: '',
  sortBy: 'score',
  topNOnly: false,
};

export type SongSuggestionFilterOptions = {
  suggesters: Array<{ userId: string; label: string }>;
  genres: string[];
  decades: string[];
};

export function collectSongSuggestionFilterOptions(
  rows: SongSuggestionWithSummary[],
  suggesterLabels: Map<string, string> = new Map(),
): SongSuggestionFilterOptions {
  const suggesterMap = new Map<string, string>();
  const genres = new Set<string>();
  const decades = new Set<string>();

  for (const row of rows) {
    if (!suggesterMap.has(row.suggested_by)) {
      suggesterMap.set(
        row.suggested_by,
        suggesterLabels.get(row.suggested_by) ??
          row.suggester_display_name ??
          'Band member',
      );
    }

    if (row.suggested_genre?.trim()) {
      genres.add(row.suggested_genre.trim());
    }
    if (row.decade?.trim()) {
      decades.add(row.decade.trim());
    }
  }

  return {
    suggesters: [...suggesterMap.entries()]
      .map(([userId, label]) => ({ userId, label }))
      .sort((a, b) => a.label.localeCompare(b.label)),
    genres: [...genres].sort((a, b) => a.localeCompare(b)),
    decades: [...decades].sort((a, b) => a.localeCompare(b)),
  };
}

function matchesSongSuggestionSearch(row: SongSuggestionWithSummary, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return true;
  }

  return (
    row.song_title.toLowerCase().includes(normalized) ||
    row.artist.toLowerCase().includes(normalized)
  );
}

function matchesSongSuggestionVoteFilter(
  row: SongSuggestionWithSummary,
  voteFilter: SongSuggestionVoteFilter,
  votingOpen: boolean,
): boolean {
  switch (voteFilter) {
    case 'all':
      return true;
    case 'needs_my_vote':
      return row.status === 'active' && votingOpen && row.my_vote === null;
    case 'voted_happy':
      return row.my_vote === 'happy_to_play';
    case 'voted_meh':
      return row.my_vote === 'meh';
    case 'voted_rather_not':
      return row.my_vote === 'rather_not';
    default:
      return true;
  }
}

function sortSongSuggestionsByKey(
  rows: SongSuggestionWithSummary[],
  sortBy: SongSuggestionSortKey,
): SongSuggestionWithSummary[] {
  const sorted = [...rows];

  switch (sortBy) {
    case 'score':
      return rankSongSuggestions(sorted);
    case 'happy_votes':
      sorted.sort(
        (a, b) =>
          b.vote_summary.happy_count - a.vote_summary.happy_count ||
          b.vote_summary.score - a.vote_summary.score,
      );
      break;
    case 'rather_not_votes':
      sorted.sort(
        (a, b) =>
          b.vote_summary.rather_not_count - a.vote_summary.rather_not_count ||
          a.vote_summary.score - b.vote_summary.score,
      );
      break;
    case 'newest':
      sorted.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
      break;
    case 'artist':
      sorted.sort(
        (a, b) =>
          a.artist.localeCompare(b.artist) || a.song_title.localeCompare(b.song_title),
      );
      break;
    case 'title':
      sorted.sort(
        (a, b) =>
          a.song_title.localeCompare(b.song_title) || a.artist.localeCompare(b.artist),
      );
      break;
    default:
      break;
  }

  return sorted.map((row, index) => ({ ...row, proposed_rank: index + 1 }));
}

export function filterAndSortSongSuggestions(
  rows: SongSuggestionWithSummary[],
  filters: SongSuggestionListFilters,
  options: { targetSongCount: number; votingOpen: boolean },
): SongSuggestionWithSummary[] {
  const rankedActive = rankSongSuggestions(rows.filter((row) => row.status === 'active'));

  const filtered = rows.filter((row) => {
    if (!matchesSongSuggestionSearch(row, filters.searchQuery)) {
      return false;
    }

    if (filters.suggestedByUserId && row.suggested_by !== filters.suggestedByUserId) {
      return false;
    }

    if (filters.genre && (row.suggested_genre ?? '').trim() !== filters.genre) {
      return false;
    }

    if (filters.decade && (row.decade ?? '').trim() !== filters.decade) {
      return false;
    }

    if (!matchesSongSuggestionVoteFilter(row, filters.voteFilter, options.votingOpen)) {
      return false;
    }

    if (filters.topNOnly) {
      if (row.status !== 'active') {
        return false;
      }
      const ranked = rankedActive.find((active) => active.id === row.id);
      if (!ranked || ranked.proposed_rank > options.targetSongCount) {
        return false;
      }
    }

    return true;
  });

  return sortSongSuggestionsByKey(filtered, filters.sortBy);
}

export async function createSkeletonSetlistFromSuggestionGroup(
  groupId: string,
  options: { setlistTitle?: string; vibe?: string | null } = {},
): Promise<{ setlistId: string }> {
  const detail = await getSongSuggestionGroupDetail(groupId, { isLeader: true });
  if (!detail || detail.group.status !== 'confirmed') {
    throw new Error('Group must be confirmed before creating a setlist.');
  }
  if (detail.confirmed.length === 0) {
    throw new Error('No confirmed songs to add to a setlist.');
  }

  const bandId = detail.group.band_id;
  const catalogue = await listBandSongs(bandId);
  const catalogueByTitleArtist = new Map(
    catalogue.map((song) => [
      `${song.title.trim().toLowerCase()}::${(song.artist ?? '').trim().toLowerCase()}`,
      song,
    ]),
  );

  const setlist = await createBandSetlist({
    bandId,
    title: options.setlistTitle?.trim() || `${detail.group.name} setlist`,
    description: detail.group.description ?? undefined,
    vibe: options.vibe ?? detail.group.preferred_genres[0] ?? undefined,
    status: 'draft',
  });

  const client = getBandieClient();

  for (const confirmed of detail.confirmed) {
    const key = `${confirmed.song_title.trim().toLowerCase()}::${confirmed.artist.trim().toLowerCase()}`;
    let songId = catalogueByTitleArtist.get(key)?.id ?? confirmed.created_catalogue_song_id;

    if (!songId) {
      const source = detail.suggestions.find((row) => row.id === confirmed.suggestion_id);
      const created = await createBandSong({
        bandId,
        title: confirmed.song_title,
        artist: confirmed.artist,
        genre: source?.suggested_genre ?? undefined,
        songKey: source?.song_key ?? undefined,
        durationSeconds: source?.estimated_length_seconds ?? undefined,
      });
      songId = created.id;

      await client
        .from('bandie_song_suggestion_confirmed_songs')
        .update({ created_catalogue_song_id: songId })
        .eq('id', confirmed.id);

      await client
        .from('bandie_song_suggestions')
        .update({ status: 'converted_to_catalogue' })
        .eq('id', confirmed.suggestion_id);
    }

    const item = await addSetlistItem(bandId, setlist.id, songId);
    await client
      .from('bandie_song_suggestion_confirmed_songs')
      .update({ created_setlist_item_id: item.id })
      .eq('id', confirmed.id);
  }

  await client
    .from('bandie_song_suggestion_groups')
    .update({ skeleton_setlist_id: setlist.id })
    .eq('id', groupId);

  await client.rpc('bandie_log_song_suggestion_event', {
    p_group_id: groupId,
    p_band_id: bandId,
    p_event_type: 'setlist_created',
    p_payload: { setlist_id: setlist.id },
  });

  return { setlistId: setlist.id };
}
