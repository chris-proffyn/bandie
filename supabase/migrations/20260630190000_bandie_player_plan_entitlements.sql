-- Player plan entitlement model (June 2026 product update):
-- Player Free: profile + join bands by invite; view-only on band repertoire (no creates).
-- Player Plus: one band, up to 20 songs and 3 setlists.
-- Player Pro: unlimited bands; up to 999 songs and setlists per band.

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

-- Plan descriptions (public catalogue copy)
update public.bandie_plans
set
  description = 'Create your player profile and join bands by invitation. View songs and setlists created by band leaders — upgrade to lead a band and manage repertoire.',
  updated_at = now()
where code = 'player_free';

update public.bandie_plans
set
  description = 'Create one band with up to 20 songs and 3 setlists. Full song folders, calendar, and band management.',
  updated_at = now()
where code = 'player_plus';

update public.bandie_plans
set
  description = 'Unlimited bands with up to 999 songs and setlists per band for active gigging leaders.',
  updated_at = now()
where code = 'player_pro';

-- Player Free — read-only band member; no workspace creation
select public.bandie_upsert_plan_entitlement('player_free', 'band.create', 'false');
select public.bandie_upsert_plan_entitlement('player_free', 'bands.max_count', '0');
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

-- Player Plus — create one band; 20 songs; 3 setlists
select public.bandie_upsert_plan_entitlement('player_plus', 'band.create', 'true');
select public.bandie_upsert_plan_entitlement('player_plus', 'bands.max_count', '1');
select public.bandie_upsert_plan_entitlement('player_plus', 'song.create', 'true');
select public.bandie_upsert_plan_entitlement('player_plus', 'songs.max_count', '20');
select public.bandie_upsert_plan_entitlement('player_plus', 'setlist.create', 'true');
select public.bandie_upsert_plan_entitlement('player_plus', 'setlists.max_count', '3');
select public.bandie_upsert_plan_entitlement('player_plus', 'song_folder.create', 'true');
select public.bandie_upsert_plan_entitlement('player_plus', 'song_file.upload', 'true');
select public.bandie_upsert_plan_entitlement('player_plus', 'band_members.invite', 'true');
select public.bandie_upsert_plan_entitlement('player_plus', 'band_members.max_count', '10');
select public.bandie_upsert_plan_entitlement('player_plus', 'gig.create', 'true');
select public.bandie_upsert_plan_entitlement('player_plus', 'gigs.active_max_count', '50');
select public.bandie_upsert_plan_entitlement('player_plus', 'band_profile.publish', 'true');
select public.bandie_upsert_plan_entitlement('player_plus', 'band_directory.list', 'true');
select public.bandie_upsert_plan_entitlement('player_plus', 'booking_enquiry.receive', 'true');
select public.bandie_upsert_plan_entitlement('player_plus', 'poster.generate', 'true');
select public.bandie_upsert_plan_entitlement('player_plus', 'calendar.use', '"full"');

-- Player Pro — unlimited bands; 999 songs and setlists per band
select public.bandie_upsert_plan_entitlement('player_pro', 'band.create', 'true');
select public.bandie_upsert_plan_entitlement('player_pro', 'bands.max_count', 'null');
select public.bandie_upsert_plan_entitlement('player_pro', 'song.create', 'true');
select public.bandie_upsert_plan_entitlement('player_pro', 'songs.max_count', '999');
select public.bandie_upsert_plan_entitlement('player_pro', 'setlist.create', 'true');
select public.bandie_upsert_plan_entitlement('player_pro', 'setlists.max_count', '999');
select public.bandie_upsert_plan_entitlement('player_pro', 'song_folder.create', 'true');
select public.bandie_upsert_plan_entitlement('player_pro', 'song_file.upload', 'true');
select public.bandie_upsert_plan_entitlement('player_pro', 'band_members.invite', 'true');
select public.bandie_upsert_plan_entitlement('player_pro', 'band_members.max_count', '20');
select public.bandie_upsert_plan_entitlement('player_pro', 'gig.create', 'true');
select public.bandie_upsert_plan_entitlement('player_pro', 'gigs.active_max_count', 'null');
select public.bandie_upsert_plan_entitlement('player_pro', 'band_profile.publish', 'true');
select public.bandie_upsert_plan_entitlement('player_pro', 'band_profile.custom_url', 'true');
select public.bandie_upsert_plan_entitlement('player_pro', 'band_directory.list', 'true');
select public.bandie_upsert_plan_entitlement('player_pro', 'booking_enquiry.receive', 'true');
select public.bandie_upsert_plan_entitlement('player_pro', 'poster.generate', 'true');
select public.bandie_upsert_plan_entitlement('player_pro', 'analytics.view', 'true');
select public.bandie_upsert_plan_entitlement('player_pro', 'calendar.use', '"full"');

drop function public.bandie_upsert_plan_entitlement(text, text, jsonb);
