import { getBandieClient } from './context';
import { logAdminAuditEvent } from './adminPortal';
import type { PlayerEntitlementTestPlanCode } from './entitlementTestPlan';
import type { EntitlementPlanScope } from './entitlementTypes';

export const ADMIN_ACCOUNTS_PAGE_SIZE = 20;

export type AdminUserAccount = {
  user_id: string;
  display_name: string | null;
  username: string | null;
  email: string | null;
  is_player: boolean;
  is_organiser: boolean;
  test_user: boolean;
  account_deleted_at: string | null;
  entitlement_test_leader_plan_code: string | null;
  leader_subscription_id: string | null;
  leader_plan_code: string | null;
  leader_plan_name: string | null;
  leader_subscription_status: string | null;
  leader_subscription_source: string | null;
  leader_trial_end: string | null;
  leader_stripe_subscription_id: string | null;
  organiser_subscription_id: string | null;
  organiser_plan_code: string | null;
  organiser_plan_name: string | null;
  organiser_subscription_status: string | null;
  organiser_subscription_source: string | null;
  organiser_trial_end: string | null;
  organiser_stripe_subscription_id: string | null;
  active_override_count: number;
  created_at: string;
};

export type AdminBandAccount = {
  band_id: string;
  name: string;
  slug: string;
  owner_user_id: string;
  owner_display_name: string | null;
  owner_email: string | null;
  test_user: boolean;
  leader_plan_code: string | null;
  leader_plan_name: string | null;
  leader_subscription_source: string | null;
  leader_trial_end: string | null;
  member_count: number;
  song_count: number;
  created_at: string;
};

export type AdminAccountsPage<T> = {
  rows: T[];
  total: number;
  limit: number;
  offset: number;
};

export type AdminTestDataCounts = {
  test_user_count: number;
  test_band_count: number;
};

export async function getAdminTestDataCounts(): Promise<AdminTestDataCounts> {
  const client = getBandieClient();
  const { data, error } = await client.rpc('bandie_admin_test_data_counts');

  if (error) {
    throw new Error(error.message);
  }

  const row = Array.isArray(data) ? data[0] : data;

  return {
    test_user_count: (row as AdminTestDataCounts | null)?.test_user_count ?? 0,
    test_band_count: (row as AdminTestDataCounts | null)?.test_band_count ?? 0,
  };
}

export async function listAdminUserAccounts(options: {
  query?: string;
  limit?: number;
  offset?: number;
  hideTestData?: boolean;
}): Promise<AdminAccountsPage<AdminUserAccount>> {
  const client = getBandieClient();
  const query = options.query?.trim() ?? '';
  const limit = options.limit ?? ADMIN_ACCOUNTS_PAGE_SIZE;
  const offset = options.offset ?? 0;

  const [{ data, error }, { data: total, error: countError }] = await Promise.all([
    client.rpc('bandie_admin_list_user_accounts', {
      p_query: query || null,
      p_limit: limit,
      p_offset: offset,
      p_hide_test_data: options.hideTestData ?? false,
    }),
    client.rpc('bandie_admin_count_user_accounts', {
      p_query: query || null,
      p_hide_test_data: options.hideTestData ?? false,
    }),
  ]);

  if (error) {
    throw new Error(error.message);
  }

  if (countError) {
    throw new Error(countError.message);
  }

  return {
    rows: (data ?? []) as AdminUserAccount[],
    total: (total as number | null) ?? 0,
    limit,
    offset,
  };
}

export async function listAdminBandAccounts(options: {
  query?: string;
  limit?: number;
  offset?: number;
  hideTestData?: boolean;
}): Promise<AdminAccountsPage<AdminBandAccount>> {
  const client = getBandieClient();
  const query = options.query?.trim() ?? '';
  const limit = options.limit ?? ADMIN_ACCOUNTS_PAGE_SIZE;
  const offset = options.offset ?? 0;

  const [{ data, error }, { data: total, error: countError }] = await Promise.all([
    client.rpc('bandie_admin_list_band_accounts', {
      p_query: query || null,
      p_limit: limit,
      p_offset: offset,
      p_hide_test_data: options.hideTestData ?? false,
    }),
    client.rpc('bandie_admin_count_band_accounts', {
      p_query: query || null,
      p_hide_test_data: options.hideTestData ?? false,
    }),
  ]);

  if (error) {
    throw new Error(error.message);
  }

  if (countError) {
    throw new Error(countError.message);
  }

  return {
    rows: (data ?? []) as AdminBandAccount[],
    total: (total as number | null) ?? 0,
    limit,
    offset,
  };
}

export async function adminUpdateUserWorkspaceRoles(input: {
  userId: string;
  isPlayer: boolean;
  isOrganiser: boolean;
}): Promise<void> {
  const client = getBandieClient();
  const { error } = await client.rpc('bandie_admin_update_user_workspace_roles', {
    p_user_id: input.userId,
    p_is_player: input.isPlayer,
    p_is_organiser: input.isOrganiser,
  });

  if (error) {
    throw new Error(error.message);
  }

  await logAdminAuditEvent({
    eventType: 'admin.user.workspace_roles_updated',
    subjectType: 'user',
    subjectId: input.userId,
    metadata: {
      is_player: input.isPlayer,
      is_organiser: input.isOrganiser,
    },
  });
}

export async function adminUpdateUserEntitlementTestPlan(
  userId: string,
  planCode: PlayerEntitlementTestPlanCode | null,
): Promise<void> {
  const client = getBandieClient();
  const { error } = await client.rpc('bandie_admin_update_user_entitlement_test_plan', {
    p_user_id: userId,
    p_plan_code: planCode,
  });

  if (error) {
    throw new Error(error.message);
  }

  await logAdminAuditEvent({
    eventType: 'admin.user.entitlement_test_plan_updated',
    subjectType: 'user',
    subjectId: userId,
    metadata: { plan_code: planCode },
  });
}

export async function adminSetUserSubscriptionPlan(
  userId: string,
  planScope: EntitlementPlanScope,
  planCode: string,
): Promise<void> {
  const client = getBandieClient();
  const { error } = await client.rpc('bandie_admin_set_user_subscription_plan', {
    p_user_id: userId,
    p_plan_scope: planScope,
    p_plan_code: planCode,
  });

  if (error) {
    throw new Error(error.message);
  }

  await logAdminAuditEvent({
    eventType: 'admin.user.subscription_plan_updated',
    subjectType: 'user',
    subjectId: userId,
    metadata: { plan_scope: planScope, plan_code: planCode },
  });
}

export async function adminSetUserSubscriptionTrialEnd(
  userId: string,
  planScope: EntitlementPlanScope,
  trialEnd: string | null,
): Promise<void> {
  const client = getBandieClient();
  const { error } = await client.rpc('bandie_admin_set_user_subscription_trial_end', {
    p_user_id: userId,
    p_plan_scope: planScope,
    p_trial_end: trialEnd,
  });

  if (error) {
    throw new Error(error.message);
  }

  await logAdminAuditEvent({
    eventType: 'admin.user.subscription_trial_end_updated',
    subjectType: 'user',
    subjectId: userId,
    metadata: { plan_scope: planScope, trial_end: trialEnd },
  });
}

export function formatAdminAccountDate(value: string | null | undefined): string {
  if (!value) {
    return '—';
  }

  return new Date(value).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatAdminWorkspaceRoles(isPlayer: boolean, isOrganiser: boolean): string {
  const roles: string[] = [];
  if (isPlayer) {
    roles.push('Player');
  }
  if (isOrganiser) {
    roles.push('Organiser');
  }
  return roles.length > 0 ? roles.join(', ') : '—';
}

export function isStripeBilledSubscription(stripeSubscriptionId: string | null | undefined): boolean {
  return Boolean(stripeSubscriptionId?.trim());
}

export function toDateTimeLocalValue(value: string | null | undefined): string {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const pad = (part: number) => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function fromDateTimeLocalValue(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) {
    throw new Error('Enter a valid date and time.');
  }

  return date.toISOString();
}
