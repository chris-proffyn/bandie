-- Phase 6.2+: Song part folders, file metadata, and activity log

-- ---------------------------------------------------------------------------
-- Song part folders (logical parts; Dropbox paths optional until first upload)
-- ---------------------------------------------------------------------------

create table if not exists public.bandie_song_part_folders (
  id uuid primary key default gen_random_uuid(),
  band_id uuid not null references public.bandie_bands(id) on delete cascade,
  song_id uuid not null references public.bandie_songs(id) on delete cascade,
  part_key text not null,
  part_label text not null,
  sort_order integer not null default 0,
  required_for_readiness boolean not null default true,
  dropbox_folder_id text,
  dropbox_path_lower text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bandie_song_part_folders_song_part_unique unique (song_id, part_key)
);

create index if not exists bandie_song_part_folders_band_id_idx
  on public.bandie_song_part_folders (band_id);

create index if not exists bandie_song_part_folders_song_id_idx
  on public.bandie_song_part_folders (song_id);

drop trigger if exists bandie_song_part_folders_set_updated_at on public.bandie_song_part_folders;
create trigger bandie_song_part_folders_set_updated_at
before update on public.bandie_song_part_folders
for each row execute function public.set_updated_at();

alter table public.bandie_song_part_folders enable row level security;

drop policy if exists "Band members can view song part folders" on public.bandie_song_part_folders;
create policy "Band members can view song part folders"
on public.bandie_song_part_folders
for select
to authenticated
using (
  public.platform_current_user_has_app_access('bandie')
  and public.bandie_current_user_is_band_member(band_id)
);

drop policy if exists "Band members can create song part folders" on public.bandie_song_part_folders;
create policy "Band members can create song part folders"
on public.bandie_song_part_folders
for insert
to authenticated
with check (
  public.platform_current_user_has_app_access('bandie')
  and public.bandie_current_user_is_band_member(band_id)
);

drop policy if exists "Band members can update song part folders" on public.bandie_song_part_folders;
create policy "Band members can update song part folders"
on public.bandie_song_part_folders
for update
to authenticated
using (
  public.platform_current_user_has_app_access('bandie')
  and public.bandie_current_user_is_band_member(band_id)
)
with check (
  public.platform_current_user_has_app_access('bandie')
  and public.bandie_current_user_is_band_member(band_id)
);

-- ---------------------------------------------------------------------------
-- Song part files (metadata only — bytes in Dropbox)
-- ---------------------------------------------------------------------------

create table if not exists public.bandie_song_part_files (
  id uuid primary key default gen_random_uuid(),
  band_id uuid not null references public.bandie_bands(id) on delete cascade,
  song_id uuid not null references public.bandie_songs(id) on delete cascade,
  song_part_folder_id uuid not null references public.bandie_song_part_folders(id) on delete cascade,
  storage_id uuid references public.bandie_band_song_part_storage(id) on delete set null,
  source text not null check (source in ('dropbox')),
  provider text not null default 'dropbox',
  display_name text not null,
  mime_type text,
  file_size_bytes bigint,
  dropbox_file_id text,
  dropbox_path_lower text,
  dropbox_rev text,
  dropbox_content_hash text,
  status text not null default 'current'
    check (status in ('current', 'draft', 'reference', 'superseded', 'archived', 'unavailable')),
  version_label text,
  visibility text not null default 'band_members'
    check (visibility in ('band_members', 'selected_members', 'setlist_guest')),
  added_by_user_id uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bandie_song_part_files_size_nonneg
    check (file_size_bytes is null or file_size_bytes >= 0)
);

create index if not exists bandie_song_part_files_band_id_idx
  on public.bandie_song_part_files (band_id);

create index if not exists bandie_song_part_files_song_id_idx
  on public.bandie_song_part_files (song_id);

create index if not exists bandie_song_part_files_folder_id_idx
  on public.bandie_song_part_files (song_part_folder_id);

create index if not exists bandie_song_part_files_created_at_idx
  on public.bandie_song_part_files (created_at desc);

drop trigger if exists bandie_song_part_files_set_updated_at on public.bandie_song_part_files;
create trigger bandie_song_part_files_set_updated_at
before update on public.bandie_song_part_files
for each row execute function public.set_updated_at();

alter table public.bandie_song_part_files enable row level security;

drop policy if exists "Band members can view song part files" on public.bandie_song_part_files;
create policy "Band members can view song part files"
on public.bandie_song_part_files
for select
to authenticated
using (
  public.platform_current_user_has_app_access('bandie')
  and public.bandie_current_user_is_band_member(band_id)
);

-- Inserts/updates for file metadata are server-side (Netlify functions use service role).

-- ---------------------------------------------------------------------------
-- Song part file activity
-- ---------------------------------------------------------------------------

create table if not exists public.bandie_song_part_file_activity (
  id uuid primary key default gen_random_uuid(),
  band_id uuid not null references public.bandie_bands(id) on delete cascade,
  song_id uuid references public.bandie_songs(id) on delete cascade,
  song_part_folder_id uuid references public.bandie_song_part_folders(id) on delete set null,
  file_id uuid references public.bandie_song_part_files(id) on delete set null,
  actor_user_id uuid references auth.users(id),
  action text not null,
  provider text default 'dropbox',
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists bandie_song_part_file_activity_band_id_idx
  on public.bandie_song_part_file_activity (band_id, created_at desc);

create index if not exists bandie_song_part_file_activity_song_id_idx
  on public.bandie_song_part_file_activity (song_id, created_at desc);

alter table public.bandie_song_part_file_activity enable row level security;

drop policy if exists "Band members can view song part file activity" on public.bandie_song_part_file_activity;
create policy "Band members can view song part file activity"
on public.bandie_song_part_file_activity
for select
to authenticated
using (
  public.platform_current_user_has_app_access('bandie')
  and public.bandie_current_user_is_band_member(band_id)
);

-- Activity inserts are server-side only.
