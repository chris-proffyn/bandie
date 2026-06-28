import type { PlayerDirectoryFilters } from '@bandie/data';
import { createDefaultDirectoryAreaFilters, resolveDirectoryAreaFilters } from './directoryAreaDefaults';
import { WORKSPACE_PLAYER_DIRECTORY_DEFAULTS } from './playerDirectoryNavigation';

export type FindPlayersContext = {
  bandId: string;
  bandName?: string;
  partId?: string;
  partTitle?: string;
  instrument?: string;
};

export function parseFindPlayersContext(search: string): FindPlayersContext | null {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const bandId = params.get('forBand')?.trim();

  if (!bandId) {
    return null;
  }

  return {
    bandId,
    bandName: params.get('bandName')?.trim() || undefined,
    partId: params.get('part')?.trim() || undefined,
    partTitle: params.get('partTitle')?.trim() || undefined,
    instrument: params.get('instrument')?.trim() || undefined,
  };
}

export function buildFindPlayersUrl(context: FindPlayersContext): string {
  const params = new URLSearchParams();
  params.set('forBand', context.bandId);

  if (context.bandName) {
    params.set('bandName', context.bandName);
  }
  if (context.partId) {
    params.set('part', context.partId);
  }
  if (context.partTitle) {
    params.set('partTitle', context.partTitle);
  }
  if (context.instrument) {
    params.set('instrument', context.instrument);
  }

  return `/app/players?${params.toString()}`;
}

export function buildFindDeputyUrl(context: FindPlayersContext): string {
  const params = new URLSearchParams();
  params.set('forBand', context.bandId);
  params.set('mode', 'temporary');

  if (context.bandName) {
    params.set('bandName', context.bandName);
  }
  if (context.partId) {
    params.set('part', context.partId);
  }
  if (context.partTitle) {
    params.set('partTitle', context.partTitle);
  }
  if (context.instrument) {
    params.set('instrument', context.instrument);
  }

  return `/app/players?${params.toString()}`;
}

export function findPlayersDirectoryFilters(context: FindPlayersContext): PlayerDirectoryFilters {
  return resolveDirectoryAreaFilters(
    {
      ...WORKSPACE_PLAYER_DIRECTORY_DEFAULTS,
      mode: 'permanent',
      instrument: context.instrument ?? '',
      primaryInstrumentOnly: true,
    },
    createDefaultDirectoryAreaFilters(),
  );
}

export function findPlayersContextLabel(context: FindPlayersContext): string {
  if (context.partTitle) {
    return context.partTitle;
  }
  if (context.instrument) {
    return context.instrument;
  }
  return 'lineup role';
}
