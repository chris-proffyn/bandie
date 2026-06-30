-- Open mic songs, sign-up, live control, and event files (Releases 2–4)

-- ---------------------------------------------------------------------------
-- Songs
-- ---------------------------------------------------------------------------

create table if not exists public.bandie_open_mic_songs (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.bandie_open_mic_events (id) on delete cascade,
  source_song_id uuid,
  source_type text not null default 'manual'
    check (source_type in ('manual', 'organiser_library', 'band_song', 'previous_event', 'suggestion')),
  title text not null,
  artist text,
  song_key text,
  duration_seconds integer check (duration_seconds is null or duration_seconds > 0),
  bpm integer check (bpm is null or bpm > 0),
  genre text,
  difficulty text check (difficulty is null or difficulty in ('easy', 'medium', 'hard')),
  notes text,
  readiness_status text not null default 'not_ready'
    check (readiness_status in ('not_ready', 'partial', 'ready', 'locked')),
  readiness_override text check (readiness_override is null or readiness_override in ('ready', 'not_ready')),
  sort_order integer not null default 0,
  live_status text not null default 'queued'
    check (live_status in ('queued', 'called', 'on_deck', 'playing', 'completed', 'skipped', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bandie_open_mic_songs_title_not_blank check (char_length(trim(title)) > 0)
);

create index if not exists bandie_open_mic_songs_event_idx
  on public.bandie_open_mic_songs (event_id, sort_order);

-- ---------------------------------------------------------------------------
-- Song slots
-- ---------------------------------------------------------------------------

create table if not exists public.bandie_open_mic_song_slots (
  id uuid primary key default gen_random_uuid(),
  event_song_id uuid not null references public.bandie_open_mic_songs (id) on delete cascade,
  slot_name text not null,
  required boolean not null default true,
  min_players integer not null default 1 check (min_players > 0),
  max_players integer not null default 1 check (max_players >= min_players),
  status text not null default 'open'
    check (status in ('open', 'partial', 'filled', 'locked')),
  public_signup_enabled boolean not null default true,
  notes text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bandie_open_mic_song_slots_name_not_blank check (char_length(trim(slot_name)) > 0)
);

create index if not exists bandie_open_mic_song_slots_song_idx
  on public.bandie_open_mic_song_slots (event_song_id, sort_order);

-- ---------------------------------------------------------------------------
-- Players (guests + Bandie members)
-- ---------------------------------------------------------------------------

create table if not exists public.bandie_open_mic_players (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.bandie_open_mic_events (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  display_name text not null,
  email text,
  phone text,
  primary_instrument text,
  profile_notes text,
  is_guest boolean not null default true,
  is_house_band boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bandie_open_mic_players_name_not_blank check (char_length(trim(display_name)) > 0)
);

create index if not exists bandie_open_mic_players_event_idx
  on public.bandie_open_mic_players (event_id);

create index if not exists bandie_open_mic_players_user_idx
  on public.bandie_open_mic_players (event_id, user_id)
  where user_id is not null;

-- ---------------------------------------------------------------------------
-- Assignments / sign-ups
-- ---------------------------------------------------------------------------

create table if not exists public.bandie_open_mic_assignments (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.bandie_open_mic_events (id) on delete cascade,
  event_song_id uuid not null references public.bandie_open_mic_songs (id) on delete cascade,
  song_slot_id uuid not null references public.bandie_open_mic_song_slots (id) on delete cascade,
  player_id uuid not null references public.bandie_open_mic_players (id) on delete cascade,
  status text not null default 'requested'
    check (status in ('requested', 'approved', 'rejected', 'cancelled', 'withdrawn', 'backup')),
  assigned_by uuid references auth.users (id) on delete set null,
  request_note text,
  organiser_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bandie_open_mic_assignments_unique_slot_player unique (song_slot_id, player_id)
);

create index if not exists bandie_open_mic_assignments_event_idx
  on public.bandie_open_mic_assignments (event_id, status);

-- ---------------------------------------------------------------------------
-- Player song suggestions
-- ---------------------------------------------------------------------------

create table if not exists public.bandie_open_mic_song_suggestions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.bandie_open_mic_events (id) on delete cascade,
  player_id uuid references public.bandie_open_mic_players (id) on delete set null,
  suggested_by_user_id uuid references auth.users (id) on delete set null,
  title text not null,
  artist text,
  song_key text,
  notes text,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  organiser_note text,
  created_song_id uuid references public.bandie_open_mic_songs (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists bandie_open_mic_song_suggestions_event_idx
  on public.bandie_open_mic_song_suggestions (event_id, status);

-- ---------------------------------------------------------------------------
-- Instrument templates
-- ---------------------------------------------------------------------------

create table if not exists public.bandie_open_mic_instrument_templates (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  slots jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

insert into public.bandie_open_mic_instrument_templates (code, name, description, slots)
values
  ('rock', 'Rock band', 'Standard rock lineup', '[
    {"slot_name":"Vocals","required":true,"sort_order":0},
    {"slot_name":"Electric guitar","required":true,"sort_order":1},
    {"slot_name":"Bass","required":true,"sort_order":2},
    {"slot_name":"Drums","required":true,"sort_order":3}
  ]'::jsonb),
  ('acoustic', 'Acoustic', 'Acoustic duo/trio', '[
    {"slot_name":"Vocals","required":true,"sort_order":0},
    {"slot_name":"Acoustic guitar","required":true,"sort_order":1},
    {"slot_name":"Cajon/percussion","required":false,"sort_order":2}
  ]'::jsonb),
  ('blues', 'Blues jam', 'Blues jam lineup', '[
    {"slot_name":"Vocals","required":false,"sort_order":0},
    {"slot_name":"Lead guitar","required":true,"sort_order":1},
    {"slot_name":"Rhythm guitar","required":false,"sort_order":2},
    {"slot_name":"Bass","required":true,"sort_order":3},
    {"slot_name":"Drums","required":true,"sort_order":4},
    {"slot_name":"Harp","required":false,"sort_order":5}
  ]'::jsonb)
on conflict (code) do nothing;

-- ---------------------------------------------------------------------------
-- Event files (Dropbox links — metadata only)
-- ---------------------------------------------------------------------------

create table if not exists public.bandie_open_mic_event_files (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.bandie_open_mic_events (id) on delete cascade,
  event_song_id uuid references public.bandie_open_mic_songs (id) on delete cascade,
  song_slot_id uuid references public.bandie_open_mic_song_slots (id) on delete cascade,
  assignment_id uuid references public.bandie_open_mic_assignments (id) on delete cascade,
  source_file_id uuid,
  storage_path text,
  external_url text,
  title text not null,
  file_type text,
  visibility text not null default 'organiser_only'
    check (visibility in ('organiser_only', 'bandie_members_assigned', 'bandie_members_event')),
  uploaded_by uuid not null references auth.users (id),
  created_at timestamptz not null default now()
);

create index if not exists bandie_open_mic_event_files_event_idx
  on public.bandie_open_mic_event_files (event_id);

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

drop trigger if exists bandie_open_mic_songs_set_updated_at on public.bandie_open_mic_songs;
create trigger bandie_open_mic_songs_set_updated_at
before update on public.bandie_open_mic_songs
for each row execute function public.set_updated_at();

drop trigger if exists bandie_open_mic_song_slots_set_updated_at on public.bandie_open_mic_song_slots;
create trigger bandie_open_mic_song_slots_set_updated_at
before update on public.bandie_open_mic_song_slots
for each row execute function public.set_updated_at();

drop trigger if exists bandie_open_mic_players_set_updated_at on public.bandie_open_mic_players;
create trigger bandie_open_mic_players_set_updated_at
before update on public.bandie_open_mic_players
for each row execute function public.set_updated_at();

drop trigger if exists bandie_open_mic_assignments_set_updated_at on public.bandie_open_mic_assignments;
create trigger bandie_open_mic_assignments_set_updated_at
before update on public.bandie_open_mic_assignments
for each row execute function public.set_updated_at();

drop trigger if exists bandie_open_mic_song_suggestions_set_updated_at on public.bandie_open_mic_song_suggestions;
create trigger bandie_open_mic_song_suggestions_set_updated_at
before update on public.bandie_open_mic_song_suggestions
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.bandie_open_mic_event_is_signup_open(p_event_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.bandie_open_mic_events e
    where e.id = p_event_id
      and e.status in ('published', 'signup_open', 'in_progress')
      and e.signup_mode in ('open', 'moderated')
      and (e.signup_opens_at is null or e.signup_opens_at <= now())
      and (e.signup_closes_at is null or e.signup_closes_at > now())
  );
$$;

grant execute on function public.bandie_open_mic_event_is_signup_open(uuid) to anon, authenticated;

create or replace function public.bandie_open_mic_refresh_song_readiness(p_event_song_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_required integer;
  v_filled integer;
  v_status text;
begin
  select count(*) into v_required
  from public.bandie_open_mic_song_slots s
  where s.event_song_id = p_event_song_id and s.required = true;

  select count(*) into v_filled
  from public.bandie_open_mic_song_slots s
  where s.event_song_id = p_event_song_id
    and s.required = true
    and exists (
      select 1 from public.bandie_open_mic_assignments a
      where a.song_slot_id = s.id and a.status = 'approved'
    );

  if v_required = 0 then
    v_status := 'ready';
  elsif v_filled = 0 then
    v_status := 'not_ready';
  elsif v_filled < v_required then
    v_status := 'partial';
  else
    v_status := 'ready';
  end if;

  update public.bandie_open_mic_songs
  set readiness_status = v_status
  where id = p_event_song_id
    and readiness_override is null;
end;
$$;

grant execute on function public.bandie_open_mic_refresh_song_readiness(uuid) to authenticated;

create or replace function public.bandie_open_mic_refresh_slot_status(p_slot_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_approved integer;
  v_max integer;
  v_status text;
begin
  select max_players into v_max from public.bandie_open_mic_song_slots where id = p_slot_id;

  select count(*) into v_approved
  from public.bandie_open_mic_assignments
  where song_slot_id = p_slot_id and status = 'approved';

  if v_approved = 0 then
    v_status := 'open';
  elsif v_approved < v_max then
    v_status := 'partial';
  else
    v_status := 'filled';
  end if;

  update public.bandie_open_mic_song_slots set status = v_status where id = p_slot_id;
end;
$$;

grant execute on function public.bandie_open_mic_refresh_slot_status(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.bandie_open_mic_songs enable row level security;
alter table public.bandie_open_mic_song_slots enable row level security;
alter table public.bandie_open_mic_players enable row level security;
alter table public.bandie_open_mic_assignments enable row level security;
alter table public.bandie_open_mic_song_suggestions enable row level security;
alter table public.bandie_open_mic_instrument_templates enable row level security;
alter table public.bandie_open_mic_event_files enable row level security;

drop policy if exists "Anyone can read instrument templates" on public.bandie_open_mic_instrument_templates;
create policy "Anyone can read instrument templates"
on public.bandie_open_mic_instrument_templates for select to authenticated, anon
using (true);

drop policy if exists "Organiser team manages songs" on public.bandie_open_mic_songs;
create policy "Organiser team manages songs"
on public.bandie_open_mic_songs for all to authenticated
using (public.bandie_current_user_can_manage_open_mic_event(event_id))
with check (public.bandie_current_user_can_manage_open_mic_event(event_id));

drop policy if exists "Organiser team manages slots" on public.bandie_open_mic_song_slots;
create policy "Organiser team manages slots"
on public.bandie_open_mic_song_slots for all to authenticated
using (
  exists (
    select 1 from public.bandie_open_mic_songs s
    where s.id = event_song_id
      and public.bandie_current_user_can_manage_open_mic_event(s.event_id)
  )
)
with check (
  exists (
    select 1 from public.bandie_open_mic_songs s
    where s.id = event_song_id
      and public.bandie_current_user_can_manage_open_mic_event(s.event_id)
  )
);

drop policy if exists "Organiser team manages players" on public.bandie_open_mic_players;
create policy "Organiser team manages players"
on public.bandie_open_mic_players for all to authenticated
using (public.bandie_current_user_can_manage_open_mic_event(event_id))
with check (public.bandie_current_user_can_manage_open_mic_event(event_id));

drop policy if exists "Players view own player row" on public.bandie_open_mic_players;
create policy "Players view own player row"
on public.bandie_open_mic_players for select to authenticated
using (user_id = auth.uid());

drop policy if exists "Organiser team manages assignments" on public.bandie_open_mic_assignments;
create policy "Organiser team manages assignments"
on public.bandie_open_mic_assignments for all to authenticated
using (public.bandie_current_user_can_manage_open_mic_event(event_id))
with check (public.bandie_current_user_can_manage_open_mic_event(event_id));

drop policy if exists "Players view own assignments" on public.bandie_open_mic_assignments;
create policy "Players view own assignments"
on public.bandie_open_mic_assignments for select to authenticated
using (
  exists (
    select 1 from public.bandie_open_mic_players p
    where p.id = player_id and p.user_id = auth.uid()
  )
);

drop policy if exists "Organiser team manages suggestions" on public.bandie_open_mic_song_suggestions;
create policy "Organiser team manages suggestions"
on public.bandie_open_mic_song_suggestions for all to authenticated
using (public.bandie_current_user_can_manage_open_mic_event(event_id))
with check (public.bandie_current_user_can_manage_open_mic_event(event_id));

drop policy if exists "Organiser team manages event files" on public.bandie_open_mic_event_files;
create policy "Organiser team manages event files"
on public.bandie_open_mic_event_files for all to authenticated
using (public.bandie_current_user_can_manage_open_mic_event(event_id))
with check (public.bandie_current_user_can_manage_open_mic_event(event_id));

-- ---------------------------------------------------------------------------
-- RPCs — Songs
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
begin
  if not public.bandie_current_user_can_manage_open_mic_event(p_event_id) then
    raise exception 'Not authorised';
  end if;

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

  perform public.bandie_open_mic_log_activity(
    p_event_id, 'add_song', 'song', v_row.id, null, to_jsonb(v_row)
  );

  return v_row;
end;
$$;

grant execute on function public.bandie_add_open_mic_song(uuid, text, text, text, integer, text) to authenticated;

create or replace function public.bandie_apply_open_mic_instrument_template(
  p_event_song_id uuid,
  p_template_code text
)
returns setof public.bandie_open_mic_song_slots
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event_id uuid;
  v_template public.bandie_open_mic_instrument_templates;
  v_slot jsonb;
  v_row public.bandie_open_mic_song_slots;
  v_idx integer := 0;
begin
  select s.event_id into v_event_id
  from public.bandie_open_mic_songs s where s.id = p_event_song_id;

  if not public.bandie_current_user_can_manage_open_mic_event(v_event_id) then
    raise exception 'Not authorised';
  end if;

  select * into v_template from public.bandie_open_mic_instrument_templates where code = p_template_code;
  if not found then
    raise exception 'Template not found';
  end if;

  for v_slot in select * from jsonb_array_elements(v_template.slots)
  loop
    insert into public.bandie_open_mic_song_slots (
      event_song_id, slot_name, required, sort_order
    ) values (
      p_event_song_id,
      v_slot->>'slot_name',
      coalesce((v_slot->>'required')::boolean, true),
      coalesce((v_slot->>'sort_order')::integer, v_idx)
    )
    returning * into v_row;
    v_idx := v_idx + 1;
    return next v_row;
  end loop;

  perform public.bandie_open_mic_refresh_song_readiness(p_event_song_id);
end;
$$;

grant execute on function public.bandie_apply_open_mic_instrument_template(uuid, text) to authenticated;

create or replace function public.bandie_reorder_open_mic_songs(
  p_event_id uuid,
  p_song_ids uuid[]
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_idx integer := 0;
begin
  if not public.bandie_current_user_can_manage_open_mic_event(p_event_id) then
    raise exception 'Not authorised';
  end if;

  foreach v_id in array p_song_ids
  loop
    update public.bandie_open_mic_songs
    set sort_order = v_idx
    where id = v_id and event_id = p_event_id;
    v_idx := v_idx + 1;
  end loop;
end;
$$;

grant execute on function public.bandie_reorder_open_mic_songs(uuid, uuid[]) to authenticated;

-- ---------------------------------------------------------------------------
-- RPCs — Sign-up
-- ---------------------------------------------------------------------------

create or replace function public.bandie_request_open_mic_slot(
  p_event_id uuid,
  p_song_slot_id uuid,
  p_display_name text,
  p_email text default null,
  p_phone text default null,
  p_primary_instrument text default null,
  p_request_note text default null
)
returns public.bandie_open_mic_assignments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event public.bandie_open_mic_events;
  v_slot public.bandie_open_mic_song_slots;
  v_song public.bandie_open_mic_songs;
  v_player public.bandie_open_mic_players;
  v_assignment public.bandie_open_mic_assignments;
  v_initial_status text;
  v_user_id uuid := auth.uid();
begin
  select * into v_event from public.bandie_open_mic_events where id = p_event_id;
  if not found then raise exception 'Event not found'; end if;

  if v_event.signup_mode = 'organiser_only' then
    raise exception 'Sign-up is organiser-managed only';
  end if;

  if not public.bandie_open_mic_event_is_signup_open(p_event_id) then
    raise exception 'Sign-up is not open';
  end if;

  select ss.* into v_slot
  from public.bandie_open_mic_song_slots ss
  join public.bandie_open_mic_songs s on s.id = ss.event_song_id
  where ss.id = p_song_slot_id and s.event_id = p_event_id;

  if not found then
    raise exception 'Slot not available';
  end if;

  select * into v_song from public.bandie_open_mic_songs where id = v_slot.event_song_id;

  if not v_slot.public_signup_enabled then
    raise exception 'Slot not available';
  end if;

  if v_slot.status = 'filled' then
    raise exception 'Slot is full';
  end if;

  if v_user_id is not null then
    select * into v_player from public.bandie_open_mic_players
    where event_id = p_event_id and user_id = v_user_id;
  end if;

  if v_player.id is null then
    insert into public.bandie_open_mic_players (
      event_id, user_id, display_name, email, phone, primary_instrument, is_guest
    ) values (
      p_event_id, v_user_id, trim(p_display_name),
      nullif(trim(coalesce(p_email, '')), ''), nullif(trim(coalesce(p_phone, '')), ''),
      nullif(trim(coalesce(p_primary_instrument, '')), ''),
      v_user_id is null
    )
    returning * into v_player;
  end if;

  v_initial_status := case
    when v_event.signup_mode = 'open' then 'approved'
    else 'requested'
  end;

  insert into public.bandie_open_mic_assignments (
    event_id, event_song_id, song_slot_id, player_id, status, request_note, assigned_by
  ) values (
    p_event_id, v_song.id, p_song_slot_id, v_player.id, v_initial_status,
    nullif(trim(coalesce(p_request_note, '')), ''),
    case when v_initial_status = 'approved' then v_user_id else null end
  )
  returning * into v_assignment;

  if v_initial_status = 'approved' then
    perform public.bandie_open_mic_refresh_slot_status(p_song_slot_id);
    perform public.bandie_open_mic_refresh_song_readiness(v_song.id);
  end if;

  perform public.bandie_open_mic_log_activity(
    p_event_id, 'request_slot', 'assignment', v_assignment.id, null, to_jsonb(v_assignment)
  );

  return v_assignment;
end;
$$;

grant execute on function public.bandie_request_open_mic_slot(uuid, uuid, text, text, text, text, text) to anon, authenticated;

create or replace function public.bandie_approve_open_mic_assignment(p_assignment_id uuid)
returns public.bandie_open_mic_assignments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.bandie_open_mic_assignments;
begin
  select * into v_row from public.bandie_open_mic_assignments where id = p_assignment_id;
  if not found then raise exception 'Assignment not found'; end if;

  if not public.bandie_current_user_can_manage_open_mic_event(v_row.event_id) then
    raise exception 'Not authorised';
  end if;

  update public.bandie_open_mic_assignments
  set status = 'approved', assigned_by = auth.uid()
  where id = p_assignment_id
  returning * into v_row;

  perform public.bandie_open_mic_refresh_slot_status(v_row.song_slot_id);
  perform public.bandie_open_mic_refresh_song_readiness(v_row.event_song_id);

  return v_row;
end;
$$;

grant execute on function public.bandie_approve_open_mic_assignment(uuid) to authenticated;

create or replace function public.bandie_reject_open_mic_assignment(p_assignment_id uuid, p_note text default null)
returns public.bandie_open_mic_assignments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.bandie_open_mic_assignments;
begin
  select * into v_row from public.bandie_open_mic_assignments where id = p_assignment_id;
  if not public.bandie_current_user_can_manage_open_mic_event(v_row.event_id) then
    raise exception 'Not authorised';
  end if;

  update public.bandie_open_mic_assignments
  set status = 'rejected', organiser_note = nullif(trim(coalesce(p_note, '')), '')
  where id = p_assignment_id
  returning * into v_row;

  return v_row;
end;
$$;

grant execute on function public.bandie_reject_open_mic_assignment(uuid, text) to authenticated;

create or replace function public.bandie_submit_open_mic_song_suggestion(
  p_event_id uuid,
  p_title text,
  p_artist text default null,
  p_display_name text default null,
  p_email text default null,
  p_phone text default null,
  p_notes text default null
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
begin
  if not public.bandie_open_mic_event_is_signup_open(p_event_id) then
    raise exception 'Suggestions are not open';
  end if;

  if v_user_id is not null then
    select id into v_player_id from public.bandie_open_mic_players
    where event_id = p_event_id and user_id = v_user_id;
  elsif p_display_name is not null then
    insert into public.bandie_open_mic_players (event_id, display_name, email, phone, is_guest)
    values (p_event_id, trim(p_display_name), p_email, p_phone, true)
    returning id into v_player_id;
  end if;

  insert into public.bandie_open_mic_song_suggestions (
    event_id, player_id, suggested_by_user_id, title, artist, notes
  ) values (
    p_event_id, v_player_id, v_user_id, trim(p_title),
    nullif(trim(coalesce(p_artist, '')), ''), nullif(trim(coalesce(p_notes, '')), '')
  )
  returning * into v_row;

  return v_row;
end;
$$;

grant execute on function public.bandie_submit_open_mic_song_suggestion(uuid, text, text, text, text, text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- RPCs — Live control
-- ---------------------------------------------------------------------------

create or replace function public.bandie_start_open_mic_event(p_event_id uuid)
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
  set status = 'in_progress', updated_by = auth.uid()
  where id = p_event_id
  returning * into v_row;

  perform public.bandie_open_mic_log_activity(p_event_id, 'start_live', 'event', p_event_id, null, to_jsonb(v_row));
  return v_row;
end;
$$;

grant execute on function public.bandie_start_open_mic_event(uuid) to authenticated;

create or replace function public.bandie_update_open_mic_song_live_status(
  p_song_id uuid,
  p_live_status text
)
returns public.bandie_open_mic_songs
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.bandie_open_mic_songs;
begin
  select * into v_row from public.bandie_open_mic_songs where id = p_song_id;
  if not public.bandie_current_user_can_manage_open_mic_event(v_row.event_id) then
    raise exception 'Not authorised';
  end if;

  update public.bandie_open_mic_songs
  set live_status = p_live_status
  where id = p_song_id
  returning * into v_row;

  return v_row;
end;
$$;

grant execute on function public.bandie_update_open_mic_song_live_status(uuid, text) to authenticated;

create or replace function public.bandie_end_open_mic_event(p_event_id uuid)
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
  set status = 'completed', updated_by = auth.uid()
  where id = p_event_id
  returning * into v_row;

  perform public.bandie_open_mic_log_activity(p_event_id, 'end_live', 'event', p_event_id, null, to_jsonb(v_row));
  return v_row;
end;
$$;

grant execute on function public.bandie_end_open_mic_event(uuid) to authenticated;

-- Extend duplicate to copy songs + slots
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
        public_signup_enabled, notes, sort_order
      ) values (
        v_new_song_id, v_slot.slot_name, v_slot.required, v_slot.min_players, v_slot.max_players,
        v_slot.public_signup_enabled, v_slot.notes, v_slot.sort_order
      );
    end loop;
  end loop;

  perform public.bandie_open_mic_log_activity(
    v_new.id, 'duplicate', 'event', v_new.id, to_jsonb(v_src), to_jsonb(v_new)
  );

  return v_new;
end;
$$;

-- Public song list RPC
create or replace function public.bandie_get_public_open_mic_songs(p_slug text)
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_event public.bandie_open_mic_events;
  v_songs jsonb;
begin
  select * into v_event from public.bandie_open_mic_events
  where slug = trim(p_slug)
    and visibility in ('public', 'unlisted')
    and status not in ('draft', 'cancelled', 'archived');

  if not found or not v_event.public_song_list_enabled then
    return '[]'::jsonb;
  end if;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', s.id,
      'title', s.title,
      'artist', s.artist,
      'song_key', s.song_key,
      'duration_seconds', s.duration_seconds,
      'readiness_status', s.readiness_status,
      'sort_order', s.sort_order,
      'slots', (
        select coalesce(jsonb_agg(jsonb_build_object(
          'id', sl.id,
          'slot_name', sl.slot_name,
          'required', sl.required,
          'status', sl.status,
          'public_signup_enabled', sl.public_signup_enabled,
          'sort_order', sl.sort_order
        ) order by sl.sort_order), '[]'::jsonb)
        from public.bandie_open_mic_song_slots sl
        where sl.event_song_id = s.id and sl.public_signup_enabled = true
      )
    ) order by s.sort_order
  ), '[]'::jsonb)
  into v_songs
  from public.bandie_open_mic_songs s
  where s.event_id = v_event.id;

  return v_songs;
end;
$$;

grant execute on function public.bandie_get_public_open_mic_songs(text) to anon, authenticated;
