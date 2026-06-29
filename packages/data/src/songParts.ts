export type StandardSongPartKey =
  | 'lead-guitar'
  | 'rhythm-guitar'
  | 'bass'
  | 'drums'
  | 'vocals'
  | 'shared';

export type StandardSongPartDefinition = {
  partKey: StandardSongPartKey;
  partLabel: string;
  sortOrder: number;
  requiredForReadiness: boolean;
  icon: string;
  description: string;
};

export const STANDARD_SONG_PARTS: StandardSongPartDefinition[] = [
  {
    partKey: 'lead-guitar',
    partLabel: 'Lead Guitar',
    sortOrder: 0,
    requiredForReadiness: true,
    icon: '🎸',
    description: 'Solo tab, intro riff, tone notes.',
  },
  {
    partKey: 'rhythm-guitar',
    partLabel: 'Rhythm Guitar',
    sortOrder: 1,
    requiredForReadiness: true,
    icon: '🎸',
    description: 'Chord chart and arrangement notes.',
  },
  {
    partKey: 'bass',
    partLabel: 'Bass',
    sortOrder: 2,
    requiredForReadiness: true,
    icon: '🎸',
    description: 'Root movement, ending variation.',
  },
  {
    partKey: 'drums',
    partLabel: 'Drums',
    sortOrder: 3,
    requiredForReadiness: true,
    icon: '🥁',
    description: 'Count-in, push accents, endings.',
  },
  {
    partKey: 'vocals',
    partLabel: 'Vocals',
    sortOrder: 4,
    requiredForReadiness: true,
    icon: '🎤',
    description: 'Lyrics, phrasing, backing cues.',
  },
  {
    partKey: 'shared',
    partLabel: 'Shared',
    sortOrder: 5,
    requiredForReadiness: false,
    icon: '📎',
    description: 'Reference links, live recordings, notes.',
  },
];

export type SongPartFolder = {
  id: string;
  band_id: string;
  song_id: string;
  part_key: string;
  part_label: string;
  sort_order: number;
  required_for_readiness: boolean;
  dropbox_folder_id: string | null;
  dropbox_path_lower: string | null;
  created_at: string;
  updated_at: string;
};

export type SongPartFileStatus =
  | 'current'
  | 'draft'
  | 'reference'
  | 'superseded'
  | 'archived'
  | 'unavailable';

export type SongPartFile = {
  id: string;
  band_id: string;
  song_id: string;
  song_part_folder_id: string;
  storage_id: string | null;
  source: 'dropbox';
  provider: 'dropbox';
  display_name: string;
  mime_type: string | null;
  file_size_bytes: number | null;
  dropbox_file_id: string | null;
  dropbox_path_lower: string | null;
  dropbox_rev: string | null;
  dropbox_content_hash: string | null;
  status: SongPartFileStatus;
  version_label: string | null;
  visibility: 'band_members' | 'selected_members' | 'setlist_guest';
  added_by_user_id: string | null;
  created_at: string;
  updated_at: string;
};

export type SongPartFileActivity = {
  id: string;
  band_id: string;
  song_id: string | null;
  song_part_folder_id: string | null;
  file_id: string | null;
  actor_user_id: string | null;
  action: string;
  provider: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type SongPartFolderWithStats = SongPartFolder & {
  currentFileCount: number;
  hasCurrentFile: boolean;
};

export function getStandardSongPart(partKey: string): StandardSongPartDefinition | undefined {
  return STANDARD_SONG_PARTS.find((part) => part.partKey === partKey);
}

export function getSongPartDisplay(partKey: string, partLabel: string) {
  const standard = getStandardSongPart(partKey);
  return {
    partLabel,
    icon: standard?.icon ?? songPartIconFromKey(partKey),
    description: standard?.description ?? `Files and notes for ${partLabel.toLowerCase()}.`,
  };
}

function songPartIconFromKey(partKey: string): string {
  const key = partKey.toLowerCase();
  if (key.includes('drum')) return '🥁';
  if (key.includes('vocal') || key.includes('singer')) return '🎤';
  if (key.includes('share') || key.includes('ref')) return '📎';
  if (key.includes('guitar') || key.includes('bass')) return '🎸';
  if (key.includes('key')) return '🎹';
  return '📁';
}

export function formatSongPartFileStatus(status: SongPartFileStatus): string {
  switch (status) {
    case 'current':
      return 'Current';
    case 'draft':
      return 'Draft';
    case 'reference':
      return 'Reference';
    case 'superseded':
      return 'Superseded';
    case 'archived':
      return 'Archived';
    case 'unavailable':
      return 'Unavailable';
    default:
      return status;
  }
}
