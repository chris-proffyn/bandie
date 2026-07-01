-- Open mic vs jam night differentiation: house band parts, jam performance slots

-- ---------------------------------------------------------------------------
-- Event columns
-- ---------------------------------------------------------------------------

alter table public.bandie_open_mic_events
  add column if not exists slot_count integer check (slot_count is null or slot_count > 0),
  add column if not exists default_slot_duration_minutes integer
    check (default_slot_duration_minutes is null or default_slot_duration_minutes > 0),
  add column if not exists requires_bandie_registration boolean not null default false;

comment on column public.bandie_open_mic_events.requires_bandie_registration is
  'When true, public sign-up requires a signed-in Bandie account. Jam nights default false (guest bands allowed).';

-- ---------------------------------------------------------------------------
-- House band roster (open mic)
-- ---------------------------------------------------------------------------

create table if not exists public.bandie_open_mic_house_band_members (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.bandie_open_mic_events (id) on delete cascade,
  display_name text not null,
  instrument text not null,
  email text,
  phone text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bandie_open_mic_house_band_members_name_not_blank check (char_length(trim(display_name)) > 0),
  constraint bandie_open_mic_house_band_members_instrument_not_blank check (char_length(trim(instrument)) > 0)
);

create index if not exists bandie_open_mic_house_band_members_event_idx
  on public.bandie_open_mic_house_band_members (event_id, sort_order);

-- ---------------------------------------------------------------------------
-- Standard parts template per event (open mic)
-- ---------------------------------------------------------------------------

create table if not exists public.bandie_open_mic_part_templates (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.bandie_open_mic_events (id) on delete cascade,
  slot_name text not null,
  required boolean not null default false,
  enabled_by_default boolean not null default true,
  public_signup_enabled boolean not null default true,
  house_band_member_id uuid references public.bandie_open_mic_house_band_members (id) on delete set null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bandie_open_mic_part_templates_name_not_blank check (char_length(trim(slot_name)) > 0)
);

create index if not exists bandie_open_mic_part_templates_event_idx
  on public.bandie_open_mic_part_templates (event_id, sort_order);

-- ---------------------------------------------------------------------------
-- Song slots — link to part template / house band
-- ---------------------------------------------------------------------------

alter table public.bandie_open_mic_song_slots
  add column if not exists part_template_id uuid references public.bandie_open_mic_part_templates (id) on delete set null,
  add column if not exists house_band_member_id uuid references public.bandie_open_mic_house_band_members (id) on delete set null,
  add column if not exists enabled boolean not null default true;

-- ---------------------------------------------------------------------------
-- Song suggestions — new song vs existing part request
-- ---------------------------------------------------------------------------

alter table public.bandie_open_mic_song_suggestions
  add column if not exists suggestion_type text not null default 'new_song'
    check (suggestion_type in ('new_song', 'existing_slot')),
  add column if not exists event_song_id uuid references public.bandie_open_mic_songs (id) on delete set null,
  add column if not exists song_slot_id uuid references public.bandie_open_mic_song_slots (id) on delete set null,
  add column if not exists preferred_slot_name text;

-- ---------------------------------------------------------------------------
-- Jam night performance slots
-- ---------------------------------------------------------------------------

create table if not exists public.bandie_open_mic_jam_slots (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.bandie_open_mic_events (id) on delete cascade,
  slot_number integer not null check (slot_number > 0),
  duration_minutes integer not null default 20 check (duration_minutes > 0),
  starts_at timestamptz,
  status text not null default 'open'
    check (status in ('open', 'requested', 'filled', 'playing', 'completed', 'skipped', 'cancelled')),
  band_name text,
  contact_name text,
  contact_email text,
  contact_phone text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bandie_open_mic_jam_slots_unique_number unique (event_id, slot_number)
);

create index if not exists bandie_open_mic_jam_slots_event_idx
  on public.bandie_open_mic_jam_slots (event_id, slot_number);

create table if not exists public.bandie_open_mic_jam_signups (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.bandie_open_mic_events (id) on delete cascade,
  jam_slot_id uuid references public.bandie_open_mic_jam_slots (id) on delete set null,
  band_name text not null,
  contact_name text not null,
  email text,
  phone text,
  user_id uuid references auth.users (id) on delete set null,
  status text not null default 'requested'
    check (status in ('requested', 'approved', 'rejected', 'cancelled', 'withdrawn')),
  request_note text,
  organiser_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bandie_open_mic_jam_signups_band_not_blank check (char_length(trim(band_name)) > 0)
);

create index if not exists bandie_open_mic_jam_signups_event_idx
  on public.bandie_open_mic_jam_signups (event_id, status);

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

drop trigger if exists bandie_open_mic_house_band_members_set_updated_at on public.bandie_open_mic_house_band_members;
create trigger bandie_open_mic_house_band_members_set_updated_at
before update on public.bandie_open_mic_house_band_members
for each row execute function public.set_updated_at();

drop trigger if exists bandie_open_mic_part_templates_set_updated_at on public.bandie_open_mic_part_templates;
create trigger bandie_open_mic_part_templates_set_updated_at
before update on public.bandie_open_mic_part_templates
for each row execute function public.set_updated_at();

drop trigger if exists bandie_open_mic_jam_slots_set_updated_at on public.bandie_open_mic_jam_slots;
create trigger bandie_open_mic_jam_slots_set_updated_at
before update on public.bandie_open_mic_jam_slots
for each row execute function public.set_updated_at();

drop trigger if exists bandie_open_mic_jam_signups_set_updated_at on public.bandie_open_mic_jam_signups;
create trigger bandie_open_mic_jam_signups_set_updated_at
before update on public.bandie_open_mic_jam_signups
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.bandie_open_mic_house_band_members enable row level security;
alter table public.bandie_open_mic_part_templates enable row level security;
alter table public.bandie_open_mic_jam_slots enable row level security;
alter table public.bandie_open_mic_jam_signups enable row level security;

drop policy if exists "Organiser team manages house band" on public.bandie_open_mic_house_band_members;
create policy "Organiser team manages house band"
on public.bandie_open_mic_house_band_members for all to authenticated
using (public.bandie_current_user_can_manage_open_mic_event(event_id))
with check (public.bandie_current_user_can_manage_open_mic_event(event_id));

drop policy if exists "Organiser team manages part templates" on public.bandie_open_mic_part_templates;
create policy "Organiser team manages part templates"
on public.bandie_open_mic_part_templates for all to authenticated
using (public.bandie_current_user_can_manage_open_mic_event(event_id))
with check (public.bandie_current_user_can_manage_open_mic_event(event_id));

drop policy if exists "Organiser team manages jam slots" on public.bandie_open_mic_jam_slots;
create policy "Organiser team manages jam slots"
on public.bandie_open_mic_jam_slots for all to authenticated
using (public.bandie_current_user_can_manage_open_mic_event(event_id))
with check (public.bandie_current_user_can_manage_open_mic_event(event_id));

drop policy if exists "Organiser team manages jam signups" on public.bandie_open_mic_jam_signups;
create policy "Organiser team manages jam signups"
on public.bandie_open_mic_jam_signups for all to authenticated
using (public.bandie_current_user_can_manage_open_mic_event(event_id))
with check (public.bandie_current_user_can_manage_open_mic_event(event_id));

drop policy if exists "Users view own jam signups" on public.bandie_open_mic_jam_signups;
create policy "Users view own jam signups"
on public.bandie_open_mic_jam_signups for select to authenticated
using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.bandie_open_mic_is_jam_night(p_event_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.bandie_open_mic_events e
    where e.id = p_event_id and e.event_type = 'jam_night'
  );
$$;

grant execute on function public.bandie_open_mic_is_jam_night(uuid) to authenticated;

create or replace function public.bandie_seed_open_mic_default_parts(p_event_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (select 1 from public.bandie_open_mic_part_templates where event_id = p_event_id) then
    return;
  end if;

  insert into public.bandie_open_mic_part_templates (event_id, slot_name, required, sort_order)
  values
    (p_event_id, 'Vocals', true, 0),
    (p_event_id, 'Lead guitar', false, 1),
    (p_event_id, 'Rhythm guitar', false, 2),
    (p_event_id, 'Bass', false, 3),
    (p_event_id, 'Keys', false, 4),
    (p_event_id, 'Drums', false, 5);
end;
$$;

grant execute on function public.bandie_seed_open_mic_default_parts(uuid) to authenticated;

create or replace function public.bandie_open_mic_ensure_house_band_player(
  p_event_id uuid,
  p_house_band_member_id uuid
)
returns public.bandie_open_mic_players
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member public.bandie_open_mic_house_band_members;
  v_player public.bandie_open_mic_players;
begin
  select * into v_member from public.bandie_open_mic_house_band_members where id = p_house_band_member_id;
  if not found then
    raise exception 'House band member not found';
  end if;

  select * into v_player
  from public.bandie_open_mic_players
  where event_id = p_event_id
    and is_house_band = true
    and display_name = v_member.display_name
    and primary_instrument = v_member.instrument
  limit 1;

  if found then
    return v_player;
  end if;

  insert into public.bandie_open_mic_players (
    event_id, display_name, email, phone, primary_instrument, is_guest, is_house_band
  ) values (
    p_event_id, v_member.display_name, v_member.email, v_member.phone, v_member.instrument, false, true
  )
  returning * into v_player;

  return v_player;
end;
$$;

grant execute on function public.bandie_open_mic_ensure_house_band_player(uuid, uuid) to authenticated;

create or replace function public.bandie_open_mic_apply_parts_to_song(p_event_song_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event_id uuid;
  v_template public.bandie_open_mic_part_templates;
  v_slot public.bandie_open_mic_song_slots;
  v_player public.bandie_open_mic_players;
begin
  select s.event_id into v_event_id from public.bandie_open_mic_songs s where s.id = p_event_song_id;

  for v_template in
    select * from public.bandie_open_mic_part_templates
    where event_id = v_event_id and enabled_by_default
    order by sort_order
  loop
    insert into public.bandie_open_mic_song_slots (
      event_song_id, slot_name, required, sort_order, public_signup_enabled,
      part_template_id, house_band_member_id, enabled
    ) values (
      p_event_song_id, v_template.slot_name, v_template.required, v_template.sort_order,
      v_template.public_signup_enabled, v_template.id, v_template.house_band_member_id, true
    )
    returning * into v_slot;

    if v_template.house_band_member_id is not null then
      v_player := public.bandie_open_mic_ensure_house_band_player(v_event_id, v_template.house_band_member_id);
      insert into public.bandie_open_mic_assignments (
        event_id, event_song_id, song_slot_id, player_id, status, assigned_by
      ) values (
        v_event_id, p_event_song_id, v_slot.id, v_player.id, 'approved', auth.uid()
      )
      on conflict (song_slot_id, player_id) do nothing;
      perform public.bandie_open_mic_refresh_slot_status(v_slot.id);
    end if;
  end loop;

  perform public.bandie_open_mic_refresh_song_readiness(p_event_song_id);
end;
$$;

grant execute on function public.bandie_open_mic_apply_parts_to_song(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Replace add song — auto-apply event part templates for open_mic events
-- ---------------------------------------------------------------------------

create or replace function public.bandie_add_open_mic_song(
  p_event_id uuid,
  p_title text,
  p_artist text default null,
  p_song_key text default null,
  p_duration_seconds integer default null,
  p_notes text default null
)
returns public.bandie_open_mic_songs
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.bandie_open_mic_songs;
  v_sort integer;
  v_event public.bandie_open_mic_events;
begin
  if not public.bandie_current_user_can_manage_open_mic_event(p_event_id) then
    raise exception 'Not authorised';
  end if;

  select * into v_event from public.bandie_open_mic_events where id = p_event_id;

  select coalesce(max(sort_order), -1) + 1 into v_sort
  from public.bandie_open_mic_songs where event_id = p_event_id;

  insert into public.bandie_open_mic_songs (
    event_id, title, artist, song_key, duration_seconds, notes, sort_order
  ) values (
    p_event_id, trim(p_title), nullif(trim(coalesce(p_artist, '')), ''),
    nullif(trim(coalesce(p_song_key, '')), ''), p_duration_seconds,
    nullif(trim(coalesce(p_notes, '')), ''), v_sort
  )
  returning * into v_row;

  if v_event.event_type = 'open_mic' then
    perform public.bandie_seed_open_mic_default_parts(p_event_id);
    perform public.bandie_open_mic_apply_parts_to_song(v_row.id);
  end if;

  perform public.bandie_open_mic_log_activity(
    p_event_id, 'add_song', 'song', v_row.id, null, to_jsonb(v_row)
  );

  return v_row;
end;
$$;

-- ---------------------------------------------------------------------------
-- Jam slot generation
-- ---------------------------------------------------------------------------

create or replace function public.bandie_generate_open_mic_jam_slots(p_event_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event public.bandie_open_mic_events;
  v_duration integer;
  v_cursor timestamptz;
  v_i integer;
  v_count integer := 0;
begin
  if not public.bandie_current_user_can_manage_open_mic_event(p_event_id) then
    raise exception 'Not authorised';
  end if;

  select * into v_event from public.bandie_open_mic_events where id = p_event_id;
  if v_event.event_type <> 'jam_night' then
    raise exception 'Jam slots only apply to jam night events';
  end if;
  if v_event.slot_count is null or v_event.slot_count < 1 then
    raise exception 'Set slot count before generating jam slots';
  end if;

  v_duration := coalesce(v_event.default_slot_duration_minutes, 20);
  v_cursor := v_event.starts_at;

  delete from public.bandie_open_mic_jam_slots
  where event_id = p_event_id and status = 'open' and band_name is null;

  for v_i in 1..v_event.slot_count loop
    if not exists (
      select 1 from public.bandie_open_mic_jam_slots
      where event_id = p_event_id and slot_number = v_i
    ) then
      insert into public.bandie_open_mic_jam_slots (
        event_id, slot_number, duration_minutes, starts_at, status
      ) values (
        p_event_id, v_i, v_duration, v_cursor, 'open'
      );
      v_count := v_count + 1;
    end if;
    v_cursor := v_cursor + (v_duration || ' minutes')::interval;
  end loop;

  return v_count;
end;
$$;

grant execute on function public.bandie_generate_open_mic_jam_slots(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Jam sign-up (public + organiser)
-- ---------------------------------------------------------------------------

create or replace function public.bandie_request_jam_slot(
  p_event_id uuid,
  p_jam_slot_id uuid default null,
  p_band_name text default null,
  p_contact_name text default null,
  p_email text default null,
  p_phone text default null,
  p_request_note text default null
)
returns public.bandie_open_mic_jam_signups
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event public.bandie_open_mic_events;
  v_slot public.bandie_open_mic_jam_slots;
  v_row public.bandie_open_mic_jam_signups;
  v_status text;
  v_user_id uuid := auth.uid();
begin
  select * into v_event from public.bandie_open_mic_events where id = p_event_id;
  if not found then raise exception 'Event not found'; end if;
  if v_event.event_type <> 'jam_night' then raise exception 'Not a jam night event'; end if;
  if v_event.requires_bandie_registration and v_user_id is null then
    raise exception 'Sign in with Bandie to request a slot';
  end if;
  if not public.bandie_open_mic_event_is_signup_open(p_event_id) then
    raise exception 'Sign-up is not open';
  end if;

  if p_jam_slot_id is not null then
    select * into v_slot from public.bandie_open_mic_jam_slots
    where id = p_jam_slot_id and event_id = p_event_id;
    if not found or v_slot.status not in ('open', 'requested') then
      raise exception 'Slot not available';
    end if;
  end if;

  v_status := case when v_event.signup_mode = 'open' then 'approved' else 'requested' end;

  insert into public.bandie_open_mic_jam_signups (
    event_id, jam_slot_id, band_name, contact_name, email, phone, user_id, status, request_note
  ) values (
    p_event_id, p_jam_slot_id, trim(p_band_name),
    coalesce(nullif(trim(coalesce(p_contact_name, '')), ''), trim(p_band_name)),
    nullif(trim(coalesce(p_email, '')), ''), nullif(trim(coalesce(p_phone, '')), ''),
    v_user_id, v_status, nullif(trim(coalesce(p_request_note, '')), '')
  )
  returning * into v_row;

  if v_status = 'approved' and p_jam_slot_id is not null then
    update public.bandie_open_mic_jam_slots
    set status = 'filled', band_name = trim(p_band_name), contact_name = trim(p_contact_name),
        contact_email = nullif(trim(coalesce(p_email, '')), ''),
        contact_phone = nullif(trim(coalesce(p_phone, '')), '')
    where id = p_jam_slot_id;
  elsif p_jam_slot_id is not null then
    update public.bandie_open_mic_jam_slots set status = 'requested' where id = p_jam_slot_id;
  end if;

  return v_row;
end;
$$;

grant execute on function public.bandie_request_jam_slot(uuid, uuid, text, text, text, text, text) to anon, authenticated;

create or replace function public.bandie_approve_jam_signup(p_signup_id uuid)
returns public.bandie_open_mic_jam_signups
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.bandie_open_mic_jam_signups;
begin
  select * into v_row from public.bandie_open_mic_jam_signups where id = p_signup_id;
  if not public.bandie_current_user_can_manage_open_mic_event(v_row.event_id) then
    raise exception 'Not authorised';
  end if;

  update public.bandie_open_mic_jam_signups set status = 'approved' where id = p_signup_id returning * into v_row;

  if v_row.jam_slot_id is not null then
    update public.bandie_open_mic_jam_slots
    set status = 'filled', band_name = v_row.band_name, contact_name = v_row.contact_name,
        contact_email = v_row.email, contact_phone = v_row.phone
    where id = v_row.jam_slot_id;
  end if;

  return v_row;
end;
$$;

grant execute on function public.bandie_approve_jam_signup(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Public jam slots
-- ---------------------------------------------------------------------------

create or replace function public.bandie_get_public_jam_slots(p_slug text)
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_event public.bandie_open_mic_events;
begin
  select * into v_event from public.bandie_open_mic_events
  where slug = trim(p_slug) and event_type = 'jam_night'
    and visibility in ('public', 'unlisted')
    and status not in ('draft', 'cancelled', 'archived');

  if not found then return '[]'::jsonb; end if;

  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', s.id,
      'slot_number', s.slot_number,
      'duration_minutes', s.duration_minutes,
      'starts_at', s.starts_at,
      'status', s.status,
      'band_name', s.band_name
    ) order by s.slot_number)
    from public.bandie_open_mic_jam_slots s
    where s.event_id = v_event.id
  ), '[]'::jsonb);
end;
$$;

grant execute on function public.bandie_get_public_jam_slots(text) to anon, authenticated;

-- Extend public event payload with event_type and jam fields
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

  if not found then return null; end if;

  if v_event.venue_id is not null then
    select v.name, nullif(trim(concat_ws(', ',
      nullif(trim(v.address_line1), ''), nullif(trim(v.address_line2), ''),
      nullif(trim(v.city), ''), nullif(trim(v.postcode), '')
    )), '')
    into v_venue_name, v_venue_address
    from public.bandie_organiser_venues v where v.id = v_event.venue_id;
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
    'requires_bandie_registration', v_event.requires_bandie_registration,
    'slot_count', v_event.slot_count,
    'default_slot_duration_minutes', v_event.default_slot_duration_minutes,
    'venue_name', coalesce(v_venue_name, v_event.venue_name),
    'venue_address', coalesce(v_venue_address, v_event.venue_address),
    'poster_template_id', v_event.poster_template_id,
    'event_image_url', v_event.event_image_url
  );
end;
$$;

-- Seed default parts when creating open_mic events
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
  p_required_contact_field text default 'email_or_phone',
  p_slot_count integer default null,
  p_default_slot_duration_minutes integer default null
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
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if char_length(trim(coalesce(p_title, ''))) = 0 then raise exception 'Title is required'; end if;
  if p_starts_at is null then raise exception 'Start time is required'; end if;

  v_slug := public.bandie_open_mic_unique_slug(p_title);

  insert into public.bandie_open_mic_events (
    organiser_user_id, title, slug, event_type, status, visibility,
    venue_id, venue_name, venue_address, starts_at, ends_at, timezone,
    description, signup_mode, required_contact_field,
    slot_count, default_slot_duration_minutes,
    requires_bandie_registration,
    created_by
  ) values (
    auth.uid(), trim(p_title), v_slug, coalesce(p_event_type, 'open_mic'), 'draft', 'unlisted',
    p_venue_id, nullif(trim(coalesce(p_venue_name, '')), ''), nullif(trim(coalesce(p_venue_address, '')), ''),
    p_starts_at, p_ends_at, coalesce(nullif(trim(p_timezone), ''), 'Europe/London'),
    nullif(trim(coalesce(p_description, '')), ''), coalesce(p_signup_mode, 'open'),
    coalesce(p_required_contact_field, 'email_or_phone'),
    p_slot_count, p_default_slot_duration_minutes,
    false,
    auth.uid()
  )
  returning * into v_row;

  if v_row.event_type = 'open_mic' then
    perform public.bandie_seed_open_mic_default_parts(v_row.id);
  end if;

  insert into public.bandie_organiser_members (owner_user_id, user_id, role, status)
  values (auth.uid(), auth.uid(), 'owner', 'active')
  on conflict (owner_user_id, user_id) do nothing;

  perform public.bandie_open_mic_log_activity(v_row.id, 'create', 'event', v_row.id, null, to_jsonb(v_row));
  return v_row;
end;
$$;

grant execute on function public.bandie_create_open_mic_event(
  text, timestamptz, timestamptz, text, uuid, text, text, text, text, text, text, integer, integer
) to authenticated;

-- Drop legacy overload (11-parameter signature)
drop function if exists public.bandie_create_open_mic_event(
  text, timestamptz, timestamptz, text, uuid, text, text, text, text, text, text
);

-- ---------------------------------------------------------------------------
-- Update event patch — jam fields
-- ---------------------------------------------------------------------------

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
  if not found then raise exception 'Event not found'; end if;
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
    slot_count = case when p_patch ? 'slot_count' then (p_patch->>'slot_count')::integer else e.slot_count end,
    default_slot_duration_minutes = case when p_patch ? 'default_slot_duration_minutes' then (p_patch->>'default_slot_duration_minutes')::integer else e.default_slot_duration_minutes end,
    requires_bandie_registration = case when p_patch ? 'requires_bandie_registration' then (p_patch->>'requires_bandie_registration')::boolean else e.requires_bandie_registration end,
    updated_by = auth.uid()
  where e.id = p_event_id
  returning * into v_after;

  perform public.bandie_open_mic_log_activity(
    p_event_id, 'update', 'event', p_event_id, to_jsonb(v_before), to_jsonb(v_after)
  );

  return v_after;
end;
$$;

-- ---------------------------------------------------------------------------
-- Duplicate — copy house band, part templates, songs/slots
-- ---------------------------------------------------------------------------

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
  v_song public.bandie_open_mic_songs;
  v_new_song_id uuid;
  v_slot public.bandie_open_mic_song_slots;
  v_hb public.bandie_open_mic_house_band_members;
  v_new_hb_id uuid;
  v_hb_map jsonb := '{}'::jsonb;
  v_pt public.bandie_open_mic_part_templates;
begin
  if not public.bandie_current_user_can_manage_open_mic_event(p_event_id) then
    raise exception 'Not authorised';
  end if;

  select * into v_src from public.bandie_open_mic_events where id = p_event_id;
  if not found then raise exception 'Event not found'; end if;

  v_slug := public.bandie_open_mic_unique_slug(v_src.title || '-copy');

  insert into public.bandie_open_mic_events (
    organiser_user_id, title, slug, event_type, status, visibility,
    venue_id, venue_name, venue_address, starts_at, ends_at, timezone,
    description, host_name, house_band_name, entry_price, age_restrictions,
    equipment_notes, backline_notes, signup_mode, signup_opens_at, signup_closes_at,
    max_songs_per_player, max_slots_per_player, required_contact_field,
    public_song_list_enabled, poster_template_id, event_image_url,
    slot_count, default_slot_duration_minutes, requires_bandie_registration, created_by
  ) values (
    v_src.organiser_user_id, v_src.title || ' (copy)', v_slug, v_src.event_type, 'draft', v_src.visibility,
    v_src.venue_id, v_src.venue_name, v_src.venue_address, v_src.starts_at, v_src.ends_at, v_src.timezone,
    v_src.description, v_src.host_name, v_src.house_band_name, v_src.entry_price, v_src.age_restrictions,
    v_src.equipment_notes, v_src.backline_notes, v_src.signup_mode, v_src.signup_opens_at, v_src.signup_closes_at,
    v_src.max_songs_per_player, v_src.max_slots_per_player, v_src.required_contact_field,
    v_src.public_song_list_enabled, v_src.poster_template_id, v_src.event_image_url,
    v_src.slot_count, v_src.default_slot_duration_minutes, v_src.requires_bandie_registration, auth.uid()
  )
  returning * into v_new;

  for v_hb in select * from public.bandie_open_mic_house_band_members where event_id = p_event_id order by sort_order
  loop
    insert into public.bandie_open_mic_house_band_members (
      event_id, display_name, instrument, email, phone, sort_order
    ) values (
      v_new.id, v_hb.display_name, v_hb.instrument, v_hb.email, v_hb.phone, v_hb.sort_order
    )
    returning id into v_new_hb_id;
    v_hb_map := v_hb_map || jsonb_build_object(v_hb.id::text, v_new_hb_id::text);
  end loop;

  for v_pt in select * from public.bandie_open_mic_part_templates where event_id = p_event_id order by sort_order
  loop
    insert into public.bandie_open_mic_part_templates (
      event_id, slot_name, required, enabled_by_default, public_signup_enabled,
      house_band_member_id, sort_order
    ) values (
      v_new.id, v_pt.slot_name, v_pt.required, v_pt.enabled_by_default, v_pt.public_signup_enabled,
      case when v_pt.house_band_member_id is not null
        then (v_hb_map->>v_pt.house_band_member_id::text)::uuid else null end,
      v_pt.sort_order
    );
  end loop;

  if not exists (select 1 from public.bandie_open_mic_part_templates where event_id = v_new.id)
    and v_new.event_type = 'open_mic' then
    perform public.bandie_seed_open_mic_default_parts(v_new.id);
  end if;

  for v_song in select * from public.bandie_open_mic_songs where event_id = p_event_id order by sort_order
  loop
    insert into public.bandie_open_mic_songs (
      event_id, source_song_id, source_type, title, artist, song_key, duration_seconds,
      bpm, genre, difficulty, notes, sort_order
    ) values (
      v_new.id, v_song.source_song_id, v_song.source_type, v_song.title, v_song.artist,
      v_song.song_key, v_song.duration_seconds, v_song.bpm, v_song.genre, v_song.difficulty,
      v_song.notes, v_song.sort_order
    )
    returning id into v_new_song_id;

    for v_slot in select * from public.bandie_open_mic_song_slots where event_song_id = v_song.id order by sort_order
    loop
      insert into public.bandie_open_mic_song_slots (
        event_song_id, slot_name, required, min_players, max_players,
        public_signup_enabled, notes, sort_order, enabled
      ) values (
        v_new_song_id, v_slot.slot_name, v_slot.required, v_slot.min_players, v_slot.max_players,
        v_slot.public_signup_enabled, v_slot.notes, v_slot.sort_order, v_slot.enabled
      );
    end loop;
  end loop;

  perform public.bandie_open_mic_log_activity(
    v_new.id, 'duplicate', 'event', v_new.id, to_jsonb(v_src), to_jsonb(v_new)
  );

  return v_new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Song suggestion — new song or existing slot request
-- ---------------------------------------------------------------------------

create or replace function public.bandie_submit_open_mic_song_suggestion(
  p_event_id uuid,
  p_title text default null,
  p_artist text default null,
  p_display_name text default null,
  p_email text default null,
  p_phone text default null,
  p_notes text default null,
  p_suggestion_type text default 'new_song',
  p_event_song_id uuid default null,
  p_song_slot_id uuid default null,
  p_preferred_slot_name text default null
)
returns public.bandie_open_mic_song_suggestions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.bandie_open_mic_song_suggestions;
  v_player_id uuid;
  v_user_id uuid := auth.uid();
  v_type text := coalesce(p_suggestion_type, 'new_song');
begin
  if not public.bandie_open_mic_event_is_signup_open(p_event_id) then
    raise exception 'Suggestions are not open';
  end if;

  if v_type = 'new_song' and char_length(trim(coalesce(p_title, ''))) = 0 then
    raise exception 'Song title is required';
  end if;

  if v_type = 'existing_slot' and p_song_slot_id is null then
    raise exception 'Choose a part to request';
  end if;

  if v_user_id is not null then
    select id into v_player_id from public.bandie_open_mic_players
    where event_id = p_event_id and user_id = v_user_id;
  end if;

  if v_player_id is null and p_display_name is not null then
    insert into public.bandie_open_mic_players (event_id, display_name, email, phone, is_guest)
    values (p_event_id, trim(p_display_name), p_email, p_phone, true)
    returning id into v_player_id;
  end if;

  insert into public.bandie_open_mic_song_suggestions (
    event_id, player_id, suggested_by_user_id, title, artist, notes,
    suggestion_type, event_song_id, song_slot_id, preferred_slot_name
  ) values (
    p_event_id, v_player_id, v_user_id,
    coalesce(nullif(trim(coalesce(p_title, '')), ''), 'Part request'),
    nullif(trim(coalesce(p_artist, '')), ''),
    nullif(trim(coalesce(p_notes, '')), ''),
    v_type, p_event_song_id, p_song_slot_id,
    nullif(trim(coalesce(p_preferred_slot_name, '')), '')
  )
  returning * into v_row;

  return v_row;
end;
$$;

grant execute on function public.bandie_submit_open_mic_song_suggestion(
  uuid, text, text, text, text, text, text, text, uuid, uuid, text
) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Toggle song part enabled / clear house band assignment on slot
-- ---------------------------------------------------------------------------

create or replace function public.bandie_set_open_mic_song_slot_enabled(
  p_slot_id uuid,
  p_enabled boolean
)
returns public.bandie_open_mic_song_slots
language plpgsql
security definer
set search_path = public
as $$
declare
  v_slot public.bandie_open_mic_song_slots;
  v_event_id uuid;
  v_event_song_id uuid;
begin
  select * into v_slot from public.bandie_open_mic_song_slots where id = p_slot_id;
  if not found then raise exception 'Slot not found'; end if;

  v_event_song_id := v_slot.event_song_id;
  select event_id into v_event_id from public.bandie_open_mic_songs where id = v_event_song_id;
  if not public.bandie_current_user_can_manage_open_mic_event(v_event_id) then
    raise exception 'Not authorised';
  end if;

  update public.bandie_open_mic_song_slots
  set enabled = p_enabled
  where id = p_slot_id
  returning * into v_slot;

  perform public.bandie_open_mic_refresh_song_readiness(v_event_song_id);

  return v_slot;
end;
$$;

grant execute on function public.bandie_set_open_mic_song_slot_enabled(uuid, boolean) to authenticated;

drop function if exists public.bandie_submit_open_mic_song_suggestion(
  uuid, text, text, text, text, text, text
);

create or replace function public.bandie_clear_open_mic_slot_assignment(p_slot_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event_id uuid;
  v_event_song_id uuid;
begin
  select song.event_id, s.event_song_id into v_event_id, v_event_song_id
  from public.bandie_open_mic_song_slots s
  join public.bandie_open_mic_songs song on song.id = s.event_song_id
  where s.id = p_slot_id;

  if not found then raise exception 'Slot not found'; end if;
  if not public.bandie_current_user_can_manage_open_mic_event(v_event_id) then
    raise exception 'Not authorised';
  end if;

  delete from public.bandie_open_mic_assignments
  where song_slot_id = p_slot_id and status in ('approved', 'requested');

  update public.bandie_open_mic_song_slots
  set house_band_member_id = null
  where id = p_slot_id;

  perform public.bandie_open_mic_refresh_slot_status(p_slot_id);
  perform public.bandie_open_mic_refresh_song_readiness(v_event_song_id);
end;
$$;

grant execute on function public.bandie_clear_open_mic_slot_assignment(uuid) to authenticated;

-- Organiser assign band to jam slot directly
create or replace function public.bandie_assign_open_mic_jam_slot(
  p_jam_slot_id uuid,
  p_band_name text,
  p_contact_name text default null,
  p_contact_email text default null,
  p_contact_phone text default null
)
returns public.bandie_open_mic_jam_slots
language plpgsql
security definer
set search_path = public
as $$
declare
  v_slot public.bandie_open_mic_jam_slots;
begin
  select * into v_slot from public.bandie_open_mic_jam_slots where id = p_jam_slot_id;
  if not found then raise exception 'Slot not found'; end if;
  if not public.bandie_current_user_can_manage_open_mic_event(v_slot.event_id) then
    raise exception 'Not authorised';
  end if;

  update public.bandie_open_mic_jam_slots
  set status = 'filled',
      band_name = trim(p_band_name),
      contact_name = nullif(trim(coalesce(p_contact_name, '')), ''),
      contact_email = nullif(trim(coalesce(p_contact_email, '')), ''),
      contact_phone = nullif(trim(coalesce(p_contact_phone, '')), '')
  where id = p_jam_slot_id
  returning * into v_slot;

  return v_slot;
end;
$$;

grant execute on function public.bandie_assign_open_mic_jam_slot(uuid, text, text, text, text) to authenticated;

create or replace function public.bandie_clear_open_mic_jam_slot(p_jam_slot_id uuid)
returns public.bandie_open_mic_jam_slots
language plpgsql
security definer
set search_path = public
as $$
declare
  v_slot public.bandie_open_mic_jam_slots;
begin
  select * into v_slot from public.bandie_open_mic_jam_slots where id = p_jam_slot_id;
  if not found then raise exception 'Slot not found'; end if;
  if not public.bandie_current_user_can_manage_open_mic_event(v_slot.event_id) then
    raise exception 'Not authorised';
  end if;

  update public.bandie_open_mic_jam_slots
  set status = 'open', band_name = null, contact_name = null,
      contact_email = null, contact_phone = null, notes = null
  where id = p_jam_slot_id
  returning * into v_slot;

  update public.bandie_open_mic_jam_signups
  set status = 'cancelled'
  where jam_slot_id = p_jam_slot_id and status in ('requested', 'approved');

  return v_slot;
end;
$$;

grant execute on function public.bandie_clear_open_mic_jam_slot(uuid) to authenticated;
