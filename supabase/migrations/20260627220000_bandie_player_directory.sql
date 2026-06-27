-- Player directory: deputy fee / travel fields and public read for published profiles

alter table public.bandie_profiles
  add column if not exists travel_distance_miles integer,
  add column if not exists deputy_fee_guidance_min integer,
  add column if not exists deputy_fee_guidance_max integer;

comment on column public.bandie_profiles.travel_distance_miles is
  'How far the player is willing to travel for deputy / stand-in gigs (miles).';
comment on column public.bandie_profiles.deputy_fee_guidance_min is
  'Typical minimum fee guidance for deputy / stand-in gigs (£).';
comment on column public.bandie_profiles.deputy_fee_guidance_max is
  'Typical maximum fee guidance for deputy / stand-in gigs (£).';

-- Public read for players listed in the directory
drop policy if exists "Anyone can view published player profiles" on public.bandie_profiles;
create policy "Anyone can view published player profiles"
on public.bandie_profiles
for select
to anon, authenticated
using (
  public_player_profile_enabled = true
  and (open_to_deputy_invites = true or open_to_member_invites = true)
);
