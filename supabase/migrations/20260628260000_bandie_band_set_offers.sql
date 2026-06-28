-- Multiple set length & fee packages per band

create table if not exists public.bandie_band_set_offers (
  id uuid primary key default gen_random_uuid(),
  band_id uuid not null references public.bandie_bands (id) on delete cascade,
  set_length_minutes integer,
  set_details text,
  average_fee integer,
  details text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint bandie_band_set_offers_set_length_check
    check (set_length_minutes is null or set_length_minutes > 0),
  constraint bandie_band_set_offers_average_fee_check
    check (average_fee is null or average_fee >= 0)
);

create index if not exists bandie_band_set_offers_band_id_idx
  on public.bandie_band_set_offers (band_id, sort_order);

comment on table public.bandie_band_set_offers is
  'Bookable set packages with length, structure, and fee guidance.';
comment on column public.bandie_band_set_offers.set_length_minutes is
  'Overall performance length in minutes.';
comment on column public.bandie_band_set_offers.set_details is
  'Human-readable set structure, e.g. 2×45 mins.';
comment on column public.bandie_band_set_offers.average_fee is
  'Typical fee for this package in GBP.';
comment on column public.bandie_band_set_offers.details is
  'Additional booking notes for this package.';

alter table public.bandie_band_set_offers enable row level security;

-- Public read for published bands
drop policy if exists "Anyone can view published band set offers" on public.bandie_band_set_offers;
create policy "Anyone can view published band set offers"
on public.bandie_band_set_offers
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

-- Band members can read set offers for their bands
drop policy if exists "Bandie members can view band set offers" on public.bandie_band_set_offers;
create policy "Bandie members can view band set offers"
on public.bandie_band_set_offers
for select
to authenticated
using (
  public.platform_current_user_has_app_access('bandie')
  and public.bandie_current_user_is_band_member(band_id)
);

-- Band leaders manage set offers
drop policy if exists "Bandie band owners can manage set offers" on public.bandie_band_set_offers;
create policy "Bandie band owners can manage set offers"
on public.bandie_band_set_offers
for all
to authenticated
using (
  public.platform_current_user_has_app_access('bandie')
  and public.bandie_current_user_owns_band(band_id)
)
with check (
  public.platform_current_user_has_app_access('bandie')
  and public.bandie_current_user_owns_band(band_id)
);

-- App admins
drop policy if exists "Bandie app admins can view all band set offers" on public.bandie_band_set_offers;
create policy "Bandie app admins can view all band set offers"
on public.bandie_band_set_offers
for select
to authenticated
using (public.bandie_current_user_is_app_admin());

drop policy if exists "Bandie app admins can manage all band set offers" on public.bandie_band_set_offers;
create policy "Bandie app admins can manage all band set offers"
on public.bandie_band_set_offers
for all
to authenticated
using (public.bandie_current_user_is_app_admin())
with check (public.bandie_current_user_is_app_admin());

-- Backfill a single offer from legacy band columns
insert into public.bandie_band_set_offers (
  band_id,
  set_length_minutes,
  average_fee,
  sort_order
)
select
  b.id,
  b.set_length_minutes,
  case
    when b.fee_guidance_min is not null and b.fee_guidance_max is not null
      then round((b.fee_guidance_min + b.fee_guidance_max) / 2.0)::integer
    when b.fee_guidance_min is not null then b.fee_guidance_min
    when b.fee_guidance_max is not null then b.fee_guidance_max
    else null
  end,
  0
from public.bandie_bands b
where not exists (
  select 1
  from public.bandie_band_set_offers o
  where o.band_id = b.id
)
and (
  b.set_length_minutes is not null
  or b.fee_guidance_min is not null
  or b.fee_guidance_max is not null
);
