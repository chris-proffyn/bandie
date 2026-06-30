import { assertCanPerform, checkBandLeaderCapability } from './entitlements';
import { isEntitlementEnforcementEnabled } from './entitlementEnforcement';
import { getBandieClient } from './context';
import { getCurrentSession } from './auth';
import {
  expandCalendarOccurrences,
  repeatPatternFromInput,
  serializeCalendarRepeatPattern,
  type CalendarRepeatInput,
} from './calendarRecurrence';

export type CalendarEventType = 'rehearsal' | 'gig_availability';

export type AvailabilityStatus = 'proposed' | 'provisional' | 'confirmed';

export type AvailabilityVote = 'available' | 'maybe' | 'no' | 'pending';

export type CalendarEvent = {
  id: string;
  band_id: string;
  event_type: CalendarEventType;
  title: string;
  starts_at: string;
  ends_at: string | null;
  location: string | null;
  notes: string | null;
  series_key: string | null;
  repeat_pattern: string | null;
  availability_status: AvailabilityStatus;
  publish_public: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type CalendarEventVote = {
  id: string;
  calendar_event_id: string;
  user_id: string;
  vote: AvailabilityVote;
  display_name: string | null;
  username: string | null;
  created_at: string;
  updated_at: string;
};

export type CalendarEventWithVotes = CalendarEvent & {
  votes: CalendarEventVote[];
};

export type CreateCalendarEventInput = {
  bandId: string;
  eventType: CalendarEventType;
  title: string;
  startsAt: string;
  endsAt?: string | null;
  location?: string | null;
  notes?: string | null;
  repeat?: CalendarRepeatInput;
};

export const CALENDAR_LEADER_ONLY_MESSAGE =
  'Only band leaders can create or edit calendar events. Members can vote on gig availability.';

export const AVAILABILITY_STATUS_LABELS: Record<AvailabilityStatus, string> = {
  proposed: 'Proposed',
  provisional: 'Provisional',
  confirmed: 'Confirmed',
};

export const AVAILABILITY_VOTE_LABELS: Record<AvailabilityVote, string> = {
  available: 'Available',
  maybe: 'Maybe',
  no: 'Not available',
  pending: 'Pending',
};

export function formatCalendarEventType(eventType: CalendarEventType): string {
  return eventType === 'rehearsal' ? 'Rehearsal' : 'Gig availability';
}

export function availabilityStatusClass(status: AvailabilityStatus): string {
  return `calendar-status calendar-status-${status}`;
}

export async function getBandCalendarTier(
  bandId: string,
): Promise<'basic' | 'full'> {
  if (!isEntitlementEnforcementEnabled()) {
    return 'full';
  }

  const decision = await checkBandLeaderCapability(bandId, 'calendar.use');
  if (decision.entitlementValue === 'full') {
    return 'full';
  }
  return 'basic';
}

export async function listBandCalendarEvents(bandId: string): Promise<CalendarEvent[]> {
  const client = getBandieClient();
  const { data, error } = await client
    .from('bandie_calendar_events')
    .select('*')
    .eq('band_id', bandId)
    .order('starts_at', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as CalendarEvent[];
}

async function loadVotesForEvents(eventIds: string[]): Promise<Map<string, CalendarEventVote[]>> {
  const result = new Map<string, CalendarEventVote[]>();
  if (eventIds.length === 0) {
    return result;
  }

  const client = getBandieClient();
  const { data, error } = await client
    .from('bandie_availability_votes')
    .select('id, calendar_event_id, user_id, vote, created_at, updated_at')
    .in('calendar_event_id', eventIds);

  if (error) {
    throw new Error(error.message);
  }

  const userIds = [...new Set((data ?? []).map((row) => row.user_id as string))];
  const profileMap = new Map<string, { display_name: string | null; username: string | null }>();

  if (userIds.length > 0) {
    const { data: profiles, error: profileError } = await client
      .from('bandie_profiles')
      .select('user_id, display_name, username')
      .in('user_id', userIds);

    if (profileError) {
      throw new Error(profileError.message);
    }

    for (const profile of profiles ?? []) {
      profileMap.set(profile.user_id as string, {
        display_name: (profile.display_name as string | null) ?? null,
        username: (profile.username as string | null) ?? null,
      });
    }
  }

  for (const row of data ?? []) {
    const eventId = row.calendar_event_id as string;
    const profile = profileMap.get(row.user_id as string);
    const vote: CalendarEventVote = {
      id: row.id as string,
      calendar_event_id: eventId,
      user_id: row.user_id as string,
      vote: row.vote as AvailabilityVote,
      display_name: profile?.display_name ?? null,
      username: profile?.username ?? null,
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
    };
    const existing = result.get(eventId) ?? [];
    existing.push(vote);
    result.set(eventId, existing);
  }

  return result;
}

export async function getCalendarEventWithVotes(
  eventId: string,
): Promise<CalendarEventWithVotes | null> {
  const client = getBandieClient();
  const { data, error } = await client
    .from('bandie_calendar_events')
    .select('*')
    .eq('id', eventId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const votes = await loadVotesForEvents([eventId]);
  return {
    ...(data as CalendarEvent),
    votes: votes.get(eventId) ?? [],
  };
}

export async function listBandCalendarEventsWithVotes(
  bandId: string,
): Promise<CalendarEventWithVotes[]> {
  const events = await listBandCalendarEvents(bandId);
  const votes = await loadVotesForEvents(events.map((event) => event.id));
  return events.map((event) => ({
    ...event,
    votes: votes.get(event.id) ?? [],
  }));
}

export async function createCalendarEvent(
  input: CreateCalendarEventInput,
): Promise<CalendarEvent[]> {
  const session = await getCurrentSession();
  if (!session?.user) {
    throw new Error('Must be signed in to create calendar events.');
  }

  await assertCanPerform({
    capability: 'calendar.use',
    subjectType: 'band',
    subjectId: input.bandId,
    bandId: input.bandId,
    planScope: 'leader',
  });

  const tier = await getBandCalendarTier(input.bandId);
  const publishPublic =
    input.eventType === 'gig_availability' && tier === 'full' ? false : false;

  const repeat = input.repeat ?? { kind: 'none' };
  const repeatPattern = repeatPatternFromInput(repeat);
  const seriesKey = repeatPattern ? crypto.randomUUID() : null;
  const repeatPatternValue = repeatPattern
    ? serializeCalendarRepeatPattern(repeatPattern)
    : null;

  const occurrences = expandCalendarOccurrences({
    startsAt: new Date(input.startsAt),
    endsAt: input.endsAt ? new Date(input.endsAt) : null,
    repeat,
  });

  if (occurrences.length === 0) {
    throw new Error('Unable to generate calendar occurrences for this repeat pattern.');
  }

  const client = getBandieClient();
  const rows = occurrences.map((occurrence) => ({
    band_id: input.bandId,
    event_type: input.eventType,
    title: input.title.trim(),
    starts_at: occurrence.startsAt.toISOString(),
    ends_at: occurrence.endsAt?.toISOString() ?? null,
    location: input.location?.trim() || null,
    notes: input.notes?.trim() || null,
    series_key: seriesKey,
    repeat_pattern: repeatPatternValue,
    publish_public: publishPublic,
    created_by: session.user.id,
  }));

  const { data, error } = await client.from('bandie_calendar_events').insert(rows).select('*');

  if (error) {
    throw new Error(error.message);
  }

  const created = (data ?? []) as CalendarEvent[];

  if (input.eventType === 'gig_availability') {
    for (const event of created) {
      const { error: seedError } = await client.rpc('bandie_seed_calendar_event_votes', {
        p_event_id: event.id,
      });
      if (seedError) {
        throw new Error(seedError.message);
      }
    }
  }

  return created;
}

export async function deleteCalendarEvent(eventId: string): Promise<void> {
  const client = getBandieClient();
  const { error } = await client.from('bandie_calendar_events').delete().eq('id', eventId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function deleteCalendarEventSeries(seriesKey: string): Promise<void> {
  const client = getBandieClient();
  const { error } = await client
    .from('bandie_calendar_events')
    .delete()
    .eq('series_key', seriesKey);

  if (error) {
    throw new Error(error.message);
  }
}

export async function castAvailabilityVote(
  eventId: string,
  vote: Exclude<AvailabilityVote, 'pending'>,
): Promise<void> {
  const session = await getCurrentSession();
  if (!session?.user) {
    throw new Error('Must be signed in to vote.');
  }

  const client = getBandieClient();
  const { error } = await client.from('bandie_availability_votes').upsert(
    {
      calendar_event_id: eventId,
      user_id: session.user.id,
      vote,
    },
    { onConflict: 'calendar_event_id,user_id' },
  );

  if (error) {
    throw new Error(error.message);
  }
}

export function summarizeAvailabilityVotes(votes: CalendarEventVote[]): {
  available: number;
  maybe: number;
  no: number;
  pending: number;
  total: number;
} {
  return votes.reduce(
    (acc, vote) => {
      acc[vote.vote] += 1;
      acc.total += 1;
      return acc;
    },
    { available: 0, maybe: 0, no: 0, pending: 0, total: 0 },
  );
}
