import {
  BANDIE_DEFAULT_COUNTRY_CODE,
  inferDefaultCountryCode,
  type DirectoryAreaFilters,
} from '@bandie/data';

const COUNTRY_STORAGE_KEY = 'bandie:directory:default-country';
const COUNTRY_SCOPE_KEY = 'bandie:directory:country-scope';

type CountryScope = 'country' | 'all';

export function readStoredDefaultCountryCode(): string | null {
  try {
    const value = sessionStorage.getItem(COUNTRY_STORAGE_KEY) ?? localStorage.getItem(COUNTRY_STORAGE_KEY);
    return value?.trim().toUpperCase() || null;
  } catch {
    return null;
  }
}

function readCountryScope(): CountryScope | null {
  try {
    const value = sessionStorage.getItem(COUNTRY_SCOPE_KEY) ?? localStorage.getItem(COUNTRY_SCOPE_KEY);
    return value === 'all' || value === 'country' ? value : null;
  } catch {
    return null;
  }
}

function saveCountryScope(scope: CountryScope): void {
  try {
    sessionStorage.setItem(COUNTRY_SCOPE_KEY, scope);
    localStorage.setItem(COUNTRY_SCOPE_KEY, scope);
  } catch {
    // Ignore quota / privacy errors.
  }
}

export function saveDefaultCountryCode(countryCode: string): void {
  const normalised = countryCode.trim().toUpperCase();
  if (!normalised) {
    return;
  }

  try {
    sessionStorage.setItem(COUNTRY_STORAGE_KEY, normalised);
    localStorage.setItem(COUNTRY_STORAGE_KEY, normalised);
    saveCountryScope('country');
  } catch {
    // Ignore quota / privacy errors.
  }
}

export function detectDefaultCountryCode(): string {
  if (readCountryScope() === 'all') {
    return '';
  }

  const stored = readStoredDefaultCountryCode();
  if (stored) {
    return stored;
  }

  const locale = typeof navigator !== 'undefined' ? navigator.language : undefined;
  let timeZone: string | undefined;

  try {
    timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    timeZone = undefined;
  }

  const detected = inferDefaultCountryCode({ locale, timeZone });
  saveDefaultCountryCode(detected);
  return detected;
}

export function createDefaultDirectoryAreaFilters(): DirectoryAreaFilters {
  if (readCountryScope() === 'all') {
    return {
      countryCode: '',
      regionId: '',
    };
  }

  return {
    countryCode: detectDefaultCountryCode() || BANDIE_DEFAULT_COUNTRY_CODE,
    regionId: '',
  };
}

export function applyDefaultCountryToAreaFilters<T extends DirectoryAreaFilters>(
  filters: T,
): T {
  if (filters.countryCode !== undefined && filters.countryCode !== null) {
    return filters;
  }

  return {
    ...filters,
    countryCode: detectDefaultCountryCode() || BANDIE_DEFAULT_COUNTRY_CODE,
    regionId: filters.regionId ?? '',
  };
}

export function resolveDirectoryAreaFilters<T extends DirectoryAreaFilters>(
  filters: Partial<T> | undefined,
  detectedDefaults: DirectoryAreaFilters,
): T {
  const merged = {
    ...(filters ?? {}),
  } as T;

  const explicitCountry =
    filters != null && Object.prototype.hasOwnProperty.call(filters, 'countryCode');
  const explicitRegion =
    filters != null && Object.prototype.hasOwnProperty.call(filters, 'regionId');

  if (!explicitCountry || (filters?.countryCode === '' && readCountryScope() !== 'all')) {
    merged.countryCode = detectedDefaults.countryCode;
  } else {
    merged.countryCode = filters?.countryCode ?? '';
  }

  merged.regionId = explicitRegion ? (filters?.regionId ?? '') : detectedDefaults.regionId;

  return merged;
}

export function rememberDirectoryCountrySelection(countryCode: string): void {
  if (countryCode.trim()) {
    saveDefaultCountryCode(countryCode);
    return;
  }

  try {
    sessionStorage.setItem(COUNTRY_SCOPE_KEY, 'all');
    localStorage.setItem(COUNTRY_SCOPE_KEY, 'all');
  } catch {
    // Ignore quota / privacy errors.
  }
}
