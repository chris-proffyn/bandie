import { getBandieClient } from './context';

export type OpenMicJamSlotStatus =
  | 'open'
  | 'requested'
  | 'filled'
  | 'playing'
  | 'completed'
  | 'skipped'
  | 'cancelled';

export type OpenMicJamSignupStatus =
  | 'requested'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'withdrawn';

export type OpenMicJamSlot = {
  id: string;
  event_id: string;
  slot_number: number;
  duration_minutes: number;
  starts_at: string | null;
  status: OpenMicJamSlotStatus;
  band_name: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type OpenMicJamSignup = {
  id: string;
  event_id: string;
  jam_slot_id: string | null;
  band_name: string;
  contact_name: string;
  email: string | null;
  phone: string | null;
  user_id: string | null;
  status: OpenMicJamSignupStatus;
  request_note: string | null;
  organiser_note: string | null;
  created_at: string;
  updated_at: string;
};

export type PublicJamSlot = {
  id: string;
  slot_number: number;
  duration_minutes: number;
  starts_at: string | null;
  status: OpenMicJamSlotStatus;
  band_name: string | null;
};

function normalizeJamSlot(row: Record<string, unknown>): OpenMicJamSlot {
  return {
    id: String(row.id),
    event_id: String(row.event_id),
    slot_number: Number(row.slot_number),
    duration_minutes: Number(row.duration_minutes),
    starts_at: row.starts_at ? String(row.starts_at) : null,
    status: row.status as OpenMicJamSlotStatus,
    band_name: row.band_name ? String(row.band_name) : null,
    contact_name: row.contact_name ? String(row.contact_name) : null,
    contact_email: row.contact_email ? String(row.contact_email) : null,
    contact_phone: row.contact_phone ? String(row.contact_phone) : null,
    notes: row.notes ? String(row.notes) : null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

function normalizeJamSignup(row: Record<string, unknown>): OpenMicJamSignup {
  return {
    id: String(row.id),
    event_id: String(row.event_id),
    jam_slot_id: row.jam_slot_id ? String(row.jam_slot_id) : null,
    band_name: String(row.band_name),
    contact_name: String(row.contact_name),
    email: row.email ? String(row.email) : null,
    phone: row.phone ? String(row.phone) : null,
    user_id: row.user_id ? String(row.user_id) : null,
    status: row.status as OpenMicJamSignupStatus,
    request_note: row.request_note ? String(row.request_note) : null,
    organiser_note: row.organiser_note ? String(row.organiser_note) : null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export function formatJamSlotStatus(status: OpenMicJamSlotStatus): string {
  switch (status) {
    case 'open':
      return 'Open';
    case 'requested':
      return 'Requested';
    case 'filled':
      return 'Filled';
    case 'playing':
      return 'Playing';
    case 'completed':
      return 'Completed';
    case 'skipped':
      return 'Skipped';
    case 'cancelled':
      return 'Cancelled';
    default:
      return status;
  }
}

export async function listOpenMicJamSlots(eventId: string): Promise<OpenMicJamSlot[]> {
  const client = getBandieClient();
  const { data, error } = await client
    .from('bandie_open_mic_jam_slots')
    .select('*')
    .eq('event_id', eventId)
    .order('slot_number', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => normalizeJamSlot(row as Record<string, unknown>));
}

export async function listOpenMicJamSignups(eventId: string): Promise<OpenMicJamSignup[]> {
  const client = getBandieClient();
  const { data, error } = await client
    .from('bandie_open_mic_jam_signups')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => normalizeJamSignup(row as Record<string, unknown>));
}

export async function generateOpenMicJamSlots(eventId: string): Promise<number> {
  const client = getBandieClient();
  const { data, error } = await client.rpc('bandie_generate_open_mic_jam_slots', {
    p_event_id: eventId,
  });
  if (error) {
    throw new Error(error.message);
  }
  return Number(data ?? 0);
}

export async function assignOpenMicJamSlot(input: {
  jamSlotId: string;
  bandName: string;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
}): Promise<OpenMicJamSlot> {
  const client = getBandieClient();
  const { data, error } = await client.rpc('bandie_assign_open_mic_jam_slot', {
    p_jam_slot_id: input.jamSlotId,
    p_band_name: input.bandName,
    p_contact_name: input.contactName ?? null,
    p_contact_email: input.contactEmail ?? null,
    p_contact_phone: input.contactPhone ?? null,
  });
  if (error) {
    throw new Error(error.message);
  }
  return normalizeJamSlot(data as Record<string, unknown>);
}

export async function clearOpenMicJamSlot(jamSlotId: string): Promise<OpenMicJamSlot> {
  const client = getBandieClient();
  const { data, error } = await client.rpc('bandie_clear_open_mic_jam_slot', {
    p_jam_slot_id: jamSlotId,
  });
  if (error) {
    throw new Error(error.message);
  }
  return normalizeJamSlot(data as Record<string, unknown>);
}

export async function requestJamSlot(input: {
  eventId: string;
  jamSlotId?: string | null;
  bandName: string;
  contactName: string;
  email?: string | null;
  phone?: string | null;
  requestNote?: string | null;
}): Promise<OpenMicJamSignup> {
  const client = getBandieClient();
  const { data, error } = await client.rpc('bandie_request_jam_slot', {
    p_event_id: input.eventId,
    p_jam_slot_id: input.jamSlotId ?? null,
    p_band_name: input.bandName,
    p_contact_name: input.contactName,
    p_email: input.email ?? null,
    p_phone: input.phone ?? null,
    p_request_note: input.requestNote ?? null,
  });
  if (error) {
    throw new Error(error.message);
  }
  return normalizeJamSignup(data as Record<string, unknown>);
}

export async function approveJamSignup(signupId: string): Promise<OpenMicJamSignup> {
  const client = getBandieClient();
  const { data, error } = await client.rpc('bandie_approve_jam_signup', {
    p_signup_id: signupId,
  });
  if (error) {
    throw new Error(error.message);
  }
  return normalizeJamSignup(data as Record<string, unknown>);
}

export async function getPublicJamSlots(slug: string): Promise<PublicJamSlot[]> {
  const client = getBandieClient();
  const { data, error } = await client.rpc('bandie_get_public_jam_slots', {
    p_slug: slug,
  });
  if (error) {
    throw new Error(error.message);
  }
  return (data ?? []) as PublicJamSlot[];
}
