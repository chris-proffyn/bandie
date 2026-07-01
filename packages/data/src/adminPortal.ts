import { getBandieClient } from './context';
import { getCurrentSession } from './auth';

export type AdminSearchUser = {
  user_id: string;
  display_name: string | null;
  username: string | null;
  email: string | null;
};

export type AdminSearchBand = {
  band_id: string;
  name: string;
  slug: string;
  owner_user_id: string;
  owner_display_name: string | null;
};

export type AuditEvent = {
  id: string;
  event_type: string;
  actor_id: string | null;
  subject_type: string | null;
  subject_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export async function searchAdminUsers(
  query: string,
  limit = 25,
): Promise<AdminSearchUser[]> {
  const client = getBandieClient();
  const { data, error } = await client.rpc('bandie_admin_search_users', {
    p_query: query,
    p_limit: limit,
  });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as AdminSearchUser[];
}

export async function searchAdminBands(
  query: string,
  limit = 25,
): Promise<AdminSearchBand[]> {
  const client = getBandieClient();
  const { data, error } = await client.rpc('bandie_admin_search_bands', {
    p_query: query,
    p_limit: limit,
  });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as AdminSearchBand[];
}

export async function logAdminAuditEvent(input: {
  eventType: string;
  subjectType?: string;
  subjectId?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const session = await getCurrentSession();
  if (!session?.user) {
    throw new Error('Must be signed in.');
  }

  const client = getBandieClient();
  const { error } = await client.from('bandie_audit_events').insert({
    event_type: input.eventType,
    actor_id: session.user.id,
    subject_type: input.subjectType ?? null,
    subject_id: input.subjectId ?? null,
    metadata: input.metadata ?? {},
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function listAuditEvents(limit = 100): Promise<AuditEvent[]> {
  const client = getBandieClient();
  const { data, error } = await client
    .from('bandie_audit_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as AuditEvent[];
}

export type AdminOverviewCounts = {
  users: number;
  bands: number;
  songs: number;
  setlists: number;
  gigs: number;
};

export async function getAdminOverviewCounts(options?: {
  hideTestData?: boolean;
}): Promise<AdminOverviewCounts> {
  const client = getBandieClient();
  const hideTestData = options?.hideTestData ?? false;

  const usersQuery = client.from('bandie_profiles').select('user_id', { count: 'exact', head: true });
  const bandsQuery = client.from('bandie_bands').select('id', { count: 'exact', head: true });

  if (hideTestData) {
    usersQuery.eq('test_user', false);
    bandsQuery.eq('test_user', false);
  }

  const [users, bands, songs, setlists, gigs] = await Promise.all([
    usersQuery,
    bandsQuery,
    client
      .from('bandie_songs')
      .select('id', { count: 'exact', head: true })
      .eq('is_deleted', false),
    client
      .from('bandie_setlists')
      .select('id', { count: 'exact', head: true })
      .neq('status', 'archived'),
    client
      .from('bandie_gigs')
      .select('id', { count: 'exact', head: true })
      .not('status', 'in', '(archived,cancelled)'),
  ]);

  const firstError =
    users.error ?? bands.error ?? songs.error ?? setlists.error ?? gigs.error;
  if (firstError) {
    throw new Error(firstError.message);
  }

  return {
    users: users.count ?? 0,
    bands: bands.count ?? 0,
    songs: songs.count ?? 0,
    setlists: setlists.count ?? 0,
    gigs: gigs.count ?? 0,
  };
}
