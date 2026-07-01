import { getCurrentSession } from './auth';
import { isPlanCapabilityEnabledForUser } from './entitlements';

export type PlayerWorkspaceAccess = {
  canCreateBand: boolean;
  canBrowseBandDirectory: boolean;
  canBrowsePlayerDirectory: boolean;
  canSendPlayerMessage: boolean;
};

export async function getPlayerWorkspaceAccess(userId?: string): Promise<PlayerWorkspaceAccess> {
  const session = await getCurrentSession();
  const resolvedUserId = userId ?? session?.user?.id;

  if (!resolvedUserId) {
    return {
      canCreateBand: false,
      canBrowseBandDirectory: false,
      canBrowsePlayerDirectory: false,
      canSendPlayerMessage: false,
    };
  }

  const [createBand, bandDirectory, playerDirectory, playerMessage] = await Promise.all([
    isPlanCapabilityEnabledForUser(resolvedUserId, 'band.create', 'leader'),
    isPlanCapabilityEnabledForUser(resolvedUserId, 'band_directory.browse', 'leader'),
    isPlanCapabilityEnabledForUser(resolvedUserId, 'player_directory.browse', 'leader'),
    isPlanCapabilityEnabledForUser(resolvedUserId, 'player_message.send', 'leader'),
  ]);

  return {
    canCreateBand: createBand,
    canBrowseBandDirectory: bandDirectory,
    canBrowsePlayerDirectory: playerDirectory,
    canSendPlayerMessage: playerMessage,
  };
}
