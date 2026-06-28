import {
  getCurrentUserProfile,
  listMyPendingPlayerOutreach,
  listPendingInvitationsForCurrentUser,
  resolveWorkspaceMode,
  workspaceModeHomePath,
} from '@bandie/data';
import { workspacePathForAuthRedirect } from './authRedirects';

export async function routeAfterAuth(options: {
  intent: string | null;
  redirect: string | null;
}): Promise<string> {
  const [pending, playerOutreach] = await Promise.all([
    listPendingInvitationsForCurrentUser(),
    listMyPendingPlayerOutreach(),
  ]);

  if (pending.length > 0 || playerOutreach.length > 0) {
    return '/app/communications';
  }

  if (options.intent === 'create-band') {
    return '/app/bands/new';
  }

  if (options.intent === 'player-profile') {
    return '/app/profile';
  }

  if (options.intent === 'organiser') {
    return '/app/bands';
  }

  if (options.redirect?.startsWith('/invite/')) {
    return options.redirect;
  }

  const normalizedRedirect = workspacePathForAuthRedirect(options.redirect);
  if (normalizedRedirect) {
    return normalizedRedirect;
  }

  const profile = await getCurrentUserProfile();
  if (profile) {
    const mode = resolveWorkspaceMode(profile.is_player, profile.is_organiser, null);
    return workspaceModeHomePath(mode);
  }

  return '/app';
}
