import { getCurrentSession } from './auth';
import { assertCanPerform } from './entitlements';
import { getBandSong, type SongWithReadiness } from './songs';

export type CopyBandSongInput = {
  sourceBandId: string;
  sourceSongId: string;
  targetBandId: string;
  title?: string;
};

export type CopyBandSongResult = {
  song: SongWithReadiness;
  copiedFolders: number;
  copiedFiles: number;
};

async function authorizedFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const session = await getCurrentSession();
  if (!session?.access_token) {
    throw new Error('Sign in to copy songs.');
  }

  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${session.access_token}`);
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  return fetch(`/api${path}`, { ...init, headers });
}

export async function copyBandSongToBand(input: CopyBandSongInput): Promise<CopyBandSongResult> {
  const session = await getCurrentSession();
  if (!session?.user) {
    throw new Error('Sign in to copy songs.');
  }

  if (input.sourceBandId === input.targetBandId) {
    throw new Error('Choose a different band to copy this song into.');
  }

  await assertCanPerform({
    capability: 'song.create',
    subjectType: 'band',
    subjectId: input.targetBandId,
    bandId: input.targetBandId,
    planScope: 'leader',
  });

  const response = await authorizedFetch('/bands/songs/copy', {
    method: 'POST',
    body: JSON.stringify({
      sourceBandId: input.sourceBandId,
      sourceSongId: input.sourceSongId,
      targetBandId: input.targetBandId,
      title: input.title?.trim() || undefined,
    }),
  });

  const payload = await response.json().catch(() => ({})) as {
    result?: {
      songId: string;
      targetBandId: string;
      copiedFolders: number;
      copiedFiles: number;
    };
    error?: string;
  };

  if (!response.ok || !payload.result) {
    throw new Error(payload.error ?? 'Unable to copy song to another band.');
  }

  const song = await getBandSong(payload.result.targetBandId, payload.result.songId);
  if (!song) {
    throw new Error('Song was copied but could not be loaded.');
  }

  return {
    song,
    copiedFolders: payload.result.copiedFolders,
    copiedFiles: payload.result.copiedFiles,
  };
}
