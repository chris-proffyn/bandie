import { getBandieAppCode, getBandieClient } from './context';

/** Roles that grant full app-level admin access for a platform app. */
export const PLATFORM_APP_ADMIN_ROLES = ['admin', 'owner'] as const;

/** Synthetic band list role when the user is a platform app admin (not a band member). */
export const PLATFORM_ADMIN_BAND_LIST_ROLE = 'platform_admin';

export type PlatformAppAdminRole = (typeof PLATFORM_APP_ADMIN_ROLES)[number];

export type AppMembership = {
  app_code: string;
  role: string;
  status: string;
  is_app_admin: boolean;
};

export function isPlatformAppAdminRole(role: string): boolean {
  return (PLATFORM_APP_ADMIN_ROLES as readonly string[]).includes(role);
}

export async function getAppMembership(): Promise<AppMembership | null> {
  const client = getBandieClient();
  const appCode = getBandieAppCode();
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await client
    .from('platform_user_app_memberships')
    .select('app_code, role, status, is_app_admin')
    .eq('user_id', user.id)
    .eq('app_code', appCode)
    .eq('status', 'active')
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return {
    ...data,
    is_app_admin: data.is_app_admin ?? isPlatformAppAdminRole(data.role),
  };
}

export async function isCurrentUserAppAdmin(): Promise<boolean> {
  const membership = await getAppMembership();
  return membership?.is_app_admin ?? false;
}

export async function ensureAppMembership(): Promise<AppMembership> {
  const existing = await getAppMembership();
  if (existing) {
    return existing;
  }

  const client = getBandieClient();
  const appCode = getBandieAppCode();
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    throw new Error('Must be signed in to join Bandie.');
  }

  const { data, error } = await client
    .from('platform_user_app_memberships')
    .upsert(
      {
        user_id: user.id,
        app_code: appCode,
        role: 'user',
        status: 'active',
      },
      { onConflict: 'user_id,app_code' },
    )
    .select('app_code, role, status, is_app_admin')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return {
    ...data,
    is_app_admin: data.is_app_admin ?? isPlatformAppAdminRole(data.role),
  };
}
