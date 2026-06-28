import type { BandNameFont } from '../bandNameFonts';
import type { BandColorPaletteId } from '../bandColorPalettes';

export type AvailabilityStatus = 'available' | 'limited' | 'unavailable';

export type BandMediaKind = 'photo' | 'video' | 'track';

export type SocialPlatform =
  | 'instagram'
  | 'youtube'
  | 'spotify'
  | 'bandcamp'
  | 'facebook'
  | 'website'
  | 'other';

export type PublicDateStatus = 'confirmed' | 'provisional';

export type BandMediaItem = {
  id: string;
  band_id: string;
  kind: BandMediaKind;
  title: string | null;
  url: string;
  sort_order: number;
};

export type BandSocialLink = {
  id: string;
  band_id: string;
  platform: SocialPlatform;
  label: string | null;
  url: string;
  sort_order: number;
};

export type BandPublicDate = {
  id: string;
  band_id: string;
  event_date: string;
  title: string | null;
  status: PublicDateStatus;
  sort_order: number;
};

export type BandProfileFields = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  location: string | null;
  travel_distance_miles: number | null;
  genres: string[];
  tagline: string | null;
  name_font: BandNameFont;
  color_palette: BandColorPaletteId;
  logo_url: string | null;
  hero_image_url: string | null;
  booking_email: string | null;
  booking_phone: string | null;
  fee_guidance_min: number | null;
  fee_guidance_max: number | null;
  band_size: number | null;
  set_length_minutes: number | null;
  equipment_notes: string | null;
  availability_status: AvailabilityStatus;
  availability_note: string | null;
  public_profile_enabled: boolean;
  owner_user_id: string;
  created_at: string;
};

export type BandSetOffer = {
  id: string;
  band_id: string;
  set_length_minutes: number | null;
  set_details: string | null;
  average_fee: number | null;
  details: string | null;
  sort_order: number;
};

export type PublicBandPrimaryContact = {
  user_id: string;
  display_name: string;
  username: string | null;
  profile_image_url: string | null;
};

export type PublicBandMember = {
  profile_id: string | null;
  user_id: string;
  display_name: string;
  username: string | null;
  preferred_instrument: string | null;
  profile_image_url: string | null;
  member_role: string;
  is_primary_contact: boolean;
  lineup_part_title: string | null;
};

export type PublicBandProfile = BandProfileFields & {
  media: BandMediaItem[];
  socialLinks: BandSocialLink[];
  publicDates: BandPublicDate[];
  setOffers: BandSetOffer[];
  dynamicFeeOffers: BandDynamicFeeOffer[];
  members: PublicBandMember[];
  primaryContact: PublicBandPrimaryContact | null;
};

export type BandSetOfferInput = {
  set_length_minutes?: number | null;
  set_details?: string | null;
  average_fee?: number | null;
  details?: string | null;
  sort_order?: number;
};

export type BandDynamicFeeOffer = {
  id: string;
  band_id: string;
  set_details: string | null;
  overall_set_length_minutes: number | null;
  appearance_fee: number | null;
  session_fee: number | null;
  session_duration_minutes: number | null;
  details: string | null;
  sort_order: number;
};

export type BandDynamicFeeOfferInput = {
  set_details?: string | null;
  overall_set_length_minutes?: number | null;
  appearance_fee?: number | null;
  session_fee?: number | null;
  session_duration_minutes?: number | null;
  details?: string | null;
  sort_order?: number;
};

export type BandMediaInput = {
  kind: BandMediaKind;
  title?: string;
  url: string;
  sort_order?: number;
};

export type BandSocialLinkInput = {
  platform: SocialPlatform;
  label?: string;
  url: string;
  sort_order?: number;
};

export type BandPublicDateInput = {
  event_date: string;
  title?: string;
  status?: PublicDateStatus;
  sort_order?: number;
};

export type UpdateBandProfileInput = {
  name?: string;
  slug?: string;
  description?: string;
  location?: string;
  travel_distance_miles?: number | null;
  genres?: string[];
  tagline?: string;
  name_font?: BandNameFont;
  color_palette?: BandColorPaletteId;
  logo_url?: string | null;
  hero_image_url?: string | null;
  booking_email?: string | null;
  booking_phone?: string | null;
  fee_guidance_min?: number | null;
  fee_guidance_max?: number | null;
  band_size?: number | null;
  set_length_minutes?: number | null;
  equipment_notes?: string | null;
  availability_status?: AvailabilityStatus;
  availability_note?: string | null;
  public_profile_enabled?: boolean;
  media?: BandMediaInput[];
  socialLinks?: BandSocialLinkInput[];
  publicDates?: BandPublicDateInput[];
  setOffers?: BandSetOfferInput[];
  dynamicFeeOffers?: BandDynamicFeeOfferInput[];
};
