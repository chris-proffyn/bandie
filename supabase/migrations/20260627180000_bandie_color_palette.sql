-- Band colour palette for public profiles and future poster templates

alter table public.bandie_bands
  add column if not exists color_palette text not null default 'bandie-gold';

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
      'neon-night'
    )
  );
