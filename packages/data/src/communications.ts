import {
  listMySentBandInvitations,
  listMyReceivedBandInvitations,
  listPendingInvitationsForCurrentUser,
} from './invitations';
import type { ReceivedBandInvitation, SentBandInvitation } from './invitations';
import { countUnreadMessages, listMyMessages, type UserMessage } from './messages';
import {
  countUnreadBookingEnquiries,
  listMyBookingEnquiries,
  type BookingEnquiry,
} from './bookingEnquiries';
import {
  countMyPendingPlayerOutreach,
  listMyReceivedPlayerOutreach,
  listMySentPlayerOutreach,
  type ReceivedPlayerOutreach,
  type SentPlayerOutreach,
} from './playerOutreach';
import { isResolvedInviteStatus } from './invitationStatus';

export type CommunicationFilter = 'all' | 'invites' | 'messages' | 'enquiries';

export type CommunicationSummary = {
  pendingInvitations: number;
  pendingPlayerOutreach: number;
  unreadMessages: number;
  unreadBookingEnquiries: number;
  total: number;
};

/** Nav badge summary (legacy shape) */
export type NotificationSummary = {
  pendingInvitations: number;
  unreadMessages: number;
  total: number;
};

export type BandInvitationCommunication = {
  kind: 'band_invitation';
  id: string;
  created_at: string;
  invitation: ReceivedBandInvitation;
};

export type PlayerOutreachCommunication = {
  kind: 'player_outreach';
  id: string;
  created_at: string;
  outreach: ReceivedPlayerOutreach;
};

export type MessageCommunication = {
  kind: 'message';
  id: string;
  created_at: string;
  message: UserMessage;
};

export type SentBandInvitationCommunication = {
  kind: 'sent_band_invitation';
  id: string;
  created_at: string;
  invitation: SentBandInvitation;
};

export type SentPlayerOutreachCommunication = {
  kind: 'sent_player_outreach';
  id: string;
  created_at: string;
  outreach: SentPlayerOutreach;
};

export type BookingEnquiryCommunication = {
  kind: 'booking_enquiry';
  id: string;
  created_at: string;
  enquiry: BookingEnquiry;
};

export type CommunicationItem =
  | BandInvitationCommunication
  | PlayerOutreachCommunication
  | MessageCommunication
  | SentBandInvitationCommunication
  | SentPlayerOutreachCommunication
  | BookingEnquiryCommunication;

export async function getCommunicationSummary(): Promise<CommunicationSummary> {
  const [invitations, playerOutreach, unreadMessages, unreadBookingEnquiries] = await Promise.all([
    listPendingInvitationsForCurrentUser(),
    countMyPendingPlayerOutreach(),
    countUnreadMessages(),
    countUnreadBookingEnquiries(),
  ]);

  const pendingInvitations = invitations.length;

  return {
    pendingInvitations,
    pendingPlayerOutreach: playerOutreach,
    unreadMessages,
    unreadBookingEnquiries,
    total: pendingInvitations + playerOutreach + unreadMessages + unreadBookingEnquiries,
  };
}

export async function listCommunications(): Promise<CommunicationItem[]> {
  const [invitations, playerOutreach, sentInvitations, sentOutreach, messages, enquiries] =
    await Promise.all([
    listMyReceivedBandInvitations(),
    listMyReceivedPlayerOutreach(),
    listMySentBandInvitations(),
    listMySentPlayerOutreach(),
    listMyMessages(),
    listMyBookingEnquiries(),
  ]);

  const enquiryMessageIds = new Set(enquiries.map((enquiry) => enquiry.message_id));

  const items: CommunicationItem[] = [
    ...invitations.map(
      (invitation): BandInvitationCommunication => ({
        kind: 'band_invitation',
        id: invitation.id,
        created_at: invitation.created_at,
        invitation,
      }),
    ),
    ...playerOutreach.map(
      (outreach): PlayerOutreachCommunication => ({
        kind: 'player_outreach',
        id: outreach.id,
        created_at: outreach.created_at,
        outreach,
      }),
    ),
    ...sentInvitations.map(
      (invitation): SentBandInvitationCommunication => ({
        kind: 'sent_band_invitation',
        id: invitation.id,
        created_at: invitation.created_at,
        invitation,
      }),
    ),
    ...sentOutreach.map(
      (outreach): SentPlayerOutreachCommunication => ({
        kind: 'sent_player_outreach',
        id: outreach.id,
        created_at: outreach.created_at,
        outreach,
      }),
    ),
    ...messages
      .filter((message) => !enquiryMessageIds.has(message.id))
      .map(
      (message): MessageCommunication => ({
        kind: 'message',
        id: message.id,
        created_at: message.created_at,
        message,
      }),
    ),
    ...enquiries.map(
      (enquiry): BookingEnquiryCommunication => ({
        kind: 'booking_enquiry',
        id: enquiry.id,
        created_at: enquiry.created_at,
        enquiry,
      }),
    ),
  ];

  return items.sort(
    (left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime(),
  );
}

export function filterCommunications(
  items: CommunicationItem[],
  filter: CommunicationFilter,
): CommunicationItem[] {
  if (filter === 'all') {
    return items;
  }

  if (filter === 'invites') {
    return items.filter(
      (item) =>
        item.kind === 'band_invitation' ||
        item.kind === 'player_outreach' ||
        item.kind === 'sent_band_invitation' ||
        item.kind === 'sent_player_outreach',
    );
  }

  if (filter === 'enquiries') {
    return items.filter((item) => item.kind === 'booking_enquiry');
  }

  return items.filter((item) => item.kind === 'message');
}

export function filterResolvedSentCommunications(
  items: CommunicationItem[],
  hideResolved: boolean,
): CommunicationItem[] {
  if (!hideResolved) {
    return items;
  }

  return items.filter((item) => {
    if (item.kind === 'band_invitation') {
      return !isResolvedInviteStatus(item.invitation.status);
    }

    if (item.kind === 'player_outreach') {
      return !isResolvedInviteStatus(item.outreach.status);
    }

    if (item.kind === 'sent_band_invitation') {
      return !isResolvedInviteStatus(item.invitation.status);
    }

    if (item.kind === 'sent_player_outreach') {
      return !isResolvedInviteStatus(item.outreach.status);
    }

    return true;
  });
}

/** @deprecated Use getCommunicationSummary */
export async function getNotificationSummary(): Promise<NotificationSummary> {
  const summary = await getCommunicationSummary();

  return {
    pendingInvitations: summary.pendingInvitations + summary.pendingPlayerOutreach,
    unreadMessages: summary.unreadMessages,
    total: summary.total,
  };
}
