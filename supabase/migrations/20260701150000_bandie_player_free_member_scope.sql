-- Player Free: invite-only band membership scope — no directories, no band creation.
-- Band workspace read access (songs, setlists, calendar, members) is via band membership + leader plan.

create or replace function public.bandie_upsert_plan_entitlement(
  p_plan_code text,
  p_capability_key text,
  p_value jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan_id uuid;
begin
  select id into v_plan_id
  from public.bandie_plans
  where code = p_plan_code;

  if v_plan_id is null then
    raise exception 'Plan % not found', p_plan_code;
  end if;

  insert into public.bandie_plan_entitlements (plan_id, capability_key, value)
  values (v_plan_id, p_capability_key, p_value)
  on conflict (plan_id, capability_key) do update set
    value = excluded.value,
    updated_at = now();
end;
$$;

insert into public.bandie_capabilities (key, name, description, category, value_type, default_value)
values
  (
    'band_directory.browse',
    'Browse band directory',
    'Search and browse the band directory in the workspace',
    'profile',
    'boolean',
    'true'
  ),
  (
    'player_directory.browse',
    'Browse player directory',
    'Search and browse the player directory in the workspace',
    'profile',
    'boolean',
    'true'
  )
on conflict (key) do update set
  name = excluded.name,
  description = excluded.description,
  category = excluded.category,
  value_type = excluded.value_type,
  default_value = excluded.default_value;

update public.bandie_plans
set
  description = 'Join bands by invitation and collaborate inside your band — view members, songs, setlists, and calendar. Upgrade to Player Plus to create a band and browse directories.',
  updated_at = now()
where code = 'player_free';

-- Player Free — member-first; directories and band creation locked
select public.bandie_upsert_plan_entitlement('player_free', 'band.create', 'false');
select public.bandie_upsert_plan_entitlement('player_free', 'bands.max_count', '0');
select public.bandie_upsert_plan_entitlement('player_free', 'band_directory.browse', 'false');
select public.bandie_upsert_plan_entitlement('player_free', 'player_directory.browse', 'false');
select public.bandie_upsert_plan_entitlement('player_free', 'band_invite.respond', 'true');
select public.bandie_upsert_plan_entitlement('player_free', 'player_profile.create', 'true');
select public.bandie_upsert_plan_entitlement('player_free', 'player_profile.edit', 'true');
select public.bandie_upsert_plan_entitlement('player_free', 'song.create', 'false');
select public.bandie_upsert_plan_entitlement('player_free', 'songs.max_count', '0');
select public.bandie_upsert_plan_entitlement('player_free', 'setlist.create', 'false');
select public.bandie_upsert_plan_entitlement('player_free', 'setlists.max_count', '0');
select public.bandie_upsert_plan_entitlement('player_free', 'song_folder.create', 'false');
select public.bandie_upsert_plan_entitlement('player_free', 'song_file.upload', 'false');
select public.bandie_upsert_plan_entitlement('player_free', 'band_members.invite', 'false');
select public.bandie_upsert_plan_entitlement('player_free', 'band_members.max_count', '0');
select public.bandie_upsert_plan_entitlement('player_free', 'gig.create', 'false');
select public.bandie_upsert_plan_entitlement('player_free', 'gigs.active_max_count', '0');
select public.bandie_upsert_plan_entitlement('player_free', 'band_profile.publish', 'false');
select public.bandie_upsert_plan_entitlement('player_free', 'band_profile.custom_url', 'false');
select public.bandie_upsert_plan_entitlement('player_free', 'band_directory.list', 'false');
select public.bandie_upsert_plan_entitlement('player_free', 'booking_enquiry.receive', 'false');
select public.bandie_upsert_plan_entitlement('player_free', 'poster.generate', 'false');
select public.bandie_upsert_plan_entitlement('player_free', 'analytics.view', 'false');
select public.bandie_upsert_plan_entitlement('player_free', 'calendar.use', '"none"');

-- Player Plus / Pro — full player workspace discovery
select public.bandie_upsert_plan_entitlement('player_plus', 'band_directory.browse', 'true');
select public.bandie_upsert_plan_entitlement('player_plus', 'player_directory.browse', 'true');
select public.bandie_upsert_plan_entitlement('player_pro', 'band_directory.browse', 'true');
select public.bandie_upsert_plan_entitlement('player_pro', 'player_directory.browse', 'true');

drop function public.bandie_upsert_plan_entitlement(text, text, jsonb);
