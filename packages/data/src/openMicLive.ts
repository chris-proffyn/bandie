import { getBandieClient } from './context';
import type { OpenMicEvent, OpenMicEventStatus } from './openMicEvents';
import type { OpenMicLiveStatus, OpenMicSongWithSlots } from './openMicSongs';
import { listOpenMicSongs } from './openMicSongs';

export type OpenMicLiveDashboard = {
  eventStatus: OpenMicEventStatus;
  nowPlaying: OpenMicSongWithSlots | null;
  upNext: OpenMicSongWithSlots[];
  issues: string[];
  songs: OpenMicSongWithSlots[];
};

export async function startOpenMicEvent(eventId: string): Promise<OpenMicEvent> {
  const client = getBandieClient();
  const { data, error } = await client.rpc('bandie_start_open_mic_event', {
    p_event_id: eventId,
  });
  if (error) {
    throw new Error(error.message);
  }
  return data as OpenMicEvent;
}

export async function endOpenMicEvent(eventId: string): Promise<OpenMicEvent> {
  const client = getBandieClient();
  const { data, error } = await client.rpc('bandie_end_open_mic_event', {
    p_event_id: eventId,
  });
  if (error) {
    throw new Error(error.message);
  }
  return data as OpenMicEvent;
}

export async function updateOpenMicSongLiveStatus(
  songId: string,
  liveStatus: OpenMicLiveStatus,
): Promise<void> {
  const client = getBandieClient();
  const { error } = await client.rpc('bandie_update_open_mic_song_live_status', {
    p_song_id: songId,
    p_live_status: liveStatus,
  });
  if (error) {
    throw new Error(error.message);
  }
}

export async function getOpenMicLiveDashboard(eventId: string): Promise<OpenMicLiveDashboard> {
  const client = getBandieClient();
  const { data: eventRow, error } = await client
    .from('bandie_open_mic_events')
    .select('status')
    .eq('id', eventId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const songs = await listOpenMicSongs(eventId);
  const nowPlaying = songs.find((song) => song.live_status === 'playing') ?? null;
  const upNext = songs
    .filter((song) => ['queued', 'called', 'on_deck'].includes(song.live_status))
    .slice(0, 5);

  const issues: string[] = [];
  for (const song of songs) {
    const emptyRequired = song.slots.filter(
      (slot) => slot.required && slot.status !== 'filled' && slot.status !== 'locked',
    );
    if (emptyRequired.length > 0) {
      issues.push(`${song.title}: ${emptyRequired.length} empty required slot(s)`);
    }
  }

  return {
    eventStatus: eventRow.status as OpenMicEventStatus,
    nowPlaying,
    upNext,
    issues,
    songs,
  };
}

export function subscribeOpenMicEvent(
  eventId: string,
  onChange: () => void,
): () => void {
  const client = getBandieClient();
  const channel = client
    .channel(`open-mic-${eventId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'bandie_open_mic_songs', filter: `event_id=eq.${eventId}` },
      () => onChange(),
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'bandie_open_mic_events', filter: `id=eq.${eventId}` },
      () => onChange(),
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'bandie_open_mic_assignments', filter: `event_id=eq.${eventId}` },
      () => onChange(),
    )
    .subscribe();

  return () => {
    void client.removeChannel(channel);
  };
}

export type OpenMicEventSummaryStats = {
  totalSongs: number;
  completedSongs: number;
  totalSignups: number;
  approvedSignups: number;
};

export async function getOpenMicEventSummary(eventId: string): Promise<OpenMicEventSummaryStats> {
  const client = getBandieClient();
  const songs = await listOpenMicSongs(eventId);

  const { count: totalSignups } = await client
    .from('bandie_open_mic_assignments')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId);

  const { count: approvedSignups } = await client
    .from('bandie_open_mic_assignments')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId)
    .eq('status', 'approved');

  return {
    totalSongs: songs.length,
    completedSongs: songs.filter((song) => song.live_status === 'completed').length,
    totalSignups: totalSignups ?? 0,
    approvedSignups: approvedSignups ?? 0,
  };
}
