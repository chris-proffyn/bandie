import { getBandieClient } from './context';

export type BandPart = {
  id: string;
  band_id: string;
  title: string;
  instrument_filter: string | null;
  sort_order: number;
  assigned_member_id: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateBandPartInput = {
  bandId: string;
  title: string;
  instrumentFilter?: string | null;
  sortOrder?: number;
};

export type UpdateBandPartInput = {
  title?: string;
  instrumentFilter?: string | null;
  sortOrder?: number;
  assignedMemberId?: string | null;
};

export const BAND_PART_TEMPLATES = [
  { title: 'Vocalist', instrumentFilter: 'Vocals' },
  { title: 'Lead Guitar', instrumentFilter: 'Guitar' },
  { title: 'Rhythm Guitar', instrumentFilter: 'Guitar' },
  { title: 'Bass', instrumentFilter: 'Bass' },
  { title: 'Drums', instrumentFilter: 'Drums' },
] as const;

export async function listBandParts(bandId: string): Promise<BandPart[]> {
  const client = getBandieClient();
  const { data, error } = await client
    .from('bandie_band_parts')
    .select('*')
    .eq('band_id', bandId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function createBandPart(input: CreateBandPartInput): Promise<BandPart> {
  const client = getBandieClient();
  const title = input.title.trim();

  if (!title) {
    throw new Error('Part title is required.');
  }

  const { data, error } = await client
    .from('bandie_band_parts')
    .insert({
      band_id: input.bandId,
      title,
      instrument_filter: input.instrumentFilter?.trim() || null,
      sort_order: input.sortOrder ?? 0,
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  await syncBandSizeFromParts(input.bandId);
  return data;
}

export async function updateBandPart(
  partId: string,
  bandId: string,
  input: UpdateBandPartInput,
): Promise<BandPart> {
  const client = getBandieClient();
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (input.title !== undefined) {
    const title = input.title.trim();
    if (!title) {
      throw new Error('Part title is required.');
    }
    updates.title = title;
  }
  if (input.instrumentFilter !== undefined) {
    updates.instrument_filter = input.instrumentFilter?.trim() || null;
  }
  if (input.sortOrder !== undefined) {
    updates.sort_order = input.sortOrder;
  }
  if (input.assignedMemberId !== undefined) {
    updates.assigned_member_id = input.assignedMemberId;
  }

  const { data, error } = await client
    .from('bandie_band_parts')
    .update(updates)
    .eq('id', partId)
    .eq('band_id', bandId)
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function assignMemberToPart(
  bandId: string,
  partId: string,
  memberId: string | null,
): Promise<BandPart> {
  if (memberId) {
    const parts = await listBandParts(bandId);
    await Promise.all(
      parts
        .filter((part) => part.id !== partId && part.assigned_member_id === memberId)
        .map((part) => updateBandPart(part.id, bandId, { assignedMemberId: null })),
    );
  }

  return updateBandPart(partId, bandId, { assignedMemberId: memberId });
}

export async function clearPartAssignmentsForMember(bandId: string, memberId: string): Promise<void> {
  const client = getBandieClient();
  const { error } = await client
    .from('bandie_band_parts')
    .update({ assigned_member_id: null })
    .eq('band_id', bandId)
    .eq('assigned_member_id', memberId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function deleteBandPart(partId: string, bandId: string): Promise<void> {
  const client = getBandieClient();
  const { error } = await client.from('bandie_band_parts').delete().eq('id', partId).eq('band_id', bandId);

  if (error) {
    throw new Error(error.message);
  }

  await syncBandSizeFromParts(bandId);
}

export async function createDefaultBandParts(bandId: string): Promise<BandPart[]> {
  const created: BandPart[] = [];

  for (const [index, template] of BAND_PART_TEMPLATES.entries()) {
    const part = await createBandPart({
      bandId,
      title: template.title,
      instrumentFilter: template.instrumentFilter,
      sortOrder: index,
    });
    created.push(part);
  }

  return created;
}

export async function syncBandSizeFromParts(bandId: string): Promise<number> {
  const client = getBandieClient();
  const { data, error } = await client.rpc('bandie_sync_band_size_from_parts', {
    p_band_id: bandId,
  });

  if (error) {
    throw new Error(error.message);
  }

  return (data as number) ?? 0;
}
