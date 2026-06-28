import { getBandieClient } from './context';
import { removeOrganiserVenueImage } from './storage';

export const ORGANISER_VENUE_TYPES = [
  { value: 'pub', label: 'Pub' },
  { value: 'bar', label: 'Bar' },
  { value: 'club', label: 'Club / live music venue' },
  { value: 'festival', label: 'Festival / outdoor event' },
  { value: 'private', label: 'Private event space' },
  { value: 'community', label: 'Community / village hall' },
  { value: 'hotel', label: 'Hotel / function room' },
  { value: 'other', label: 'Other' },
] as const;

export type OrganiserVenueType = (typeof ORGANISER_VENUE_TYPES)[number]['value'];

export type OrganiserVenue = {
  id: string;
  owner_user_id: string;
  name: string;
  venue_type: OrganiserVenueType | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  postcode: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  capacity: number | null;
  notes: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
};

export type OrganiserVenueInput = {
  name: string;
  venue_type?: OrganiserVenueType | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  postcode?: string | null;
  contact_name?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  capacity?: number | null;
  notes?: string | null;
  image_url?: string | null;
};

function normalizeVenueRow(row: Record<string, unknown>): OrganiserVenue {
  return {
    id: row.id as string,
    owner_user_id: row.owner_user_id as string,
    name: row.name as string,
    venue_type: (row.venue_type as OrganiserVenueType | null) ?? null,
    address_line1: (row.address_line1 as string | null) ?? null,
    address_line2: (row.address_line2 as string | null) ?? null,
    city: (row.city as string | null) ?? null,
    postcode: (row.postcode as string | null) ?? null,
    contact_name: (row.contact_name as string | null) ?? null,
    contact_email: (row.contact_email as string | null) ?? null,
    contact_phone: (row.contact_phone as string | null) ?? null,
    capacity: (row.capacity as number | null) ?? null,
    notes: (row.notes as string | null) ?? null,
    image_url: (row.image_url as string | null) ?? null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

function normalizeOptionalText(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function buildVenuePayload(input: OrganiserVenueInput): Record<string, unknown> {
  const name = input.name.trim();
  if (!name) {
    throw new Error('Venue name is required.');
  }

  let capacity: number | null = null;
  if (input.capacity != null && input.capacity !== ('' as unknown)) {
    const parsed = Number(input.capacity);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      throw new Error('Capacity must be a positive number.');
    }
    capacity = Math.round(parsed);
  }

  return {
    name,
    venue_type: input.venue_type ?? null,
    address_line1: normalizeOptionalText(input.address_line1),
    address_line2: normalizeOptionalText(input.address_line2),
    city: normalizeOptionalText(input.city),
    postcode: normalizeOptionalText(input.postcode),
    contact_name: normalizeOptionalText(input.contact_name),
    contact_email: normalizeOptionalText(input.contact_email),
    contact_phone: normalizeOptionalText(input.contact_phone),
    capacity,
    notes: normalizeOptionalText(input.notes),
    image_url: normalizeOptionalText(input.image_url),
  };
}

export function formatOrganiserVenueType(value: string | null | undefined): string {
  if (!value) {
    return 'Venue';
  }

  return ORGANISER_VENUE_TYPES.find((option) => option.value === value)?.label ?? value;
}

export function formatOrganiserVenueLocation(venue: OrganiserVenue): string | null {
  const parts = [venue.city, venue.postcode].map((part) => part?.trim()).filter(Boolean) as string[];
  return parts.length ? parts.join(', ') : null;
}

export function formatOrganiserVenueAddress(venue: OrganiserVenue): string | null {
  const parts = [
    venue.address_line1,
    venue.address_line2,
    venue.city,
    venue.postcode,
  ]
    .map((part) => part?.trim())
    .filter(Boolean) as string[];

  return parts.length ? parts.join(', ') : null;
}

export async function listMyOrganiserVenues(): Promise<OrganiserVenue[]> {
  const client = getBandieClient();
  const { data, error } = await client
    .from('bandie_organiser_venues')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => normalizeVenueRow(row as Record<string, unknown>));
}

export async function createOrganiserVenue(input: OrganiserVenueInput): Promise<OrganiserVenue> {
  const client = getBandieClient();
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    throw new Error('You must be signed in to add a venue.');
  }

  const payload = buildVenuePayload(input);
  const { data, error } = await client
    .from('bandie_organiser_venues')
    .insert({ ...payload, owner_user_id: user.id })
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return normalizeVenueRow(data as Record<string, unknown>);
}

export async function updateOrganiserVenue(
  venueId: string,
  input: OrganiserVenueInput,
): Promise<OrganiserVenue> {
  const client = getBandieClient();
  const payload = buildVenuePayload(input);
  const { data, error } = await client
    .from('bandie_organiser_venues')
    .update(payload)
    .eq('id', venueId)
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return normalizeVenueRow(data as Record<string, unknown>);
}

export async function deleteOrganiserVenue(venueId: string): Promise<void> {
  const client = getBandieClient();

  try {
    await removeOrganiserVenueImage(venueId);
  } catch {
    // Storage cleanup is best-effort when deleting the venue record.
  }

  const { error } = await client.from('bandie_organiser_venues').delete().eq('id', venueId);

  if (error) {
    throw new Error(error.message);
  }
}
