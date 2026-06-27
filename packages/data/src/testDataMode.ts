export type BandieDataMode = 'test' | 'live';

let dataMode: BandieDataMode = 'live';

export function resolveBandieDataMode(value: string | undefined | null): BandieDataMode {
  return value === 'test' ? 'test' : 'live';
}

export function initBandieDataMode(mode: string | undefined | null): BandieDataMode {
  dataMode = resolveBandieDataMode(mode);
  return dataMode;
}

export function getBandieDataMode(): BandieDataMode {
  return dataMode;
}

export function includeTestData(): boolean {
  return dataMode === 'test';
}

export function filterTestRows<T extends { test_user?: boolean | null }>(rows: T[]): T[] {
  if (includeTestData()) {
    return rows;
  }
  return rows.filter((row) => !row.test_user);
}

export function isHiddenTestRow(testUser: boolean | null | undefined): boolean {
  return !includeTestData() && Boolean(testUser);
}
