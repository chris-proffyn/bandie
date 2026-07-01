const STORAGE_KEY = 'bandie:admin:hide-test-data';

export function readAdminHideTestData(): boolean {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function saveAdminHideTestData(hidden: boolean): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, hidden ? '1' : '0');
  } catch {
    // Ignore quota / privacy errors.
  }
}
