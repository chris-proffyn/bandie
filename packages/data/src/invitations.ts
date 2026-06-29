import { getBandieClient } from './context';
import { assertCanPerform } from './entitlements';

export type BandInvitation = {
  id: string;
  band_id: string;
  email: string;
  invitee_display_name?: string | null;
  role: string;
  token: string;
  status: string;
  expires_at: string;
  created_at: string;
};

export type PendingBandInvitation = {
  id: string;
  band_id: string;
  band_name: string;
  role: string;
  token: string;
  expires_at: string;
  created_at: string;
};

export type ReceivedBandInvitation = PendingBandInvitation & {
  status: string;
};

export type SentBandInvitation = {
  id: string;
  band_id: string;
  band_name: string;
  email: string;
  invitee_display_name: string | null;
  role: string;
  status: string;
  expires_at: string;
  created_at: string;
};

export type CreateInvitationInput = {
  bandId: string;
  email: string;
  role?: 'admin' | 'member' | 'viewer';
};

export async function createBandInvitation(input: CreateInvitationInput): Promise<BandInvitation> {
  const client = getBandieClient();
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    throw new Error('Must be signed in to invite members.');
  }

  await assertCanPerform({
    capability: 'band_members.invite',
    subjectType: 'band',
    subjectId: input.bandId,
    bandId: input.bandId,
    planScope: 'leader',
  });

  const { data, error } = await client
    .from('bandie_band_invitations')
    .insert({
      band_id: input.bandId,
      email: input.email.trim().toLowerCase(),
      role: input.role ?? 'member',
      invited_by: user.id,
      status: 'pending',
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function listBandInvitations(bandId: string): Promise<BandInvitation[]> {
  const client = getBandieClient();
  const { data, error } = await client.rpc('bandie_list_band_invitations_for_owner', {
    p_band_id: bandId,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function listPendingInvitationsForCurrentUser(): Promise<PendingBandInvitation[]> {
  const client = getBandieClient();
  const { data, error } = await client.rpc('bandie_list_my_pending_invitations');

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function listMyReceivedBandInvitations(): Promise<ReceivedBandInvitation[]> {
  const client = getBandieClient();
  const { data, error } = await client.rpc('bandie_list_my_received_band_invitations');

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function listMySentBandInvitations(): Promise<SentBandInvitation[]> {
  const client = getBandieClient();
  const { data, error } = await client.rpc('bandie_list_my_sent_band_invitations');

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function acceptBandInvitation(token: string): Promise<string> {
  const client = getBandieClient();
  const { data, error } = await client.rpc('bandie_accept_invitation', {
    invite_token: token,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data as string;
}

export async function declineBandInvitation(token: string): Promise<void> {
  const client = getBandieClient();
  const { error } = await client.rpc('bandie_decline_invitation', {
    invite_token: token,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function acceptAllPendingInvitations(
  invitations: PendingBandInvitation[],
): Promise<string[]> {
  const bandIds: string[] = [];

  for (const invitation of invitations) {
    const bandId = await acceptBandInvitation(invitation.token);
    bandIds.push(bandId);
  }

  return bandIds;
}

export async function revokeBandInvitation(invitationId: string): Promise<void> {
  const client = getBandieClient();
  const { error } = await client
    .from('bandie_band_invitations')
    .update({ status: 'revoked' })
    .eq('id', invitationId);

  if (error) {
    throw new Error(error.message);
  }
}
