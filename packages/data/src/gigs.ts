import { assertCanPerform } from './entitlements';
import { getBandieClient } from './context';
import { getCurrentSession } from './auth';
import { syncUsageMeter, METER_KEYS } from './usageMeters';
import { getBandSetlist, type SetlistMetrics } from './setlists';

export type GigStatus =
  | 'enquiry'
  | 'proposed'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'archived';

export const GIG_STATUS_OPTIONS: GigStatus[] = [
  'enquiry',
  'proposed',
  'confirmed',
  'completed',
  'cancelled',
  'archived',
];

export const ACTIVE_GIG_STATUSES: GigStatus[] = ['enquiry', 'proposed', 'confirmed'];

export const GIG_LEADER_ONLY_MESSAGE =
  'Only band leaders can create or edit gigs. You can view gig details and linked setlists.';

export type BandGig = {
  id: string;
  band_id: string;
  title: string;
  starts_at: string;
  ends_at: string | null;
  venue_name: string | null;
  venue_address: string | null;
  status: GigStatus;
  setlist_id: string | null;
  calendar_event_id: string | null;
  notes: string | null;
  fee_notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type GigWithSetlistContext = BandGig & {
  setlistTitle: string | null;
  setlistMetrics: SetlistMetrics | null;
};

export type CreateGigInput = {
  bandId: string;
  title: string;
  startsAt: string;
  endsAt?: string | null;
  venueName?: string | null;
  venueAddress?: string | null;
  status?: GigStatus;
  setlistId?: string | null;
  calendarEventId?: string | null;
  notes?: string | null;
  feeNotes?: string | null;
};

export type UpdateGigInput = Partial<
  Omit<CreateGigInput, 'bandId'> & { status: GigStatus }
>;

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

export function gigStatusPillClass(status: GigStatus): string {
  return `gig-status gig-status-${status}`;
}

export async function listBandGigs(bandId: string): Promise<BandGig[]> {
  const client = getBandieClient();
  const { data, error } = await client
    .from('bandie_gigs')
    .select('*')
    .eq('band_id', bandId)
    .order('starts_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as BandGig[];
}

export async function getGig(gigId: string): Promise<GigWithSetlistContext | null> {
  const client = getBandieClient();
  const { data, error } = await client
    .from('bandie_gigs')
    .select('*')
    .eq('id', gigId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const gig = data as BandGig;
  if (!gig.setlist_id) {
    return { ...gig, setlistTitle: null, setlistMetrics: null };
  }

  const setlist = await getBandSetlist(gig.band_id, gig.setlist_id);
  return {
    ...gig,
    setlistTitle: setlist?.title ?? null,
    setlistMetrics: setlist?.metrics ?? null,
  };
}

export async function createGig(input: CreateGigInput): Promise<BandGig> {
  const session = await getCurrentSession();
  if (!session?.user) {
    throw new Error('Must be signed in to create gigs.');
  }

  await assertCanPerform({
    capability: 'gig.create',
    subjectType: 'band',
    subjectId: input.bandId,
    bandId: input.bandId,
    planScope: 'leader',
  });

  const client = getBandieClient();
  const { data, error } = await client
    .from('bandie_gigs')
    .insert({
      band_id: input.bandId,
      title: input.title.trim(),
      starts_at: input.startsAt,
      ends_at: input.endsAt ?? null,
      venue_name: input.venueName?.trim() || null,
      venue_address: input.venueAddress?.trim() || null,
      status: input.status ?? 'enquiry',
      setlist_id: input.setlistId ?? null,
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

  await syncUsageMeter(METER_KEYS.GIGS_ACTIVE_COUNT, 'band', input.bandId);
  return data as BandGig;
}

export async function updateGig(gigId: string, input: UpdateGigInput): Promise<BandGig> {
  const client = getBandieClient();
  const existing = await getGig(gigId);
  if (!existing) {
    throw new Error('Gig not found.');
  }

  const patch: Record<string, unknown> = {};
  if (input.title !== undefined) patch.title = input.title.trim();
  if (input.startsAt !== undefined) patch.starts_at = input.startsAt;
  if (input.endsAt !== undefined) patch.ends_at = input.endsAt;
  if (input.venueName !== undefined) patch.venue_name = input.venueName?.trim() || null;
  if (input.venueAddress !== undefined) patch.venue_address = input.venueAddress?.trim() || null;
  if (input.status !== undefined) patch.status = input.status;
  if (input.setlistId !== undefined) patch.setlist_id = input.setlistId;
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

  await syncUsageMeter(METER_KEYS.GIGS_ACTIVE_COUNT, 'band', existing.band_id);
  return data as BandGig;
}

export async function archiveGig(gigId: string): Promise<void> {
  await updateGig(gigId, { status: 'archived' });
}

export function computeGigDashboardMetrics(gigs: BandGig[]): {
  active: number;
  upcoming: number;
  confirmed: number;
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
