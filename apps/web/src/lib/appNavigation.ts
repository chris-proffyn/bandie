import type { WorkspaceMode } from '@bandie/data';

export type AppNavItem = {
  label: string;
  to: string;
  end?: boolean;
  badge?: number;
};

type AppNavOptions = {
  bandId?: string;
  workspaceMode?: WorkspaceMode;
  adminModeActive?: boolean;
  notificationCount?: number;
};

export function getAppNavItems({
  bandId,
  workspaceMode = 'player',
  adminModeActive = false,
  notificationCount = 0,
}: AppNavOptions): AppNavItem[] {
  if (adminModeActive) {
    const items: AppNavItem[] = [
      { label: 'My bands', to: '/app', end: true },
      {
        label: 'Communications',
        to: '/app/communications',
        badge: notificationCount || undefined,
      },
      { label: 'My profile', to: '/app/profile' },
      { label: 'Band directory', to: '/app/bands' },
      { label: 'Player directory', to: '/app/players' },
    ];

    if (bandId) {
      items.push({ label: 'Band overview', to: `/app/${bandId}`, end: true });
      items.push({ label: 'Songs', to: `/app/${bandId}/songs` });
      items.push({ label: 'Setlists', to: `/app/${bandId}/setlists` });
    }

    return items;
  }

  if (workspaceMode === 'organiser') {
    return [
      { label: 'Find bands', to: '/app/bands', end: true },
      { label: 'My venues', to: '/app/venues' },
      { label: 'My profile', to: '/app/profile' },
    ];
  }

  const items: AppNavItem[] = [
    { label: 'My bands', to: '/app', end: true },
    {
      label: 'Communications',
      to: '/app/communications',
      badge: notificationCount || undefined,
    },
    { label: 'My profile', to: '/app/profile' },
    { label: 'Band directory', to: '/app/bands' },
    { label: 'Player directory', to: '/app/players' },
  ];

  if (bandId) {
    items.push({ label: 'Band overview', to: `/app/${bandId}`, end: true });
    items.push({ label: 'Songs', to: `/app/${bandId}/songs` });
    items.push({ label: 'Setlists', to: `/app/${bandId}/setlists` });
  }

  return items;
}
