import { assertCanPerform } from './entitlements';
import { getBandieClient } from './context';
import { getCurrentSession } from './auth';
import { formatOrganiserVenueAddress, getOrganiserVenue, type OrganiserVenue } from './organiserVenues';

export type OpenMicEventStatus =
  | 'draft'
  | 'published'
  | 'signup_open'
  | 'signup_closed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'archived';

export type OpenMicEventType =
  | 'open_mic'
  | 'jam_night'
  | 'songbook_jam'
  | 'house_band_guest_night';

export type OpenMicSignupMode = 'open' | 'moderated' | 'invite_only' | 'organiser_only';

export type OpenMicVisibility = 'public' | 'unlisted' | 'private';

export type OpenMicContactField = 'email' | 'phone' | 'email_or_phone';

export const OPEN_MIC_ORGANISER_ONLY_MESSAGE =
  'Open mic events are created and managed by organisers with Organiser Plus.';

export const OPEN_MIC_STATUS_OPTIONS: OpenMicEventStatus[] = [
  'draft',
  'published',
  'signup_open',
  'signup_closed',
  'in_progress',
  'completed',
  'cancelled',
  'archived',
];

export const OPEN_MIC_EVENT_TYPE_OPTIONS: OpenMicEventType[] = [
  'open_mic',
  'jam_night',
  'songbook_jam',
  'house_band_guest_night',
];

export const OPEN_MIC_SIGNUP_MODE_OPTIONS: OpenMicSignupMode[] = [
  'open',
  'moderated',
  'invite_only',
  'organiser_only',
];

export type OpenMicEvent = {
  id: string;
  organiser_user_id: string;
  venue_id: string | null;
  title: string;
  slug: string;
  event_type: OpenMicEventType;
  status: OpenMicEventStatus;
  visibility: OpenMicVisibility;
  venue_name: string | null;
  venue_address: string | null;
  starts_at: string;
  ends_at: string | null;
  timezone: string;
  description: string | null;
  host_name: string | null;
  house_band_name: string | null;
  entry_price: string | null;
  age_restrictions: string | null;
  equipment_notes: string | null;
  backline_notes: string | null;
  signup_mode: OpenMicSignupMode;
  signup_opens_at: string | null;
  signup_closes_at: string | null;
  max_songs_per_player: number | null;
  max_slots_per_player: number | null;
  required_contact_field: OpenMicContactField;
  public_song_list_enabled: boolean;
  running_order_locked: boolean;
  poster_template_id: string | null;
  event_image_url: string | null;
  created_by: string;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

export type OpenMicEventSummary = OpenMicEvent & {
  songCount: number;
  signupCount: number;
  venue: OrganiserVenue | null;
};

export type PublicOpenMicEvent = {
  id: string;
  slug: string;
  title: string;
  event_type: OpenMicEventType;
  status: OpenMicEventStatus;
  starts_at: string;
  ends_at: string | null;
  timezone: string;
  description: string | null;
  host_name: string | null;
  house_band_name: string | null;
  entry_price: string | null;
  age_restrictions: string | null;
  equipment_notes: string | null;
  backline_notes: string | null;
  signup_mode: OpenMicSignupMode;
  signup_opens_at: string | null;
  signup_closes_at: string | null;
  public_song_list_enabled: boolean;
  required_contact_field: OpenMicContactField;
  venue_name: string | null;
  venue_address: string | null;
  poster_template_id: string | null;
  event_image_url: string | null;
};

export type CreateOpenMicEventInput = {
  title: string;
  startsAt: string;
  endsAt?: string | null;
  eventType?: OpenMicEventType;
  venueId?: string | null;
  venueName?: string | null;
  venueAddress?: string | null;
  description?: string | null;
  timezone?: string;
  signupMode?: OpenMicSignupMode;
  requiredContactField?: OpenMicContactField;
};

export type UpdateOpenMicEventInput = Partial<{
  title: string;
  eventType: OpenMicEventType;
  venueId: string | null;
  venueName: string | null;
  venueAddress: string | null;
  startsAt: string;
  endsAt: string | null;
  timezone: string;
  description: string | null;
  hostName: string | null;
  houseBandName: string | null;
  entryPrice: string | null;
  ageRestrictions: string | null;
  equipmentNotes: string | null;
  backlineNotes: string | null;
  signupMode: OpenMicSignupMode;
  signupOpensAt: string | null;
  signupClosesAt: string | null;
  maxSongsPerPlayer: number | null;
  maxSlotsPerPlayer: number | null;
  requiredContactField: OpenMicContactField;
  publicSongListEnabled: boolean;
  posterTemplateId: string | null;
  eventImageUrl: string | null;
  visibility: OpenMicVisibility;
}>;

function normalizeEventRow(row: Record<string, unknown>): OpenMicEvent {
  return {
    id: String(row.id),
    organiser_user_id: String(row.organiser_user_id),
    venue_id: row.venue_id ? String(row.venue_id) : null,
    title: String(row.title),
    slug: String(row.slug),
    event_type: row.event_type as OpenMicEventType,
    status: row.status as OpenMicEventStatus,
    visibility: row.visibility as OpenMicVisibility,
    venue_name: row.venue_name ? String(row.venue_name) : null,
    venue_address: row.venue_address ? String(row.venue_address) : null,
    starts_at: String(row.starts_at),
    ends_at: row.ends_at ? String(row.ends_at) : null,
    timezone: String(row.timezone ?? 'Europe/London'),
    description: row.description ? String(row.description) : null,
    host_name: row.host_name ? String(row.host_name) : null,
    house_band_name: row.house_band_name ? String(row.house_band_name) : null,
    entry_price: row.entry_price ? String(row.entry_price) : null,
    age_restrictions: row.age_restrictions ? String(row.age_restrictions) : null,
    equipment_notes: row.equipment_notes ? String(row.equipment_notes) : null,
    backline_notes: row.backline_notes ? String(row.backline_notes) : null,
    signup_mode: row.signup_mode as OpenMicSignupMode,
    signup_opens_at: row.signup_opens_at ? String(row.signup_opens_at) : null,
    signup_closes_at: row.signup_closes_at ? String(row.signup_closes_at) : null,
    max_songs_per_player:
      row.max_songs_per_player == null ? null : Number(row.max_songs_per_player),
    max_slots_per_player:
      row.max_slots_per_player == null ? null : Number(row.max_slots_per_player),
    required_contact_field: row.required_contact_field as OpenMicContactField,
    public_song_list_enabled: Boolean(row.public_song_list_enabled),
    running_order_locked: Boolean(row.running_order_locked),
    poster_template_id: row.poster_template_id ? String(row.poster_template_id) : null,
    event_image_url: row.event_image_url ? String(row.event_image_url) : null,
    created_by: String(row.created_by),
    updated_by: row.updated_by ? String(row.updated_by) : null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export function formatOpenMicEventStatus(status: OpenMicEventStatus): string {
  switch (status) {
    case 'draft':
      return 'Draft';
    case 'published':
      return 'Published';
    case 'signup_open':
      return 'Sign-up open';
    case 'signup_closed':
      return 'Sign-up closed';
    case 'in_progress':
      return 'In progress';
    case 'completed':
      return 'Completed';
    case 'cancelled':
      return 'Cancelled';
    case 'archived':
      return 'Archived';
    default:
      return status;
  }
}

export function openMicStatusPillClass(status: OpenMicEventStatus): string {
  switch (status) {
    case 'draft':
      return 'status-pill status-pill--muted';
    case 'published':
    case 'signup_open':
      return 'status-pill status-pill--success';
    case 'signup_closed':
      return 'status-pill status-pill--warning';
    case 'in_progress':
      return 'status-pill status-pill--info';
    case 'completed':
      return 'status-pill status-pill--muted';
    case 'cancelled':
      return 'status-pill status-pill--danger';
    case 'archived':
      return 'status-pill status-pill--muted';
    default:
      return 'status-pill';
  }
}

export function formatOpenMicEventType(type: OpenMicEventType): string {
  switch (type) {
    case 'open_mic':
      return 'Open mic';
    case 'jam_night':
      return 'Jam night';
    case 'songbook_jam':
      return 'Songbook jam';
    case 'house_band_guest_night':
      return 'House band guest night';
    default:
      return type;
  }
}

export function formatOpenMicSignupMode(mode: OpenMicSignupMode): string {
  switch (mode) {
    case 'open':
      return 'Open';
    case 'moderated':
      return 'Moderated';
    case 'invite_only':
      return 'Invite only';
    case 'organiser_only':
      return 'Organiser only';
    default:
      return mode;
  }
}

export function getOpenMicPublicUrl(slug: string): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/events/${slug}`;
  }
  return `/events/${slug}`;
}

export function computeOpenMicDashboardMetrics(events: OpenMicEvent[]) {
  const upcoming = events.filter(
    (event) =>
      !['completed', 'cancelled', 'archived'].includes(event.status) &&
      new Date(event.starts_at) >= new Date(),
  );
  const drafts = events.filter((event) => event.status === 'draft');
  const live = events.filter((event) => event.status === 'in_progress');

  return {
    total: events.length,
    upcoming: upcoming.length,
    drafts: drafts.length,
    live: live.length,
  };
}

export async function listOrganiserOpenMicEvents(): Promise<OpenMicEventSummary[]> {
  const session = await getCurrentSession();
  if (!session?.user) {
    throw new Error('Must be signed in to view open mic events.');
  }

  const client = getBandieClient();
  const { data, error } = await client
    .from('bandie_open_mic_events')
    .select('*')
    .eq('organiser_user_id', session.user.id)
    .order('starts_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const events = (data ?? []).map((row) => normalizeEventRow(row as Record<string, unknown>));
  const eventIds = events.map((event) => event.id);

  const songCounts = new Map<string, number>();
  const signupCounts = new Map<string, number>();

  if (eventIds.length > 0) {
    const { data: songs } = await client
      .from('bandie_open_mic_songs')
      .select('event_id')
      .in('event_id', eventIds);
    for (const row of songs ?? []) {
      const id = String((row as { event_id: string }).event_id);
      songCounts.set(id, (songCounts.get(id) ?? 0) + 1);
    }

    const { data: signups } = await client
      .from('bandie_open_mic_assignments')
      .select('event_id, status')
      .in('event_id', eventIds)
      .in('status', ['requested', 'approved']);
    for (const row of signups ?? []) {
      const id = String((row as { event_id: string }).event_id);
      signupCounts.set(id, (signupCounts.get(id) ?? 0) + 1);
    }
  }

  const venueCache = new Map<string, OrganiserVenue | null>();

  return Promise.all(
    events.map(async (event) => {
      let venue: OrganiserVenue | null = null;
      if (event.venue_id) {
        if (!venueCache.has(event.venue_id)) {
          venueCache.set(event.venue_id, await getOrganiserVenue(event.venue_id).catch(() => null));
        }
        venue = venueCache.get(event.venue_id) ?? null;
      }

      return {
        ...event,
        songCount: songCounts.get(event.id) ?? 0,
        signupCount: signupCounts.get(event.id) ?? 0,
        venue,
      };
    }),
  );
}

export async function getOpenMicEvent(eventId: string): Promise<OpenMicEventSummary | null> {
  const client = getBandieClient();
  const { data, error } = await client
    .from('bandie_open_mic_events')
    .select('*')
    .eq('id', eventId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  if (!data) {
    return null;
  }

  const event = normalizeEventRow(data as Record<string, unknown>);
  const venue = event.venue_id ? await getOrganiserVenue(event.venue_id).catch(() => null) : null;

  const { count: songCount } = await client
    .from('bandie_open_mic_songs')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId);

  const { count: signupCount } = await client
    .from('bandie_open_mic_assignments')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId)
    .in('status', ['requested', 'approved']);

  return {
    ...event,
    songCount: songCount ?? 0,
    signupCount: signupCount ?? 0,
    venue,
  };
}

export function resolveOpenMicVenueLabel(
  event: Pick<OpenMicEvent, 'venue_name' | 'venue_address'>,
  venue: OrganiserVenue | null,
): { name: string | null; address: string | null } {
  if (venue) {
    return {
      name: venue.name,
      address: formatOrganiserVenueAddress(venue),
    };
  }
  return {
    name: event.venue_name,
    address: event.venue_address,
  };
}

export async function createOpenMicEvent(input: CreateOpenMicEventInput): Promise<OpenMicEvent> {
  const session = await getCurrentSession();
  if (!session?.user) {
    throw new Error('Must be signed in to create open mic events.');
  }

  await assertCanPerform({
    capability: 'open_mic.create',
    subjectType: 'user',
    subjectId: session.user.id,
    planScope: 'organiser',
  });

  const client = getBandieClient();
  const { data, error } = await client.rpc('bandie_create_open_mic_event', {
    p_title: input.title.trim(),
    p_starts_at: input.startsAt,
    p_ends_at: input.endsAt ?? null,
    p_event_type: input.eventType ?? 'open_mic',
    p_venue_id: input.venueId ?? null,
    p_venue_name: input.venueName ?? null,
    p_venue_address: input.venueAddress ?? null,
    p_description: input.description ?? null,
    p_timezone: input.timezone ?? 'Europe/London',
    p_signup_mode: input.signupMode ?? 'open',
    p_required_contact_field: input.requiredContactField ?? 'email_or_phone',
  });

  if (error) {
    throw new Error(error.message);
  }

  return normalizeEventRow(data as Record<string, unknown>);
}

function buildUpdatePatch(input: UpdateOpenMicEventInput): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  if (input.title !== undefined) patch.title = input.title;
  if (input.eventType !== undefined) patch.event_type = input.eventType;
  if (input.venueId !== undefined) patch.venue_id = input.venueId;
  if (input.venueName !== undefined) patch.venue_name = input.venueName;
  if (input.venueAddress !== undefined) patch.venue_address = input.venueAddress;
  if (input.startsAt !== undefined) patch.starts_at = input.startsAt;
  if (input.endsAt !== undefined) patch.ends_at = input.endsAt;
  if (input.timezone !== undefined) patch.timezone = input.timezone;
  if (input.description !== undefined) patch.description = input.description;
  if (input.hostName !== undefined) patch.host_name = input.hostName;
  if (input.houseBandName !== undefined) patch.house_band_name = input.houseBandName;
  if (input.entryPrice !== undefined) patch.entry_price = input.entryPrice;
  if (input.ageRestrictions !== undefined) patch.age_restrictions = input.ageRestrictions;
  if (input.equipmentNotes !== undefined) patch.equipment_notes = input.equipmentNotes;
  if (input.backlineNotes !== undefined) patch.backline_notes = input.backlineNotes;
  if (input.signupMode !== undefined) patch.signup_mode = input.signupMode;
  if (input.signupOpensAt !== undefined) patch.signup_opens_at = input.signupOpensAt;
  if (input.signupClosesAt !== undefined) patch.signup_closes_at = input.signupClosesAt;
  if (input.maxSongsPerPlayer !== undefined) patch.max_songs_per_player = input.maxSongsPerPlayer;
  if (input.maxSlotsPerPlayer !== undefined) patch.max_slots_per_player = input.maxSlotsPerPlayer;
  if (input.requiredContactField !== undefined) {
    patch.required_contact_field = input.requiredContactField;
  }
  if (input.publicSongListEnabled !== undefined) {
    patch.public_song_list_enabled = input.publicSongListEnabled;
  }
  if (input.posterTemplateId !== undefined) patch.poster_template_id = input.posterTemplateId;
  if (input.eventImageUrl !== undefined) patch.event_image_url = input.eventImageUrl;
  if (input.visibility !== undefined) patch.visibility = input.visibility;
  return patch;
}

export async function updateOpenMicEvent(
  eventId: string,
  input: UpdateOpenMicEventInput,
): Promise<OpenMicEvent> {
  const session = await getCurrentSession();
  if (!session?.user) {
    throw new Error('Must be signed in to update events.');
  }

  const client = getBandieClient();
  const { data, error } = await client.rpc('bandie_update_open_mic_event', {
    p_event_id: eventId,
    p_patch: buildUpdatePatch(input),
  });

  if (error) {
    throw new Error(error.message);
  }

  return normalizeEventRow(data as Record<string, unknown>);
}

export async function publishOpenMicEvent(eventId: string): Promise<OpenMicEvent> {
  const client = getBandieClient();
  const { data, error } = await client.rpc('bandie_publish_open_mic_event', {
    p_event_id: eventId,
  });
  if (error) {
    throw new Error(error.message);
  }
  return normalizeEventRow(data as Record<string, unknown>);
}

export async function cancelOpenMicEvent(eventId: string): Promise<OpenMicEvent> {
  const client = getBandieClient();
  const { data, error } = await client.rpc('bandie_cancel_open_mic_event', {
    p_event_id: eventId,
  });
  if (error) {
    throw new Error(error.message);
  }
  return normalizeEventRow(data as Record<string, unknown>);
}

export async function duplicateOpenMicEvent(eventId: string): Promise<OpenMicEvent> {
  const client = getBandieClient();
  const { data, error } = await client.rpc('bandie_duplicate_open_mic_event', {
    p_event_id: eventId,
  });
  if (error) {
    throw new Error(error.message);
  }
  return normalizeEventRow(data as Record<string, unknown>);
}

export async function getPublicOpenMicEvent(slug: string): Promise<PublicOpenMicEvent | null> {
  const client = getBandieClient();
  const { data, error } = await client.rpc('bandie_get_public_open_mic_event', {
    p_slug: slug,
  });

  if (error) {
    throw new Error(error.message);
  }
  if (!data) {
    return null;
  }

  const row = data as Record<string, unknown>;
  return {
    id: String(row.id),
    slug: String(row.slug),
    title: String(row.title),
    event_type: row.event_type as OpenMicEventType,
    status: row.status as OpenMicEventStatus,
    starts_at: String(row.starts_at),
    ends_at: row.ends_at ? String(row.ends_at) : null,
    timezone: String(row.timezone ?? 'Europe/London'),
    description: row.description ? String(row.description) : null,
    host_name: row.host_name ? String(row.host_name) : null,
    house_band_name: row.house_band_name ? String(row.house_band_name) : null,
    entry_price: row.entry_price ? String(row.entry_price) : null,
    age_restrictions: row.age_restrictions ? String(row.age_restrictions) : null,
    equipment_notes: row.equipment_notes ? String(row.equipment_notes) : null,
    backline_notes: row.backline_notes ? String(row.backline_notes) : null,
    signup_mode: row.signup_mode as OpenMicSignupMode,
    signup_opens_at: row.signup_opens_at ? String(row.signup_opens_at) : null,
    signup_closes_at: row.signup_closes_at ? String(row.signup_closes_at) : null,
    public_song_list_enabled: Boolean(row.public_song_list_enabled),
    required_contact_field: row.required_contact_field as OpenMicContactField,
    venue_name: row.venue_name ? String(row.venue_name) : null,
    venue_address: row.venue_address ? String(row.venue_address) : null,
    poster_template_id: row.poster_template_id ? String(row.poster_template_id) : null,
    event_image_url: row.event_image_url ? String(row.event_image_url) : null,
  };
}
