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

function parseMemberOptions(raw: unknown): AdminAccountDeletionMemberOption[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.map((member) => {
    const row = member as Record<string, unknown>;
    return {
      user_id: String(row.user_id),
      display_name: String(row.display_name),
    };
  });
}

function parseBandTransfers(raw: unknown): AdminAccountDeletionBandTransfer[] {
  const bands = Array.isArray(raw)
    ? raw
    : typeof raw === 'string'
      ? (JSON.parse(raw) as unknown[])
      : [];

  return bands.map((band) => {
    const row = band as Record<string, unknown>;
    return {
      band_id: String(row.band_id),
      band_name: String(row.band_name),
      member_options: parseMemberOptions(row.member_options),
    };
  });
}

function parsePreviewRow(row: Record<string, unknown>): AdminAccountDeletionPreview {
  return {
    account_deleted_at: (row.account_deleted_at as string | null) ?? null,
    is_platform_admin: Boolean(row.is_platform_admin),
    dropbox_connected: Boolean(row.dropbox_connected),
    dropbox_band_count: Number(row.dropbox_band_count ?? 0),
    bands_requiring_transfer: parseBandTransfers(row.bands_requiring_transfer),
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
