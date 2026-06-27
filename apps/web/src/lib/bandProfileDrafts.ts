import {
  type BandMediaInput,
  type BandPublicDateInput,
  type BandSocialLinkInput,
} from '@bandie/data';

export type MediaDraft = BandMediaInput & { key: string };
export type SocialDraft = BandSocialLinkInput & { key: string };
export type DateDraft = BandPublicDateInput & { key: string };

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
