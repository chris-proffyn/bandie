import { assertCanPerform } from './entitlements';
import { getBandieClient } from './context';
import { getCurrentSession } from './auth';
import { syncUsageMeter, METER_KEYS } from './usageMeters';

export type BookingEnquiryStatus = 'new' | 'read' | 'replied' | 'archived';

export type BookingEnquiry = {
  id: string;
  band_id: string;
  band_name: string;
  message_id: string;
  sender_user_id: string;
  recipient_user_id: string;
  sender_display_name: string | null;
  sender_username: string | null;
  status: BookingEnquiryStatus;
  preferred_date: string | null;
  venue_summary: string | null;
  set_duration_minutes: number | null;
  message_body: string;
  message_read_at: string | null;
  created_at: string;
};

export type SendBookingEnquiryInput = {
  bandId: string;
  recipientUserId: string;
  body: string;
  preferredDate?: string | null;
  venueSummary?: string | null;
  setDurationMinutes?: number | null;
  metadata?: Record<string, unknown>;
};

export const BOOKING_ENQUIRY_STATUS_LABELS: Record<BookingEnquiryStatus, string> = {
  new: 'New',
  read: 'Read',
  replied: 'Replied',
  archived: 'Archived',
};

export async function listMyBookingEnquiries(): Promise<BookingEnquiry[]> {
  const client = getBandieClient();
  const { data, error } = await client.rpc('bandie_list_my_booking_enquiries');

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as BookingEnquiry[];
}

export async function listReceivedBookingEnquiries(): Promise<BookingEnquiry[]> {
  const session = await getCurrentSession();
  if (!session?.user) {
    return [];
  }

  const rows = await listMyBookingEnquiries();
  return rows.filter((row) => row.recipient_user_id === session.user!.id);
}

export async function countUnreadBookingEnquiries(): Promise<number> {
  const received = await listReceivedBookingEnquiries();
  return received.filter((row) => row.status === 'new' && !row.message_read_at).length;
}

export async function sendBookingEnquiry(input: SendBookingEnquiryInput): Promise<BookingEnquiry> {
  const session = await getCurrentSession();
  if (!session?.user) {
    throw new Error('Must be signed in to send a booking enquiry.');
  }

  await assertCanPerform({
    capability: 'booking_enquiry.send',
    subjectType: 'user',
    subjectId: session.user.id,
    requestedAmount: 1,
    planScope: 'organiser',
  });

  const trimmedBody = input.body.trim();
  if (!trimmedBody) {
    throw new Error('Message cannot be empty.');
  }

  if (input.recipientUserId === session.user.id) {
    throw new Error('You cannot send a booking enquiry to yourself.');
  }

  const client = getBandieClient();
  const { data: message, error: messageError } = await client
    .from('bandie_user_messages')
    .insert({
      sender_user_id: session.user.id,
      recipient_user_id: input.recipientUserId,
      body: trimmedBody,
    })
    .select('id')
    .single();

  if (messageError) {
    throw new Error(messageError.message);
  }

  const { data: enquiry, error: enquiryError } = await client
    .from('bandie_booking_enquiries')
    .insert({
      band_id: input.bandId,
      message_id: message.id,
      sender_user_id: session.user.id,
      recipient_user_id: input.recipientUserId,
      preferred_date: input.preferredDate ?? null,
      venue_summary: input.venueSummary ?? null,
      set_duration_minutes: input.setDurationMinutes ?? null,
      metadata: input.metadata ?? {},
    })
    .select('id')
    .single();

  if (enquiryError) {
    throw new Error(enquiryError.message);
  }

  await syncUsageMeter(METER_KEYS.BOOKING_ENQUIRIES_SENT, 'user', session.user.id);

  const rows = await listMyBookingEnquiries();
  const created = rows.find((row) => row.id === enquiry.id);
  if (!created) {
    throw new Error('Booking enquiry created but could not be loaded.');
  }

  return created;
}

export async function updateBookingEnquiryStatus(
  enquiryId: string,
  status: BookingEnquiryStatus,
): Promise<void> {
  const client = getBandieClient();
  const { error } = await client
    .from('bandie_booking_enquiries')
    .update({ status })
    .eq('id', enquiryId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function markBookingEnquiryRead(enquiry: BookingEnquiry): Promise<void> {
  if (enquiry.message_read_at) {
    if (enquiry.status === 'new') {
      await updateBookingEnquiryStatus(enquiry.id, 'read');
    }
    return;
  }

  const client = getBandieClient();
  const { error } = await client
    .from('bandie_user_messages')
    .update({ read_at: new Date().toISOString() })
    .eq('id', enquiry.message_id)
    .is('read_at', null);

  if (error) {
    throw new Error(error.message);
  }

  if (enquiry.status === 'new') {
    await updateBookingEnquiryStatus(enquiry.id, 'read');
  }
}
