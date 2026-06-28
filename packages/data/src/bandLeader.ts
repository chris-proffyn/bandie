import { getBandieClient } from './context';

export type BandLeaderContact = {
  userId: string;
  displayName: string;
  email: string;
  contactPhone: string | null;
};

export type BandLeaderSummary = BandLeaderContact & {
  isPrimary: boolean;
};

export async function getBandLeaderContact(bandId: string): Promise<BandLeaderContact | null> {
  const client = getBandieClient();
  const { data, error } = await client.rpc('bandie_get_band_leader_contact', {
    p_band_id: bandId,
  });

  if (error) {
    throw new Error(error.message);
  }

  const row = (data as Array<Record<string, unknown>> | null)?.[0];
  if (!row) {
    return null;
  }

  return {
    userId: row.user_id as string,
    displayName: (row.display_name as string) || 'Band leader',
    email: (row.email as string) || '',
    contactPhone: (row.contact_phone as string | null) ?? null,
  };
}

export async function listBandLeaders(bandId: string): Promise<BandLeaderSummary[]> {
  const client = getBandieClient();
  const { data, error } = await client.rpc('bandie_list_band_leaders', {
    p_band_id: bandId,
  });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row: Record<string, unknown>) => ({
    userId: row.user_id as string,
    displayName: (row.display_name as string) || 'Band leader',
    email: (row.email as string) || '',
    contactPhone: (row.contact_phone as string | null) ?? null,
    isPrimary: Boolean(row.is_primary),
  }));
}

export async function addBandLeader(bandId: string, userId: string): Promise<void> {
  const client = getBandieClient();
  const { error } = await client.rpc('bandie_add_band_leader', {
    p_band_id: bandId,
    p_user_id: userId,
  });

  if (error) {
    throw new Error(error.message);
  }
}

/** @deprecated Use addBandLeader */
export async function assignBandLeader(bandId: string, userId: string): Promise<void> {
  return addBandLeader(bandId, userId);
}

export async function removeBandLeader(bandId: string, userId: string): Promise<void> {
  const client = getBandieClient();
  const { error } = await client.rpc('bandie_remove_band_leader', {
    p_band_id: bandId,
    p_user_id: userId,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function setPrimaryBandContact(bandId: string, userId: string): Promise<void> {
  const client = getBandieClient();
  const { error } = await client.rpc('bandie_set_primary_band_contact', {
    p_band_id: bandId,
    p_user_id: userId,
  });

  if (error) {
    throw new Error(error.message);
  }
}

/** Reconcile primary leader pointer; ensures at least one leader membership exists. */
export async function ensureBandLeader(bandId: string): Promise<string> {
  const client = getBandieClient();
  const { data, error } = await client.rpc('bandie_ensure_band_leader', {
    p_band_id: bandId,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data as string;
}
