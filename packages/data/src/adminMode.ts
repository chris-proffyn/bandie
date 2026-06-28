let adminModeActive = false;

export function setBandieAdminModeActive(active: boolean): void {
  adminModeActive = active;
}

export function isBandieAdminModeActive(): boolean {
  return adminModeActive;
}
