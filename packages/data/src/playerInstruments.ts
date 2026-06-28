export const PRIMARY_INSTRUMENT_OPTIONS = [
  { value: 'Vocals', label: 'Vocals' },
  { value: 'Guitar', label: 'Guitar' },
  { value: 'Bass', label: 'Bass' },
  { value: 'Drums', label: 'Drums' },
  { value: 'Keys', label: 'Keys / piano' },
  { value: 'Saxophone', label: 'Saxophone' },
  { value: 'Trumpet', label: 'Trumpet' },
  { value: 'Trombone', label: 'Trombone' },
  { value: 'Violin', label: 'Violin' },
  { value: 'Cello', label: 'Cello' },
  { value: 'Flute', label: 'Flute' },
  { value: 'Percussion', label: 'Percussion' },
  { value: 'Harmonica', label: 'Harmonica' },
  { value: 'Banjo', label: 'Banjo' },
  { value: 'Mandolin', label: 'Mandolin' },
  { value: 'DJ', label: 'DJ / decks' },
] as const;

export type PrimaryInstrumentOption = (typeof PRIMARY_INSTRUMENT_OPTIONS)[number]['value'];

export const PRIMARY_INSTRUMENT_OTHER = '__other__';

export function isPrimaryInstrumentOption(value: string): boolean {
  return PRIMARY_INSTRUMENT_OPTIONS.some((option) => option.value === value);
}

export function resolvePrimaryInstrumentValue(choice: string, otherValue: string): string {
  if (choice === PRIMARY_INSTRUMENT_OTHER) {
    return otherValue.trim();
  }

  return choice.trim();
}

export function primaryInstrumentFormState(instrument: string | null | undefined): {
  choice: string;
  other: string;
} {
  const value = instrument?.trim() ?? '';

  if (!value) {
    return { choice: '', other: '' };
  }

  if (isPrimaryInstrumentOption(value)) {
    return { choice: value, other: '' };
  }

  return { choice: PRIMARY_INSTRUMENT_OTHER, other: value };
}
