/** Internal membership slug for the band creator / primary manager. */
export const BAND_LEADER_ROLE = 'owner';

export function isBandLeaderRole(role: string | null | undefined): boolean {
  return role === BAND_LEADER_ROLE;
}

export function formatBandMemberRoleLabel(role: string): string {
  switch (role) {
    case BAND_LEADER_ROLE:
      return 'Leader';
    case 'admin':
      return 'Admin';
    case 'platform_admin':
      return 'Platform admin';
    case 'member':
      return 'Member';
    case 'viewer':
      return 'Viewer';
    default:
      return role;
  }
}
