import { getBandieClient } from './context';

export type PlayerOutreachType = 'audition' | 'join';

export type PlayerOutreach = {
  id: string;
  band_id: string;
  player_profile_id: string;
  band_part_id: string | null;
  invite_type: PlayerOutreachType;
  message: string | null;
  player_email: string;
  invited_by: string;
  status: string;
  band_invitation_id: string | null;
  created_at: string;
  expires_at: string;
};

export type PendingPlayerOutreach = {
  id: string;
  band_id: string;
  band_name: string;
  invite_type: PlayerOutreachType;
  message: string | null;
  band_part_title: string | null;
  inviter_display_name: string | null;
  band_invitation_token: string | null;
  expires_at: string;
  created_at: string;
};

export type ReceivedPlayerOutreach = PendingPlayerOutreach & {
  status: string;
};

export type SentPlayerOutreach = {
  id: string;
  band_id: string;
  band_name: string;
  invite_type: PlayerOutreachType;
  message: string | null;
  player_display_name: string | null;
  player_email: string;
  band_part_title: string | null;
  status: string;
  expires_at: string;
  created_at: string;
};

export type CreatePlayerOutreachInput = {
  bandId: string;
  playerProfileId: string;
  inviteType: PlayerOutreachType;
  bandPartId?: string | null;
  message?: string | null;
};

export async function createPlayerOutreach(input: CreatePlayerOutreachInput): Promise<string> {
  const client = getBandieClient();
  const { data, error } = await client.rpc('bandie_create_player_outreach', {
    p_band_id: input.bandId,
    p_player_profile_id: input.playerProfileId,
    p_invite_type: input.inviteType,
    p_band_part_id: input.bandPartId ?? null,
    p_message: input.message ?? null,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data as string;
}

export async function listPlayerOutreachForBand(bandId: string): Promise<PlayerOutreach[]> {
  const client = getBandieClient();
  const { data, error } = await client
    .from('bandie_player_outreach')
    .select('*')
    .eq('band_id', bandId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export function playerOutreachTypeLabel(type: PlayerOutreachType): string {
  return type === 'audition' ? 'Audition invite' : 'Join band invite';
}

export async function listMyPendingPlayerOutreach(): Promise<PendingPlayerOutreach[]> {
  const client = getBandieClient();
  const { data, error } = await client.rpc('bandie_list_my_pending_player_outreach');

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function listMyReceivedPlayerOutreach(): Promise<ReceivedPlayerOutreach[]> {
  const client = getBandieClient();
  const { data, error } = await client.rpc('bandie_list_my_received_player_outreach');

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function countMyPendingPlayerOutreach(): Promise<number> {
  const client = getBandieClient();
  const { data, error } = await client.rpc('bandie_count_my_pending_player_outreach');

  if (error) {
    throw new Error(error.message);
  }

  return typeof data === 'number' ? data : 0;
}

export async function respondToPlayerOutreach(
  outreachId: string,
  accept: boolean,
): Promise<void> {
  const client = getBandieClient();
  const { error } = await client.rpc('bandie_respond_to_player_outreach', {
    p_outreach_id: outreachId,
    p_accept: accept,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function listMySentPlayerOutreach(): Promise<SentPlayerOutreach[]> {
  const client = getBandieClient();
  const { data, error } = await client.rpc('bandie_list_my_sent_player_outreach');

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function revokePlayerOutreach(outreachId: string): Promise<void> {
  const client = getBandieClient();
  const { error } = await client.rpc('bandie_revoke_player_outreach', {
    p_outreach_id: outreachId,
  });

  if (error) {
    throw new Error(error.message);
  }
}
