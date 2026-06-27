import type { PlayerSearchMode } from '@bandie/data';

export type BackNavigationState = {
  from?: string;
  workspaceContext?: 'players' | 'bands';
  playerMode?: PlayerSearchMode;
};

export function resolveBackPath(
  currentPath: string,
  locationState: unknown,
  fallbackTo: string,
  workspaceFallbackTo?: string,
): string {
  const state = locationState as BackNavigationState | null;

  if (state?.from && state.from.startsWith('/') && state.from !== currentPath) {
    return state.from;
  }

  if (state?.workspaceContext === 'players' && workspaceFallbackTo) {
    return workspaceFallbackTo;
  }

  if (state?.workspaceContext === 'bands' && workspaceFallbackTo) {
    return workspaceFallbackTo;
  }

  if (currentPath.startsWith('/app/') && workspaceFallbackTo) {
    return workspaceFallbackTo;
  }

  return fallbackTo;
}

export function backNavigationState(locationState: unknown): BackNavigationState | undefined {
  const state = locationState as BackNavigationState | null;
  if (!state?.playerMode && !state?.workspaceContext) {
    return undefined;
  }

  return {
    playerMode: state.playerMode,
    workspaceContext: state.workspaceContext,
  };
}

export function directoryLinkState(
  fromPath: string,
  options: {
    variant: 'public' | 'workspace';
    directory: 'players' | 'bands';
    playerMode?: PlayerSearchMode;
  },
): BackNavigationState {
  return {
    from: fromPath,
    workspaceContext: options.variant === 'workspace' ? options.directory : undefined,
    playerMode: options.playerMode,
  };
}
