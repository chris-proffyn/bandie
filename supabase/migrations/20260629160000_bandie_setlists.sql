-- Phase 7: Setlist management

create table if not exists public.bandie_setlists (
  id uuid primary key default gen_random_uuid(),
  band_id uuid not null references public.bandie_bands(id) on delete cascade,
  title text not null,
  slug text not null,
  description text,
  status text not null default 'draft'
    check (status in ('draft', 'needs_rehearsal', 'needs_specific_part', 'gig_ready', 'archived')),
  vibe text,
  notes text,
  times_used integer not null default 0,
  last_used_at timestamptz,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bandie_setlists_title_check check (char_length(trim(title)) > 0),
  constraint bandie_setlists_times_used_nonneg check (times_used >= 0)
);

create unique index if not exists bandie_setlists_band_slug_unique
  on public.bandie_setlists (band_id, slug);

create index if not exists bandie_setlists_band_id_idx
  on public.bandie_setlists (band_id, updated_at desc);

drop trigger if exists bandie_setlists_set_updated_at on public.bandie_setlists;
create trigger bandie_setlists_set_updated_at
before update on public.bandie_setlists
for each row execute function public.set_updated_at();

alter table public.bandie_setlists enable row level security;

drop policy if exists "Band members can view setlists" on public.bandie_setlists;
create policy "Band members can view setlists"
on public.bandie_setlists
for select
to authenticated
using (
  public.platform_current_user_has_app_access('bandie')
  and public.bandie_current_user_is_band_member(band_id)
);

drop policy if exists "Band leaders can create setlists" on public.bandie_setlists;
create policy "Band leaders can create setlists"
on public.bandie_setlists
for insert
to authenticated
with check (
  public.platform_current_user_has_app_access('bandie')
  and public.bandie_current_user_owns_band(band_id)
  and created_by = auth.uid()
);

drop policy if exists "Band leaders can update setlists" on public.bandie_setlists;
create policy "Band leaders can update setlists"
on public.bandie_setlists
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

drop policy if exists "Band leaders can delete setlists" on public.bandie_setlists;
create policy "Band leaders can delete setlists"
on public.bandie_setlists
for delete
to authenticated
using (
  public.platform_current_user_has_app_access('bandie')
  and public.bandie_current_user_owns_band(band_id)
);

-- ---------------------------------------------------------------------------
-- Setlist items (running order)
-- ---------------------------------------------------------------------------

create table if not exists public.bandie_setlist_items (
  id uuid primary key default gen_random_uuid(),
  band_id uuid not null references public.bandie_bands(id) on delete cascade,
  setlist_id uuid not null references public.bandie_setlists(id) on delete cascade,
  song_id uuid not null references public.bandie_songs(id) on delete restrict,
  sort_order integer not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bandie_setlist_items_setlist_song_unique unique (setlist_id, song_id),
  constraint bandie_setlist_items_sort_order_nonneg check (sort_order >= 0)
);

create index if not exists bandie_setlist_items_setlist_id_idx
  on public.bandie_setlist_items (setlist_id, sort_order);

create index if not exists bandie_setlist_items_band_id_idx
  on public.bandie_setlist_items (band_id);

drop trigger if exists bandie_setlist_items_set_updated_at on public.bandie_setlist_items;
create trigger bandie_setlist_items_set_updated_at
before update on public.bandie_setlist_items
for each row execute function public.set_updated_at();

alter table public.bandie_setlist_items enable row level security;

drop policy if exists "Band members can view setlist items" on public.bandie_setlist_items;
create policy "Band members can view setlist items"
on public.bandie_setlist_items
for select
to authenticated
using (
  public.platform_current_user_has_app_access('bandie')
  and public.bandie_current_user_is_band_member(band_id)
);

drop policy if exists "Band leaders can insert setlist items" on public.bandie_setlist_items;
create policy "Band leaders can insert setlist items"
on public.bandie_setlist_items
for insert
to authenticated
with check (
  public.platform_current_user_has_app_access('bandie')
  and public.bandie_current_user_owns_band(band_id)
);

drop policy if exists "Band leaders can update setlist items" on public.bandie_setlist_items;
create policy "Band leaders can update setlist items"
on public.bandie_setlist_items
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

drop policy if exists "Band leaders can delete setlist items" on public.bandie_setlist_items;
create policy "Band leaders can delete setlist items"
on public.bandie_setlist_items
for delete
to authenticated
using (
  public.platform_current_user_has_app_access('bandie')
  and public.bandie_current_user_owns_band(band_id)
);
