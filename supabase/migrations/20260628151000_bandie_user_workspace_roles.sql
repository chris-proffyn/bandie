-- User workspace roles: player, organiser, or both.

alter table public.bandie_profiles
  add column if not exists is_player boolean not null default true,
  add column if not exists is_organiser boolean not null default false;

alter table public.bandie_profiles
  drop constraint if exists bandie_profiles_workspace_role_required;

alter table public.bandie_profiles
  add constraint bandie_profiles_workspace_role_required
  check (is_player or is_organiser);

comment on column public.bandie_profiles.is_player is
  'User uses Bandie as a musician: bands, player profile, player directory.';

comment on column public.bandie_profiles.is_organiser is
  'User uses Bandie as an event organiser: band directory and booking discovery.';
