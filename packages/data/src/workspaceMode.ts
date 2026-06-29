export type WorkspaceMode = 'player' | 'organiser';

export const WORKSPACE_MODE_LABELS: Record<WorkspaceMode, string> = {
  player: 'Player mode',
  organiser: 'Organiser mode',
};

export function canSwitchWorkspaceMode(isPlayer: boolean, isOrganiser: boolean): boolean {
  return isPlayer && isOrganiser;
}

export function resolveWorkspaceMode(
  isPlayer: boolean,
  isOrganiser: boolean,
  storedMode: WorkspaceMode | null,
): WorkspaceMode {
  if (isPlayer && !isOrganiser) {
    return 'player';
  }

  if (isOrganiser && !isPlayer) {
    return 'organiser';
  }

  if (storedMode === 'organiser' && isOrganiser) {
    return 'organiser';
  }

  if (storedMode === 'player' && isPlayer) {
    return 'player';
  }

  return isPlayer ? 'player' : 'organiser';
}

export function workspaceModeHomePath(mode: WorkspaceMode): string {
  return mode === 'organiser' ? '/app/bands' : '/app';
}

export function isPlayerWorkspaceRoute(pathname: string): boolean {
  const path = pathname.replace(/\/$/, '') || '/app';

  if (path === '/app') {
    return true;
  }

  if (path.startsWith('/app/communications')) {
    return true;
  }

  if (path.startsWith('/app/notifications')) {
    return true;
  }

  if (path.startsWith('/app/invites')) {
    return true;
  }

  if (path.startsWith('/app/bands/new')) {
    return true;
  }

  if (path.startsWith('/app/players')) {
    return true;
  }

  const rest = path.slice('/app/'.length);
  const [firstSegment] = rest.split('/');

  if (
    !firstSegment ||
    [
      'profile',
      'bands',
      'players',
      'venues',
      'gigs',
      'invites',
      'notifications',
      'communications',
      'profiles',
    ].includes(firstSegment)
  ) {
    return false;
  }

  return true;
}
