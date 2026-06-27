export function bandInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function formatDisplayDate(dateValue: string): string {
  const date = new Date(`${dateValue}T12:00:00`);
  return date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function socialPlatformLabel(platform: string, label?: string | null): string {
  if (label?.trim()) {
    return label.trim();
  }

  switch (platform) {
    case 'instagram':
      return 'Instagram';
    case 'youtube':
      return 'YouTube';
    case 'spotify':
      return 'Spotify';
    case 'bandcamp':
      return 'Bandcamp';
    case 'facebook':
      return 'Facebook';
    case 'website':
      return 'Website';
    default:
      return 'Link';
  }
}

export function youtubeEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtu.be')) {
      const id = parsed.pathname.replace('/', '');
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (parsed.hostname.includes('youtube.com')) {
      const id = parsed.searchParams.get('v');
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
  } catch {
    return null;
  }
  return null;
}
