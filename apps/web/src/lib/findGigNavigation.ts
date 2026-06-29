export type FindGigContext = {
  gigId: string;
  gigTitle?: string;
};

export function parseFindGigContext(search: string): FindGigContext | null {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const gigId = params.get('forGig')?.trim();

  if (!gigId) {
    return null;
  }

  return {
    gigId,
    gigTitle: params.get('gigTitle')?.trim() || undefined,
  };
}

export function buildFindGigUrl(context: FindGigContext): string {
  const params = new URLSearchParams();
  params.set('forGig', context.gigId);

  if (context.gigTitle) {
    params.set('gigTitle', context.gigTitle);
  }

  return `/app/bands?${params.toString()}`;
}
