-- Organiser venues: pubs, clubs and event spaces an organiser manages or is associated with.

create table if not exists public.bandie_organiser_venues (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  venue_type text,
  address_line1 text,
  address_line2 text,
  city text,
  postcode text,
  contact_name text,
  contact_email text,
  contact_phone text,
  capacity integer,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bandie_organiser_venues_name_not_blank check (char_length(trim(name)) > 0),
  constraint bandie_organiser_venues_capacity_positive check (capacity is null or capacity > 0)
);

create index if not exists bandie_organiser_venues_owner_idx
  on public.bandie_organiser_venues (owner_user_id, created_at desc);

comment on table public.bandie_organiser_venues is
  'Venues managed or associated with an event organiser (pub, club, festival site, etc.).';

create or replace function public.bandie_current_user_is_organiser()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.bandie_profiles p
    where p.user_id = auth.uid()
      and p.is_organiser = true
  );
$$;

grant execute on function public.bandie_current_user_is_organiser() to authenticated;

create or replace function public.bandie_organiser_venues_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists bandie_organiser_venues_set_updated_at on public.bandie_organiser_venues;

create trigger bandie_organiser_venues_set_updated_at
before update on public.bandie_organiser_venues
for each row
execute function public.bandie_organiser_venues_set_updated_at();

alter table public.bandie_organiser_venues enable row level security;

drop policy if exists "Organisers can view own venues" on public.bandie_organiser_venues;
create policy "Organisers can view own venues"
on public.bandie_organiser_venues
for select
to authenticated
using (
  public.platform_current_user_has_app_access('bandie')
  and owner_user_id = auth.uid()
);

drop policy if exists "Organisers can insert own venues" on public.bandie_organiser_venues;
create policy "Organisers can insert own venues"
on public.bandie_organiser_venues
for insert
to authenticated
with check (
  public.platform_current_user_has_app_access('bandie')
  and owner_user_id = auth.uid()
  and public.bandie_current_user_is_organiser()
);

drop policy if exists "Organisers can update own venues" on public.bandie_organiser_venues;
create policy "Organisers can update own venues"
on public.bandie_organiser_venues
for update
to authenticated
using (
  public.platform_current_user_has_app_access('bandie')
  and owner_user_id = auth.uid()
)
with check (
  public.platform_current_user_has_app_access('bandie')
  and owner_user_id = auth.uid()
);

drop policy if exists "Organisers can delete own venues" on public.bandie_organiser_venues;
create policy "Organisers can delete own venues"
on public.bandie_organiser_venues
for delete
to authenticated
using (
  public.platform_current_user_has_app_access('bandie')
  and owner_user_id = auth.uid()
);

drop policy if exists "Bandie app admins can view all organiser venues" on public.bandie_organiser_venues;
create policy "Bandie app admins can view all organiser venues"
on public.bandie_organiser_venues
for select
to authenticated
using (public.bandie_current_user_is_app_admin());

drop policy if exists "Bandie app admins can manage all organiser venues" on public.bandie_organiser_venues;
create policy "Bandie app admins can manage all organiser venues"
on public.bandie_organiser_venues
for all
to authenticated
using (public.bandie_current_user_is_app_admin())
with check (public.bandie_current_user_is_app_admin());
