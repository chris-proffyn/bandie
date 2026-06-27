export type BandColorPaletteId =
  | 'bandie-gold'
  | 'stage-red'
  | 'midnight-blue'
  | 'forest-green'
  | 'purple-haze'
  | 'copper-warm'
  | 'ocean-teal'
  | 'neon-night'
  | 'punk-riot'
  | 'anarcho-black'
  | 'acid-clash'
  | 'garage-grit';

export type BandColorPalette = {
  id: BandColorPaletteId;
  label: string;
  description: string;
  background: string;
  glowPrimary: string;
  glowSecondary: string;
  surface: string;
  surfaceBorder: string;
  headerBg: string;
  text: string;
  textMuted: string;
  accent: string;
  accentSecondary: string;
  accentText: string;
  accentSoftBg: string;
  accentSoftBorder: string;
  bookingGradientStart: string;
  bookingGradientEnd: string;
  logoGradientStart: string;
  logoGradientEnd: string;
};

export const BAND_COLOR_PALETTES: BandColorPalette[] = [
  {
    id: 'bandie-gold',
    label: 'Bandie Gold',
    description: 'Warm gold and coral on deep charcoal — the classic Bandie look.',
    background: '#101014',
    glowPrimary: 'rgba(255, 204, 51, 0.18)',
    glowSecondary: 'rgba(255, 94, 126, 0.16)',
    surface: 'rgba(255, 255, 255, 0.05)',
    surfaceBorder: 'rgba(255, 255, 255, 0.12)',
    headerBg: 'rgba(16, 16, 20, 0.82)',
    text: '#f6f3ea',
    textMuted: '#bbb6aa',
    accent: '#ffcc33',
    accentSecondary: '#ff5e7e',
    accentText: '#101014',
    accentSoftBg: 'rgba(255, 204, 51, 0.14)',
    accentSoftBorder: 'rgba(255, 204, 51, 0.35)',
    bookingGradientStart: 'rgba(255, 204, 51, 0.12)',
    bookingGradientEnd: 'rgba(255, 94, 126, 0.08)',
    logoGradientStart: '#ffcc33',
    logoGradientEnd: '#ff5e7e',
  },
  {
    id: 'stage-red',
    label: 'Stage Red',
    description: 'Bold crimson and amber — high energy for rock and covers bands.',
    background: '#12080c',
    glowPrimary: 'rgba(255, 75, 92, 0.22)',
    glowSecondary: 'rgba(255, 189, 74, 0.14)',
    surface: 'rgba(255, 255, 255, 0.05)',
    surfaceBorder: 'rgba(255, 120, 120, 0.18)',
    headerBg: 'rgba(18, 8, 12, 0.88)',
    text: '#fff5f5',
    textMuted: '#c9a8ae',
    accent: '#ff4b5c',
    accentSecondary: '#ffbd4a',
    accentText: '#1a0508',
    accentSoftBg: 'rgba(255, 75, 92, 0.16)',
    accentSoftBorder: 'rgba(255, 75, 92, 0.38)',
    bookingGradientStart: 'rgba(255, 75, 92, 0.16)',
    bookingGradientEnd: 'rgba(255, 189, 74, 0.1)',
    logoGradientStart: '#ff4b5c',
    logoGradientEnd: '#ffbd4a',
  },
  {
    id: 'midnight-blue',
    label: 'Midnight Blue',
    description: 'Cool navy and ice blue — polished and professional.',
    background: '#070b14',
    glowPrimary: 'rgba(124, 199, 255, 0.16)',
    glowSecondary: 'rgba(96, 165, 250, 0.12)',
    surface: 'rgba(255, 255, 255, 0.04)',
    surfaceBorder: 'rgba(148, 163, 184, 0.18)',
    headerBg: 'rgba(7, 11, 20, 0.9)',
    text: '#eef4ff',
    textMuted: '#94a3b8',
    accent: '#7cc7ff',
    accentSecondary: '#60a5fa',
    accentText: '#071018',
    accentSoftBg: 'rgba(124, 199, 255, 0.14)',
    accentSoftBorder: 'rgba(124, 199, 255, 0.32)',
    bookingGradientStart: 'rgba(124, 199, 255, 0.12)',
    bookingGradientEnd: 'rgba(96, 165, 250, 0.08)',
    logoGradientStart: '#7cc7ff',
    logoGradientEnd: '#3b82f6',
  },
  {
    id: 'forest-green',
    label: 'Forest Green',
    description: 'Deep green and sage — earthy, acoustic, folk-friendly.',
    background: '#08110d',
    glowPrimary: 'rgba(59, 207, 142, 0.14)',
    glowSecondary: 'rgba(134, 239, 172, 0.1)',
    surface: 'rgba(255, 255, 255, 0.04)',
    surfaceBorder: 'rgba(134, 239, 172, 0.16)',
    headerBg: 'rgba(8, 17, 13, 0.9)',
    text: '#edfdf4',
    textMuted: '#9cb8a8',
    accent: '#3bcf8e',
    accentSecondary: '#86efac',
    accentText: '#052e16',
    accentSoftBg: 'rgba(59, 207, 142, 0.14)',
    accentSoftBorder: 'rgba(59, 207, 142, 0.32)',
    bookingGradientStart: 'rgba(59, 207, 142, 0.12)',
    bookingGradientEnd: 'rgba(134, 239, 172, 0.08)',
    logoGradientStart: '#3bcf8e',
    logoGradientEnd: '#22c55e',
  },
  {
    id: 'purple-haze',
    label: 'Purple Haze',
    description: 'Violet and magenta — creative, indie, and festival-ready.',
    background: '#0d0814',
    glowPrimary: 'rgba(178, 140, 255, 0.18)',
    glowSecondary: 'rgba(236, 72, 153, 0.14)',
    surface: 'rgba(255, 255, 255, 0.05)',
    surfaceBorder: 'rgba(196, 181, 253, 0.18)',
    headerBg: 'rgba(13, 8, 20, 0.9)',
    text: '#f5f0ff',
    textMuted: '#b8a8c9',
    accent: '#b28cff',
    accentSecondary: '#ec4899',
    accentText: '#140820',
    accentSoftBg: 'rgba(178, 140, 255, 0.14)',
    accentSoftBorder: 'rgba(178, 140, 255, 0.35)',
    bookingGradientStart: 'rgba(178, 140, 255, 0.14)',
    bookingGradientEnd: 'rgba(236, 72, 153, 0.1)',
    logoGradientStart: '#b28cff',
    logoGradientEnd: '#ec4899',
  },
  {
    id: 'copper-warm',
    label: 'Copper Warm',
    description: 'Burnt orange and bronze — soul, blues, and vintage vibes.',
    background: '#14100c',
    glowPrimary: 'rgba(234, 140, 74, 0.18)',
    glowSecondary: 'rgba(217, 119, 6, 0.12)',
    surface: 'rgba(255, 255, 255, 0.05)',
    surfaceBorder: 'rgba(251, 191, 136, 0.16)',
    headerBg: 'rgba(20, 16, 12, 0.9)',
    text: '#fff8f0',
    textMuted: '#c4a88a',
    accent: '#ea8c4a',
    accentSecondary: '#d97706',
    accentText: '#1c0f06',
    accentSoftBg: 'rgba(234, 140, 74, 0.14)',
    accentSoftBorder: 'rgba(234, 140, 74, 0.35)',
    bookingGradientStart: 'rgba(234, 140, 74, 0.14)',
    bookingGradientEnd: 'rgba(217, 119, 6, 0.1)',
    logoGradientStart: '#ea8c4a',
    logoGradientEnd: '#d97706',
  },
  {
    id: 'ocean-teal',
    label: 'Ocean Teal',
    description: 'Teal and aqua — coastal, reggae, and summer session bands.',
    background: '#061214',
    glowPrimary: 'rgba(45, 212, 191, 0.16)',
    glowSecondary: 'rgba(6, 182, 212, 0.12)',
    surface: 'rgba(255, 255, 255, 0.04)',
    surfaceBorder: 'rgba(94, 234, 212, 0.16)',
    headerBg: 'rgba(6, 18, 20, 0.9)',
    text: '#ecfeff',
    textMuted: '#94b8b8',
    accent: '#2dd4bf',
    accentSecondary: '#06b6d4',
    accentText: '#042f2e',
    accentSoftBg: 'rgba(45, 212, 191, 0.14)',
    accentSoftBorder: 'rgba(45, 212, 191, 0.32)',
    bookingGradientStart: 'rgba(45, 212, 191, 0.12)',
    bookingGradientEnd: 'rgba(6, 182, 212, 0.08)',
    logoGradientStart: '#2dd4bf',
    logoGradientEnd: '#06b6d4',
  },
  {
    id: 'neon-night',
    label: 'Neon Night',
    description: 'Electric pink and cyan — pop, disco, and party bands.',
    background: '#0a0812',
    glowPrimary: 'rgba(244, 114, 182, 0.18)',
    glowSecondary: 'rgba(34, 211, 238, 0.14)',
    surface: 'rgba(255, 255, 255, 0.05)',
    surfaceBorder: 'rgba(244, 114, 182, 0.18)',
    headerBg: 'rgba(10, 8, 18, 0.9)',
    text: '#fdf4ff',
    textMuted: '#b8a0c4',
    accent: '#f472b6',
    accentSecondary: '#22d3ee',
    accentText: '#1a0818',
    accentSoftBg: 'rgba(244, 114, 182, 0.14)',
    accentSoftBorder: 'rgba(244, 114, 182, 0.35)',
    bookingGradientStart: 'rgba(244, 114, 182, 0.14)',
    bookingGradientEnd: 'rgba(34, 211, 238, 0.1)',
    logoGradientStart: '#f472b6',
    logoGradientEnd: '#22d3ee',
  },
  {
    id: 'punk-riot',
    label: 'Punk Riot',
    description: 'Hot pink and safety yellow on jet black — ripped-flyer punk energy.',
    background: '#050505',
    glowPrimary: 'rgba(255, 0, 102, 0.22)',
    glowSecondary: 'rgba(255, 230, 0, 0.12)',
    surface: 'rgba(255, 255, 255, 0.04)',
    surfaceBorder: 'rgba(255, 0, 102, 0.22)',
    headerBg: 'rgba(5, 5, 5, 0.94)',
    text: '#f5f5f5',
    textMuted: '#9a9a9a',
    accent: '#ff0066',
    accentSecondary: '#ffe600',
    accentText: '#0a0a0a',
    accentSoftBg: 'rgba(255, 0, 102, 0.16)',
    accentSoftBorder: 'rgba(255, 0, 102, 0.42)',
    bookingGradientStart: 'rgba(255, 0, 102, 0.14)',
    bookingGradientEnd: 'rgba(255, 230, 0, 0.08)',
    logoGradientStart: '#ff0066',
    logoGradientEnd: '#ffe600',
  },
  {
    id: 'anarcho-black',
    label: 'Anarcho Black',
    description: 'Bone white and blood red on pure black — hardcore, crust, and anarcho punk.',
    background: '#080808',
    glowPrimary: 'rgba(220, 20, 60, 0.2)',
    glowSecondary: 'rgba(240, 236, 232, 0.06)',
    surface: 'rgba(255, 255, 255, 0.03)',
    surfaceBorder: 'rgba(220, 20, 60, 0.2)',
    headerBg: 'rgba(8, 8, 8, 0.95)',
    text: '#f0ece8',
    textMuted: '#8a8580',
    accent: '#dc143c',
    accentSecondary: '#8b0000',
    accentText: '#f0ece8',
    accentSoftBg: 'rgba(220, 20, 60, 0.14)',
    accentSoftBorder: 'rgba(220, 20, 60, 0.38)',
    bookingGradientStart: 'rgba(220, 20, 60, 0.14)',
    bookingGradientEnd: 'rgba(139, 0, 0, 0.1)',
    logoGradientStart: '#dc143c',
    logoGradientEnd: '#8b0000',
  },
  {
    id: 'acid-clash',
    label: 'Acid Clash',
    description: 'Toxic lime and burnt orange on black — garage punk and post-punk bite.',
    background: '#0a0a0a',
    glowPrimary: 'rgba(204, 255, 0, 0.14)',
    glowSecondary: 'rgba(255, 102, 0, 0.14)',
    surface: 'rgba(255, 255, 255, 0.04)',
    surfaceBorder: 'rgba(204, 255, 0, 0.16)',
    headerBg: 'rgba(10, 10, 10, 0.94)',
    text: '#e8ffe0',
    textMuted: '#8a9a82',
    accent: '#ccff00',
    accentSecondary: '#ff6600',
    accentText: '#0a0a0a',
    accentSoftBg: 'rgba(204, 255, 0, 0.12)',
    accentSoftBorder: 'rgba(204, 255, 0, 0.32)',
    bookingGradientStart: 'rgba(204, 255, 0, 0.1)',
    bookingGradientEnd: 'rgba(255, 102, 0, 0.1)',
    logoGradientStart: '#ccff00',
    logoGradientEnd: '#ff6600',
  },
  {
    id: 'garage-grit',
    label: 'Garage Grit',
    description: 'Rust orange and charcoal — dirty garage rock and lo-fi punk.',
    background: '#100e0c',
    glowPrimary: 'rgba(234, 88, 12, 0.18)',
    glowSecondary: 'rgba(120, 113, 108, 0.14)',
    surface: 'rgba(255, 255, 255, 0.04)',
    surfaceBorder: 'rgba(234, 88, 12, 0.18)',
    headerBg: 'rgba(16, 14, 12, 0.92)',
    text: '#f5f0ea',
    textMuted: '#a39a90',
    accent: '#ea580c',
    accentSecondary: '#78716c',
    accentText: '#100e0c',
    accentSoftBg: 'rgba(234, 88, 12, 0.14)',
    accentSoftBorder: 'rgba(234, 88, 12, 0.35)',
    bookingGradientStart: 'rgba(234, 88, 12, 0.12)',
    bookingGradientEnd: 'rgba(120, 113, 108, 0.1)',
    logoGradientStart: '#ea580c',
    logoGradientEnd: '#57534e',
  },
];

export const DEFAULT_BAND_COLOR_PALETTE: BandColorPaletteId = 'bandie-gold';

const paletteById = new Map(BAND_COLOR_PALETTES.map((palette) => [palette.id, palette]));

export function isBandColorPalette(value: string | null | undefined): value is BandColorPaletteId {
  return Boolean(value && paletteById.has(value as BandColorPaletteId));
}

export function resolveBandColorPalette(value: string | null | undefined): BandColorPaletteId {
  return isBandColorPalette(value) ? value : DEFAULT_BAND_COLOR_PALETTE;
}

export function getBandColorPalette(value: string | null | undefined): BandColorPalette {
  return paletteById.get(resolveBandColorPalette(value)) ?? paletteById.get(DEFAULT_BAND_COLOR_PALETTE)!;
}

export function bandPaletteCssVariables(value: string | null | undefined): Record<string, string> {
  const palette = getBandColorPalette(value);

  return {
    '--band-bg': palette.background,
    '--band-glow-primary': palette.glowPrimary,
    '--band-glow-secondary': palette.glowSecondary,
    '--band-surface': palette.surface,
    '--band-surface-border': palette.surfaceBorder,
    '--band-header-bg': palette.headerBg,
    '--band-text': palette.text,
    '--band-text-muted': palette.textMuted,
    '--band-accent': palette.accent,
    '--band-accent-secondary': palette.accentSecondary,
    '--band-accent-text': palette.accentText,
    '--band-accent-soft-bg': palette.accentSoftBg,
    '--band-accent-soft-border': palette.accentSoftBorder,
    '--band-booking-start': palette.bookingGradientStart,
    '--band-booking-end': palette.bookingGradientEnd,
    '--band-logo-start': palette.logoGradientStart,
    '--band-logo-end': palette.logoGradientEnd,
  };
}
