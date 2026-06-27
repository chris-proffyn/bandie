import { listPendingInvitationsForCurrentUser } from '@bandie/data';

export async function routeAfterAuth(options: {
  intent: string | null;
  redirect: string | null;
}): Promise<string> {
  const pending = await listPendingInvitationsForCurrentUser();

  if (pending.length > 0) {
    return '/app/invites';
  }

  if (options.intent === 'create-band') {
    return '/app/bands/new';
  }

  if (options.intent === 'player-profile') {
    return '/app/profile';
  }

  if (options.redirect?.startsWith('/invite/')) {
    return options.redirect;
  }

  return options.redirect ?? '/app';
}
