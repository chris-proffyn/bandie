import {
  checkUserLeaderCapability,
  getCurrentUserProfile,
  getCurrentSession,
  isPlanCapabilityEnabledForUser,
  listMyPendingPlayerOutreach,
  listPendingInvitationsForCurrentUser,
  listPendingOrganiserInvitationsForCurrentUser,
  resolveWorkspaceMode,
  workspaceModeHomePath,
  type UserProfile,
} from '@bandie/data';
import { workspacePathForAuthRedirect } from './authRedirects';

function splitPath(path: string): { pathname: string; search: string } {
  const [pathname, searchPart] = path.split('?');
  return {
    pathname,
    search: searchPart ? `?${searchPart}` : '',
  };
}

async function finalizeAuthDestination(
  path: string,
  profile: UserProfile,
  userId: string,
): Promise<string> {
  const { pathname, search } = splitPath(path);
  const mode = resolveWorkspaceMode(profile.is_player, profile.is_organiser, null);

  if (mode !== 'player') {
    return path;
  }

  if (pathname === '/app/bands' || pathname === '/bands') {
    const canBrowse = await isPlanCapabilityEnabledForUser(userId, 'band_directory.browse', 'leader');
    if (!canBrowse) {
      return '/app';
    }
  }

  if (pathname === '/app/players' || pathname === '/players' || pathname.startsWith('/players/')) {
    const canBrowse = await isPlanCapabilityEnabledForUser(
      userId,
      'player_directory.browse',
      'leader',
    );
    if (!canBrowse) {
      return '/app';
    }
  }

  return `${pathname}${search}`;
}

export async function routeAfterAuth(options: {
  intent: string | null;
  redirect: string | null;
}): Promise<string> {
  const session = await getCurrentSession();
  const userId = session?.user?.id;
  const profile = await getCurrentUserProfile();

  const [pending, organiserPending, playerOutreach] = await Promise.all([
    listPendingInvitationsForCurrentUser(),
    listPendingOrganiserInvitationsForCurrentUser(),
    listMyPendingPlayerOutreach(),
  ]);

  let path: string;

  if (pending.length > 0 || organiserPending.length > 0 || playerOutreach.length > 0) {
    path = '/app/communications';
  } else if (options.intent === 'create-band') {
    if (userId) {
      const decision = await checkUserLeaderCapability(userId, 'band.create');
      path = decision.allowed ? '/app/bands/new' : '/app';
    } else {
      path = '/app';
    }
  } else if (options.intent === 'player-profile') {
    path = '/app/profile';
  } else if (options.intent === 'organiser') {
    path = profile?.is_organiser ? '/app/bands' : '/app';
  } else if (options.redirect?.startsWith('/invite/')) {
    path = options.redirect;
  } else {
    const normalizedRedirect = workspacePathForAuthRedirect(options.redirect);
    if (normalizedRedirect) {
      path = normalizedRedirect;
    } else if (profile) {
      const mode = resolveWorkspaceMode(profile.is_player, profile.is_organiser, null);
      path = workspaceModeHomePath(mode);
    } else {
      path = '/app';
    }
  }

  if (profile && userId) {
    return finalizeAuthDestination(path, profile, userId);
  }

  return path;
}
