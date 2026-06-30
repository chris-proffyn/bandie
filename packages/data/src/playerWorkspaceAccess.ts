import { getCurrentSession } from './auth';
import { checkUserLeaderCapability } from './entitlements';

export type PlayerWorkspaceAccess = {
  canCreateBand: boolean;
  canBrowseBandDirectory: boolean;
  canBrowsePlayerDirectory: boolean;
};

export async function getPlayerWorkspaceAccess(userId?: string): Promise<PlayerWorkspaceAccess> {
  const session = await getCurrentSession();
  const resolvedUserId = userId ?? session?.user?.id;

  if (!resolvedUserId) {
    return {
      canCreateBand: false,
      canBrowseBandDirectory: false,
      canBrowsePlayerDirectory: false,
    };
  }

  const [createBand, bandDirectory, playerDirectory] = await Promise.all([
    checkUserLeaderCapability(resolvedUserId, 'band.create'),
    checkUserLeaderCapability(resolvedUserId, 'band_directory.browse'),
    checkUserLeaderCapability(resolvedUserId, 'player_directory.browse'),
  ]);

  return {
    canCreateBand: createBand.allowed,
    canBrowseBandDirectory: bandDirectory.allowed,
    canBrowsePlayerDirectory: playerDirectory.allowed,
  };
}
