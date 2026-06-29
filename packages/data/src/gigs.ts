import { assertCanPerform } from './entitlements';
import { getBandieClient } from './context';
import { getCurrentSession } from './auth';
import { syncUsageMeter, METER_KEYS } from './usageMeters';
import { getBandSetlist, type SetlistMetrics } from './setlists';
import { getOrganiserVenue, type OrganiserVenue } from './organiserVenues';

export type GigStatus =
  | 'enquiry'
  | 'proposed'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'archived';

export type GigInviteStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled';

export const GIG_STATUS_OPTIONS: GigStatus[] = [
  'enquiry',
  'proposed',
  'confirmed',
  'completed',
  'cancelled',
  'archived',
];

export const GIG_INVITE_STATUS_OPTIONS: GigInviteStatus[] = [
  'pending',
  'accepted',
  'rejected',
  'cancelled',
];

export const ACTIVE_GIG_INVITE_STATUSES: GigInviteStatus[] = ['pending', 'accepted'];

export function isActiveGigInviteStatus(status: GigInviteStatus): boolean {
  return ACTIVE_GIG_INVITE_STATUSES.includes(status);
}

export const ACTIVE_GIG_STATUSES: GigStatus[] = ['enquiry', 'proposed', 'confirmed'];

export const GIG_BAND_LEADER_MESSAGE =
  'Only band leaders can accept invites and assign setlists. All members can view gig details.';

export const GIG_ORGANISER_ONLY_MESSAGE =
  'Gigs are created and managed by organisers. Band leaders respond to invites and assign setlists.';

export type OrganiserGig = {
  id: string;
  organiser_user_id: string;
  venue_id: string | null;
  title: string;
  starts_at: string;
  ends_at: string | null;
  venue_name: string | null;
  venue_address: string | null;
  status: GigStatus;
  calendar_event_id: string | null;
  notes: string | null;
  fee_notes: string | null;
  slot_count: number | null;
  default_slot_duration_minutes: number | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type GigBandInvite = {
  id: string;
  gig_id: string;
  band_id: string;
  invite_status: GigInviteStatus;
  running_order: number | null;
  slot_duration_minutes: number | null;
  setlist_id: string | null;
  invited_at: string;
  responded_at: string | null;
  responded_by: string | null;
  created_at: string;
  updated_at: string;
};

export type GigBandInviteWithBand = GigBandInvite & {
  bandName: string;
  bandSlug: string;
  bandLogoUrl: string | null;
  bandHeroImageUrl: string | null;
  bandTagline: string | null;
  setlistTitle: string | null;
  setlistMetrics: SetlistMetrics | null;
};

export type GigSlotScheduleEntry = {
  invite: GigBandInviteWithBand;
  slotNumber: number;
  durationMinutes: number;
  startsAt: Date;
  endsAt: Date;
};

export type GigWorkflowStep = {
  id: string;
  label: string;
  complete: boolean;
};

export type BandGigInvitation = {
  invite: GigBandInvite;
  gig: OrganiserGig;
  setlistTitle: string | null;
  setlistMetrics: SetlistMetrics | null;
};

export type OrganiserGigDetail = OrganiserGig & {
  venue: OrganiserVenue | null;
  bands: GigBandInviteWithBand[];
};

export type CreateOrganiserGigInput = {
  title: string;
  startsAt: string;
  endsAt?: string | null;
  venueId?: string | null;
  venueName?: string | null;
  venueAddress?: string | null;
  status?: GigStatus;
  slotCount?: number | null;
  defaultSlotDurationMinutes?: number | null;
  calendarEventId?: string | null;
  notes?: string | null;
  feeNotes?: string | null;
};

export type UpdateOrganiserGigInput = Partial<CreateOrganiserGigInput & { status: GigStatus }>;

export type InviteBandToGigInput = {
  bandId: string;
  slotNumber?: number | null;
  slotDurationMinutes?: number | null;
  personalMessage?: string | null;
};

export type UpdateGigBandSlotInput = {
  gigBandId: string;
  slotNumber?: number | null;
  slotDurationMinutes?: number | null;
};

export function formatGigStatus(status: GigStatus): string {
  switch (status) {
    case 'enquiry':
      return 'Enquiry';
    case 'proposed':
      return 'Proposed';
    case 'confirmed':
      return 'Confirmed';
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

export function formatGigInviteStatus(status: GigInviteStatus): string {
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'accepted':
      return 'Accepted';
    case 'rejected':
      return 'Rejected';
    case 'cancelled':
      return 'Cancelled';
    default:
      return status;
  }
}

export function gigStatusPillClass(status: GigStatus): string {
  return `gig-status gig-status-${status}`;
}

export function gigInviteStatusPillClass(status: GigInviteStatus): string {
  return `gig-invite-status gig-invite-status-${status}`;
}

export function formatSlotDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
}

export function formatSlotTimeRange(startsAt: Date, endsAt: Date): string {
  const timeOptions: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' };
  return `${startsAt.toLocaleTimeString('en-GB', timeOptions)} – ${endsAt.toLocaleTimeString('en-GB', timeOptions)}`;
}

export function buildGigSlotSchedule(
  gig: Pick<OrganiserGig, 'starts_at' | 'default_slot_duration_minutes'>,
  bands: GigBandInviteWithBand[],
): GigSlotScheduleEntry[] {
  const defaultDuration = gig.default_slot_duration_minutes ?? 45;
  const sorted = [...bands]
    .filter((invite) => invite.running_order != null && invite.invite_status !== 'cancelled')
    .sort((a, b) => (a.running_order ?? 0) - (b.running_order ?? 0));

  let cursor = new Date(gig.starts_at);
  return sorted.map((invite) => {
    const durationMinutes = invite.slot_duration_minutes ?? defaultDuration;
    const startsAt = new Date(cursor);
    const endsAt = new Date(cursor.getTime() + durationMinutes * 60_000);
    cursor = endsAt;
    return {
      invite,
      slotNumber: invite.running_order as number,
      durationMinutes,
      startsAt,
      endsAt,
    };
  });
}

export function buildGigWorkflowSteps(gig: OrganiserGig, bands: GigBandInviteWithBand[]): GigWorkflowStep[] {
  const activeBands = bands.filter((band) => band.invite_status !== 'cancelled');
  const hasVenue = Boolean(gig.venue_id || gig.venue_name?.trim());
  const hasStructure = Boolean(
    gig.ends_at && gig.slot_count && gig.slot_count > 0 && gig.default_slot_duration_minutes,
  );
  const hasInvites = activeBands.length > 0;
  const allResponded =
    activeBands.length > 0 &&
    activeBands.every((band) => band.invite_status === 'accepted' || band.invite_status === 'rejected');
  const hasAccepted = activeBands.some((band) => band.invite_status === 'accepted');
  const isConfirmed = gig.status === 'confirmed';

  return [
    { id: 'placeholder', label: 'Create placeholder', complete: Boolean(gig.title.trim() && gig.starts_at) },
    { id: 'venue', label: 'Identify venue', complete: hasVenue },
    { id: 'structure', label: 'Design gig structure', complete: hasStructure },
    { id: 'invites', label: 'Invite bands', complete: hasInvites },
    { id: 'responses', label: 'Band responses', complete: hasInvites && allResponded },
    { id: 'running-order', label: 'Running order', complete: hasAccepted && activeBands.some((b) => b.running_order) },
    { id: 'confirmed', label: 'Confirmed', complete: isConfirmed },
  ];
}

export function canConfirmOrganiserGig(gig: OrganiserGig, bands: GigBandInviteWithBand[]): boolean {
  if (gig.status === 'confirmed' || gig.status === 'archived' || gig.status === 'cancelled') {
    return false;
  }
  const accepted = bands.filter((band) => band.invite_status === 'accepted');
  return (
    Boolean(gig.title.trim() && gig.starts_at && gig.ends_at && gig.slot_count && gig.default_slot_duration_minutes) &&
    accepted.length > 0 &&
    accepted.every((band) => band.running_order != null)
  );
}

function normalizeGigRow(row: Record<string, unknown>): OrganiserGig {
  return row as OrganiserGig;
}

function normalizeInviteRow(row: Record<string, unknown>): GigBandInvite {
  return row as GigBandInvite;
}

async function hydrateInviteSetlist(
  bandId: string,
  invite: GigBandInvite,
): Promise<{ setlistTitle: string | null; setlistMetrics: SetlistMetrics | null }> {
  if (!invite.setlist_id) {
    return { setlistTitle: null, setlistMetrics: null };
  }

  const setlist = await getBandSetlist(bandId, invite.setlist_id);
  return {
    setlistTitle: setlist?.title ?? null,
    setlistMetrics: setlist?.metrics ?? null,
  };
}

async function syncOrganiserGigUsage(organiserUserId: string): Promise<void> {
  await syncUsageMeter(METER_KEYS.GIGS_ACTIVE_COUNT, 'user', organiserUserId);
}

export async function listOrganiserGigs(): Promise<OrganiserGig[]> {
  const session = await getCurrentSession();
  if (!session?.user) {
    throw new Error('Must be signed in to view gigs.');
  }

  const client = getBandieClient();
  const { data, error } = await client
    .from('bandie_gigs')
    .select('*')
    .eq('organiser_user_id', session.user.id)
    .order('starts_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => normalizeGigRow(row as Record<string, unknown>));
}

export async function getOrganiserGig(gigId: string): Promise<OrganiserGigDetail | null> {
  const client = getBandieClient();
  const { data: gigRow, error: gigError } = await client
    .from('bandie_gigs')
    .select('*')
    .eq('id', gigId)
    .maybeSingle();

  if (gigError) {
    throw new Error(gigError.message);
  }

  if (!gigRow) {
    return null;
  }

  const gig = normalizeGigRow(gigRow as Record<string, unknown>);
  const venue = gig.venue_id ? await getOrganiserVenue(gig.venue_id) : null;

  const { data: inviteRows, error: inviteError } = await client
    .from('bandie_gig_bands')
    .select('*, band:bandie_bands(name, slug, logo_url, hero_image_url, tagline)')
    .eq('gig_id', gigId)
    .order('running_order', { ascending: true, nullsFirst: false });

  if (inviteError) {
    throw new Error(inviteError.message);
  }

  const bands: GigBandInviteWithBand[] = [];
  for (const row of inviteRows ?? []) {
    const invite = normalizeInviteRow(row as Record<string, unknown>);
    const bandMeta = (row as {
      band?: { name?: string; slug?: string; logo_url?: string | null; hero_image_url?: string | null; tagline?: string | null };
    }).band;
    const setlistContext = await hydrateInviteSetlist(invite.band_id, invite);
    bands.push({
      ...invite,
      bandName: bandMeta?.name ?? 'Band',
      bandSlug: bandMeta?.slug ?? '',
      bandLogoUrl: bandMeta?.logo_url ?? null,
      bandHeroImageUrl: bandMeta?.hero_image_url ?? null,
      bandTagline: bandMeta?.tagline ?? null,
      ...setlistContext,
    });
  }

  return { ...gig, venue, bands };
}

export async function createOrganiserGig(input: CreateOrganiserGigInput): Promise<OrganiserGig> {
  const session = await getCurrentSession();
  if (!session?.user) {
    throw new Error('Must be signed in to create gigs.');
  }

  await assertCanPerform({
    capability: 'gig.create',
    subjectType: 'user',
    subjectId: session.user.id,
    planScope: 'organiser',
  });

  const client = getBandieClient();
  const { data, error } = await client
    .from('bandie_gigs')
    .insert({
      organiser_user_id: session.user.id,
      title: input.title.trim(),
      starts_at: input.startsAt,
      ends_at: input.endsAt ?? null,
      venue_id: input.venueId ?? null,
      venue_name: input.venueName?.trim() || null,
      venue_address: input.venueAddress?.trim() || null,
      status: input.status ?? 'enquiry',
      calendar_event_id: input.calendarEventId ?? null,
      notes: input.notes?.trim() || null,
      fee_notes: input.feeNotes?.trim() || null,
      slot_count: input.slotCount ?? null,
      default_slot_duration_minutes: input.defaultSlotDurationMinutes ?? null,
      created_by: session.user.id,
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  await syncOrganiserGigUsage(session.user.id);
  return normalizeGigRow(data as Record<string, unknown>);
}

export async function updateOrganiserGig(
  gigId: string,
  input: UpdateOrganiserGigInput,
): Promise<OrganiserGig> {
  const session = await getCurrentSession();
  if (!session?.user) {
    throw new Error('Must be signed in to update gigs.');
  }

  const client = getBandieClient();
  const patch: Record<string, unknown> = {};
  if (input.title !== undefined) patch.title = input.title.trim();
  if (input.startsAt !== undefined) patch.starts_at = input.startsAt;
  if (input.endsAt !== undefined) patch.ends_at = input.endsAt;
  if (input.venueId !== undefined) patch.venue_id = input.venueId;
  if (input.venueName !== undefined) patch.venue_name = input.venueName?.trim() || null;
  if (input.venueAddress !== undefined) patch.venue_address = input.venueAddress?.trim() || null;
  if (input.status !== undefined) patch.status = input.status;
  if (input.calendarEventId !== undefined) patch.calendar_event_id = input.calendarEventId;
  if (input.notes !== undefined) patch.notes = input.notes?.trim() || null;
  if (input.feeNotes !== undefined) patch.fee_notes = input.feeNotes?.trim() || null;
  if (input.slotCount !== undefined) patch.slot_count = input.slotCount;
  if (input.defaultSlotDurationMinutes !== undefined) {
    patch.default_slot_duration_minutes = input.defaultSlotDurationMinutes;
  }

  const { data, error } = await client
    .from('bandie_gigs')
    .update(patch)
    .eq('id', gigId)
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  await syncOrganiserGigUsage(session.user.id);
  return normalizeGigRow(data as Record<string, unknown>);
}

export async function archiveOrganiserGig(gigId: string): Promise<void> {
  await updateOrganiserGig(gigId, { status: 'archived' });
}

export async function confirmOrganiserGig(gigId: string): Promise<OrganiserGig> {
  const detail = await getOrganiserGig(gigId);
  if (!detail) {
    throw new Error('Gig not found.');
  }
  if (!canConfirmOrganiserGig(detail, detail.bands)) {
    throw new Error('Add structure, accepted bands, and slot positions before confirming.');
  }
  return updateOrganiserGig(gigId, { status: 'confirmed' });
}

export async function reopenOrganiserGig(gigId: string): Promise<OrganiserGig> {
  const detail = await getOrganiserGig(gigId);
  if (!detail) {
    throw new Error('Gig not found.');
  }
  if (detail.status !== 'confirmed') {
    throw new Error('Only confirmed gigs can be re-opened for planning.');
  }
  return updateOrganiserGig(gigId, { status: 'proposed' });
}

export async function inviteBandToGig(
  gigId: string,
  input: InviteBandToGigInput | string,
): Promise<GigBandInvite> {
  const payload = typeof input === 'string' ? { bandId: input } : input;
  const client = getBandieClient();
  const { data, error } = await client.rpc('bandie_organiser_invite_band_to_gig', {
    p_gig_id: gigId,
    p_band_id: payload.bandId,
    p_running_order: payload.slotNumber ?? null,
    p_slot_duration_minutes: payload.slotDurationMinutes ?? null,
    p_personal_message: payload.personalMessage?.trim() || null,
  });

  if (error) {
    throw new Error(error.message);
  }

  return normalizeInviteRow(data as Record<string, unknown>);
}

export function formatGigInviteNotificationBody(input: {
  gig: Pick<
    OrganiserGig,
    | 'title'
    | 'starts_at'
    | 'ends_at'
    | 'venue_name'
    | 'venue_address'
    | 'fee_notes'
    | 'notes'
    | 'default_slot_duration_minutes'
  >;
  organiser: {
    displayName: string;
    username?: string | null;
    email?: string | null;
    contactPhone?: string | null;
  };
  slotNumber?: number | null;
  slotDurationMinutes?: number | null;
  personalMessage?: string | null;
}): string {
  const lines: string[] = [];
  const when = new Date(input.gig.starts_at).toLocaleString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  lines.push('You have been invited to play a gig on Bandie.', '');
  lines.push(`Gig: ${input.gig.title}`);
  lines.push(`Date & time: ${when}`);

  if (input.gig.ends_at) {
    lines.push(
      `Show end: ${new Date(input.gig.ends_at).toLocaleString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })}`,
    );
  }

  if (input.gig.venue_name?.trim()) {
    lines.push(`Venue: ${input.gig.venue_name.trim()}`);
  }

  if (input.gig.venue_address?.trim()) {
    lines.push(`Address: ${input.gig.venue_address.trim()}`);
  }

  if (input.slotNumber != null) {
    lines.push(`Proposed slot: ${input.slotNumber}`);
  }

  const duration = input.slotDurationMinutes ?? input.gig.default_slot_duration_minutes;
  if (duration != null) {
    lines.push(`Slot duration: ${duration} minutes`);
  }

  if (input.gig.fee_notes?.trim()) {
    lines.push(`Fee notes: ${input.gig.fee_notes.trim()}`);
  }

  if (input.gig.notes?.trim()) {
    lines.push(`Notes: ${input.gig.notes.trim()}`);
  }

  lines.push('', 'Organiser contact');
  lines.push(`Name: ${input.organiser.displayName}`);

  if (input.organiser.username?.trim()) {
    lines.push(`Username: @${input.organiser.username.trim()}`);
  }

  if (input.organiser.email?.trim()) {
    lines.push(`Email: ${input.organiser.email.trim()}`);
  }

  if (input.organiser.contactPhone?.trim()) {
    lines.push(`Phone: ${input.organiser.contactPhone.trim()}`);
  }

  if (input.personalMessage?.trim()) {
    lines.push('', 'Message from organiser:', input.personalMessage.trim());
  }

  lines.push('', 'Respond from Gig invites in your band workspace or from Bandie communications.');
  return lines.join('\n');
}

export async function cancelGigBandInvite(gigBandId: string): Promise<void> {
  const client = getBandieClient();
  const { error } = await client
    .from('bandie_gig_bands')
    .update({ invite_status: 'cancelled' })
    .eq('id', gigBandId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function updateGigBandSlot(
  gigId: string,
  input: UpdateGigBandSlotInput,
): Promise<void> {
  const client = getBandieClient();
  const patch: Record<string, unknown> = {};
  if (input.slotNumber !== undefined) patch.running_order = input.slotNumber;
  if (input.slotDurationMinutes !== undefined) patch.slot_duration_minutes = input.slotDurationMinutes;

  const { error } = await client
    .from('bandie_gig_bands')
    .update(patch)
    .eq('id', input.gigBandId)
    .eq('gig_id', gigId);

  if (error) {
    throw new Error(error.message);
  }
}

/** @deprecated Use updateGigBandSlot */
export async function updateGigBandRunningOrder(
  gigId: string,
  orders: Array<{ gigBandId: string; runningOrder: number | null }>,
): Promise<void> {
  for (const item of orders) {
    await updateGigBandSlot(gigId, { gigBandId: item.gigBandId, slotNumber: item.runningOrder });
  }
}

export async function listBandGigInvitations(bandId: string): Promise<BandGigInvitation[]> {
  const client = getBandieClient();
  const { data, error } = await client
    .from('bandie_gig_bands')
    .select('*, gig:bandie_gigs(*)')
    .eq('band_id', bandId)
    .neq('invite_status', 'cancelled')
    .order('invited_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const invitations: BandGigInvitation[] = [];
  for (const row of data ?? []) {
    const invite = normalizeInviteRow(row as Record<string, unknown>);
    const gigRow = (row as { gig?: Record<string, unknown> }).gig;
    if (!gigRow) {
      continue;
    }
    const gig = normalizeGigRow(gigRow);
    const setlistContext = await hydrateInviteSetlist(bandId, invite);
    invitations.push({ invite, gig, ...setlistContext });
  }

  return invitations;
}

export async function getBandGigInvitation(
  bandId: string,
  gigId: string,
): Promise<BandGigInvitation | null> {
  const client = getBandieClient();
  const { data, error } = await client
    .from('bandie_gig_bands')
    .select('*, gig:bandie_gigs(*)')
    .eq('band_id', bandId)
    .eq('gig_id', gigId)
    .neq('invite_status', 'cancelled')
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const invite = normalizeInviteRow(data as Record<string, unknown>);
  const gigRow = (data as { gig?: Record<string, unknown> }).gig;
  if (!gigRow) {
    return null;
  }

  const setlistContext = await hydrateInviteSetlist(bandId, invite);
  return {
    invite,
    gig: normalizeGigRow(gigRow),
    ...setlistContext,
  };
}

export async function respondToGigInvitation(
  gigBandId: string,
  accept: boolean,
): Promise<GigBandInvite> {
  const client = getBandieClient();
  const { data, error } = await client.rpc('bandie_respond_gig_invite', {
    p_gig_band_id: gigBandId,
    p_accept: accept,
  });

  if (error) {
    throw new Error(error.message);
  }

  return normalizeInviteRow(data as Record<string, unknown>);
}

export async function assignGigSetlist(
  gigBandId: string,
  setlistId: string | null,
): Promise<GigBandInvite> {
  const client = getBandieClient();
  const { data, error } = await client.rpc('bandie_assign_gig_setlist', {
    p_gig_band_id: gigBandId,
    p_setlist_id: setlistId,
  });

  if (error) {
    throw new Error(error.message);
  }

  return normalizeInviteRow(data as Record<string, unknown>);
}

export function computeGigDashboardMetrics(gigs: OrganiserGig[]): {
  active: number;
  upcoming: number;
  confirmed: number;
  pendingInvites?: number;
} {
  const now = Date.now();
  let active = 0;
  let upcoming = 0;
  let confirmed = 0;

  for (const gig of gigs) {
    if (ACTIVE_GIG_STATUSES.includes(gig.status)) {
      active += 1;
    }
    if (gig.status === 'confirmed' && new Date(gig.starts_at).getTime() >= now) {
      confirmed += 1;
    }
    if (
      ACTIVE_GIG_STATUSES.includes(gig.status) &&
      new Date(gig.starts_at).getTime() >= now
    ) {
      upcoming += 1;
    }
  }

  return { active, upcoming, confirmed };
}

export function computeBandGigInviteMetrics(invitations: BandGigInvitation[]): {
  pending: number;
  accepted: number;
  upcoming: number;
} {
  const now = Date.now();
  let pending = 0;
  let accepted = 0;
  let upcoming = 0;

  for (const item of invitations) {
    if (item.invite.invite_status === 'pending') {
      pending += 1;
    }
    if (item.invite.invite_status === 'accepted') {
      accepted += 1;
      if (
        ACTIVE_GIG_STATUSES.includes(item.gig.status) &&
        new Date(item.gig.starts_at).getTime() >= now
      ) {
        upcoming += 1;
      }
    }
  }

  return { pending, accepted, upcoming };
}
