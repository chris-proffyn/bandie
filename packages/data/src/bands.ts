import { slugifyBandName } from '@bandie/utils';
import { resolveBandColorPalette } from './bandColorPalettes';
import { getBandieClient } from './context';
import { isBandieAdminModeActive } from './adminMode';
import { isCurrentUserAppAdmin, PLATFORM_ADMIN_BAND_LIST_ROLE } from './membership';

export type Band = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  location: string | null;
  travel_distance_miles: number | null;
  genres: string[];
  tagline: string | null;
  name_font: string;
  color_palette: string;
  logo_url: string | null;
  hero_image_url: string | null;
  booking_email: string | null;
  booking_phone: string | null;
  fee_guidance_min: number | null;
  fee_guidance_max: number | null;
  band_size: number | null;
  set_length_minutes: number | null;
  equipment_notes: string | null;
  availability_status: 'available' | 'limited' | 'unavailable';
  availability_note: string | null;
  owner_user_id: string;
  public_profile_enabled: boolean;
  test_user: boolean;
  created_at: string;
};

export type UserBand = Band & {
  member_role: string;
  member_status: string;
};

export type CreateBandInput = {
  name: string;
  slug?: string;
  description?: string;
  location?: string;
  color_palette?: string;
};

function mapBandRow(band: Record<string, unknown>, memberRole: string, memberStatus: string): UserBand {
  return {
    ...(band as Band),
    genres: (band.genres as string[]) ?? [],
    tagline: (band.tagline as string | null) ?? null,
    name_font: (band.name_font as string) ?? 'inter',
    color_palette: (band.color_palette as string) ?? 'bandie-gold',
    logo_url: (band.logo_url as string | null) ?? null,
    hero_image_url: (band.hero_image_url as string | null) ?? null,
    booking_email: (band.booking_email as string | null) ?? null,
    booking_phone: (band.booking_phone as string | null) ?? null,
    fee_guidance_min: (band.fee_guidance_min as number | null) ?? null,
    fee_guidance_max: (band.fee_guidance_max as number | null) ?? null,
    band_size: (band.band_size as number | null) ?? null,
    set_length_minutes: (band.set_length_minutes as number | null) ?? null,
    equipment_notes: (band.equipment_notes as string | null) ?? null,
    availability_status: (band.availability_status as Band['availability_status']) ?? 'available',
    availability_note: (band.availability_note as string | null) ?? null,
    test_user: Boolean(band.test_user),
    member_role: memberRole,
    member_status: memberStatus,
  };
}

export async function listUserBands(): Promise<UserBand[]> {
  const client = getBandieClient();
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    return [];
  }

  if (isBandieAdminModeActive() && (await isCurrentUserAppAdmin())) {
    const { data: bands, error: bandsError } = await client
      .from('bandie_bands')
      .select('*')
      .order('name', { ascending: true });

    if (bandsError) {
      throw new Error(bandsError.message);
    }

    return (bands ?? []).map((band) => mapBandRow(band, PLATFORM_ADMIN_BAND_LIST_ROLE, 'active'));
  }

  const { data: memberships, error: membershipError } = await client
    .from('bandie_band_members')
    .select('band_id, role, status')
    .eq('user_id', user.id)
    .eq('status', 'active');

  if (membershipError) {
    throw new Error(membershipError.message);
  }

  if (!memberships?.length) {
    return [];
  }

  const bandIds = memberships.map((m) => m.band_id);
  const { data: bands, error: bandsError } = await client
    .from('bandie_bands')
    .select('*')
    .in('id', bandIds);

  if (bandsError) {
    throw new Error(bandsError.message);
  }

  const roleByBand = new Map(memberships.map((m) => [m.band_id, m]));

  return (bands ?? []).map((band) => {
    const membership = roleByBand.get(band.id)!;
    return mapBandRow(band, membership.role, membership.status);
  });
}

export async function getBandById(bandId: string): Promise<Band | null> {
  const client = getBandieClient();
  const { data, error } = await client.from('bandie_bands').select('*').eq('id', bandId).maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return {
    ...(data as Band),
    genres: (data.genres as string[]) ?? [],
    test_user: Boolean(data.test_user),
  };
}

async function uniqueSlug(baseSlug: string): Promise<string> {
  const client = getBandieClient();
  let slug = baseSlug || 'band';
  let suffix = 0;

  while (suffix < 20) {
    const candidate = suffix === 0 ? slug : `${slug}-${suffix}`;
    const { data } = await client.from('bandie_bands').select('id').eq('slug', candidate).maybeSingle();
    if (!data) {
      return candidate;
    }
    suffix += 1;
  }

  return `${slug}-${Date.now()}`;
}

export async function createBand(input: CreateBandInput): Promise<Band> {
  const client = getBandieClient();
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    throw new Error('Must be signed in to create a band.');
  }

  const baseSlug = slugifyBandName(input.slug || input.name);
  const slug = await uniqueSlug(baseSlug);

  const { data, error } = await client
    .from('bandie_bands')
    .insert({
      owner_user_id: user.id,
      name: input.name.trim(),
      slug,
      description: input.description?.trim() || null,
      location: input.location?.trim() || null,
      color_palette: resolveBandColorPalette(input.color_palette),
      public_profile_enabled: false,
      test_user: false,
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
