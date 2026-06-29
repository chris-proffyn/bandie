import { slugifyBandName } from '@bandie/utils';
import { getBandieClient } from './context';

export type BandSongPartTemplate = {
  id: string;
  band_id: string;
  part_key: string;
  part_label: string;
  sort_order: number;
  required_for_readiness: boolean;
  created_at: string;
  updated_at: string;
};

export type SongPartTemplateDefinition = {
  partKey: string;
  partLabel: string;
  sortOrder: number;
  requiredForReadiness: boolean;
  icon: string;
  description: string;
};

/** Default templates for new bands — one guitar folder, not lead/rhythm split. */
export const DEFAULT_BAND_SONG_PART_TEMPLATES: SongPartTemplateDefinition[] = [
  {
    partKey: 'guitar',
    partLabel: 'Guitar',
    sortOrder: 0,
    requiredForReadiness: true,
    icon: '🎸',
    description: 'Chord charts, riffs, solos and arrangement notes.',
  },
  {
    partKey: 'bass',
    partLabel: 'Bass',
    sortOrder: 1,
    requiredForReadiness: true,
    icon: '🎸',
    description: 'Root movement, endings and groove notes.',
  },
  {
    partKey: 'drums',
    partLabel: 'Drums',
    sortOrder: 2,
    requiredForReadiness: true,
    icon: '🥁',
    description: 'Count-in, accents and endings.',
  },
  {
    partKey: 'vocals',
    partLabel: 'Vocals',
    sortOrder: 3,
    requiredForReadiness: true,
    icon: '🎤',
    description: 'Lyrics, phrasing and backing cues.',
  },
  {
    partKey: 'shared',
    partLabel: 'Shared',
    sortOrder: 4,
    requiredForReadiness: false,
    icon: '📎',
    description: 'Reference recordings, links and general notes.',
  },
];

export function songPartIcon(partKey: string): string {
  const key = partKey.toLowerCase();
  if (key.includes('drum')) return '🥁';
  if (key.includes('vocal') || key.includes('singer')) return '🎤';
  if (key.includes('share') || key.includes('ref')) return '📎';
  if (key.includes('guitar') || key.includes('bass')) return '🎸';
  if (key.includes('key')) return '🎹';
  return '📁';
}

export function songPartDescription(partLabel: string): string {
  return `Files and notes for ${partLabel.toLowerCase()}.`;
}

async function resolveUniqueTemplatePartKey(bandId: string, label: string): Promise<string> {
  const client = getBandieClient();
  const base = slugifyBandName(label) || 'part';
  let candidate = base;
  let suffix = 2;

  while (true) {
    const { data, error } = await client
      .from('bandie_band_song_part_templates')
      .select('id')
      .eq('band_id', bandId)
      .eq('part_key', candidate)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      return candidate;
    }

    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
}

export async function listBandSongPartTemplates(bandId: string): Promise<BandSongPartTemplate[]> {
  const client = getBandieClient();
  const { data, error } = await client
    .from('bandie_band_song_part_templates')
    .select('*')
    .eq('band_id', bandId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as BandSongPartTemplate[];
}

export async function ensureBandSongPartTemplates(bandId: string): Promise<BandSongPartTemplate[]> {
  const existing = await listBandSongPartTemplates(bandId);
  if (existing.length > 0) {
    return existing;
  }

  const client = getBandieClient();
  const rows = DEFAULT_BAND_SONG_PART_TEMPLATES.map((part) => ({
    band_id: bandId,
    part_key: part.partKey,
    part_label: part.partLabel,
    sort_order: part.sortOrder,
    required_for_readiness: part.requiredForReadiness,
  }));

  const { data, error } = await client
    .from('bandie_band_song_part_templates')
    .insert(rows)
    .select('*');

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as BandSongPartTemplate[];
}

export type CreateBandSongPartTemplateInput = {
  bandId: string;
  partLabel: string;
  requiredForReadiness?: boolean;
};

export async function createBandSongPartTemplate(
  input: CreateBandSongPartTemplateInput,
): Promise<BandSongPartTemplate> {
  const label = input.partLabel.trim();
  if (!label) {
    throw new Error('Part label is required.');
  }

  const client = getBandieClient();
  const templates = await listBandSongPartTemplates(input.bandId);
  const partKey = await resolveUniqueTemplatePartKey(input.bandId, label);

  const { data, error } = await client
    .from('bandie_band_song_part_templates')
    .insert({
      band_id: input.bandId,
      part_key: partKey,
      part_label: label,
      sort_order: templates.length,
      required_for_readiness: input.requiredForReadiness ?? true,
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as BandSongPartTemplate;
}

export type UpdateBandSongPartTemplateInput = {
  partLabel?: string;
  requiredForReadiness?: boolean;
  sortOrder?: number;
};

export async function updateBandSongPartTemplate(
  bandId: string,
  templateId: string,
  input: UpdateBandSongPartTemplateInput,
): Promise<BandSongPartTemplate> {
  const client = getBandieClient();
  const updates: Record<string, unknown> = {};

  if (input.partLabel !== undefined) {
    const label = input.partLabel.trim();
    if (!label) {
      throw new Error('Part label cannot be empty.');
    }
    updates.part_label = label;
  }

  if (input.requiredForReadiness !== undefined) {
    updates.required_for_readiness = input.requiredForReadiness;
  }

  if (input.sortOrder !== undefined) {
    updates.sort_order = input.sortOrder;
  }

  if (Object.keys(updates).length === 0) {
    const templates = await listBandSongPartTemplates(bandId);
    const existing = templates.find((item) => item.id === templateId);
    if (!existing) {
      throw new Error('Song part template not found.');
    }
    return existing;
  }

  const { data, error } = await client
    .from('bandie_band_song_part_templates')
    .update(updates)
    .eq('band_id', bandId)
    .eq('id', templateId)
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as BandSongPartTemplate;
}

export async function deleteBandSongPartTemplate(bandId: string, templateId: string): Promise<void> {
  const client = getBandieClient();
  const { error } = await client
    .from('bandie_band_song_part_templates')
    .delete()
    .eq('band_id', bandId)
    .eq('id', templateId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function createDefaultBandSongPartTemplates(
  bandId: string,
): Promise<BandSongPartTemplate[]> {
  const existing = await listBandSongPartTemplates(bandId);
  if (existing.length > 0) {
    throw new Error('Song part templates already exist for this band.');
  }

  return ensureBandSongPartTemplates(bandId);
}

export function templateRowsForSongFolders(
  templates: BandSongPartTemplate[],
  bandId: string,
  songId: string,
) {
  return templates.map((template) => ({
    band_id: bandId,
    song_id: songId,
    part_key: template.part_key,
    part_label: template.part_label,
    sort_order: template.sort_order,
    required_for_readiness: template.required_for_readiness,
  }));
}
