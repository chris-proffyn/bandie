import type { BandSong } from '@bandie/data';

export type SongMetadataFormValues = {
  title: string;
  artist: string;
  genre: string;
  songKey: string;
  durationMinutes: string;
  durationSeconds: string;
  notes: string;
};

export const EMPTY_SONG_METADATA: SongMetadataFormValues = {
  title: '',
  artist: '',
  genre: '',
  songKey: '',
  durationMinutes: '',
  durationSeconds: '',
  notes: '',
};

export function songToMetadataFormValues(
  song: Pick<BandSong, 'title' | 'artist' | 'genre' | 'song_key' | 'duration_seconds' | 'notes'>,
): SongMetadataFormValues {
  const totalSeconds = song.duration_seconds ?? 0;
  const minutes = totalSeconds > 0 ? Math.floor(totalSeconds / 60) : 0;
  const seconds = totalSeconds > 0 ? totalSeconds % 60 : 0;

  return {
    title: song.title,
    artist: song.artist ?? '',
    genre: song.genre ?? '',
    songKey: song.song_key ?? '',
    durationMinutes: totalSeconds > 0 ? String(minutes) : '',
    durationSeconds: totalSeconds > 0 ? String(seconds) : '',
    notes: song.notes ?? '',
  };
}

export function parseDurationFromForm(minutes: string, seconds: string): number | null {
  const mins = Number.parseInt(minutes, 10) || 0;
  const secs = Number.parseInt(seconds, 10) || 0;

  if (mins <= 0 && secs <= 0) {
    return null;
  }

  return mins * 60 + secs;
}
