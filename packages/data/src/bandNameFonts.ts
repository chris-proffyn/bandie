export const BAND_NAME_FONTS = [
  { id: 'inter', label: 'Inter (default)', family: 'Inter, ui-sans-serif, system-ui, sans-serif', googleQuery: 'Inter:wght@700;800;900' },
  { id: 'bebas-neue', label: 'Bebas Neue', family: '"Bebas Neue", sans-serif', googleQuery: 'Bebas+Neue' },
  { id: 'playfair-display', label: 'Playfair Display', family: '"Playfair Display", Georgia, serif', googleQuery: 'Playfair+Display:wght@700;800;900' },
  { id: 'oswald', label: 'Oswald', family: 'Oswald, sans-serif', googleQuery: 'Oswald:wght@600;700' },
  { id: 'space-grotesk', label: 'Space Grotesk', family: '"Space Grotesk", sans-serif', googleQuery: 'Space+Grotesk:wght@700' },
  { id: 'permanent-marker', label: 'Permanent Marker', family: '"Permanent Marker", cursive', googleQuery: 'Permanent+Marker' },
  { id: 'anton', label: 'Anton', family: 'Anton, sans-serif', googleQuery: 'Anton' },
  { id: 'rock-salt', label: 'Rock Salt', family: '"Rock Salt", cursive', googleQuery: 'Rock+Salt' },
] as const;

export type BandNameFont = (typeof BAND_NAME_FONTS)[number]['id'];

export const DEFAULT_BAND_NAME_FONT: BandNameFont = 'inter';

const fontById = new Map(BAND_NAME_FONTS.map((font) => [font.id, font]));

export function isBandNameFont(value: string | null | undefined): value is BandNameFont {
  return Boolean(value && fontById.has(value as BandNameFont));
}

export function resolveBandNameFont(value: string | null | undefined): BandNameFont {
  return isBandNameFont(value) ? value : DEFAULT_BAND_NAME_FONT;
}

export function bandNameFontFamily(value: string | null | undefined): string {
  return fontById.get(resolveBandNameFont(value))?.family ?? fontById.get(DEFAULT_BAND_NAME_FONT)!.family;
}

export function bandNameFontGoogleStylesheetUrl(value: string | null | undefined): string | null {
  const font = fontById.get(resolveBandNameFont(value));
  if (!font || font.id === DEFAULT_BAND_NAME_FONT) {
    return null;
  }

  return `https://fonts.googleapis.com/css2?family=${font.googleQuery}&display=swap`;
}

export function allBandNameFontsGoogleStylesheetUrl(): string {
  const families = BAND_NAME_FONTS.map((font) => font.googleQuery).join('&family=');
  return `https://fonts.googleapis.com/css2?family=${families}&display=swap`;
}
