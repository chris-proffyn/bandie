-- Open mic / jam night events — foundation (Release 1)
-- User-scoped organiser model (organiser_user_id), globally unique slug, public /events/:slug

-- ---------------------------------------------------------------------------
-- Add-on tables (Release 1 schema; billing integration deferred)
-- ---------------------------------------------------------------------------

create table if not exists public.bandie_addons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  billing_interval text not null default 'monthly'
    check (billing_interval in ('monthly', 'one_off')),
  status text not null default 'active'
    check (status in ('active', 'retired')),
  stripe_price_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bandie_addon_entitlements (
  id uuid primary key default gen_random_uuid(),
  addon_id uuid not null references public.bandie_addons (id) on delete cascade,
  capability_key text not null references public.bandie_capabilities (key) on delete cascade,
  operation text not null default 'set'
    check (operation in ('set', 'increment', 'decrement')),
  value jsonb not null default 'true'::jsonb,
  created_at timestamptz not null default now(),
  unique (addon_id, capability_key)
);

create table if not exists public.bandie_subject_addons (
  id uuid primary key default gen_random_uuid(),
  subject_type text not null
    check (subject_type in ('user', 'band', 'organiser', 'event')),
  subject_id uuid not null,
  addon_id uuid not null references public.bandie_addons (id) on delete cascade,
  status text not null default 'active'
    check (status in ('active', 'cancelled', 'expired')),
  quantity integer not null default 1 check (quantity > 0),
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  stripe_subscription_item_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists bandie_subject_addons_subject_idx
  on public.bandie_subject_addons (subject_type, subject_id, status);

-- ---------------------------------------------------------------------------
-- Delegated organiser team members
-- ---------------------------------------------------------------------------

create table if not exists public.bandie_organiser_members (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null
    check (role in ('owner', 'admin', 'host', 'house_band_member')),
  status text not null default 'active'
    check (status in ('invited', 'active', 'removed')),
  is_house_band boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bandie_organiser_members_unique_user unique (owner_user_id, user_id)
);

create index if not exists bandie_organiser_members_owner_idx
  on public.bandie_organiser_members (owner_user_id, status);

create index if not exists bandie_organiser_members_user_idx
  on public.bandie_organiser_members (user_id, status);

-- ---------------------------------------------------------------------------
-- Open mic events
-- ---------------------------------------------------------------------------

create table if not exists public.bandie_open_mic_events (
  id uuid primary key default gen_random_uuid(),
  organiser_user_id uuid not null references auth.users (id) on delete cascade,
  venue_id uuid references public.bandie_organiser_venues (id) on delete set null,
  title text not null,
  slug text not null,
  event_type text not null default 'open_mic'
    check (event_type in ('open_mic', 'jam_night', 'songbook_jam', 'house_band_guest_night')),
  status text not null default 'draft'
    check (status in (
      'draft', 'published', 'signup_open', 'signup_closed',
      'in_progress', 'completed', 'cancelled', 'archived'
    )),
  visibility text not null default 'unlisted'
    check (visibility in ('public', 'unlisted', 'private')),
  venue_name text,
  venue_address text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  timezone text not null default 'Europe/London',
  description text,
  host_name text,
  house_band_name text,
  entry_price text,
  age_restrictions text,
  equipment_notes text,
  backline_notes text,
  signup_mode text not null default 'open'
    check (signup_mode in ('open', 'moderated', 'invite_only', 'organiser_only')),
  signup_opens_at timestamptz,
  signup_closes_at timestamptz,
  max_songs_per_player integer check (max_songs_per_player is null or max_songs_per_player > 0),
  max_slots_per_player integer check (max_slots_per_player is null or max_slots_per_player > 0),
  required_contact_field text not null default 'email_or_phone'
    check (required_contact_field in ('email', 'phone', 'email_or_phone')),
  public_song_list_enabled boolean not null default false,
  running_order_locked boolean not null default false,
  poster_template_id text,
  event_image_url text,
  created_by uuid not null references auth.users (id),
  updated_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bandie_open_mic_events_title_not_blank check (char_length(trim(title)) > 0),
  constraint bandie_open_mic_events_slug_not_blank check (char_length(trim(slug)) > 0),
  constraint bandie_open_mic_events_slug_unique unique (slug)
);

create index if not exists bandie_open_mic_events_organiser_status_idx
  on public.bandie_open_mic_events (organiser_user_id, status);

create index if not exists bandie_open_mic_events_starts_at_idx
  on public.bandie_open_mic_events (starts_at desc);

-- ---------------------------------------------------------------------------
-- Activity log
-- ---------------------------------------------------------------------------

create table if not exists public.bandie_open_mic_activity_log (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.bandie_open_mic_events (id) on delete cascade,
  actor_user_id uuid references auth.users (id) on delete set null,
  actor_label text,
  action_type text not null,
  entity_type text not null,
  entity_id uuid,
  before_state jsonb,
  after_state jsonb,
  created_at timestamptz not null default now()
);

create index if not exists bandie_open_mic_activity_log_event_idx
  on public.bandie_open_mic_activity_log (event_id, created_at desc);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------

drop trigger if exists bandie_addons_set_updated_at on public.bandie_addons;
create trigger bandie_addons_set_updated_at
before update on public.bandie_addons
for each row execute function public.set_updated_at();

drop trigger if exists bandie_subject_addons_set_updated_at on public.bandie_subject_addons;
create trigger bandie_subject_addons_set_updated_at
before update on public.bandie_subject_addons
for each row execute function public.set_updated_at();

drop trigger if exists bandie_organiser_members_set_updated_at on public.bandie_organiser_members;
create trigger bandie_organiser_members_set_updated_at
before update on public.bandie_organiser_members
for each row execute function public.set_updated_at();

drop trigger if exists bandie_open_mic_events_set_updated_at on public.bandie_open_mic_events;
create trigger bandie_open_mic_events_set_updated_at
before update on public.bandie_open_mic_events
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Entitlements: Organiser Plus only for open_mic.create
-- ---------------------------------------------------------------------------

update public.bandie_capabilities
set value_type = 'boolean', default_value = 'false'::jsonb
where key = 'open_mic.create';

insert into public.bandie_plan_entitlements (plan_id, capability_key, value)
select p.id, 'open_mic.create', 'false'::jsonb
from public.bandie_plans p
where p.code = 'organiser_free'
on conflict (plan_id, capability_key) do update set
  value = excluded.value,
  updated_at = now();

insert into public.bandie_plan_entitlements (plan_id, capability_key, value)
select p.id, 'open_mic.create', 'true'::jsonb
from public.bandie_plans p
where p.code = 'organiser_plus'
on conflict (plan_id, capability_key) do update set
  value = excluded.value,
  updated_at = now();

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.bandie_open_mic_slugify(p_text text)
returns text
language sql
immutable
as $$
  select left(
    trim(both '-' from regexp_replace(lower(trim(coalesce(p_text, ''))), '[^a-z0-9]+', '-', 'g')),
    60
  );
$$;

create or replace function public.bandie_open_mic_unique_slug(p_base text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_slug text;
  v_candidate text;
  v_suffix integer := 0;
begin
  v_slug := public.bandie_open_mic_slugify(p_base);
  if v_slug = '' then
    v_slug := 'event';
  end if;
  v_candidate := v_slug;
  while exists (select 1 from public.bandie_open_mic_events e where e.slug = v_candidate) loop
    v_suffix := v_suffix + 1;
    v_candidate := v_slug || '-' || v_suffix::text;
  end loop;
  return v_candidate;
end;
$$;

grant execute on function public.bandie_open_mic_slugify(text) to authenticated;
grant execute on function public.bandie_open_mic_unique_slug(text) to authenticated;

create or replace function public.bandie_current_user_can_manage_open_mic()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.bandie_current_user_is_organiser()
    or public.bandie_current_user_is_app_admin();
$$;

grant execute on function public.bandie_current_user_can_manage_open_mic() to authenticated;

create or replace function public.bandie_current_user_can_manage_open_mic_event(p_event_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.bandie_open_mic_events e
    where e.id = p_event_id
      and (
        e.organiser_user_id = auth.uid()
        or exists (
          select 1
          from public.bandie_organiser_members m
          where m.owner_user_id = e.organiser_user_id
            and m.user_id = auth.uid()
            and m.status = 'active'
            and m.role in ('owner', 'admin', 'host')
        )
        or public.bandie_current_user_is_app_admin()
      )
  );
$$;

grant execute on function public.bandie_current_user_can_manage_open_mic_event(uuid) to authenticated;

create or replace function public.bandie_open_mic_log_activity(
  p_event_id uuid,
  p_action_type text,
  p_entity_type text,
  p_entity_id uuid default null,
  p_before_state jsonb default null,
  p_after_state jsonb default null,
  p_actor_label text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.bandie_open_mic_activity_log (
    event_id, actor_user_id, actor_label, action_type, entity_type, entity_id, before_state, after_state
  ) values (
    p_event_id, auth.uid(), p_actor_label, p_action_type, p_entity_type, p_entity_id, p_before_state, p_after_state
  );
end;
$$;

grant execute on function public.bandie_open_mic_log_activity(uuid, text, text, uuid, jsonb, jsonb, text) to authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.bandie_addons enable row level security;
alter table public.bandie_addon_entitlements enable row level security;
alter table public.bandie_subject_addons enable row level security;
alter table public.bandie_organiser_members enable row level security;
alter table public.bandie_open_mic_events enable row level security;
alter table public.bandie_open_mic_activity_log enable row level security;

-- Addons: app admins only for now
drop policy if exists "App admins manage addons" on public.bandie_addons;
create policy "App admins manage addons"
on public.bandie_addons for all to authenticated
using (public.bandie_current_user_is_app_admin())
with check (public.bandie_current_user_is_app_admin());

drop policy if exists "App admins manage addon entitlements" on public.bandie_addon_entitlements;
create policy "App admins manage addon entitlements"
on public.bandie_addon_entitlements for all to authenticated
using (public.bandie_current_user_is_app_admin())
with check (public.bandie_current_user_is_app_admin());

drop policy if exists "Subjects view own addons" on public.bandie_subject_addons;
create policy "Subjects view own addons"
on public.bandie_subject_addons for select to authenticated
using (
  subject_type = 'user' and subject_id = auth.uid()
  or public.bandie_current_user_is_app_admin()
);

drop policy if exists "App admins manage subject addons" on public.bandie_subject_addons;
create policy "App admins manage subject addons"
on public.bandie_subject_addons for all to authenticated
using (public.bandie_current_user_is_app_admin())
with check (public.bandie_current_user_is_app_admin());

-- Organiser members
drop policy if exists "Team members view organiser team" on public.bandie_organiser_members;
create policy "Team members view organiser team"
on public.bandie_organiser_members for select to authenticated
using (
  public.platform_current_user_has_app_access('bandie')
  and (
    owner_user_id = auth.uid()
    or user_id = auth.uid()
    or public.bandie_current_user_is_app_admin()
  )
);

drop policy if exists "Owners manage organiser team" on public.bandie_organiser_members;
create policy "Owners manage organiser team"
on public.bandie_organiser_members for all to authenticated
using (
  public.platform_current_user_has_app_access('bandie')
  and (owner_user_id = auth.uid() or public.bandie_current_user_is_app_admin())
)
with check (
  public.platform_current_user_has_app_access('bandie')
  and (owner_user_id = auth.uid() or public.bandie_current_user_is_app_admin())
);

-- Open mic events
drop policy if exists "Organiser team can view open mic events" on public.bandie_open_mic_events;
create policy "Organiser team can view open mic events"
on public.bandie_open_mic_events for select to authenticated
using (
  public.platform_current_user_has_app_access('bandie')
  and public.bandie_current_user_can_manage_open_mic_event(id)
);

drop policy if exists "Organisers can insert open mic events" on public.bandie_open_mic_events;
create policy "Organisers can insert open mic events"
on public.bandie_open_mic_events for insert to authenticated
with check (
  public.platform_current_user_has_app_access('bandie')
  and organiser_user_id = auth.uid()
  and created_by = auth.uid()
  and (
    venue_id is null
    or exists (
      select 1 from public.bandie_organiser_venues v
      where v.id = venue_id and v.owner_user_id = auth.uid()
    )
  )
);

drop policy if exists "Organiser team can update open mic events" on public.bandie_open_mic_events;
create policy "Organiser team can update open mic events"
on public.bandie_open_mic_events for update to authenticated
using (
  public.platform_current_user_has_app_access('bandie')
  and public.bandie_current_user_can_manage_open_mic_event(id)
)
with check (
  public.platform_current_user_has_app_access('bandie')
  and public.bandie_current_user_can_manage_open_mic_event(id)
);

drop policy if exists "Owners can delete draft open mic events" on public.bandie_open_mic_events;
create policy "Owners can delete draft open mic events"
on public.bandie_open_mic_events for delete to authenticated
using (
  public.platform_current_user_has_app_access('bandie')
  and organiser_user_id = auth.uid()
  and status = 'draft'
);

drop policy if exists "App admins manage all open mic events" on public.bandie_open_mic_events;
create policy "App admins manage all open mic events"
on public.bandie_open_mic_events for all to authenticated
using (public.bandie_current_user_is_app_admin())
with check (public.bandie_current_user_is_app_admin());

-- Activity log
drop policy if exists "Organiser team can view activity log" on public.bandie_open_mic_activity_log;
create policy "Organiser team can view activity log"
on public.bandie_open_mic_activity_log for select to authenticated
using (
  public.platform_current_user_has_app_access('bandie')
  and public.bandie_current_user_can_manage_open_mic_event(event_id)
);

-- ---------------------------------------------------------------------------
-- RPCs — Release 1
-- ---------------------------------------------------------------------------

create or replace function public.bandie_create_open_mic_event(
  p_title text,
  p_starts_at timestamptz,
  p_ends_at timestamptz default null,
  p_event_type text default 'open_mic',
  p_venue_id uuid default null,
  p_venue_name text default null,
  p_venue_address text default null,
  p_description text default null,
  p_timezone text default 'Europe/London',
  p_signup_mode text default 'open',
  p_required_contact_field text default 'email_or_phone'
)
returns public.bandie_open_mic_events
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.bandie_open_mic_events;
  v_slug text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if char_length(trim(coalesce(p_title, ''))) = 0 then
    raise exception 'Title is required';
  end if;

  if p_starts_at is null then
    raise exception 'Start time is required';
  end if;

  v_slug := public.bandie_open_mic_unique_slug(p_title);

  insert into public.bandie_open_mic_events (
    organiser_user_id, title, slug, event_type, status, visibility,
    venue_id, venue_name, venue_address, starts_at, ends_at, timezone,
    description, signup_mode, required_contact_field, created_by
  ) values (
    auth.uid(), trim(p_title), v_slug, coalesce(p_event_type, 'open_mic'), 'draft', 'unlisted',
    p_venue_id, nullif(trim(coalesce(p_venue_name, '')), ''), nullif(trim(coalesce(p_venue_address, '')), ''),
    p_starts_at, p_ends_at, coalesce(nullif(trim(p_timezone), ''), 'Europe/London'),
    nullif(trim(coalesce(p_description, '')), ''), coalesce(p_signup_mode, 'open'),
    coalesce(p_required_contact_field, 'email_or_phone'), auth.uid()
  )
  returning * into v_row;

  insert into public.bandie_organiser_members (owner_user_id, user_id, role, status)
  values (auth.uid(), auth.uid(), 'owner', 'active')
  on conflict (owner_user_id, user_id) do nothing;

  perform public.bandie_open_mic_log_activity(
    v_row.id, 'create', 'event', v_row.id, null, to_jsonb(v_row)
  );

  return v_row;
end;
$$;

grant execute on function public.bandie_create_open_mic_event(text, timestamptz, timestamptz, text, uuid, text, text, text, text, text, text) to authenticated;

create or replace function public.bandie_update_open_mic_event(
  p_event_id uuid,
  p_patch jsonb
)
returns public.bandie_open_mic_events
language plpgsql
security definer
set search_path = public
as $$
declare
  v_before public.bandie_open_mic_events;
  v_after public.bandie_open_mic_events;
begin
  if not public.bandie_current_user_can_manage_open_mic_event(p_event_id) then
    raise exception 'Not authorised to update this event';
  end if;

  select * into v_before from public.bandie_open_mic_events where id = p_event_id;
  if not found then
    raise exception 'Event not found';
  end if;

  if v_before.status in ('completed', 'cancelled', 'archived') then
    raise exception 'Cannot update a terminal event';
  end if;

  update public.bandie_open_mic_events e
  set
    title = coalesce(nullif(trim(p_patch->>'title'), ''), e.title),
    event_type = coalesce(p_patch->>'event_type', e.event_type),
    venue_id = case when p_patch ? 'venue_id' then (p_patch->>'venue_id')::uuid else e.venue_id end,
    venue_name = case when p_patch ? 'venue_name' then nullif(trim(p_patch->>'venue_name'), '') else e.venue_name end,
    venue_address = case when p_patch ? 'venue_address' then nullif(trim(p_patch->>'venue_address'), '') else e.venue_address end,
    starts_at = coalesce((p_patch->>'starts_at')::timestamptz, e.starts_at),
    ends_at = case when p_patch ? 'ends_at' then (p_patch->>'ends_at')::timestamptz else e.ends_at end,
    timezone = coalesce(nullif(trim(p_patch->>'timezone'), ''), e.timezone),
    description = case when p_patch ? 'description' then nullif(trim(p_patch->>'description'), '') else e.description end,
    host_name = case when p_patch ? 'host_name' then nullif(trim(p_patch->>'host_name'), '') else e.host_name end,
    house_band_name = case when p_patch ? 'house_band_name' then nullif(trim(p_patch->>'house_band_name'), '') else e.house_band_name end,
    entry_price = case when p_patch ? 'entry_price' then nullif(trim(p_patch->>'entry_price'), '') else e.entry_price end,
    age_restrictions = case when p_patch ? 'age_restrictions' then nullif(trim(p_patch->>'age_restrictions'), '') else e.age_restrictions end,
    equipment_notes = case when p_patch ? 'equipment_notes' then nullif(trim(p_patch->>'equipment_notes'), '') else e.equipment_notes end,
    backline_notes = case when p_patch ? 'backline_notes' then nullif(trim(p_patch->>'backline_notes'), '') else e.backline_notes end,
    signup_mode = coalesce(p_patch->>'signup_mode', e.signup_mode),
    signup_opens_at = case when p_patch ? 'signup_opens_at' then (p_patch->>'signup_opens_at')::timestamptz else e.signup_opens_at end,
    signup_closes_at = case when p_patch ? 'signup_closes_at' then (p_patch->>'signup_closes_at')::timestamptz else e.signup_closes_at end,
    max_songs_per_player = case when p_patch ? 'max_songs_per_player' then (p_patch->>'max_songs_per_player')::integer else e.max_songs_per_player end,
    max_slots_per_player = case when p_patch ? 'max_slots_per_player' then (p_patch->>'max_slots_per_player')::integer else e.max_slots_per_player end,
    required_contact_field = coalesce(p_patch->>'required_contact_field', e.required_contact_field),
    public_song_list_enabled = case when p_patch ? 'public_song_list_enabled' then (p_patch->>'public_song_list_enabled')::boolean else e.public_song_list_enabled end,
    poster_template_id = case when p_patch ? 'poster_template_id' then nullif(trim(p_patch->>'poster_template_id'), '') else e.poster_template_id end,
    event_image_url = case when p_patch ? 'event_image_url' then nullif(trim(p_patch->>'event_image_url'), '') else e.event_image_url end,
    visibility = coalesce(p_patch->>'visibility', e.visibility),
    updated_by = auth.uid()
  where e.id = p_event_id
  returning * into v_after;

  perform public.bandie_open_mic_log_activity(
    p_event_id, 'update', 'event', p_event_id, to_jsonb(v_before), to_jsonb(v_after)
  );

  return v_after;
end;
$$;

grant execute on function public.bandie_update_open_mic_event(uuid, jsonb) to authenticated;

create or replace function public.bandie_publish_open_mic_event(p_event_id uuid)
returns public.bandie_open_mic_events
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.bandie_open_mic_events;
  v_venue_ok boolean;
begin
  if not public.bandie_current_user_can_manage_open_mic_event(p_event_id) then
    raise exception 'Not authorised';
  end if;

  select * into v_row from public.bandie_open_mic_events where id = p_event_id;
  if not found then
    raise exception 'Event not found';
  end if;

  v_venue_ok := v_row.venue_id is not null
    or char_length(trim(coalesce(v_row.venue_name, ''))) > 0;

  if char_length(trim(v_row.title)) = 0 or v_row.starts_at is null or not v_venue_ok then
    raise exception 'Title, start time, and venue are required before publishing';
  end if;

  update public.bandie_open_mic_events
  set status = case
    when signup_opens_at is not null and signup_opens_at > now() then 'published'
    else 'signup_open'
  end,
  updated_by = auth.uid()
  where id = p_event_id
  returning * into v_row;

  perform public.bandie_open_mic_log_activity(
    p_event_id, 'publish', 'event', p_event_id, null, to_jsonb(v_row)
  );

  return v_row;
end;
$$;

grant execute on function public.bandie_publish_open_mic_event(uuid) to authenticated;

create or replace function public.bandie_cancel_open_mic_event(p_event_id uuid)
returns public.bandie_open_mic_events
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.bandie_open_mic_events;
begin
  if not public.bandie_current_user_can_manage_open_mic_event(p_event_id) then
    raise exception 'Not authorised';
  end if;

  update public.bandie_open_mic_events
  set status = 'cancelled', updated_by = auth.uid()
  where id = p_event_id
  returning * into v_row;

  if not found then
    raise exception 'Event not found';
  end if;

  perform public.bandie_open_mic_log_activity(
    p_event_id, 'cancel', 'event', p_event_id, null, to_jsonb(v_row)
  );

  return v_row;
end;
$$;

grant execute on function public.bandie_cancel_open_mic_event(uuid) to authenticated;

create or replace function public.bandie_duplicate_open_mic_event(p_event_id uuid)
returns public.bandie_open_mic_events
language plpgsql
security definer
set search_path = public
as $$
declare
  v_src public.bandie_open_mic_events;
  v_new public.bandie_open_mic_events;
  v_slug text;
begin
  if not public.bandie_current_user_can_manage_open_mic_event(p_event_id) then
    raise exception 'Not authorised';
  end if;

  select * into v_src from public.bandie_open_mic_events where id = p_event_id;
  if not found then
    raise exception 'Event not found';
  end if;

  v_slug := public.bandie_open_mic_unique_slug(v_src.title || '-copy');

  insert into public.bandie_open_mic_events (
    organiser_user_id, title, slug, event_type, status, visibility,
    venue_id, venue_name, venue_address, starts_at, ends_at, timezone,
    description, host_name, house_band_name, entry_price, age_restrictions,
    equipment_notes, backline_notes, signup_mode, signup_opens_at, signup_closes_at,
    max_songs_per_player, max_slots_per_player, required_contact_field,
    public_song_list_enabled, poster_template_id, event_image_url, created_by
  ) values (
    v_src.organiser_user_id, v_src.title || ' (copy)', v_slug, v_src.event_type, 'draft', v_src.visibility,
    v_src.venue_id, v_src.venue_name, v_src.venue_address, v_src.starts_at, v_src.ends_at, v_src.timezone,
    v_src.description, v_src.host_name, v_src.house_band_name, v_src.entry_price, v_src.age_restrictions,
    v_src.equipment_notes, v_src.backline_notes, v_src.signup_mode, v_src.signup_opens_at, v_src.signup_closes_at,
    v_src.max_songs_per_player, v_src.max_slots_per_player, v_src.required_contact_field,
    v_src.public_song_list_enabled, v_src.poster_template_id, v_src.event_image_url, auth.uid()
  )
  returning * into v_new;

  perform public.bandie_open_mic_log_activity(
    v_new.id, 'duplicate', 'event', v_new.id, to_jsonb(v_src), to_jsonb(v_new)
  );

  return v_new;
end;
$$;

grant execute on function public.bandie_duplicate_open_mic_event(uuid) to authenticated;

create or replace function public.bandie_get_public_open_mic_event(p_slug text)
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_event public.bandie_open_mic_events;
  v_venue_name text;
  v_venue_address text;
begin
  select * into v_event
  from public.bandie_open_mic_events e
  where e.slug = trim(p_slug)
    and e.visibility in ('public', 'unlisted')
    and e.status not in ('draft', 'cancelled', 'archived');

  if not found then
    return null;
  end if;

  if v_event.venue_id is not null then
    select
      v.name,
      nullif(trim(concat_ws(', ',
        nullif(trim(v.address_line1), ''),
        nullif(trim(v.address_line2), ''),
        nullif(trim(v.city), ''),
        nullif(trim(v.postcode), '')
      )), '')
    into v_venue_name, v_venue_address
    from public.bandie_organiser_venues v
    where v.id = v_event.venue_id;
  else
    v_venue_name := v_event.venue_name;
    v_venue_address := v_event.venue_address;
  end if;

  return jsonb_build_object(
    'id', v_event.id,
    'slug', v_event.slug,
    'title', v_event.title,
    'event_type', v_event.event_type,
    'status', v_event.status,
    'starts_at', v_event.starts_at,
    'ends_at', v_event.ends_at,
    'timezone', v_event.timezone,
    'description', v_event.description,
    'host_name', v_event.host_name,
    'house_band_name', v_event.house_band_name,
    'entry_price', v_event.entry_price,
    'age_restrictions', v_event.age_restrictions,
    'equipment_notes', v_event.equipment_notes,
    'backline_notes', v_event.backline_notes,
    'signup_mode', v_event.signup_mode,
    'signup_opens_at', v_event.signup_opens_at,
    'signup_closes_at', v_event.signup_closes_at,
    'public_song_list_enabled', v_event.public_song_list_enabled,
    'required_contact_field', v_event.required_contact_field,
    'venue_name', coalesce(v_venue_name, v_event.venue_name),
    'venue_address', coalesce(v_venue_address, v_event.venue_address),
    'poster_template_id', v_event.poster_template_id,
    'event_image_url', v_event.event_image_url
  );
end;
$$;

grant execute on function public.bandie_get_public_open_mic_event(text) to anon, authenticated;

comment on table public.bandie_open_mic_events is
  'Open mic / jam night events owned by an organiser user. Public access via slug at /events/:slug.';
