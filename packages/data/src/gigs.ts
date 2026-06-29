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
  setlistTitle: string | null;
  setlistMetrics: SetlistMetrics | null;
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
  calendarEventId?: string | null;
  notes?: string | null;
  feeNotes?: string | null;
};

export type UpdateOrganiserGigInput = Partial<CreateOrganiserGigInput & { status: GigStatus }>;

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
    .select('*, band:bandie_bands(name, slug)')
    .eq('gig_id', gigId)
    .order('running_order', { ascending: true, nullsFirst: false });

  if (inviteError) {
    throw new Error(inviteError.message);
  }

  const bands: GigBandInviteWithBand[] = [];
  for (const row of inviteRows ?? []) {
    const invite = normalizeInviteRow(row as Record<string, unknown>);
    const bandMeta = (row as { band?: { name?: string; slug?: string } }).band;
    const setlistContext = await hydrateInviteSetlist(invite.band_id, invite);
    bands.push({
      ...invite,
      bandName: bandMeta?.name ?? 'Band',
      bandSlug: bandMeta?.slug ?? '',
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

export async function inviteBandToGig(gigId: string, bandId: string): Promise<GigBandInvite> {
  const client = getBandieClient();
  const { data, error } = await client
    .from('bandie_gig_bands')
    .insert({
      gig_id: gigId,
      band_id: bandId,
      invite_status: 'pending',
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return normalizeInviteRow(data as Record<string, unknown>);
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

export async function updateGigBandRunningOrder(
  gigId: string,
  orders: Array<{ gigBandId: string; runningOrder: number | null }>,
): Promise<void> {
  const client = getBandieClient();

  for (const item of orders) {
    const { error } = await client
      .from('bandie_gig_bands')
      .update({ running_order: item.runningOrder })
      .eq('id', item.gigBandId)
      .eq('gig_id', gigId);

    if (error) {
      throw new Error(error.message);
    }
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
