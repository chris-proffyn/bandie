import {
  type BandMediaInput,
  type BandPublicDateInput,
  type BandDynamicFeeOfferInput,
  type BandSetOfferInput,
  type BandSocialLinkInput,
} from '@bandie/data';

export type MediaDraft = BandMediaInput & { key: string };
export type SocialDraft = BandSocialLinkInput & { key: string };
export type DateDraft = BandPublicDateInput & { key: string };
export type SetOfferDraft = BandSetOfferInput & { key: string };
export type DynamicFeeOfferDraft = BandDynamicFeeOfferInput & { key: string };

function nextKey(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export function emptyMedia(): MediaDraft {
  return { key: nextKey('media'), kind: 'track', title: '', url: '' };
}

export function emptySocial(): SocialDraft {
  return { key: nextKey('social'), platform: 'website', label: '', url: '' };
}

export function emptyDate(): DateDraft {
  return { key: nextKey('date'), event_date: '', title: '', status: 'confirmed' };
}

export function emptySetOffer(): SetOfferDraft {
  return {
    key: nextKey('set-offer'),
    set_length_minutes: null,
    set_details: '',
    average_fee: null,
    details: '',
  };
}

export function emptyDynamicFeeOffer(): DynamicFeeOfferDraft {
  return {
    key: nextKey('dynamic-fee'),
    set_details: '',
    overall_set_length_minutes: null,
    appearance_fee: null,
    session_fee: null,
    session_duration_minutes: null,
    details: '',
  };
}

export function mediaDraftsFromProfile(
  media: Array<{ id: string; kind: MediaDraft['kind']; title: string | null; url: string }>,
): MediaDraft[] {
  return media.length
    ? media.map((item) => ({
        key: item.id,
        kind: item.kind,
        title: item.title ?? '',
        url: item.url,
      }))
    : [emptyMedia()];
}

export function socialDraftsFromProfile(
  links: Array<{ id: string; platform: SocialDraft['platform']; label: string | null; url: string }>,
): SocialDraft[] {
  return links.length
    ? links.map((item) => ({
        key: item.id,
        platform: item.platform,
        label: item.label ?? '',
        url: item.url,
      }))
    : [emptySocial()];
}

export function dateDraftsFromProfile(
  dates: Array<{ id: string; event_date: string; title: string | null; status: DateDraft['status'] }>,
): DateDraft[] {
  return dates.length
    ? dates.map((item) => ({
        key: item.id,
        event_date: item.event_date,
        title: item.title ?? '',
        status: item.status,
      }))
    : [];
}

export function mediaDraftsToInput(items: MediaDraft[]): BandMediaInput[] {
  return items
    .filter((item) => item.url.trim())
    .map(({ kind, title, url }, index) => ({
      kind,
      title,
      url,
      sort_order: index,
    }));
}

export function socialDraftsToInput(items: SocialDraft[]): BandSocialLinkInput[] {
  return items
    .filter((item) => item.url.trim())
    .map(({ platform, label, url }, index) => ({
      platform,
      label,
      url,
      sort_order: index,
    }));
}

export function dateDraftsToInput(items: DateDraft[]): BandPublicDateInput[] {
  return items
    .filter((item) => item.event_date)
    .map(({ event_date, title, status }, index) => ({
      event_date,
      title,
      status,
      sort_order: index,
    }));
}

export function setOfferDraftsFromProfile(
  offers: Array<{
    id: string;
    set_length_minutes: number | null;
    set_details: string | null;
    average_fee: number | null;
    details: string | null;
  }>,
): SetOfferDraft[] {
  return offers.length
    ? offers.map((item) => ({
        key: item.id,
        set_length_minutes: item.set_length_minutes,
        set_details: item.set_details ?? '',
        average_fee: item.average_fee,
        details: item.details ?? '',
      }))
    : [emptySetOffer()];
}

export function setOfferDraftsToInput(items: SetOfferDraft[]): BandSetOfferInput[] {
  return items
    .filter(
      (item) =>
        item.set_length_minutes != null ||
        Boolean(item.set_details?.trim()) ||
        item.average_fee != null ||
        Boolean(item.details?.trim()),
    )
    .map(({ set_length_minutes, set_details, average_fee, details }, index) => ({
      set_length_minutes: set_length_minutes ?? null,
      set_details: set_details?.trim() || null,
      average_fee: average_fee ?? null,
      details: details?.trim() || null,
      sort_order: index,
    }));
}

export function dynamicFeeOfferDraftsFromProfile(
  offers: Array<{
    id: string;
    set_details: string | null;
    overall_set_length_minutes: number | null;
    appearance_fee: number | null;
    session_fee: number | null;
    session_duration_minutes: number | null;
    details: string | null;
  }>,
): DynamicFeeOfferDraft[] {
  return offers.length
    ? offers.map((item) => ({
        key: item.id,
        set_details: item.set_details ?? '',
        overall_set_length_minutes: item.overall_set_length_minutes,
        appearance_fee: item.appearance_fee,
        session_fee: item.session_fee,
        session_duration_minutes: item.session_duration_minutes,
        details: item.details ?? '',
      }))
    : [emptyDynamicFeeOffer()];
}

export function dynamicFeeOfferDraftsToInput(items: DynamicFeeOfferDraft[]): BandDynamicFeeOfferInput[] {
  return items
    .filter(
      (item) =>
        item.overall_set_length_minutes != null ||
        Boolean(item.set_details?.trim()) ||
        item.appearance_fee != null ||
        item.session_fee != null ||
        item.session_duration_minutes != null ||
        Boolean(item.details?.trim()),
    )
    .map(
      (
        {
          set_details,
          overall_set_length_minutes,
          appearance_fee,
          session_fee,
          session_duration_minutes,
          details,
        },
        index,
      ) => ({
        set_details: set_details?.trim() || null,
        overall_set_length_minutes: overall_set_length_minutes ?? null,
        appearance_fee: appearance_fee ?? null,
        session_fee: session_fee ?? null,
        session_duration_minutes: session_duration_minutes ?? null,
        details: details?.trim() || null,
        sort_order: index,
      }),
    );
}
