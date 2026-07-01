import { getBandieClient } from './context';
import { getCurrentSession } from './auth';

export type OpenMicSongReadiness = 'not_ready' | 'partial' | 'ready' | 'locked';
export type OpenMicLiveStatus =
  | 'queued'
  | 'called'
  | 'on_deck'
  | 'playing'
  | 'completed'
  | 'skipped'
  | 'cancelled';
export type OpenMicSlotStatus = 'open' | 'partial' | 'filled' | 'locked';
export type OpenMicAssignmentStatus =
  | 'requested'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'withdrawn'
  | 'backup';
export type OpenMicSuggestionStatus = 'pending' | 'approved' | 'rejected';

export type OpenMicSong = {
  id: string;
  event_id: string;
  source_song_id: string | null;
  source_type: string;
  title: string;
  artist: string | null;
  song_key: string | null;
  duration_seconds: number | null;
  bpm: number | null;
  genre: string | null;
  difficulty: string | null;
  notes: string | null;
  readiness_status: OpenMicSongReadiness;
  readiness_override: string | null;
  sort_order: number;
  live_status: OpenMicLiveStatus;
  created_at: string;
  updated_at: string;
};

export type OpenMicSongSlot = {
  id: string;
  event_song_id: string;
  slot_name: string;
  required: boolean;
  min_players: number;
  max_players: number;
  status: OpenMicSlotStatus;
  public_signup_enabled: boolean;
  notes: string | null;
  sort_order: number;
  enabled: boolean;
  part_template_id: string | null;
  house_band_member_id: string | null;
  created_at: string;
  updated_at: string;
};

export type OpenMicPlayer = {
  id: string;
  event_id: string;
  user_id: string | null;
  display_name: string;
  email: string | null;
  phone: string | null;
  primary_instrument: string | null;
  profile_notes: string | null;
  is_guest: boolean;
  is_house_band: boolean;
  created_at: string;
  updated_at: string;
};

export type OpenMicAssignment = {
  id: string;
  event_id: string;
  event_song_id: string;
  song_slot_id: string;
  player_id: string;
  status: OpenMicAssignmentStatus;
  assigned_by: string | null;
  request_note: string | null;
  organiser_note: string | null;
  created_at: string;
  updated_at: string;
};

export type OpenMicSuggestionType = 'new_song' | 'existing_slot';

export type OpenMicSongSuggestion = {
  id: string;
  event_id: string;
  player_id: string | null;
  suggested_by_user_id: string | null;
  title: string;
  artist: string | null;
  song_key: string | null;
  notes: string | null;
  status: OpenMicSuggestionStatus;
  organiser_note: string | null;
  created_song_id: string | null;
  suggestion_type: OpenMicSuggestionType;
  event_song_id: string | null;
  song_slot_id: string | null;
  preferred_slot_name: string | null;
  created_at: string;
  updated_at: string;
};

export type OpenMicSongWithSlots = OpenMicSong & {
  slots: OpenMicSongSlotWithPlayer[];
};

export type OpenMicSongSlotWithPlayer = OpenMicSongSlot & {
  playerName: string | null;
  assignmentStatus: OpenMicAssignmentStatus | null;
};

export type OpenMicAssignmentWithDetails = OpenMicAssignment & {
  player: OpenMicPlayer;
  song: Pick<OpenMicSong, 'id' | 'title' | 'artist'>;
  slot: Pick<OpenMicSongSlot, 'id' | 'slot_name'>;
};

export type PublicOpenMicSongSlot = {
  id: string;
  slot_name: string;
  required: boolean;
  status: OpenMicSlotStatus;
  public_signup_enabled: boolean;
  sort_order: number;
};

export type PublicOpenMicSong = {
  id: string;
  title: string;
  artist: string | null;
  song_key: string | null;
  duration_seconds: number | null;
  readiness_status: OpenMicSongReadiness;
  sort_order: number;
  slots: PublicOpenMicSongSlot[];
};

function normalizeSong(row: Record<string, unknown>): OpenMicSong {
  return {
    id: String(row.id),
    event_id: String(row.event_id),
    source_song_id: row.source_song_id ? String(row.source_song_id) : null,
    source_type: String(row.source_type ?? 'manual'),
    title: String(row.title),
    artist: row.artist ? String(row.artist) : null,
    song_key: row.song_key ? String(row.song_key) : null,
    duration_seconds: row.duration_seconds == null ? null : Number(row.duration_seconds),
    bpm: row.bpm == null ? null : Number(row.bpm),
    genre: row.genre ? String(row.genre) : null,
    difficulty: row.difficulty ? String(row.difficulty) : null,
    notes: row.notes ? String(row.notes) : null,
    readiness_status: row.readiness_status as OpenMicSongReadiness,
    readiness_override: row.readiness_override ? String(row.readiness_override) : null,
    sort_order: Number(row.sort_order ?? 0),
    live_status: row.live_status as OpenMicLiveStatus,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

function normalizeSlot(row: Record<string, unknown>): OpenMicSongSlot {
  return {
    id: String(row.id),
    event_song_id: String(row.event_song_id),
    slot_name: String(row.slot_name),
    required: Boolean(row.required),
    min_players: Number(row.min_players ?? 1),
    max_players: Number(row.max_players ?? 1),
    status: row.status as OpenMicSlotStatus,
    public_signup_enabled: Boolean(row.public_signup_enabled),
    notes: row.notes ? String(row.notes) : null,
    sort_order: Number(row.sort_order ?? 0),
    enabled: row.enabled !== false,
    part_template_id: row.part_template_id ? String(row.part_template_id) : null,
    house_band_member_id: row.house_band_member_id ? String(row.house_band_member_id) : null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

function normalizePlayer(row: Record<string, unknown>): OpenMicPlayer {
  return {
    id: String(row.id),
    event_id: String(row.event_id),
    user_id: row.user_id ? String(row.user_id) : null,
    display_name: String(row.display_name),
    email: row.email ? String(row.email) : null,
    phone: row.phone ? String(row.phone) : null,
    primary_instrument: row.primary_instrument ? String(row.primary_instrument) : null,
    profile_notes: row.profile_notes ? String(row.profile_notes) : null,
    is_guest: Boolean(row.is_guest),
    is_house_band: Boolean(row.is_house_band),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

function normalizeAssignment(row: Record<string, unknown>): OpenMicAssignment {
  return {
    id: String(row.id),
    event_id: String(row.event_id),
    event_song_id: String(row.event_song_id),
    song_slot_id: String(row.song_slot_id),
    player_id: String(row.player_id),
    status: row.status as OpenMicAssignmentStatus,
    assigned_by: row.assigned_by ? String(row.assigned_by) : null,
    request_note: row.request_note ? String(row.request_note) : null,
    organiser_note: row.organiser_note ? String(row.organiser_note) : null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export function computeOpenMicSongReadiness(
  song: Pick<OpenMicSong, 'readiness_override' | 'readiness_status'>,
  slots: OpenMicSongSlot[],
): OpenMicSongReadiness {
  if (song.readiness_override === 'ready') return 'ready';
  if (song.readiness_override === 'not_ready') return 'not_ready';

  const required = slots.filter((slot) => slot.required && slot.enabled !== false);
  if (required.length === 0) return 'ready';
  const filled = required.filter((slot) => slot.status === 'filled' || slot.status === 'locked');
  if (filled.length === 0) return 'not_ready';
  if (filled.length < required.length) return 'partial';
  return 'ready';
}

export function formatSongReadiness(status: OpenMicSongReadiness): string {
  switch (status) {
    case 'not_ready':
      return 'Not ready';
    case 'partial':
      return 'Partially ready';
    case 'ready':
      return 'Ready';
    case 'locked':
      return 'Locked';
    default:
      return status;
  }
}

export async function listOpenMicSongs(eventId: string): Promise<OpenMicSongWithSlots[]> {
  const client = getBandieClient();
  const { data: songs, error } = await client
    .from('bandie_open_mic_songs')
    .select('*')
    .eq('event_id', eventId)
    .order('sort_order', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const songRows = (songs ?? []).map((row) => normalizeSong(row as Record<string, unknown>));
  if (songRows.length === 0) {
    return [];
  }

  const songIds = songRows.map((song) => song.id);
  const { data: slots, error: slotError } = await client
    .from('bandie_open_mic_song_slots')
    .select('*')
    .in('event_song_id', songIds)
    .order('sort_order', { ascending: true });

  if (slotError) {
    throw new Error(slotError.message);
  }

  const slotIds = (slots ?? []).map((row) => String((row as { id: string }).id));
  const assignmentBySlot = new Map<string, { playerName: string; status: OpenMicAssignmentStatus }>();

  if (slotIds.length > 0) {
    const { data: assignments } = await client
      .from('bandie_open_mic_assignments')
      .select('song_slot_id, status, player_id')
      .in('song_slot_id', slotIds)
      .in('status', ['approved', 'requested']);

    const playerIds = [...new Set((assignments ?? []).map((row) => String((row as { player_id: string }).player_id)))];
    const playerMap = new Map<string, string>();

    if (playerIds.length > 0) {
      const { data: players } = await client
        .from('bandie_open_mic_players')
        .select('id, display_name')
        .in('id', playerIds);
      for (const row of players ?? []) {
        playerMap.set(String((row as { id: string }).id), String((row as { display_name: string }).display_name));
      }
    }

    for (const row of assignments ?? []) {
      const slotId = String((row as { song_slot_id: string }).song_slot_id);
      assignmentBySlot.set(slotId, {
        playerName: playerMap.get(String((row as { player_id: string }).player_id)) ?? 'Unknown',
        status: (row as { status: OpenMicAssignmentStatus }).status,
      });
    }
  }

  const slotsBySong = new Map<string, OpenMicSongSlotWithPlayer[]>();
  for (const row of slots ?? []) {
    const slot = normalizeSlot(row as Record<string, unknown>);
    const assignment = assignmentBySlot.get(slot.id);
    const enriched: OpenMicSongSlotWithPlayer = {
      ...slot,
      playerName: assignment?.playerName ?? null,
      assignmentStatus: assignment?.status ?? null,
    };
    const list = slotsBySong.get(slot.event_song_id) ?? [];
    list.push(enriched);
    slotsBySong.set(slot.event_song_id, list);
  }

  return songRows.map((song) => ({
    ...song,
    slots: slotsBySong.get(song.id) ?? [],
  }));
}

export async function addOpenMicSong(
  eventId: string,
  input: { title: string; artist?: string | null; songKey?: string | null; durationSeconds?: number | null; notes?: string | null },
): Promise<OpenMicSong> {
  const client = getBandieClient();
  const { data, error } = await client.rpc('bandie_add_open_mic_song', {
    p_event_id: eventId,
    p_title: input.title,
    p_artist: input.artist ?? null,
    p_song_key: input.songKey ?? null,
    p_duration_seconds: input.durationSeconds ?? null,
    p_notes: input.notes ?? null,
  });

  if (error) {
    throw new Error(error.message);
  }

  return normalizeSong(data as Record<string, unknown>);
}

export type ImportOpenMicSongsFromBandResult = {
  imported: OpenMicSong[];
  skippedCount: number;
};

export async function importOpenMicSongsFromBand(
  eventId: string,
  bandId: string,
  songIds: string[],
): Promise<ImportOpenMicSongsFromBandResult> {
  const uniqueIds = [...new Set(songIds.filter(Boolean))];
  if (uniqueIds.length === 0) {
    return { imported: [], skippedCount: 0 };
  }

  const client = getBandieClient();
  const { data, error } = await client.rpc('bandie_import_open_mic_songs_from_band', {
    p_event_id: eventId,
    p_band_id: bandId,
    p_song_ids: uniqueIds,
  });

  if (error) {
    throw new Error(error.message);
  }

  const imported = (data ?? []).map((row: Record<string, unknown>) => normalizeSong(row));
  return {
    imported,
    skippedCount: uniqueIds.length - imported.length,
  };
}

export async function deleteOpenMicSong(songId: string): Promise<void> {
  const client = getBandieClient();
  const { error } = await client.from('bandie_open_mic_songs').delete().eq('id', songId);
  if (error) {
    throw new Error(error.message);
  }
}

export async function reorderOpenMicSongs(eventId: string, songIds: string[]): Promise<void> {
  const client = getBandieClient();
  const { error } = await client.rpc('bandie_reorder_open_mic_songs', {
    p_event_id: eventId,
    p_song_ids: songIds,
  });
  if (error) {
    throw new Error(error.message);
  }
}

export async function applyInstrumentTemplate(
  eventSongId: string,
  templateCode: string,
): Promise<OpenMicSongSlot[]> {
  const client = getBandieClient();
  const { data, error } = await client.rpc('bandie_apply_open_mic_instrument_template', {
    p_event_song_id: eventSongId,
    p_template_code: templateCode,
  });
  if (error) {
    throw new Error(error.message);
  }
  return (data ?? []).map((row: Record<string, unknown>) => normalizeSlot(row));
}

export async function listOpenMicSignups(eventId: string): Promise<OpenMicAssignmentWithDetails[]> {
  const client = getBandieClient();
  const { data: assignments, error } = await client
    .from('bandie_open_mic_assignments')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (assignments ?? []).map((row) => normalizeAssignment(row as Record<string, unknown>));
  if (rows.length === 0) {
    return [];
  }

  const playerIds = [...new Set(rows.map((row) => row.player_id))];
  const songIds = [...new Set(rows.map((row) => row.event_song_id))];
  const slotIds = [...new Set(rows.map((row) => row.song_slot_id))];

  const [{ data: players }, { data: songs }, { data: slots }] = await Promise.all([
    client.from('bandie_open_mic_players').select('*').in('id', playerIds),
    client.from('bandie_open_mic_songs').select('id, title, artist').in('id', songIds),
    client.from('bandie_open_mic_song_slots').select('id, slot_name').in('id', slotIds),
  ]);

  const playerMap = new Map(
    (players ?? []).map((row) => [String((row as { id: string }).id), normalizePlayer(row as Record<string, unknown>)]),
  );
  const songMap = new Map(
    (songs ?? []).map((row) => [
      String((row as { id: string }).id),
      row as { id: string; title: string; artist: string | null },
    ]),
  );
  const slotMap = new Map(
    (slots ?? []).map((row) => [
      String((row as { id: string }).id),
      row as { id: string; slot_name: string },
    ]),
  );

  return rows.map((assignment) => ({
    ...assignment,
    player: playerMap.get(assignment.player_id)!,
    song: songMap.get(assignment.event_song_id)!,
    slot: slotMap.get(assignment.song_slot_id)!,
  }));
}

export async function requestOpenMicSlot(input: {
  eventId: string;
  songSlotId: string;
  displayName: string;
  email?: string | null;
  phone?: string | null;
  primaryInstrument?: string | null;
  requestNote?: string | null;
}): Promise<OpenMicAssignment> {
  const client = getBandieClient();
  const { data, error } = await client.rpc('bandie_request_open_mic_slot', {
    p_event_id: input.eventId,
    p_song_slot_id: input.songSlotId,
    p_display_name: input.displayName,
    p_email: input.email ?? null,
    p_phone: input.phone ?? null,
    p_primary_instrument: input.primaryInstrument ?? null,
    p_request_note: input.requestNote ?? null,
  });

  if (error) {
    throw new Error(error.message);
  }

  return normalizeAssignment(data as Record<string, unknown>);
}

export async function approveOpenMicAssignment(assignmentId: string): Promise<OpenMicAssignment> {
  const client = getBandieClient();
  const { data, error } = await client.rpc('bandie_approve_open_mic_assignment', {
    p_assignment_id: assignmentId,
  });
  if (error) {
    throw new Error(error.message);
  }
  return normalizeAssignment(data as Record<string, unknown>);
}

export async function rejectOpenMicAssignment(
  assignmentId: string,
  note?: string | null,
): Promise<OpenMicAssignment> {
  const client = getBandieClient();
  const { data, error } = await client.rpc('bandie_reject_open_mic_assignment', {
    p_assignment_id: assignmentId,
    p_note: note ?? null,
  });
  if (error) {
    throw new Error(error.message);
  }
  return normalizeAssignment(data as Record<string, unknown>);
}

export async function submitOpenMicSongSuggestion(input: {
  eventId: string;
  title?: string | null;
  artist?: string | null;
  displayName?: string | null;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
  suggestionType?: OpenMicSuggestionType;
  eventSongId?: string | null;
  songSlotId?: string | null;
  preferredSlotName?: string | null;
}): Promise<OpenMicSongSuggestion> {
  const client = getBandieClient();
  const { data, error } = await client.rpc('bandie_submit_open_mic_song_suggestion', {
    p_event_id: input.eventId,
    p_title: input.title ?? null,
    p_artist: input.artist ?? null,
    p_display_name: input.displayName ?? null,
    p_email: input.email ?? null,
    p_phone: input.phone ?? null,
    p_notes: input.notes ?? null,
    p_suggestion_type: input.suggestionType ?? 'new_song',
    p_event_song_id: input.eventSongId ?? null,
    p_song_slot_id: input.songSlotId ?? null,
    p_preferred_slot_name: input.preferredSlotName ?? null,
  });
  if (error) {
    throw new Error(error.message);
  }

  const row = data as Record<string, unknown>;
  return {
    id: String(row.id),
    event_id: String(row.event_id),
    player_id: row.player_id ? String(row.player_id) : null,
    suggested_by_user_id: row.suggested_by_user_id ? String(row.suggested_by_user_id) : null,
    title: String(row.title),
    artist: row.artist ? String(row.artist) : null,
    song_key: row.song_key ? String(row.song_key) : null,
    notes: row.notes ? String(row.notes) : null,
    status: row.status as OpenMicSuggestionStatus,
    organiser_note: row.organiser_note ? String(row.organiser_note) : null,
    created_song_id: row.created_song_id ? String(row.created_song_id) : null,
    suggestion_type: (row.suggestion_type as OpenMicSuggestionType) ?? 'new_song',
    event_song_id: row.event_song_id ? String(row.event_song_id) : null,
    song_slot_id: row.song_slot_id ? String(row.song_slot_id) : null,
    preferred_slot_name: row.preferred_slot_name ? String(row.preferred_slot_name) : null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export async function listOpenMicSongSuggestions(eventId: string): Promise<OpenMicSongSuggestion[]> {
  const client = getBandieClient();
  const { data, error } = await client
    .from('bandie_open_mic_song_suggestions')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => {
    const r = row as Record<string, unknown>;
    return {
      id: String(r.id),
      event_id: String(r.event_id),
      player_id: r.player_id ? String(r.player_id) : null,
      suggested_by_user_id: r.suggested_by_user_id ? String(r.suggested_by_user_id) : null,
      title: String(r.title),
      artist: r.artist ? String(r.artist) : null,
      song_key: r.song_key ? String(r.song_key) : null,
      notes: r.notes ? String(r.notes) : null,
      status: r.status as OpenMicSuggestionStatus,
      organiser_note: r.organiser_note ? String(r.organiser_note) : null,
      created_song_id: r.created_song_id ? String(r.created_song_id) : null,
      suggestion_type: (r.suggestion_type as OpenMicSuggestionType) ?? 'new_song',
      event_song_id: r.event_song_id ? String(r.event_song_id) : null,
      song_slot_id: r.song_slot_id ? String(r.song_slot_id) : null,
      preferred_slot_name: r.preferred_slot_name ? String(r.preferred_slot_name) : null,
      created_at: String(r.created_at),
      updated_at: String(r.updated_at),
    };
  });
}

export async function getPublicOpenMicSongs(slug: string): Promise<PublicOpenMicSong[]> {
  const client = getBandieClient();
  const { data, error } = await client.rpc('bandie_get_public_open_mic_songs', {
    p_slug: slug,
  });
  if (error) {
    throw new Error(error.message);
  }
  return (data ?? []) as PublicOpenMicSong[];
}

export async function listMyOpenMicAssignments(eventId: string): Promise<OpenMicAssignmentWithDetails[]> {
  const session = await getCurrentSession();
  if (!session?.user) {
    return [];
  }

  const all = await listOpenMicSignups(eventId);
  return all.filter((row) => row.player.user_id === session.user!.id);
}
