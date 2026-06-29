-- Phase 8.3: Entitlement plan catalogue, capabilities, seeds, default subscriptions.
-- Product limits: docs/project/bandie_entitlements_admin_portal_functional_technical_spec.md §20.2

-- ---------------------------------------------------------------------------
-- Subscription scope — leader vs organiser plans on the same user
-- ---------------------------------------------------------------------------

alter table public.bandie_subscriptions
  add column if not exists plan_scope text not null default 'leader'
  check (plan_scope in ('leader', 'organiser'));

drop index if exists public.bandie_subscriptions_one_active_per_subject;

create unique index if not exists bandie_subscriptions_one_active_per_subject_scope
  on public.bandie_subscriptions (subject_type, subject_id, plan_scope)
  where status in ('active', 'trialing', 'past_due');

-- ---------------------------------------------------------------------------
-- Capabilities catalogue
-- ---------------------------------------------------------------------------

insert into public.bandie_capabilities (key, name, description, category, value_type, default_value)
values
  ('player_profile.create', 'Create player profile', 'Create a Bandie player profile', 'profile', 'boolean', 'true'),
  ('player_profile.edit', 'Edit player profile', 'Edit own player profile', 'profile', 'boolean', 'true'),
  ('band_invite.respond', 'Respond to band invites', 'Accept or decline band invitations', 'profile', 'boolean', 'true'),
  ('band.create', 'Create band', 'Create a new band workspace', 'bands', 'boolean', 'true'),
  ('bands.max_count', 'Bands owned', 'Maximum bands the user may create as primary leader', 'bands', 'integer', '1'),
  ('band_profile.publish', 'Publish band profile', 'Publish public band profile', 'profile', 'boolean', 'true'),
  ('band_profile.custom_url', 'Custom profile URL', 'Use a custom public profile URL', 'profile', 'boolean', 'false'),
  ('band_directory.list', 'Band directory listing', 'Appear in the band directory', 'profile', 'boolean', 'true'),
  ('band_members.invite', 'Invite band members', 'Invite members to the band', 'bands', 'boolean', 'true'),
  ('band_members.max_count', 'Band members', 'Maximum active members per band', 'bands', 'integer', '5'),
  ('song.create', 'Create songs', 'Add songs to the repertoire', 'songs', 'boolean', 'true'),
  ('songs.max_count', 'Songs per band', 'Maximum active songs per band', 'songs', 'integer', '6'),
  ('song_folder.create', 'Song part folders', 'Create and manage song part folders', 'songs', 'boolean', 'true'),
  ('song_file.upload', 'Upload song files', 'Upload song-part files', 'songs', 'boolean', 'true'),
  ('setlist.create', 'Create setlists', 'Create setlists', 'setlists', 'boolean', 'true'),
  ('setlists.max_count', 'Setlists per band', 'Maximum setlists per band', 'setlists', 'integer', '1'),
  ('calendar.use', 'Calendar access', 'Calendar tier: basic or full', 'calendar', 'text', '"basic"'),
  ('gig.create', 'Create gigs', 'Create gig records', 'gigs', 'boolean', 'true'),
  ('gigs.active_max_count', 'Active gigs', 'Maximum active gigs per band', 'gigs', 'integer', '1'),
  ('booking_enquiry.receive', 'Receive booking enquiries', 'Receive booking enquiries on public profile', 'booking', 'boolean', 'true'),
  ('poster.generate', 'Poster generator', 'Generate promotional posters', 'marketing', 'boolean', 'false'),
  ('analytics.view', 'Analytics', 'View band analytics', 'analytics', 'boolean', 'false'),
  ('organiser_profile.create', 'Organiser profile', 'Register as an organiser', 'organiser', 'boolean', 'true'),
  ('venue.create', 'Create venues', 'Add organiser venues', 'organiser', 'boolean', 'true'),
  ('venues.max_count', 'Venues', 'Maximum venues per organiser', 'organiser', 'integer', '1'),
  ('band_directory.search', 'Search band directory', 'Search the band directory as organiser', 'organiser', 'boolean', 'true'),
  ('booking_enquiry.send', 'Send booking enquiries', 'Send booking enquiries to bands', 'organiser', 'boolean', 'true'),
  ('booking_enquiries.monthly_max_count', 'Monthly booking enquiries', 'Outbound booking enquiries per calendar month', 'organiser', 'integer', '20'),
  ('event_brief.create', 'Create event briefs', 'Create event briefs', 'organiser', 'boolean', 'true'),
  ('event_briefs.active_max_count', 'Active event briefs', 'Maximum active event briefs', 'organiser', 'integer', '1'),
  ('open_mic.create', 'Open mic events', 'Create open mic / jam night events', 'organiser', 'integer', '0')
on conflict (key) do update set
  name = excluded.name,
  description = excluded.description,
  category = excluded.category,
  value_type = excluded.value_type,
  default_value = excluded.default_value;

-- ---------------------------------------------------------------------------
-- Plans
-- ---------------------------------------------------------------------------

insert into public.bandie_plans (
  code, name, description, subject_type, billing_interval, status, is_public, display_order
)
values
  (
    'player_free',
    'Player Free',
    'One band, up to six songs and one setlist. Full song folders via your Dropbox.',
    'user',
    'free',
    'active',
    true,
    10
  ),
  (
    'band_standard',
    'Bandie Level 1',
    'Lead up to three bands with expanded repertoire and calendar features.',
    'user',
    'monthly',
    'active',
    true,
    20
  ),
  (
    'band_pro',
    'Bandie Level 2',
    'Unlimited bands and fair-use repertoire for active gigging leaders.',
    'user',
    'monthly',
    'active',
    true,
    30
  ),
  (
    'organiser_free',
    'Organiser Free',
    'One venue and fair-use booking enquiries. One trial open mic event.',
    'user',
    'free',
    'active',
    true,
    40
  ),
  (
    'organiser_plus',
    'Organiser Plus',
    'Multiple venues, unlimited enquiries, and open mic tooling.',
    'user',
    'monthly',
    'active',
    true,
    50
  )
on conflict (code) do update set
  name = excluded.name,
  description = excluded.description,
  subject_type = excluded.subject_type,
  billing_interval = excluded.billing_interval,
  status = excluded.status,
  is_public = excluded.is_public,
  display_order = excluded.display_order,
  updated_at = now();

-- ---------------------------------------------------------------------------
-- Plan entitlements — helper via temp mapping
-- ---------------------------------------------------------------------------

create or replace function public.bandie_seed_plan_entitlement(
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
  select id into v_plan_id from public.bandie_plans where code = p_plan_code;
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

select public.bandie_seed_plan_entitlement('player_free', 'band.create', 'true');
select public.bandie_seed_plan_entitlement('player_free', 'bands.max_count', '1');
select public.bandie_seed_plan_entitlement('player_free', 'songs.max_count', '6');
select public.bandie_seed_plan_entitlement('player_free', 'setlists.max_count', '1');
select public.bandie_seed_plan_entitlement('player_free', 'song.create', 'true');
select public.bandie_seed_plan_entitlement('player_free', 'setlist.create', 'true');
select public.bandie_seed_plan_entitlement('player_free', 'song_folder.create', 'true');
select public.bandie_seed_plan_entitlement('player_free', 'song_file.upload', 'true');
select public.bandie_seed_plan_entitlement('player_free', 'band_members.max_count', '5');
select public.bandie_seed_plan_entitlement('player_free', 'band_members.invite', 'true');
select public.bandie_seed_plan_entitlement('player_free', 'gigs.active_max_count', '1');
select public.bandie_seed_plan_entitlement('player_free', 'calendar.use', '"basic"');
select public.bandie_seed_plan_entitlement('player_free', 'band_profile.publish', 'true');
select public.bandie_seed_plan_entitlement('player_free', 'band_directory.list', 'true');
select public.bandie_seed_plan_entitlement('player_free', 'booking_enquiry.receive', 'true');

select public.bandie_seed_plan_entitlement('band_standard', 'band.create', 'true');
select public.bandie_seed_plan_entitlement('band_standard', 'bands.max_count', '3');
select public.bandie_seed_plan_entitlement('band_standard', 'songs.max_count', '999');
select public.bandie_seed_plan_entitlement('band_standard', 'setlists.max_count', '50');
select public.bandie_seed_plan_entitlement('band_standard', 'song.create', 'true');
select public.bandie_seed_plan_entitlement('band_standard', 'setlist.create', 'true');
select public.bandie_seed_plan_entitlement('band_standard', 'song_folder.create', 'true');
select public.bandie_seed_plan_entitlement('band_standard', 'song_file.upload', 'true');
select public.bandie_seed_plan_entitlement('band_standard', 'band_members.max_count', '10');
select public.bandie_seed_plan_entitlement('band_standard', 'band_members.invite', 'true');
select public.bandie_seed_plan_entitlement('band_standard', 'gigs.active_max_count', '50');
select public.bandie_seed_plan_entitlement('band_standard', 'calendar.use', '"full"');
select public.bandie_seed_plan_entitlement('band_standard', 'band_profile.publish', 'true');
select public.bandie_seed_plan_entitlement('band_standard', 'band_directory.list', 'true');
select public.bandie_seed_plan_entitlement('band_standard', 'booking_enquiry.receive', 'true');
select public.bandie_seed_plan_entitlement('band_standard', 'poster.generate', 'true');

select public.bandie_seed_plan_entitlement('band_pro', 'band.create', 'true');
select public.bandie_seed_plan_entitlement('band_pro', 'bands.max_count', 'null');
select public.bandie_seed_plan_entitlement('band_pro', 'songs.max_count', '999');
select public.bandie_seed_plan_entitlement('band_pro', 'setlists.max_count', 'null');
select public.bandie_seed_plan_entitlement('band_pro', 'song.create', 'true');
select public.bandie_seed_plan_entitlement('band_pro', 'setlist.create', 'true');
select public.bandie_seed_plan_entitlement('band_pro', 'song_folder.create', 'true');
select public.bandie_seed_plan_entitlement('band_pro', 'song_file.upload', 'true');
select public.bandie_seed_plan_entitlement('band_pro', 'band_members.max_count', '20');
select public.bandie_seed_plan_entitlement('band_pro', 'band_members.invite', 'true');
select public.bandie_seed_plan_entitlement('band_pro', 'gigs.active_max_count', 'null');
select public.bandie_seed_plan_entitlement('band_pro', 'calendar.use', '"full"');
select public.bandie_seed_plan_entitlement('band_pro', 'band_profile.publish', 'true');
select public.bandie_seed_plan_entitlement('band_pro', 'band_profile.custom_url', 'true');
select public.bandie_seed_plan_entitlement('band_pro', 'band_directory.list', 'true');
select public.bandie_seed_plan_entitlement('band_pro', 'booking_enquiry.receive', 'true');
select public.bandie_seed_plan_entitlement('band_pro', 'poster.generate', 'true');
select public.bandie_seed_plan_entitlement('band_pro', 'analytics.view', 'true');

select public.bandie_seed_plan_entitlement('organiser_free', 'organiser_profile.create', 'true');
select public.bandie_seed_plan_entitlement('organiser_free', 'venue.create', 'true');
select public.bandie_seed_plan_entitlement('organiser_free', 'venues.max_count', '1');
select public.bandie_seed_plan_entitlement('organiser_free', 'band_directory.search', 'true');
select public.bandie_seed_plan_entitlement('organiser_free', 'booking_enquiry.send', 'true');
select public.bandie_seed_plan_entitlement('organiser_free', 'booking_enquiries.monthly_max_count', '20');
select public.bandie_seed_plan_entitlement('organiser_free', 'event_brief.create', 'true');
select public.bandie_seed_plan_entitlement('organiser_free', 'event_briefs.active_max_count', '1');
select public.bandie_seed_plan_entitlement('organiser_free', 'open_mic.create', '1');

select public.bandie_seed_plan_entitlement('organiser_plus', 'organiser_profile.create', 'true');
select public.bandie_seed_plan_entitlement('organiser_plus', 'venue.create', 'true');
select public.bandie_seed_plan_entitlement('organiser_plus', 'venues.max_count', '10');
select public.bandie_seed_plan_entitlement('organiser_plus', 'band_directory.search', 'true');
select public.bandie_seed_plan_entitlement('organiser_plus', 'booking_enquiry.send', 'true');
select public.bandie_seed_plan_entitlement('organiser_plus', 'booking_enquiries.monthly_max_count', 'null');
select public.bandie_seed_plan_entitlement('organiser_plus', 'event_brief.create', 'true');
select public.bandie_seed_plan_entitlement('organiser_plus', 'event_briefs.active_max_count', 'null');
select public.bandie_seed_plan_entitlement('organiser_plus', 'open_mic.create', 'null');
select public.bandie_seed_plan_entitlement('organiser_plus', 'poster.generate', 'true');

drop function public.bandie_seed_plan_entitlement(text, text, jsonb);

-- ---------------------------------------------------------------------------
-- Default subscriptions for existing and new users
-- ---------------------------------------------------------------------------

create or replace function public.bandie_assign_default_user_subscriptions(
  p_user_id uuid,
  p_is_organiser boolean default false
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_leader_plan_id uuid;
  v_organiser_plan_id uuid;
begin
  select id into v_leader_plan_id from public.bandie_plans where code = 'player_free' and status = 'active';
  if v_leader_plan_id is null then
    raise exception 'player_free plan is not configured';
  end if;

  if not exists (
    select 1
    from public.bandie_subscriptions s
    where s.subject_type = 'user'
      and s.subject_id = p_user_id
      and s.plan_scope = 'leader'
      and s.status in ('active', 'trialing', 'past_due')
  ) then
    insert into public.bandie_subscriptions (
      subject_type,
      subject_id,
      plan_id,
      status,
      source,
      plan_scope
    )
    values (
      'user',
      p_user_id,
      v_leader_plan_id,
      'active',
      'system',
      'leader'
    );
  end if;

  if p_is_organiser then
    select id into v_organiser_plan_id from public.bandie_plans where code = 'organiser_free' and status = 'active';
    if v_organiser_plan_id is null then
      raise exception 'organiser_free plan is not configured';
    end if;

    if not exists (
      select 1
      from public.bandie_subscriptions s
      where s.subject_type = 'user'
        and s.subject_id = p_user_id
        and s.plan_scope = 'organiser'
        and s.status in ('active', 'trialing', 'past_due')
    ) then
      insert into public.bandie_subscriptions (
        subject_type,
        subject_id,
        plan_id,
        status,
        source,
        plan_scope
      )
      values (
        'user',
        p_user_id,
        v_organiser_plan_id,
        'active',
        'system',
        'organiser'
      );
    end if;
  end if;
end;
$$;

grant execute on function public.bandie_assign_default_user_subscriptions(uuid, boolean) to authenticated;

-- Backfill leader subscriptions for existing profiles
insert into public.bandie_subscriptions (subject_type, subject_id, plan_id, status, source, plan_scope)
select
  'user',
  p.user_id,
  pl.id,
  'active',
  'migration',
  'leader'
from public.bandie_profiles p
join public.bandie_plans pl on pl.code = 'player_free'
where not exists (
  select 1
  from public.bandie_subscriptions s
  where s.subject_type = 'user'
    and s.subject_id = p.user_id
    and s.plan_scope = 'leader'
    and s.status in ('active', 'trialing', 'past_due')
);

-- Backfill organiser subscriptions
insert into public.bandie_subscriptions (subject_type, subject_id, plan_id, status, source, plan_scope)
select
  'user',
  p.user_id,
  pl.id,
  'active',
  'migration',
  'organiser'
from public.bandie_profiles p
join public.bandie_plans pl on pl.code = 'organiser_free'
where coalesce(p.is_organiser, false) = true
  and not exists (
    select 1
    from public.bandie_subscriptions s
    where s.subject_type = 'user'
      and s.subject_id = p.user_id
      and s.plan_scope = 'organiser'
      and s.status in ('active', 'trialing', 'past_due')
  );

create or replace function public.bandie_profiles_assign_default_subscriptions()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.bandie_assign_default_user_subscriptions(
    new.user_id,
    coalesce(new.is_organiser, false)
  );
  return new;
end;
$$;

drop trigger if exists bandie_profiles_assign_default_subscriptions on public.bandie_profiles;
create trigger bandie_profiles_assign_default_subscriptions
after insert on public.bandie_profiles
for each row execute function public.bandie_profiles_assign_default_subscriptions();
