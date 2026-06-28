export type PlayerGender = 'female' | 'male' | 'non_binary' | 'prefer_not_to_say';

export const PLAYER_GENDER_OPTIONS: { value: PlayerGender; label: string }[] = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'non_binary', label: 'Non-binary' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

export function formatPlayerGenderLabel(gender: string | null | undefined): string | null {
  if (!gender) {
    return null;
  }

  return PLAYER_GENDER_OPTIONS.find((option) => option.value === gender)?.label ?? null;
}

export function isPlayerGender(value: string): value is PlayerGender {
  return PLAYER_GENDER_OPTIONS.some((option) => option.value === value);
}
