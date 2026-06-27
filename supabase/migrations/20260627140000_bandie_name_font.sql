-- Band name font choice for public profile display

alter table public.bandie_bands
  add column if not exists name_font text not null default 'inter';

alter table public.bandie_bands
  drop constraint if exists bandie_bands_name_font_check;

alter table public.bandie_bands
  add constraint bandie_bands_name_font_check
  check (
    name_font in (
      'inter',
      'bebas-neue',
      'playfair-display',
      'oswald',
      'space-grotesk',
      'permanent-marker',
      'anton',
      'rock-salt'
    )
  );
