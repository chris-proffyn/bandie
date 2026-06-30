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
import {
  countUnreadGigInviteNotifications,
  listMyGigInviteCommunications,
  type GigInviteCommunication,
} from './gigInviteCommunications';
import { isResolvedInviteStatus } from './invitationStatus';

export type CommunicationFilter = 'all' | 'player_invites' | 'gig_invites' | 'messages';

/** High-level communication categories used across the product. */
export type CommunicationCategory = 'player_invite' | 'gig_invite' | 'general_message';

export const COMMUNICATION_CATEGORY_LABELS: Record<CommunicationCategory, string> = {
  player_invite: 'Player invite',
  gig_invite: 'Gig invite',
  general_message: 'General message',
};

export function getCommunicationCategory(item: CommunicationItem): CommunicationCategory {
  switch (item.kind) {
    case 'band_invitation':
    case 'player_outreach':
    case 'sent_band_invitation':
    case 'sent_player_outreach':
      return 'player_invite';
    case 'gig_invitation':
    case 'sent_gig_invitation':
      return 'gig_invite';
    case 'message':
    case 'booking_enquiry':
      return 'general_message';
  }
}

export function isPlayerInviteCommunication(item: CommunicationItem): boolean {
  return getCommunicationCategory(item) === 'player_invite';
}

export function isGigInviteCommunication(item: CommunicationItem): boolean {
  return getCommunicationCategory(item) === 'gig_invite';
}

export function isGeneralMessageCommunication(item: CommunicationItem): boolean {
  return getCommunicationCategory(item) === 'general_message';
}

export type CommunicationSummary = {
  pendingInvitations: number;
  pendingPlayerOutreach: number;
  unreadMessages: number;
  unreadBookingEnquiries: number;
  unreadGigInvites: number;
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

export type GigInviteCommunicationItem = {
  kind: 'gig_invitation';
  id: string;
  created_at: string;
  invite: GigInviteCommunication;
};

export type SentGigInviteCommunicationItem = {
  kind: 'sent_gig_invitation';
  id: string;
  created_at: string;
  invite: GigInviteCommunication;
};

export type CommunicationItem =
  | BandInvitationCommunication
  | PlayerOutreachCommunication
  | MessageCommunication
  | SentBandInvitationCommunication
  | SentPlayerOutreachCommunication
  | BookingEnquiryCommunication
  | GigInviteCommunicationItem
  | SentGigInviteCommunicationItem;

export async function getCommunicationSummary(): Promise<CommunicationSummary> {
  const [invitations, playerOutreach, unreadMessages, unreadBookingEnquiries, unreadGigInvites] =
    await Promise.all([
    listPendingInvitationsForCurrentUser(),
    countMyPendingPlayerOutreach(),
    countUnreadMessages(),
    countUnreadBookingEnquiries(),
    countUnreadGigInviteNotifications(),
  ]);

  const pendingInvitations = invitations.length;

  return {
    pendingInvitations,
    pendingPlayerOutreach: playerOutreach,
    unreadMessages,
    unreadBookingEnquiries,
    unreadGigInvites,
    total:
      pendingInvitations +
      playerOutreach +
      unreadMessages +
      unreadBookingEnquiries +
      unreadGigInvites,
  };
}

export async function listCommunications(): Promise<CommunicationItem[]> {
  const [invitations, playerOutreach, sentInvitations, sentOutreach, messages, enquiries, gigInvites] =
    await Promise.all([
    listMyReceivedBandInvitations(),
    listMyReceivedPlayerOutreach(),
    listMySentBandInvitations(),
    listMySentPlayerOutreach(),
    listMyMessages(),
    listMyBookingEnquiries(),
    listMyGigInviteCommunications(),
  ]);

  const enquiryMessageIds = new Set(enquiries.map((enquiry) => enquiry.message_id));
  const gigInviteMessageIds = new Set(gigInvites.map((invite) => invite.message_id));

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
      .filter((message) => !enquiryMessageIds.has(message.id) && !gigInviteMessageIds.has(message.id))
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
    ...gigInvites.map((invite): GigInviteCommunicationItem | SentGigInviteCommunicationItem => {
      if (invite.direction === 'sent') {
        return {
          kind: 'sent_gig_invitation',
          id: invite.gig_band_id,
          created_at: invite.invited_at,
          invite,
        };
      }

      return {
        kind: 'gig_invitation',
        id: invite.gig_band_id,
        created_at: invite.invited_at,
        invite,
      };
    }),
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

  if (filter === 'player_invites') {
    return items.filter(isPlayerInviteCommunication);
  }

  if (filter === 'gig_invites') {
    return items.filter(isGigInviteCommunication);
  }

  return items.filter(isGeneralMessageCommunication);
}

export function filterResolvedInviteCommunications(
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

    if (item.kind === 'gig_invitation') {
      return item.invite.invite_status === 'pending';
    }

    if (item.kind === 'sent_gig_invitation') {
      return item.invite.invite_status === 'pending';
    }

    return true;
  });
}

/** @deprecated Use filterResolvedInviteCommunications */
export function filterResolvedSentCommunications(
  items: CommunicationItem[],
  hideResolved: boolean,
): CommunicationItem[] {
  return filterResolvedInviteCommunications(items, hideResolved);
}

export function filterReadGeneralMessages(
  items: CommunicationItem[],
  currentUserId: string,
  hideRead: boolean,
): CommunicationItem[] {
  if (!hideRead || !currentUserId) {
    return items;
  }

  return items.filter((item) => {
    if (item.kind === 'message') {
      const isIncoming = item.message.recipient_user_id === currentUserId;
      if (!isIncoming) {
        return true;
      }

      return item.message.read_at == null;
    }

    if (item.kind === 'booking_enquiry') {
      const isIncoming = item.enquiry.recipient_user_id === currentUserId;
      if (!isIncoming) {
        return true;
      }

      return item.enquiry.status === 'new';
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
