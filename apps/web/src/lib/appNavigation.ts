import type { WorkspaceMode } from '@bandie/data';
import { bandRouteIdFromParam } from './bandRoutes';

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
  const resolvedBandId = bandRouteIdFromParam(bandId);
  const inBandContext = Boolean(resolvedBandId);

  const directoryItems: AppNavItem[] = inBandContext
    ? []
    : [
        { label: 'Band directory', to: '/app/bands' },
        { label: 'Player directory', to: '/app/players' },
      ];

  if (adminModeActive) {
    const items: AppNavItem[] = [
      { label: 'My bands', to: '/app', end: true },
      {
        label: 'Communications',
        to: '/app/communications',
        badge: notificationCount || undefined,
      },
      { label: 'My profile', to: '/app/profile' },
      ...directoryItems,
    ];

    if (resolvedBandId) {
      items.push({ label: 'Band overview', to: `/app/${resolvedBandId}`, end: true });
      items.push({ label: 'Songs', to: `/app/${resolvedBandId}/songs` });
      items.push({ label: 'Setlists', to: `/app/${resolvedBandId}/setlists` });
      items.push({ label: 'Calendar', to: `/app/${resolvedBandId}/calendar` });
      items.push({ label: 'Gig invites', to: `/app/${resolvedBandId}/gigs` });
    }

    return items;
  }

  if (workspaceMode === 'organiser') {
    return [
      { label: 'Find bands', to: '/app/bands', end: true },
      { label: 'My gigs', to: '/app/gigs' },
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
    ...directoryItems,
  ];

  if (resolvedBandId) {
    items.push({ label: 'Band overview', to: `/app/${resolvedBandId}`, end: true });
    items.push({ label: 'Songs', to: `/app/${resolvedBandId}/songs` });
    items.push({ label: 'Setlists', to: `/app/${resolvedBandId}/setlists` });
    items.push({ label: 'Calendar', to: `/app/${resolvedBandId}/calendar` });
    items.push({ label: 'Gig invites', to: `/app/${resolvedBandId}/gigs` });
  }

  return items;
}
