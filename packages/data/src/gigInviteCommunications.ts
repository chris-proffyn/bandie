import { getBandieClient } from './context';
import type { GigInviteStatus } from './gigs';

export type GigInviteCommunication = {
  gig_band_id: string;
  gig_id: string;
  band_id: string;
  band_name: string;
  band_slug: string;
  gig_title: string;
  gig_starts_at: string;
  venue_name: string | null;
  venue_address: string | null;
  invite_status: GigInviteStatus;
  running_order: number | null;
  slot_duration_minutes: number | null;
  sender_user_id: string;
  recipient_user_id: string;
  sender_display_name: string | null;
  sender_username: string | null;
  message_id: string;
  message_body: string;
  message_read_at: string | null;
  invited_at: string;
  direction: 'received' | 'sent';
};

export async function listMyGigInviteCommunications(): Promise<GigInviteCommunication[]> {
  const client = getBandieClient();
  const { data, error } = await client.rpc('bandie_list_my_gig_invite_communications');

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as GigInviteCommunication[];
}

export async function listReceivedGigInviteCommunications(): Promise<GigInviteCommunication[]> {
  const rows = await listMyGigInviteCommunications();
  return rows.filter((row) => row.direction === 'received');
}

export async function listSentGigInviteCommunications(): Promise<GigInviteCommunication[]> {
  const rows = await listMyGigInviteCommunications();
  return rows.filter((row) => row.direction === 'sent');
}

export async function countUnreadGigInviteNotifications(): Promise<number> {
  const client = getBandieClient();
  const { data, error } = await client.rpc('bandie_count_my_unread_gig_invite_notifications');

  if (error) {
    throw new Error(error.message);
  }

  return (data as number) ?? 0;
}

export async function markGigInviteNotificationRead(communication: GigInviteCommunication): Promise<void> {
  if (communication.message_read_at) {
    return;
  }

  const client = getBandieClient();
  const { error } = await client
    .from('bandie_user_messages')
    .update({ read_at: new Date().toISOString() })
    .eq('id', communication.message_id)
    .is('read_at', null);

  if (error) {
    throw new Error(error.message);
  }
}
