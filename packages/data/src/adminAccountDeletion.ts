import { getBandieClient } from './context';
import { logAdminAuditEvent } from './adminPortal';

export type AdminAccountDeletionMemberOption = {
  user_id: string;
  display_name: string;
};

export type AdminAccountDeletionBandTransfer = {
  band_id: string;
  band_name: string;
  member_options: AdminAccountDeletionMemberOption[];
};

export type AdminAccountDeletionPreview = {
  account_deleted_at: string | null;
  is_platform_admin: boolean;
  dropbox_connected: boolean;
  dropbox_band_count: number;
  bands_requiring_transfer: AdminAccountDeletionBandTransfer[];
};

export type AdminAccountDeletionLeadershipTransfer = {
  bandId: string;
  newLeaderUserId: string;
};

function parsePreviewRow(row: Record<string, unknown>): AdminAccountDeletionPreview {
  const rawBands = row.bands_requiring_transfer;
  const bands = Array.isArray(rawBands)
    ? rawBands
    : typeof rawBands === 'string'
      ? (JSON.parse(rawBands) as AdminAccountDeletionBandTransfer[])
      : [];

  return {
    account_deleted_at: (row.account_deleted_at as string | null) ?? null,
    is_platform_admin: Boolean(row.is_platform_admin),
    dropbox_connected: Boolean(row.dropbox_connected),
    dropbox_band_count: Number(row.dropbox_band_count ?? 0),
    bands_requiring_transfer: bands.map((band) => ({
      band_id: String(band.band_id),
      band_name: String(band.band_name),
      member_options: (band.member_options ?? []).map((member) => ({
        user_id: String(member.user_id),
        display_name: String(member.display_name),
      })),
    })),
  };
}

export async function getAdminAccountDeletionPreview(
  userId: string,
): Promise<AdminAccountDeletionPreview> {
  const client = getBandieClient();
  const { data, error } = await client.rpc('bandie_admin_get_user_account_deletion_preview', {
    p_user_id: userId,
  });

  if (error) {
    throw new Error(error.message);
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) {
    throw new Error('Unable to load account deletion preview.');
  }

  return parsePreviewRow(row as Record<string, unknown>);
}

export async function adminDeleteUserAccount(input: {
  userId: string;
  leadershipTransfers: AdminAccountDeletionLeadershipTransfer[];
}): Promise<void> {
  const client = getBandieClient();
  const payload = input.leadershipTransfers.map((transfer) => ({
    band_id: transfer.bandId,
    new_leader_user_id: transfer.newLeaderUserId,
  }));

  const { error } = await client.rpc('bandie_admin_delete_user_account', {
    p_user_id: input.userId,
    p_leadership_transfers: payload,
  });

  if (error) {
    throw new Error(error.message);
  }

  await logAdminAuditEvent({
    eventType: 'admin.user.account_deleted',
    subjectType: 'user',
    subjectId: input.userId,
    metadata: {
      leadership_transfers: payload,
    },
  });
}
