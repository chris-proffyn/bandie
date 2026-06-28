import {
  DEFAULT_PLAYER_DIRECTORY_FILTERS,
  type PlayerDirectoryFilters,
  type PlayerDirectorySort,
} from '@bandie/data';
import type { BackNavigationState } from './backNavigation';
import { backNavigationState } from './backNavigation';

export const WORKSPACE_PLAYER_DIRECTORY_DEFAULTS: PlayerDirectoryFilters = {
  ...DEFAULT_PLAYER_DIRECTORY_FILTERS,
  mode: 'permanent',
};

type StoredPlayerDirectoryNav = {
  filters: PlayerDirectoryFilters;
  sort: PlayerDirectorySort;
};

const STORAGE_KEYS = {
  workspace: 'bandie:player-directory:workspace',
  public: 'bandie:player-directory:public',
} as const;

function mergePlayerDirectoryFilters(
  initialFilters: PlayerDirectoryFilters,
  stored?: Partial<PlayerDirectoryFilters>,
): PlayerDirectoryFilters {
  return {
    ...DEFAULT_PLAYER_DIRECTORY_FILTERS,
    ...initialFilters,
    ...stored,
  };
}

export function loadPlayerDirectoryNavigation(
  variant: 'public' | 'workspace',
  initialFilters: PlayerDirectoryFilters,
): StoredPlayerDirectoryNav {
  const fallback: StoredPlayerDirectoryNav = {
    filters: mergePlayerDirectoryFilters(initialFilters),
    sort: 'recommended',
  };

  try {
    const raw = sessionStorage.getItem(STORAGE_KEYS[variant]);
    if (!raw) {
      return fallback;
    }

    const parsed = JSON.parse(raw) as Partial<StoredPlayerDirectoryNav>;
    return {
      filters: mergePlayerDirectoryFilters(initialFilters, parsed.filters),
      sort: parsed.sort ?? 'recommended',
    };
  } catch {
    return fallback;
  }
}

export function savePlayerDirectoryNavigation(
  variant: 'public' | 'workspace',
  filters: PlayerDirectoryFilters,
  sort: PlayerDirectorySort,
): void {
  try {
    sessionStorage.setItem(
      STORAGE_KEYS[variant],
      JSON.stringify({ filters, sort } satisfies StoredPlayerDirectoryNav),
    );
  } catch {
    // Ignore quota / privacy errors.
  }
}

export function clearPlayerDirectoryNavigation(variant: 'public' | 'workspace'): void {
  try {
    sessionStorage.removeItem(STORAGE_KEYS[variant]);
  } catch {
    // Ignore.
  }
}

export function buildPlayerDirectoryBackState(
  variant: 'public' | 'workspace',
  initialFilters: PlayerDirectoryFilters,
  locationState: unknown,
): BackNavigationState {
  const routed = backNavigationState(locationState);
  if (routed?.playerFilters) {
    return routed;
  }

  const stored = loadPlayerDirectoryNavigation(variant, initialFilters);
  return {
    workspaceContext: variant === 'workspace' ? 'players' : undefined,
    playerMode: stored.filters.mode,
    playerFilters: stored.filters,
    playerSort: stored.sort,
    findPlayers: routed?.findPlayers,
  };
}
