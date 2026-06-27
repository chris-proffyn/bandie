-- Player invitation preferences for future player directory discovery

alter table public.bandie_profiles
  add column if not exists open_to_deputy_invites boolean not null default false,
  add column if not exists open_to_member_invites boolean not null default false;
