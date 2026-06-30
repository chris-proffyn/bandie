import { getBandieClient } from './context';
import { acceptBandInvitation } from './invitations';

export type OrganiserInvitation = {
  id: string;
  email: string;
  invitee_display_name: string | null;
  token: string;
  status: string;
  expires_at: string;
  created_at: string;
};

export type PendingOrganiserInvitation = {
  id: string;
  token: string;
  expires_at: string;
  created_at: string;
};

export type InviteTokenType = 'band' | 'organiser';

export type AcceptInviteResult =
  | { type: 'band'; bandId: string }
  | { type: 'organiser' };

export async function createOrganiserInvitation(email: string): Promise<OrganiserInvitation> {
  const client = getBandieClient();
  const { data, error } = await client.rpc('bandie_create_organiser_invitation', {
    p_email: email.trim(),
  });

  if (error) {
    throw new Error(error.message);
  }

  return data as OrganiserInvitation;
}

export async function listOrganiserInvitationsForAdmin(): Promise<OrganiserInvitation[]> {
  const client = getBandieClient();
  const { data, error } = await client.rpc('bandie_list_organiser_invitations_for_admin');

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as OrganiserInvitation[];
}

export async function revokeOrganiserInvitation(invitationId: string): Promise<void> {
  const client = getBandieClient();
  const { error } = await client.rpc('bandie_revoke_organiser_invitation', {
    p_invitation_id: invitationId,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function resolveInviteTokenType(token: string): Promise<InviteTokenType | null> {
  const client = getBandieClient();
  const { data, error } = await client.rpc('bandie_resolve_invite_token', {
    p_token: token,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (data === 'band' || data === 'organiser') {
    return data;
  }

  return null;
}

export async function listPendingOrganiserInvitationsForCurrentUser(): Promise<
  PendingOrganiserInvitation[]
> {
  const client = getBandieClient();
  const { data, error } = await client.rpc('bandie_list_my_pending_organiser_invitations');

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as PendingOrganiserInvitation[];
}

export async function acceptOrganiserInvitation(token: string): Promise<void> {
  const client = getBandieClient();
  const { error } = await client.rpc('bandie_accept_organiser_invitation', {
    p_token: token,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function declineOrganiserInvitation(token: string): Promise<void> {
  const client = getBandieClient();
  const { error } = await client.rpc('bandie_decline_organiser_invitation', {
    p_token: token,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function acceptInviteByToken(token: string): Promise<AcceptInviteResult> {
  const inviteType = await resolveInviteTokenType(token);

  if (inviteType === 'band') {
    const bandId = await acceptBandInvitation(token);
    return { type: 'band', bandId };
  }

  if (inviteType === 'organiser') {
    await acceptOrganiserInvitation(token);
    return { type: 'organiser' };
  }

  throw new Error('Invitation not found or expired.');
}
