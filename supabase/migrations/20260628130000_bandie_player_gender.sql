-- Optional gender on player profiles for directory search

alter table public.bandie_profiles
  add column if not exists gender text;

comment on column public.bandie_profiles.gender is
  'Optional self-reported gender for player directory filtering (female, male, non_binary, prefer_not_to_say).';

alter table public.bandie_profiles
  drop constraint if exists bandie_profiles_gender_check;

alter table public.bandie_profiles
  add constraint bandie_profiles_gender_check
  check (gender is null or gender in ('female', 'male', 'non_binary', 'prefer_not_to_say'));
