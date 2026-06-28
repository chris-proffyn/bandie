-- Dynamic fee packages: appearance + per-session fees calculated from set length

create table if not exists public.bandie_band_dynamic_fee_offers (
  id uuid primary key default gen_random_uuid(),
  band_id uuid not null references public.bandie_bands (id) on delete cascade,
  set_details text,
  overall_set_length_minutes integer,
  appearance_fee integer,
  session_fee integer,
  session_duration_minutes integer,
  details text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint bandie_band_dynamic_fee_offers_overall_length_check
    check (overall_set_length_minutes is null or overall_set_length_minutes > 0),
  constraint bandie_band_dynamic_fee_offers_appearance_fee_check
    check (appearance_fee is null or appearance_fee >= 0),
  constraint bandie_band_dynamic_fee_offers_session_fee_check
    check (session_fee is null or session_fee >= 0),
  constraint bandie_band_dynamic_fee_offers_session_duration_check
    check (session_duration_minutes is null or session_duration_minutes > 0)
);

create index if not exists bandie_band_dynamic_fee_offers_band_id_idx
  on public.bandie_band_dynamic_fee_offers (band_id, sort_order);

comment on table public.bandie_band_dynamic_fee_offers is
  'Session-based fee packages: appearance fee plus fee per performance session.';
comment on column public.bandie_band_dynamic_fee_offers.overall_set_length_minutes is
  'Total booked performance time in minutes used to derive session count.';
comment on column public.bandie_band_dynamic_fee_offers.session_duration_minutes is
  'Length of each session in minutes; session count = ceil(overall / duration).';

alter table public.bandie_band_dynamic_fee_offers enable row level security;

drop policy if exists "Anyone can view published band dynamic fee offers" on public.bandie_band_dynamic_fee_offers;
create policy "Anyone can view published band dynamic fee offers"
on public.bandie_band_dynamic_fee_offers
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

drop policy if exists "Bandie members can view band dynamic fee offers" on public.bandie_band_dynamic_fee_offers;
create policy "Bandie members can view band dynamic fee offers"
on public.bandie_band_dynamic_fee_offers
for select
to authenticated
using (
  public.platform_current_user_has_app_access('bandie')
  and public.bandie_current_user_is_band_member(band_id)
);

drop policy if exists "Bandie band owners can manage dynamic fee offers" on public.bandie_band_dynamic_fee_offers;
create policy "Bandie band owners can manage dynamic fee offers"
on public.bandie_band_dynamic_fee_offers
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

drop policy if exists "Bandie app admins can view all band dynamic fee offers" on public.bandie_band_dynamic_fee_offers;
create policy "Bandie app admins can view all band dynamic fee offers"
on public.bandie_band_dynamic_fee_offers
for select
to authenticated
using (public.bandie_current_user_is_app_admin());

drop policy if exists "Bandie app admins can manage all band dynamic fee offers" on public.bandie_band_dynamic_fee_offers;
create policy "Bandie app admins can manage all band dynamic fee offers"
on public.bandie_band_dynamic_fee_offers
for all
to authenticated
using (public.bandie_current_user_is_app_admin())
with check (public.bandie_current_user_is_app_admin());
