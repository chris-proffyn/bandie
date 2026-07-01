import { getBandieClient } from './context';

export type OpenMicHouseBandMember = {
  id: string;
  event_id: string;
  display_name: string;
  instrument: string;
  email: string | null;
  phone: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type OpenMicPartTemplate = {
  id: string;
  event_id: string;
  slot_name: string;
  required: boolean;
  enabled_by_default: boolean;
  public_signup_enabled: boolean;
  house_band_member_id: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

function normalizeHouseBandMember(row: Record<string, unknown>): OpenMicHouseBandMember {
  return {
    id: String(row.id),
    event_id: String(row.event_id),
    display_name: String(row.display_name),
    instrument: String(row.instrument),
    email: row.email ? String(row.email) : null,
    phone: row.phone ? String(row.phone) : null,
    sort_order: Number(row.sort_order ?? 0),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

function normalizePartTemplate(row: Record<string, unknown>): OpenMicPartTemplate {
  return {
    id: String(row.id),
    event_id: String(row.event_id),
    slot_name: String(row.slot_name),
    required: Boolean(row.required),
    enabled_by_default: Boolean(row.enabled_by_default),
    public_signup_enabled: Boolean(row.public_signup_enabled),
    house_band_member_id: row.house_band_member_id ? String(row.house_band_member_id) : null,
    sort_order: Number(row.sort_order ?? 0),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export async function listOpenMicHouseBandMembers(
  eventId: string,
): Promise<OpenMicHouseBandMember[]> {
  const client = getBandieClient();
  const { data, error } = await client
    .from('bandie_open_mic_house_band_members')
    .select('*')
    .eq('event_id', eventId)
    .order('sort_order', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => normalizeHouseBandMember(row as Record<string, unknown>));
}

export async function addOpenMicHouseBandMember(
  eventId: string,
  input: { displayName: string; instrument: string; email?: string | null; phone?: string | null },
): Promise<OpenMicHouseBandMember> {
  const client = getBandieClient();
  const { count } = await client
    .from('bandie_open_mic_house_band_members')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId);

  const { data, error } = await client
    .from('bandie_open_mic_house_band_members')
    .insert({
      event_id: eventId,
      display_name: input.displayName.trim(),
      instrument: input.instrument.trim(),
      email: input.email ?? null,
      phone: input.phone ?? null,
      sort_order: count ?? 0,
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return normalizeHouseBandMember(data as Record<string, unknown>);
}

export async function deleteOpenMicHouseBandMember(memberId: string): Promise<void> {
  const client = getBandieClient();
  const { error } = await client
    .from('bandie_open_mic_house_band_members')
    .delete()
    .eq('id', memberId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function listOpenMicPartTemplates(eventId: string): Promise<OpenMicPartTemplate[]> {
  const client = getBandieClient();
  const { data, error } = await client
    .from('bandie_open_mic_part_templates')
    .select('*')
    .eq('event_id', eventId)
    .order('sort_order', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => normalizePartTemplate(row as Record<string, unknown>));
}

export async function addOpenMicPartTemplate(
  eventId: string,
  input: {
    slotName: string;
    required?: boolean;
    enabledByDefault?: boolean;
    publicSignupEnabled?: boolean;
    houseBandMemberId?: string | null;
  },
): Promise<OpenMicPartTemplate> {
  const client = getBandieClient();
  const { count } = await client
    .from('bandie_open_mic_part_templates')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId);

  const { data, error } = await client
    .from('bandie_open_mic_part_templates')
    .insert({
      event_id: eventId,
      slot_name: input.slotName.trim(),
      required: input.required ?? false,
      enabled_by_default: input.enabledByDefault ?? true,
      public_signup_enabled: input.publicSignupEnabled ?? true,
      house_band_member_id: input.houseBandMemberId ?? null,
      sort_order: count ?? 0,
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return normalizePartTemplate(data as Record<string, unknown>);
}

export async function updateOpenMicPartTemplate(
  templateId: string,
  input: Partial<{
    slotName: string;
    required: boolean;
    enabledByDefault: boolean;
    publicSignupEnabled: boolean;
    houseBandMemberId: string | null;
  }>,
): Promise<OpenMicPartTemplate> {
  const client = getBandieClient();
  const patch: Record<string, unknown> = {};
  if (input.slotName !== undefined) patch.slot_name = input.slotName.trim();
  if (input.required !== undefined) patch.required = input.required;
  if (input.enabledByDefault !== undefined) patch.enabled_by_default = input.enabledByDefault;
  if (input.publicSignupEnabled !== undefined) patch.public_signup_enabled = input.publicSignupEnabled;
  if (input.houseBandMemberId !== undefined) patch.house_band_member_id = input.houseBandMemberId;

  const { data, error } = await client
    .from('bandie_open_mic_part_templates')
    .update(patch)
    .eq('id', templateId)
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return normalizePartTemplate(data as Record<string, unknown>);
}

export async function deleteOpenMicPartTemplate(templateId: string): Promise<void> {
  const client = getBandieClient();
  const { error } = await client.from('bandie_open_mic_part_templates').delete().eq('id', templateId);
  if (error) {
    throw new Error(error.message);
  }
}

export async function seedOpenMicDefaultParts(eventId: string): Promise<void> {
  const client = getBandieClient();
  const { error } = await client.rpc('bandie_seed_open_mic_default_parts', {
    p_event_id: eventId,
  });
  if (error) {
    throw new Error(error.message);
  }
}

export async function setOpenMicSongSlotEnabled(
  slotId: string,
  enabled: boolean,
): Promise<void> {
  const client = getBandieClient();
  const { error } = await client.rpc('bandie_set_open_mic_song_slot_enabled', {
    p_slot_id: slotId,
    p_enabled: enabled,
  });
  if (error) {
    throw new Error(error.message);
  }
}

export async function clearOpenMicSlotAssignment(slotId: string): Promise<void> {
  const client = getBandieClient();
  const { error } = await client.rpc('bandie_clear_open_mic_slot_assignment', {
    p_slot_id: slotId,
  });
  if (error) {
    throw new Error(error.message);
  }
}
