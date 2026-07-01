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
  canBrowseBandDirectory?: boolean;
  canBrowsePlayerDirectory?: boolean;
};

export function getGlobalNavItems({
  bandId,
  workspaceMode = 'player',
  adminModeActive = false,
  notificationCount = 0,
  canBrowseBandDirectory = true,
  canBrowsePlayerDirectory = true,
}: AppNavOptions): AppNavItem[] {
  const resolvedBandId = bandRouteIdFromParam(bandId);

  const directoryItems: AppNavItem[] = resolvedBandId
    ? []
    : [
        ...(canBrowseBandDirectory ? [{ label: 'Band directory', to: '/app/bands' }] : []),
        ...(canBrowsePlayerDirectory ? [{ label: 'Player directory', to: '/app/players' }] : []),
      ];

  if (adminModeActive) {
    return [
      { label: 'My bands', to: '/app', end: true },
      {
        label: 'Communications',
        to: '/app/communications',
        badge: notificationCount || undefined,
      },
      { label: 'My profile', to: '/app/profile' },
      ...directoryItems,
    ];
  }

  if (workspaceMode === 'organiser') {
    return [
      { label: 'Find bands', to: '/app/bands', end: true },
      { label: 'My gigs', to: '/app/gigs' },
      { label: 'Open mic', to: '/app/open-mic' },
      { label: 'My venues', to: '/app/venues' },
      {
        label: 'Communications',
        to: '/app/communications',
        badge: notificationCount || undefined,
      },
      { label: 'My profile', to: '/app/profile' },
    ];
  }

  return [
    { label: 'My bands', to: '/app', end: true },
    {
      label: 'Communications',
      to: '/app/communications',
      badge: notificationCount || undefined,
    },
    { label: 'My profile', to: '/app/profile' },
    ...directoryItems,
  ];
}

export function getBandNavItems({
  bandId,
  workspaceMode = 'player',
  adminModeActive = false,
}: AppNavOptions): AppNavItem[] {
  const resolvedBandId = bandRouteIdFromParam(bandId);
  if (!resolvedBandId) {
    return [];
  }

  if (adminModeActive || workspaceMode === 'player') {
    return [
      { label: 'Band overview', to: `/app/${resolvedBandId}`, end: true },
      { label: 'Songs', to: `/app/${resolvedBandId}/songs` },
      { label: 'Setlists', to: `/app/${resolvedBandId}/setlists` },
      { label: 'Calendar', to: `/app/${resolvedBandId}/calendar` },
      { label: 'Gig invites', to: `/app/${resolvedBandId}/gigs` },
    ];
  }

  return [];
}

export function getAppNavItems(options: AppNavOptions): AppNavItem[] {
  return [...getGlobalNavItems(options), ...getBandNavItems(options)];
}
