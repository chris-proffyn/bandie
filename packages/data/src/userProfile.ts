import { getBandieClient } from './context';
import { isCurrentUserAppAdmin } from './membership';

export type UserProfile = {
  id: string;
  user_id: string;
  display_name: string | null;
  preferred_instrument: string | null;
  profile_image_url: string | null;
  bio: string | null;
  location: string | null;
  genres: string[];
  instruments: string[];
  years_playing: number | null;
  gear_items: string[];
  gear_notes: string | null;
  travel_distance_miles: number | null;
  deputy_fee_guidance_min: number | null;
  deputy_fee_guidance_max: number | null;
  open_to_deputy_invites: boolean;
  open_to_member_invites: boolean;
  public_player_profile_enabled: boolean;
  onboarding_complete: boolean;
  created_at: string;
  updated_at: string;
};

export type UpdateUserProfileInput = {
  display_name?: string;
  preferred_instrument?: string;
  profile_image_url?: string | null;
  bio?: string;
  location?: string;
  genres?: string[];
  instruments?: string[];
  years_playing?: number | null;
  gear_items?: string[];
  gear_notes?: string;
  travel_distance_miles?: number | null;
  deputy_fee_guidance_min?: number | null;
  deputy_fee_guidance_max?: number | null;
  open_to_deputy_invites?: boolean;
  open_to_member_invites?: boolean;
  public_player_profile_enabled?: boolean;
};

const profileSelect = `
  id,
  user_id,
  display_name,
  preferred_instrument,
  profile_image_url,
  bio,
  location,
  genres,
  instruments,
  years_playing,
  gear_items,
  gear_notes,
  travel_distance_miles,
  deputy_fee_guidance_min,
  deputy_fee_guidance_max,
  open_to_deputy_invites,
  open_to_member_invites,
  public_player_profile_enabled,
  onboarding_complete,
  created_at,
  updated_at
`;

function defaultDisplayName(email?: string | null, metadataName?: string | null): string {
  if (metadataName?.trim()) {
    return metadataName.trim();
  }
  if (email?.includes('@')) {
    return email.split('@')[0] ?? 'Band member';
  }
  return 'Band member';
}

export function resolveDisplayName(
  profile: UserProfile | null,
  userEmail?: string | null,
  metadataDisplayName?: string | null,
): string {
  if (profile?.display_name?.trim()) {
    return profile.display_name.trim();
  }
  return defaultDisplayName(userEmail, metadataDisplayName);
}

/** Display name first, then email when both are known and distinct. */
export function formatUserWithEmail(
  displayName: string | null | undefined,
  email: string,
): string {
  const name = displayName?.trim();
  const normalizedEmail = email.trim();

  if (name) {
    return `${name} · ${normalizedEmail}`;
  }

  return normalizedEmail;
}

export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  const client = getBandieClient();
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await client
    .from('bandie_profiles')
    .select(profileSelect)
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return {
    ...data,
    genres: data.genres ?? [],
    instruments: data.instruments ?? [],
    gear_items: data.gear_items ?? [],
  };
}

function normalizeProfileRow(data: Record<string, unknown>): UserProfile {
  return {
    ...(data as UserProfile),
    genres: (data.genres as string[]) ?? [],
    instruments: (data.instruments as string[]) ?? [],
    gear_items: (data.gear_items as string[]) ?? [],
  };
}

export async function getUserProfileByUserId(userId: string): Promise<UserProfile | null> {
  const client = getBandieClient();
  const { data, error } = await client
    .from('bandie_profiles')
    .select(profileSelect)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return normalizeProfileRow(data);
}

export async function getUserProfileById(profileId: string): Promise<UserProfile | null> {
  const client = getBandieClient();
  const { data, error } = await client
    .from('bandie_profiles')
    .select(profileSelect)
    .eq('id', profileId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return normalizeProfileRow(data);
}

async function applyUserProfileUpdates(
  targetUserId: string,
  input: UpdateUserProfileInput,
  userEmail?: string | null,
  metadataDisplayName?: string | null,
): Promise<void> {
  const client = getBandieClient();
  const updates: Record<string, unknown> = {};

  if (input.display_name !== undefined) {
    updates.display_name =
      input.display_name.trim() || defaultDisplayName(userEmail, metadataDisplayName);
  }
  if (input.preferred_instrument !== undefined) {
    updates.preferred_instrument = input.preferred_instrument.trim() || null;
  }
  if (input.profile_image_url !== undefined) {
    updates.profile_image_url = input.profile_image_url?.trim() || null;
  }
  if (input.bio !== undefined) {
    updates.bio = input.bio.trim() || null;
  }
  if (input.location !== undefined) {
    updates.location = input.location.trim() || null;
  }
  if (input.genres !== undefined) {
    updates.genres = input.genres.map((genre) => genre.trim()).filter(Boolean);
  }
  if (input.instruments !== undefined) {
    updates.instruments = input.instruments.map((item) => item.trim()).filter(Boolean);
  }
  if (input.years_playing !== undefined) {
    updates.years_playing = input.years_playing;
  }
  if (input.gear_items !== undefined) {
    updates.gear_items = input.gear_items.map((item) => item.trim()).filter(Boolean);
  }
  if (input.gear_notes !== undefined) {
    updates.gear_notes = input.gear_notes.trim() || null;
  }
  if (input.travel_distance_miles !== undefined) {
    updates.travel_distance_miles = input.travel_distance_miles;
  }
  if (input.deputy_fee_guidance_min !== undefined) {
    updates.deputy_fee_guidance_min = input.deputy_fee_guidance_min;
  }
  if (input.deputy_fee_guidance_max !== undefined) {
    updates.deputy_fee_guidance_max = input.deputy_fee_guidance_max;
  }
  if (input.open_to_deputy_invites !== undefined) {
    updates.open_to_deputy_invites = input.open_to_deputy_invites;
  }
  if (input.open_to_member_invites !== undefined) {
    updates.open_to_member_invites = input.open_to_member_invites;
  }
  if (input.public_player_profile_enabled !== undefined) {
    updates.public_player_profile_enabled = input.public_player_profile_enabled;
  }

  if (Object.keys(updates).length === 0) {
    return;
  }

  updates.onboarding_complete = true;
  const { error } = await client.from('bandie_profiles').update(updates).eq('user_id', targetUserId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function ensureBandieProfile(displayName?: string): Promise<UserProfile> {
  const existing = await getCurrentUserProfile();
  if (existing) {
    return existing;
  }

  const client = getBandieClient();
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    throw new Error('Must be signed in to create a profile.');
  }

  const { data, error } = await client
    .from('bandie_profiles')
    .insert({
      user_id: user.id,
      display_name: displayName ?? defaultDisplayName(user.email, user.user_metadata?.display_name),
    })
    .select(profileSelect)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return {
    ...data,
    genres: data.genres ?? [],
    instruments: data.instruments ?? [],
    gear_items: data.gear_items ?? [],
  };
}

export async function updateUserProfile(input: UpdateUserProfileInput): Promise<UserProfile> {
  const client = getBandieClient();
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    throw new Error('Must be signed in to update your profile.');
  }

  await ensureBandieProfile();

  await applyUserProfileUpdates(user.id, input, user.email, user.user_metadata?.display_name);

  if (input.display_name !== undefined) {
    await client.auth.updateUser({
      data: {
        display_name:
          input.display_name.trim() ||
          defaultDisplayName(user.email, user.user_metadata?.display_name),
      },
    });
  }

  const profile = await getCurrentUserProfile();
  if (!profile) {
    throw new Error('Profile not found after update.');
  }

  return profile;
}

export async function updateUserProfileByUserId(
  targetUserId: string,
  input: UpdateUserProfileInput,
): Promise<UserProfile> {
  if (!(await isCurrentUserAppAdmin())) {
    throw new Error('Only app admins can update another user profile.');
  }

  const client = getBandieClient();
  const existing = await getUserProfileByUserId(targetUserId);
  if (!existing) {
    const { error } = await client.from('bandie_profiles').insert({
      user_id: targetUserId,
      display_name: input.display_name?.trim() || 'Band member',
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  await applyUserProfileUpdates(targetUserId, input);

  const profile = await getUserProfileByUserId(targetUserId);
  if (!profile) {
    throw new Error('Profile not found after update.');
  }

  return profile;
}

export function formatPlayerInvitePreferences(
  profile: Pick<UserProfile, 'open_to_deputy_invites' | 'open_to_member_invites'>,
): string[] {
  const labels: string[] = [];

  if (profile.open_to_deputy_invites) {
    labels.push('Open to deputy / stand-in gigs');
  }
  if (profile.open_to_member_invites) {
    labels.push('Open to permanent member invites');
  }

  return labels;
}
