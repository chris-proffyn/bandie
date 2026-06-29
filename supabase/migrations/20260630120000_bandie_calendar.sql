-- Phase 9: Calendar and availability

create table if not exists public.bandie_calendar_events (
  id uuid primary key default gen_random_uuid(),
  band_id uuid not null references public.bandie_bands(id) on delete cascade,
  event_type text not null check (event_type in ('rehearsal', 'gig_availability')),
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  location text,
  notes text,
  series_key uuid,
  repeat_pattern text,
  availability_status text not null default 'proposed'
    check (availability_status in ('proposed', 'provisional', 'confirmed')),
  publish_public boolean not null default false,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bandie_calendar_events_title_check check (char_length(trim(title)) > 0)
);

create index if not exists bandie_calendar_events_band_starts_idx
  on public.bandie_calendar_events (band_id, starts_at);

create index if not exists bandie_calendar_events_band_type_idx
  on public.bandie_calendar_events (band_id, event_type, availability_status);

drop trigger if exists bandie_calendar_events_set_updated_at on public.bandie_calendar_events;
create trigger bandie_calendar_events_set_updated_at
before update on public.bandie_calendar_events
for each row execute function public.set_updated_at();

create table if not exists public.bandie_availability_votes (
  id uuid primary key default gen_random_uuid(),
  calendar_event_id uuid not null references public.bandie_calendar_events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  vote text not null default 'pending'
    check (vote in ('available', 'maybe', 'no', 'pending')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bandie_availability_votes_unique unique (calendar_event_id, user_id)
);

create index if not exists bandie_availability_votes_event_idx
  on public.bandie_availability_votes (calendar_event_id);

drop trigger if exists bandie_availability_votes_set_updated_at on public.bandie_availability_votes;
create trigger bandie_availability_votes_set_updated_at
before update on public.bandie_availability_votes
for each row execute function public.set_updated_at();

alter table public.bandie_calendar_events enable row level security;
alter table public.bandie_availability_votes enable row level security;

drop policy if exists "Band members can view calendar events" on public.bandie_calendar_events;
create policy "Band members can view calendar events"
on public.bandie_calendar_events
for select
to authenticated
using (
  public.platform_current_user_has_app_access('bandie')
  and public.bandie_current_user_is_band_member(band_id)
);

drop policy if exists "Anyone can view public gig availability" on public.bandie_calendar_events;
create policy "Anyone can view public gig availability"
on public.bandie_calendar_events
for select
to anon, authenticated
using (
  event_type = 'gig_availability'
  and publish_public = true
  and availability_status in ('confirmed', 'provisional')
  and exists (
    select 1
    from public.bandie_bands b
    where b.id = band_id
      and b.public_profile_enabled = true
  )
);

drop policy if exists "Band leaders can manage calendar events" on public.bandie_calendar_events;
drop policy if exists "Band leaders can insert calendar events" on public.bandie_calendar_events;
drop policy if exists "Band leaders can update calendar events" on public.bandie_calendar_events;
drop policy if exists "Band leaders can delete calendar events" on public.bandie_calendar_events;

create policy "Band leaders can insert calendar events"
on public.bandie_calendar_events
for insert
to authenticated
with check (
  public.platform_current_user_has_app_access('bandie')
  and public.bandie_current_user_owns_band(band_id)
  and created_by = auth.uid()
);

create policy "Band leaders can update calendar events"
on public.bandie_calendar_events
for update
to authenticated
using (
  public.platform_current_user_has_app_access('bandie')
  and public.bandie_current_user_owns_band(band_id)
)
with check (
  public.platform_current_user_has_app_access('bandie')
  and public.bandie_current_user_owns_band(band_id)
);

create policy "Band leaders can delete calendar events"
on public.bandie_calendar_events
for delete
to authenticated
using (
  public.platform_current_user_has_app_access('bandie')
  and public.bandie_current_user_owns_band(band_id)
);

alter table public.bandie_band_public_dates
  add column if not exists source_calendar_event_id uuid
    references public.bandie_calendar_events(id) on delete cascade;

create unique index if not exists bandie_band_public_dates_calendar_event_idx
  on public.bandie_band_public_dates (source_calendar_event_id)
  where source_calendar_event_id is not null;

drop policy if exists "Band members can view availability votes" on public.bandie_availability_votes;
create policy "Band members can view availability votes"
on public.bandie_availability_votes
for select
to authenticated
using (
  public.platform_current_user_has_app_access('bandie')
  and exists (
    select 1
    from public.bandie_calendar_events e
    where e.id = calendar_event_id
      and public.bandie_current_user_is_band_member(e.band_id)
  )
);

drop policy if exists "Band members can vote on calendar events" on public.bandie_availability_votes;
create policy "Band members can vote on calendar events"
on public.bandie_availability_votes
for all
to authenticated
using (
  public.platform_current_user_has_app_access('bandie')
  and user_id = auth.uid()
  and exists (
    select 1
    from public.bandie_calendar_events e
    where e.id = calendar_event_id
      and public.bandie_current_user_is_band_member(e.band_id)
  )
)
with check (
  public.platform_current_user_has_app_access('bandie')
  and user_id = auth.uid()
  and exists (
    select 1
    from public.bandie_calendar_events e
    where e.id = calendar_event_id
      and public.bandie_current_user_is_band_member(e.band_id)
  )
);

-- Recompute gig availability status from member votes
create or replace function public.bandie_recompute_calendar_event_status(p_event_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event public.bandie_calendar_events%rowtype;
  v_member_count integer;
  v_yes_count integer;
  v_new_status text;
  v_publish boolean;
begin
  select * into v_event from public.bandie_calendar_events where id = p_event_id;
  if not found then
    return;
  end if;

  if v_event.event_type <> 'gig_availability' then
    return;
  end if;

  select count(*)::integer into v_member_count
  from public.bandie_band_members m
  where m.band_id = v_event.band_id
    and m.status = 'active';

  if v_member_count = 0 then
    v_new_status := 'proposed';
  else
    select count(*)::integer into v_yes_count
    from public.bandie_availability_votes v
    where v.calendar_event_id = p_event_id
      and v.vote = 'available';

    if v_yes_count = v_member_count then
      v_new_status := 'confirmed';
    elsif (v_yes_count::numeric / v_member_count::numeric) > 0.5 then
      v_new_status := 'provisional';
    else
      v_new_status := 'proposed';
    end if;
  end if;

  v_publish := v_new_status in ('confirmed', 'provisional');

  update public.bandie_calendar_events
  set
    availability_status = v_new_status,
    publish_public = v_publish,
    updated_at = now()
  where id = p_event_id;

  delete from public.bandie_band_public_dates
  where source_calendar_event_id = p_event_id;

  if v_publish then
    insert into public.bandie_band_public_dates (
      band_id,
      event_date,
      title,
      status,
      source_calendar_event_id
    )
    values (
      v_event.band_id,
      (v_event.starts_at at time zone 'utc')::date,
      v_event.title,
      case when v_new_status = 'confirmed' then 'confirmed' else 'provisional' end,
      p_event_id
    )
    on conflict (source_calendar_event_id) do update
    set
      event_date = excluded.event_date,
      title = excluded.title,
      status = excluded.status;
  end if;
end;
$$;

grant execute on function public.bandie_recompute_calendar_event_status(uuid) to authenticated;

create or replace function public.bandie_after_availability_vote_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.bandie_recompute_calendar_event_status(
    coalesce(new.calendar_event_id, old.calendar_event_id)
  );
  return coalesce(new, old);
end;
$$;

drop trigger if exists bandie_availability_votes_recompute_status on public.bandie_availability_votes;
create trigger bandie_availability_votes_recompute_status
after insert or update or delete on public.bandie_availability_votes
for each row execute function public.bandie_after_availability_vote_change();

create or replace function public.bandie_seed_calendar_event_votes(p_event_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_band_id uuid;
begin
  select band_id into v_band_id from public.bandie_calendar_events where id = p_event_id;
  if v_band_id is null then
    return;
  end if;

  insert into public.bandie_availability_votes (calendar_event_id, user_id, vote)
  select p_event_id, m.user_id, 'pending'
  from public.bandie_band_members m
  where m.band_id = v_band_id
    and m.status = 'active'
  on conflict (calendar_event_id, user_id) do nothing;
end;
$$;

grant execute on function public.bandie_seed_calendar_event_votes(uuid) to authenticated;
