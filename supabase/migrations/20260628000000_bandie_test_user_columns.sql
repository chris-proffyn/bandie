-- Flag fictitious bands and player profiles for test/live data mode

alter table public.bandie_bands
  add column if not exists test_user boolean not null default false;

alter table public.bandie_profiles
  add column if not exists test_user boolean not null default false;

comment on column public.bandie_bands.test_user is
  'True for seeded fictitious bands used in test data mode.';
comment on column public.bandie_profiles.test_user is
  'True for seeded fictitious player profiles used in test data mode.';

create index if not exists bandie_bands_test_user_idx
  on public.bandie_bands (test_user)
  where test_user = true;

create index if not exists bandie_profiles_test_user_idx
  on public.bandie_profiles (test_user)
  where test_user = true;
