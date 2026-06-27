-- Gear fields on musician / player profiles

alter table public.bandie_profiles
  add column if not exists gear_items text[] not null default '{}',
  add column if not exists gear_notes text;
