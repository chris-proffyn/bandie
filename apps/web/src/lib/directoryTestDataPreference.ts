import { includeTestData, isTestDataEntity } from '@bandie/data';

const STORAGE_KEY = 'bandie:directory:hide-test-data';

export function readDirectoryHideTestData(): boolean {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function saveDirectoryHideTestData(hidden: boolean): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, hidden ? '1' : '0');
  } catch {
    // Ignore quota / privacy errors.
  }
}

export function applyDirectoryTestDataFilter<T extends { test_user?: boolean | null }>(
  rows: T[],
  hideTestData: boolean,
): T[] {
  if (!hideTestData) {
    return rows;
  }

  return rows.filter((row) => !isTestDataEntity(row.test_user));
}

export function countDirectoryTestRows<T extends { test_user?: boolean | null }>(rows: T[]): number {
  return rows.filter((row) => isTestDataEntity(row.test_user)).length;
}

export function showDirectoryTestDataToggle<T extends { test_user?: boolean | null }>(
  rows: T[],
): boolean {
  return includeTestData() && countDirectoryTestRows(rows) > 0;
}
