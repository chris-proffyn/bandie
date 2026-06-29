-- Phase 10: Gig management

create table if not exists public.bandie_gigs (
  id uuid primary key default gen_random_uuid(),
  band_id uuid not null references public.bandie_bands(id) on delete cascade,
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  venue_name text,
  venue_address text,
  status text not null default 'enquiry'
    check (status in ('enquiry', 'proposed', 'confirmed', 'completed', 'cancelled', 'archived')),
  setlist_id uuid references public.bandie_setlists(id) on delete set null,
  calendar_event_id uuid references public.bandie_calendar_events(id) on delete set null,
  notes text,
  fee_notes text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bandie_gigs_title_check check (char_length(trim(title)) > 0)
);

create index if not exists bandie_gigs_band_starts_idx
  on public.bandie_gigs (band_id, starts_at desc);

create index if not exists bandie_gigs_band_status_idx
  on public.bandie_gigs (band_id, status);

drop trigger if exists bandie_gigs_set_updated_at on public.bandie_gigs;
create trigger bandie_gigs_set_updated_at
before update on public.bandie_gigs
for each row execute function public.set_updated_at();

alter table public.bandie_gigs enable row level security;

drop policy if exists "Band members can view gigs" on public.bandie_gigs;
create policy "Band members can view gigs"
on public.bandie_gigs
for select
to authenticated
using (
  public.platform_current_user_has_app_access('bandie')
  and public.bandie_current_user_is_band_member(band_id)
);

drop policy if exists "Band leaders can insert gigs" on public.bandie_gigs;
create policy "Band leaders can insert gigs"
on public.bandie_gigs
for insert
to authenticated
with check (
  public.platform_current_user_has_app_access('bandie')
  and public.bandie_current_user_owns_band(band_id)
  and created_by = auth.uid()
);

drop policy if exists "Band leaders can update gigs" on public.bandie_gigs;
create policy "Band leaders can update gigs"
on public.bandie_gigs
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

drop policy if exists "Band leaders can delete gigs" on public.bandie_gigs;
create policy "Band leaders can delete gigs"
on public.bandie_gigs
for delete
to authenticated
using (
  public.platform_current_user_has_app_access('bandie')
  and public.bandie_current_user_owns_band(band_id)
);
