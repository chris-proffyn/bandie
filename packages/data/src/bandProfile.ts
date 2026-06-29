import { slugifyBandName } from '@bandie/utils';
import { resolveBandNameFont } from './bandNameFonts';
import { resolveBandColorPalette } from './bandColorPalettes';
import { getBandById } from './bands';
import { getBandieClient } from './context';
import { includeTestData, isHiddenTestRow } from './testDataMode';
import type {
  BandDynamicFeeOfferInput,
  BandMediaInput,
  BandPublicDateInput,
  BandSetOfferInput,
  BandSocialLinkInput,
  PublicBandProfile,
  UpdateBandProfileInput,
} from './types/bandProfile';
import { calculateDynamicFee } from './bandDynamicFees';

const bandProfileSelect = `
  id,
  name,
  slug,
  description,
  location,
  travel_distance_miles,
  genres,
  tagline,
  name_font,
  color_palette,
  logo_url,
  hero_image_url,
  booking_email,
  booking_phone,
  fee_guidance_min,
  fee_guidance_max,
  band_size,
  set_length_minutes,
  equipment_notes,
  availability_status,
  availability_note,
  public_profile_enabled,
  owner_user_id,
  test_user,
  created_at
`;

async function loadProfileRelations(bandId: string): Promise<{
  media: PublicBandProfile['media'];
  socialLinks: PublicBandProfile['socialLinks'];
  publicDates: PublicBandProfile['publicDates'];
  setOffers: PublicBandProfile['setOffers'];
  dynamicFeeOffers: PublicBandProfile['dynamicFeeOffers'];
}> {
  const client = getBandieClient();

  const [mediaResult, socialResult, datesResult, setOffersResult, dynamicFeeOffersResult] =
    await Promise.all([
    client
      .from('bandie_band_media')
      .select('*')
      .eq('band_id', bandId)
      .order('sort_order', { ascending: true }),
    client
      .from('bandie_band_social_links')
      .select('*')
      .eq('band_id', bandId)
      .order('sort_order', { ascending: true }),
    client
      .from('bandie_band_public_dates')
      .select('*')
      .eq('band_id', bandId)
      .order('event_date', { ascending: true }),
    client
      .from('bandie_band_set_offers')
      .select('*')
      .eq('band_id', bandId)
      .order('sort_order', { ascending: true }),
    client
      .from('bandie_band_dynamic_fee_offers')
      .select('*')
      .eq('band_id', bandId)
      .order('sort_order', { ascending: true }),
  ]);

  if (mediaResult.error) {
    throw new Error(mediaResult.error.message);
  }
  if (socialResult.error) {
    throw new Error(socialResult.error.message);
  }
  if (datesResult.error) {
    throw new Error(datesResult.error.message);
  }
  if (setOffersResult.error) {
    throw new Error(setOffersResult.error.message);
  }
  if (dynamicFeeOffersResult.error) {
    throw new Error(dynamicFeeOffersResult.error.message);
  }

  return {
    media: mediaResult.data ?? [],
    socialLinks: socialResult.data ?? [],
    publicDates: datesResult.data ?? [],
    setOffers: setOffersResult.data ?? [],
    dynamicFeeOffers: dynamicFeeOffersResult.data ?? [],
  };
}

async function loadPublicProfileExtras(bandId: string): Promise<{
  members: PublicBandProfile['members'];
  primaryContact: PublicBandProfile['primaryContact'];
}> {
  const client = getBandieClient();
  const [membersResult, contactResult] = await Promise.all([
    client.rpc('bandie_list_public_band_members', { p_band_id: bandId }),
    client.rpc('bandie_get_public_band_primary_contact', { p_band_id: bandId }),
  ]);

  if (membersResult.error) {
    throw new Error(membersResult.error.message);
  }
  if (contactResult.error) {
    throw new Error(contactResult.error.message);
  }

  const contactRow = (contactResult.data as Array<Record<string, unknown>> | null)?.[0];

  return {
    members: membersResult.data ?? [],
    primaryContact: contactRow
      ? {
          user_id: contactRow.user_id as string,
          display_name: (contactRow.display_name as string) || 'Band leader',
          username: (contactRow.username as string | null) ?? null,
          profile_image_url: (contactRow.profile_image_url as string | null) ?? null,
        }
      : null,
  };
}

const emptyPublicExtras = {
  members: [] as PublicBandProfile['members'],
  primaryContact: null as PublicBandProfile['primaryContact'],
};

export async function getPublicBandProfileBySlug(slug: string): Promise<PublicBandProfile | null> {
  const client = getBandieClient();
  let query = client
    .from('bandie_bands')
    .select(bandProfileSelect)
    .eq('slug', slug)
    .eq('public_profile_enabled', true);

  if (!includeTestData()) {
    query = query.eq('test_user', false);
  }

  const { data: band, error } = await query.maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!band || isHiddenTestRow(band.test_user)) {
    return null;
  }

  const [relations, publicExtras] = await Promise.all([
    loadProfileRelations(band.id),
    loadPublicProfileExtras(band.id),
  ]);
  return {
    ...band,
    genres: band.genres ?? [],
    name_font: resolveBandNameFont(band.name_font),
    color_palette: resolveBandColorPalette(band.color_palette),
    test_user: Boolean(band.test_user),
    ...relations,
    ...publicExtras,
  };
}

export async function getBandProfileForEdit(bandId: string): Promise<PublicBandProfile | null> {
  const band = await getBandById(bandId);
  if (!band) {
    return null;
  }

  const relations = await loadProfileRelations(bandId);
  return {
    ...band,
    genres: band.genres ?? [],
    tagline: band.tagline ?? null,
    name_font: resolveBandNameFont(band.name_font),
    color_palette: resolveBandColorPalette(band.color_palette),
    logo_url: band.logo_url ?? null,
    hero_image_url: band.hero_image_url ?? null,
    booking_email: band.booking_email ?? null,
    booking_phone: band.booking_phone ?? null,
    fee_guidance_min: band.fee_guidance_min ?? null,
    fee_guidance_max: band.fee_guidance_max ?? null,
    band_size: band.band_size ?? null,
    set_length_minutes: band.set_length_minutes ?? null,
    equipment_notes: band.equipment_notes ?? null,
    availability_status: band.availability_status ?? 'available',
    availability_note: band.availability_note ?? null,
    ...relations,
    ...emptyPublicExtras,
  };
}

async function uniqueSlug(baseSlug: string, excludeBandId?: string): Promise<string> {
  const client = getBandieClient();
  const slug = baseSlug || 'band';
  let suffix = 0;

  while (suffix < 20) {
    const candidate = suffix === 0 ? slug : `${slug}-${suffix}`;
    let query = client.from('bandie_bands').select('id').eq('slug', candidate);
    if (excludeBandId) {
      query = query.neq('id', excludeBandId);
    }
    const { data } = await query.maybeSingle();
    if (!data) {
      return candidate;
    }
    suffix += 1;
  }

  return `${slug}-${Date.now()}`;
}

async function replaceBandMedia(bandId: string, items: BandMediaInput[]): Promise<void> {
  const client = getBandieClient();
  const { error: deleteError } = await client.from('bandie_band_media').delete().eq('band_id', bandId);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  if (!items.length) {
    return;
  }

  const { error: insertError } = await client.from('bandie_band_media').insert(
    items.map((item, index) => ({
      band_id: bandId,
      kind: item.kind,
      title: item.title?.trim() || null,
      url: item.url.trim(),
      sort_order: item.sort_order ?? index,
    })),
  );

  if (insertError) {
    throw new Error(insertError.message);
  }
}

async function replaceBandSocialLinks(bandId: string, items: BandSocialLinkInput[]): Promise<void> {
  const client = getBandieClient();
  const { error: deleteError } = await client
    .from('bandie_band_social_links')
    .delete()
    .eq('band_id', bandId);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  if (!items.length) {
    return;
  }

  const { error: insertError } = await client.from('bandie_band_social_links').insert(
    items.map((item, index) => ({
      band_id: bandId,
      platform: item.platform,
      label: item.label?.trim() || null,
      url: item.url.trim(),
      sort_order: item.sort_order ?? index,
    })),
  );

  if (insertError) {
    throw new Error(insertError.message);
  }
}

async function replaceBandPublicDates(bandId: string, items: BandPublicDateInput[]): Promise<void> {
  const client = getBandieClient();
  const { error: deleteError } = await client
    .from('bandie_band_public_dates')
    .delete()
    .eq('band_id', bandId);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  if (!items.length) {
    return;
  }

  const { error: insertError } = await client.from('bandie_band_public_dates').insert(
    items.map((item, index) => ({
      band_id: bandId,
      event_date: item.event_date,
      title: item.title?.trim() || null,
      status: item.status ?? 'confirmed',
      sort_order: item.sort_order ?? index,
    })),
  );

  if (insertError) {
    throw new Error(insertError.message);
  }
}

function isSetOfferInputPopulated(item: BandSetOfferInput): boolean {
  return (
    item.set_length_minutes != null ||
    Boolean(item.set_details?.trim()) ||
    item.average_fee != null ||
    Boolean(item.details?.trim())
  );
}

function feeGuidanceFromOffers(
  fixedOffers: BandSetOfferInput[],
  dynamicOffers: BandDynamicFeeOfferInput[],
): {
  fee_guidance_min: number | null;
  fee_guidance_max: number | null;
  set_length_minutes: number | null;
} {
  const fees = [
    ...fixedOffers
      .map((item) => item.average_fee)
      .filter((fee): fee is number => fee != null && fee >= 0),
    ...dynamicOffers
      .map((item) => calculateDynamicFee(item).total)
      .filter((fee): fee is number => fee != null && fee >= 0),
  ];
  const lengths = [
    ...fixedOffers
      .map((item) => item.set_length_minutes)
      .filter((length): length is number => length != null && length > 0),
    ...dynamicOffers
      .map((item) => item.overall_set_length_minutes)
      .filter((length): length is number => length != null && length > 0),
  ];

  return {
    fee_guidance_min: fees.length ? Math.min(...fees) : null,
    fee_guidance_max: fees.length ? Math.max(...fees) : null,
    set_length_minutes: lengths.length ? lengths[0] : null,
  };
}

function isDynamicFeeOfferInputPopulated(item: BandDynamicFeeOfferInput): boolean {
  return (
    item.overall_set_length_minutes != null ||
    Boolean(item.set_details?.trim()) ||
    item.appearance_fee != null ||
    item.session_fee != null ||
    item.session_duration_minutes != null ||
    Boolean(item.details?.trim())
  );
}

async function replaceBandDynamicFeeOffers(
  bandId: string,
  items: BandDynamicFeeOfferInput[],
): Promise<void> {
  const client = getBandieClient();
  const { error: deleteError } = await client
    .from('bandie_band_dynamic_fee_offers')
    .delete()
    .eq('band_id', bandId);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  const populated = items.filter(isDynamicFeeOfferInputPopulated);
  if (!populated.length) {
    return;
  }

  const { error: insertError } = await client.from('bandie_band_dynamic_fee_offers').insert(
    populated.map((item, index) => ({
      band_id: bandId,
      set_details: item.set_details?.trim() || null,
      overall_set_length_minutes: item.overall_set_length_minutes ?? null,
      appearance_fee: item.appearance_fee ?? null,
      session_fee: item.session_fee ?? null,
      session_duration_minutes: item.session_duration_minutes ?? null,
      details: item.details?.trim() || null,
      sort_order: item.sort_order ?? index,
    })),
  );

  if (insertError) {
    throw new Error(insertError.message);
  }
}

async function replaceBandSetOffers(bandId: string, items: BandSetOfferInput[]): Promise<void> {
  const client = getBandieClient();
  const { error: deleteError } = await client
    .from('bandie_band_set_offers')
    .delete()
    .eq('band_id', bandId);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  const populated = items.filter(isSetOfferInputPopulated);
  if (!populated.length) {
    return;
  }

  const { error: insertError } = await client.from('bandie_band_set_offers').insert(
    populated.map((item, index) => ({
      band_id: bandId,
      set_length_minutes: item.set_length_minutes ?? null,
      set_details: item.set_details?.trim() || null,
      average_fee: item.average_fee ?? null,
      details: item.details?.trim() || null,
      sort_order: item.sort_order ?? index,
    })),
  );

  if (insertError) {
    throw new Error(insertError.message);
  }
}

export async function updateBandProfile(
  bandId: string,
  input: UpdateBandProfileInput,
): Promise<PublicBandProfile> {
  const client = getBandieClient();
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    throw new Error('Must be signed in to update band profile.');
  }

  const updates: Record<string, unknown> = {};

  if (input.name !== undefined) {
    updates.name = input.name.trim();
  }
  if (input.description !== undefined) {
    updates.description = input.description.trim() || null;
  }
  if (input.location !== undefined) {
    updates.location = input.location.trim() || null;
  }
  if (input.travel_distance_miles !== undefined) {
    updates.travel_distance_miles = input.travel_distance_miles;
  }
  if (input.genres !== undefined) {
    updates.genres = input.genres.map((genre) => genre.trim()).filter(Boolean);
  }
  if (input.tagline !== undefined) {
    updates.tagline = input.tagline.trim() || null;
  }
  if (input.name_font !== undefined) {
    updates.name_font = resolveBandNameFont(input.name_font);
  }
  if (input.color_palette !== undefined) {
    updates.color_palette = resolveBandColorPalette(input.color_palette);
  }
  if (input.logo_url !== undefined) {
    updates.logo_url = input.logo_url?.trim() || null;
  }
  if (input.hero_image_url !== undefined) {
    updates.hero_image_url = input.hero_image_url?.trim() || null;
  }
  if (input.booking_email !== undefined) {
    updates.booking_email = input.booking_email?.trim() || null;
  }
  if (input.booking_phone !== undefined) {
    updates.booking_phone = input.booking_phone?.trim() || null;
  }
  if (input.fee_guidance_min !== undefined) {
    updates.fee_guidance_min = input.fee_guidance_min;
  }
  if (input.fee_guidance_max !== undefined) {
    updates.fee_guidance_max = input.fee_guidance_max;
  }
  if (input.band_size !== undefined) {
    updates.band_size = input.band_size;
  }
  if (input.set_length_minutes !== undefined) {
    updates.set_length_minutes = input.set_length_minutes;
  }
  if (input.equipment_notes !== undefined) {
    updates.equipment_notes =
      input.equipment_notes === null ? null : input.equipment_notes.trim() || null;
  }
  if (input.availability_status !== undefined) {
    updates.availability_status = input.availability_status;
  }
  if (input.availability_note !== undefined) {
    updates.availability_note =
      input.availability_note === null ? null : input.availability_note.trim() || null;
  }
  if (input.public_profile_enabled !== undefined) {
    updates.public_profile_enabled = input.public_profile_enabled;
  }
  if (input.slug !== undefined) {
    const baseSlug = slugifyBandName(input.slug);
    updates.slug = await uniqueSlug(baseSlug, bandId);
  }

  if (Object.keys(updates).length > 0) {
    const { error } = await client.from('bandie_bands').update(updates).eq('id', bandId);

    if (error) {
      throw new Error(error.message);
    }
  }

  if (input.media !== undefined) {
    await replaceBandMedia(bandId, input.media);
  }
  if (input.socialLinks !== undefined) {
    await replaceBandSocialLinks(bandId, input.socialLinks);
  }
  if (input.publicDates !== undefined) {
    await replaceBandPublicDates(bandId, input.publicDates);
  }
  if (input.setOffers !== undefined) {
    await replaceBandSetOffers(bandId, input.setOffers);
  }
  if (input.dynamicFeeOffers !== undefined) {
    await replaceBandDynamicFeeOffers(bandId, input.dynamicFeeOffers);
  }
  if (input.setOffers !== undefined || input.dynamicFeeOffers !== undefined) {
    let fixedOffers = input.setOffers;
    let dynamicOffers = input.dynamicFeeOffers;

    if (fixedOffers === undefined || dynamicOffers === undefined) {
      const current = await getBandProfileForEdit(bandId);
      fixedOffers ??=
        current?.setOffers.map(
          ({ set_length_minutes, set_details, average_fee, details, sort_order }) => ({
            set_length_minutes,
            set_details,
            average_fee,
            details,
            sort_order,
          }),
        ) ?? [];
      dynamicOffers ??=
        current?.dynamicFeeOffers.map(
          ({
            set_details,
            overall_set_length_minutes,
            appearance_fee,
            session_fee,
            session_duration_minutes,
            details,
            sort_order,
          }) => ({
            set_details,
            overall_set_length_minutes,
            appearance_fee,
            session_fee,
            session_duration_minutes,
            details,
            sort_order,
          }),
        ) ?? [];
    }

    const syncedFees = feeGuidanceFromOffers(fixedOffers, dynamicOffers);
    const { error: syncError } = await client
      .from('bandie_bands')
      .update(syncedFees)
      .eq('id', bandId);

    if (syncError) {
      throw new Error(syncError.message);
    }
  }

  const profile = await getBandProfileForEdit(bandId);
  if (!profile) {
    throw new Error('Band profile not found after update.');
  }

  return profile;
}

export function formatBandSubtitle(profile: Pick<PublicBandProfile, 'tagline'>): string {
  return profile.tagline?.trim() ?? '';
}

export function formatBandLocation(
  profile: Pick<PublicBandProfile, 'location' | 'travel_distance_miles'>,
): string {
  const city = profile.location?.trim();
  if (city && profile.travel_distance_miles != null) {
    return `${city} · up to ${profile.travel_distance_miles} miles`;
  }
  if (city) {
    return city;
  }
  if (profile.travel_distance_miles != null) {
    return `Up to ${profile.travel_distance_miles} miles travel`;
  }
  return '';
}

export function formatBandDirectorySubtitle(
  profile: Pick<PublicBandProfile, 'tagline' | 'genres' | 'location' | 'travel_distance_miles'>,
): string {
  const tagline = formatBandSubtitle(profile);
  if (tagline) {
    return tagline;
  }

  const parts: string[] = [];
  const genreLabel = profile.genres.filter(Boolean).join(' / ');
  if (genreLabel) {
    parts.push(genreLabel);
  }
  const locationLabel = formatBandLocation(profile);
  if (locationLabel) {
    parts.push(locationLabel);
  }
  return parts.join(' · ');
}

export function availabilityLabel(status: PublicBandProfile['availability_status']): string {
  switch (status) {
    case 'available':
      return 'Available for gigs';
    case 'limited':
      return 'Limited availability';
    case 'unavailable':
      return 'Not currently booking';
    default:
      return 'Availability unknown';
  }
}

export function formatFeeRange(min: number | null, max: number | null): string | null {
  if (min != null && max != null) {
    if (min === max) {
      return formatAverageFee(min);
    }
    return `£${min.toLocaleString()} – £${max.toLocaleString()}`;
  }
  if (min != null) {
    return `From £${min.toLocaleString()}`;
  }
  if (max != null) {
    return `Up to £${max.toLocaleString()}`;
  }
  return null;
}

export function formatAverageFee(fee: number | null): string | null {
  if (fee == null) {
    return null;
  }

  return `£${fee.toLocaleString()}`;
}

export function formatSetOfferSummary(
  offer: Pick<BandSetOfferInput, 'set_length_minutes' | 'set_details' | 'average_fee'>,
): string {
  const parts: string[] = [];

  if (offer.set_details?.trim()) {
    parts.push(offer.set_details.trim());
  } else if (offer.set_length_minutes != null) {
    parts.push(`${offer.set_length_minutes} min`);
  }

  const feeLabel = formatAverageFee(offer.average_fee ?? null);
  if (feeLabel) {
    parts.push(feeLabel);
  }

  return parts.join(' · ') || 'Set option';
}
