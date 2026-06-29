import { getBandieClient } from './context';

export const METER_KEYS = {
  BANDS_COUNT: 'bands.count',
  SONGS_COUNT: 'songs.count',
  SETLISTS_COUNT: 'setlists.count',
  VENUES_COUNT: 'venues.count',
  BAND_MEMBERS_COUNT: 'band_members.count',
  BOOKING_ENQUIRIES_SENT: 'booking_enquiries.sent',
  GIGS_ACTIVE_COUNT: 'gigs.active_count',
} as const;

const LIMIT_CAPABILITY_TO_METER: Record<string, string> = {
  'bands.max_count': METER_KEYS.BANDS_COUNT,
  'songs.max_count': METER_KEYS.SONGS_COUNT,
  'setlists.max_count': METER_KEYS.SETLISTS_COUNT,
  'venues.max_count': METER_KEYS.VENUES_COUNT,
  'band_members.max_count': METER_KEYS.BAND_MEMBERS_COUNT,
  'booking_enquiries.monthly_max_count': METER_KEYS.BOOKING_ENQUIRIES_SENT,
  'gigs.active_max_count': METER_KEYS.GIGS_ACTIVE_COUNT,
};

export function meterKeyForLimitCapability(capabilityKey: string): string | null {
  return LIMIT_CAPABILITY_TO_METER[capabilityKey] ?? null;
}

export function limitCapabilityForMeter(meterKey: string): string | null {
  const entry = Object.entries(LIMIT_CAPABILITY_TO_METER).find(([, value]) => value === meterKey);
  return entry?.[0] ?? null;
}

export async function countBandsLedByUser(userId: string): Promise<number> {
  const client = getBandieClient();
  const { count, error } = await client
    .from('bandie_bands')
    .select('id', { count: 'exact', head: true })
    .eq('owner_user_id', userId);

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

export async function countActiveSongsInBand(bandId: string): Promise<number> {
  const client = getBandieClient();
  const { count, error } = await client
    .from('bandie_songs')
    .select('id', { count: 'exact', head: true })
    .eq('band_id', bandId)
    .eq('is_deleted', false);

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

export async function countSetlistsInBand(bandId: string): Promise<number> {
  const client = getBandieClient();
  const { count, error } = await client
    .from('bandie_setlists')
    .select('id', { count: 'exact', head: true })
    .eq('band_id', bandId)
    .neq('status', 'archived');

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

export async function countOrganiserVenues(userId: string): Promise<number> {
  const client = getBandieClient();
  const { count, error } = await client
    .from('bandie_organiser_venues')
    .select('id', { count: 'exact', head: true })
    .eq('owner_user_id', userId);

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

export async function countActiveBandMembers(bandId: string): Promise<number> {
  const client = getBandieClient();
  const { count, error } = await client
    .from('bandie_band_members')
    .select('id', { count: 'exact', head: true })
    .eq('band_id', bandId)
    .eq('status', 'active');

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

export async function countActiveGigsInBand(bandId: string): Promise<number> {
  const client = getBandieClient();
  const { count, error } = await client
    .from('bandie_gigs')
    .select('id', { count: 'exact', head: true })
    .eq('band_id', bandId)
    .in('status', ['enquiry', 'proposed', 'confirmed']);

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

export async function countBookingEnquiriesSentThisMonth(userId: string): Promise<number> {
  const client = getBandieClient();
  const { data, error } = await client.rpc('bandie_count_booking_enquiries_sent_this_month', {
    p_user_id: userId,
  });

  if (error) {
    throw new Error(error.message);
  }

  return typeof data === 'number' ? data : 0;
}

export async function measureUsage(
  meterKey: string,
  _subjectType: 'user' | 'band',
  subjectId: string,
): Promise<number> {
  switch (meterKey) {
    case METER_KEYS.BANDS_COUNT:
      return countBandsLedByUser(subjectId);
    case METER_KEYS.SONGS_COUNT:
      return countActiveSongsInBand(subjectId);
    case METER_KEYS.SETLISTS_COUNT:
      return countSetlistsInBand(subjectId);
    case METER_KEYS.VENUES_COUNT:
      return countOrganiserVenues(subjectId);
    case METER_KEYS.BAND_MEMBERS_COUNT:
      return countActiveBandMembers(subjectId);
    case METER_KEYS.BOOKING_ENQUIRIES_SENT:
      return countBookingEnquiriesSentThisMonth(subjectId);
    case METER_KEYS.GIGS_ACTIVE_COUNT:
      return countActiveGigsInBand(subjectId);
    default:
      return 0;
  }
}

export async function syncUsageMeter(
  meterKey: string,
  subjectType: 'user' | 'band',
  subjectId: string,
): Promise<void> {
  const current = await measureUsage(meterKey, subjectType, subjectId);
  const client = getBandieClient();
  const { error } = await client.rpc('bandie_set_usage_meter', {
    p_subject_type: subjectType,
    p_subject_id: subjectId,
    p_meter_key: meterKey,
    p_current_value: current,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export const METER_LABELS: Record<string, string> = {
  [METER_KEYS.BANDS_COUNT]: 'Bands',
  [METER_KEYS.SONGS_COUNT]: 'Songs',
  [METER_KEYS.SETLISTS_COUNT]: 'Setlists',
  [METER_KEYS.VENUES_COUNT]: 'Venues',
  [METER_KEYS.BAND_MEMBERS_COUNT]: 'Band members',
  [METER_KEYS.BOOKING_ENQUIRIES_SENT]: 'Booking enquiries this month',
  [METER_KEYS.GIGS_ACTIVE_COUNT]: 'Active gigs',
};

export async function reconcileBandUsageMeters(bandId: string): Promise<void> {
  await Promise.all([
    syncUsageMeter(METER_KEYS.SONGS_COUNT, 'band', bandId),
    syncUsageMeter(METER_KEYS.SETLISTS_COUNT, 'band', bandId),
    syncUsageMeter(METER_KEYS.BAND_MEMBERS_COUNT, 'band', bandId),
    syncUsageMeter(METER_KEYS.GIGS_ACTIVE_COUNT, 'band', bandId),
  ]);
}

export async function reconcileUserUsageMeters(userId: string): Promise<void> {
  await Promise.all([
    syncUsageMeter(METER_KEYS.BANDS_COUNT, 'user', userId),
    syncUsageMeter(METER_KEYS.VENUES_COUNT, 'user', userId),
  ]);
}
