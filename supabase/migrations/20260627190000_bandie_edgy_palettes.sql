-- Edgy / punk colour palettes

alter table public.bandie_bands
  drop constraint if exists bandie_bands_color_palette_check;

alter table public.bandie_bands
  add constraint bandie_bands_color_palette_check
  check (
    color_palette in (
      'bandie-gold',
      'stage-red',
      'midnight-blue',
      'forest-green',
      'purple-haze',
      'copper-warm',
      'ocean-teal',
      'neon-night',
      'punk-riot',
      'anarcho-black',
      'acid-clash',
      'garage-grit'
    )
  );
