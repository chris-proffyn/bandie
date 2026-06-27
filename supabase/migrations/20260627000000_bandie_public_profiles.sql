-- Public band profile fields, media, social links, and manual availability dates

alter table public.bandie_bands
  add column if not exists genres text[] not null default '{}',
  add column if not exists tagline text,
  add column if not exists logo_url text,
  add column if not exists hero_image_url text,
  add column if not exists booking_email text,
  add column if not exists booking_phone text,
  add column if not exists fee_guidance_min integer,
  add column if not exists fee_guidance_max integer,
  add column if not exists band_size integer,
  add column if not exists set_length_minutes integer,
  add column if not exists equipment_notes text,
  add column if not exists availability_status text not null default 'available',
  add column if not exists availability_note text;

alter table public.bandie_bands
  drop constraint if exists bandie_bands_availability_status_check;

alter table public.bandie_bands
  add constraint bandie_bands_availability_status_check
  check (availability_status in ('available', 'limited', 'unavailable'));

create table if not exists public.bandie_band_media (
  id uuid primary key default gen_random_uuid(),
  band_id uuid not null references public.bandie_bands(id) on delete cascade,
  kind text not null,
  title text,
  url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),

  constraint bandie_band_media_kind_check
    check (kind in ('photo', 'video', 'track'))
);

create index if not exists bandie_band_media_band_id_idx
  on public.bandie_band_media (band_id, sort_order);

create table if not exists public.bandie_band_social_links (
  id uuid primary key default gen_random_uuid(),
  band_id uuid not null references public.bandie_bands(id) on delete cascade,
  platform text not null,
  label text,
  url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),

  constraint bandie_band_social_links_platform_check
    check (platform in ('instagram', 'youtube', 'spotify', 'bandcamp', 'facebook', 'website', 'other'))
);

create index if not exists bandie_band_social_links_band_id_idx
  on public.bandie_band_social_links (band_id, sort_order);

create table if not exists public.bandie_band_public_dates (
  id uuid primary key default gen_random_uuid(),
  band_id uuid not null references public.bandie_bands(id) on delete cascade,
  event_date date not null,
  title text,
  status text not null default 'confirmed',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),

  constraint bandie_band_public_dates_status_check
    check (status in ('confirmed', 'provisional'))
);

create index if not exists bandie_band_public_dates_band_id_idx
  on public.bandie_band_public_dates (band_id, event_date);

alter table public.bandie_band_media enable row level security;
alter table public.bandie_band_social_links enable row level security;
alter table public.bandie_band_public_dates enable row level security;

-- Public read for published profiles
drop policy if exists "Anyone can view published band profiles" on public.bandie_bands;
create policy "Anyone can view published band profiles"
on public.bandie_bands
for select
to anon, authenticated
using (public_profile_enabled = true);

drop policy if exists "Anyone can view published band media" on public.bandie_band_media;
create policy "Anyone can view published band media"
on public.bandie_band_media
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.bandie_bands b
    where b.id = band_id
      and b.public_profile_enabled = true
  )
);

drop policy if exists "Anyone can view published band social links" on public.bandie_band_social_links;
create policy "Anyone can view published band social links"
on public.bandie_band_social_links
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.bandie_bands b
    where b.id = band_id
      and b.public_profile_enabled = true
  )
);

drop policy if exists "Anyone can view published band availability" on public.bandie_band_public_dates;
create policy "Anyone can view published band availability"
on public.bandie_band_public_dates
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.bandie_bands b
    where b.id = band_id
      and b.public_profile_enabled = true
  )
);

-- Band members can read profile data for their bands (published or not)
drop policy if exists "Bandie members can view band media" on public.bandie_band_media;
create policy "Bandie members can view band media"
on public.bandie_band_media
for select
to authenticated
using (
  public.platform_current_user_has_app_access('bandie')
  and public.bandie_current_user_is_band_member(band_id)
);

drop policy if exists "Bandie members can view band social links" on public.bandie_band_social_links;
create policy "Bandie members can view band social links"
on public.bandie_band_social_links
for select
to authenticated
using (
  public.platform_current_user_has_app_access('bandie')
  and public.bandie_current_user_is_band_member(band_id)
);

drop policy if exists "Bandie members can view band public dates" on public.bandie_band_public_dates;
create policy "Bandie members can view band public dates"
on public.bandie_band_public_dates
for select
to authenticated
using (
  public.platform_current_user_has_app_access('bandie')
  and public.bandie_current_user_is_band_member(band_id)
);

-- Band owners manage profile content
drop policy if exists "Bandie band owners can manage media" on public.bandie_band_media;
create policy "Bandie band owners can manage media"
on public.bandie_band_media
for all
to authenticated
using (
  public.platform_current_user_has_app_access('bandie')
  and exists (
    select 1
    from public.bandie_bands b
    where b.id = band_id
      and b.owner_user_id = auth.uid()
  )
)
with check (
  public.platform_current_user_has_app_access('bandie')
  and exists (
    select 1
    from public.bandie_bands b
    where b.id = band_id
      and b.owner_user_id = auth.uid()
  )
);

drop policy if exists "Bandie band owners can manage social links" on public.bandie_band_social_links;
create policy "Bandie band owners can manage social links"
on public.bandie_band_social_links
for all
to authenticated
using (
  public.platform_current_user_has_app_access('bandie')
  and exists (
    select 1
    from public.bandie_bands b
    where b.id = band_id
      and b.owner_user_id = auth.uid()
  )
)
with check (
  public.platform_current_user_has_app_access('bandie')
  and exists (
    select 1
    from public.bandie_bands b
    where b.id = band_id
      and b.owner_user_id = auth.uid()
  )
);

drop policy if exists "Bandie band owners can manage public dates" on public.bandie_band_public_dates;
create policy "Bandie band owners can manage public dates"
on public.bandie_band_public_dates
for all
to authenticated
using (
  public.platform_current_user_has_app_access('bandie')
  and exists (
    select 1
    from public.bandie_bands b
    where b.id = band_id
      and b.owner_user_id = auth.uid()
  )
)
with check (
  public.platform_current_user_has_app_access('bandie')
  and exists (
    select 1
    from public.bandie_bands b
    where b.id = band_id
      and b.owner_user_id = auth.uid()
  )
);
