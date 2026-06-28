const USERNAME_PATTERN = /^[a-z0-9]{3,30}$/;

export function normalizeUsername(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function isValidUsername(value: string): boolean {
  return USERNAME_PATTERN.test(value);
}

export function proposeUsernameFromDisplayName(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return '';
  }

  if (parts.length === 1) {
    return normalizeUsername(parts[0]).slice(0, 30);
  }

  const firstName = parts[0] ?? '';
  const lastName = parts[parts.length - 1] ?? '';
  const last = normalizeUsername(lastName);
  const initial = normalizeUsername(firstName).charAt(0);
  let result = `${last}${initial}`;

  if (result.length < 3) {
    result = normalizeUsername(parts.join(''));
  }

  if (result.length < 3) {
    result = 'player';
  }

  return result.slice(0, 30);
}

export function resolveUsernameForProfile(
  username: string | null | undefined,
  displayName: string,
): string {
  const normalized = normalizeUsername(username ?? '');
  if (normalized) {
    return normalized;
  }

  return proposeUsernameFromDisplayName(displayName);
}

export function validateUsernameInput(value: string): string | null {
  const normalized = normalizeUsername(value);
  if (!normalized) {
    return 'Username is required.';
  }
  if (!isValidUsername(normalized)) {
    return 'Username must be 3–30 lowercase letters or numbers.';
  }
  return null;
}
