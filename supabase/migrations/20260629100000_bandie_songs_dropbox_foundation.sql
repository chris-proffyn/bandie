-- Phase 6.1: Songs repertoire model + Dropbox integration foundation

-- ---------------------------------------------------------------------------
-- Songs
-- ---------------------------------------------------------------------------

create table if not exists public.bandie_songs (
  id uuid primary key default gen_random_uuid(),
  band_id uuid not null references public.bandie_bands(id) on delete cascade,
  title text not null,
  slug text not null,
  artist text,
  genre text,
  song_key text,
  duration_seconds integer,
  readiness_status text not null default 'not_started'
    check (readiness_status in ('not_started', 'in_progress', 'ready', 'needs_review')),
  times_played integer not null default 0,
  notes text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint bandie_songs_band_slug_unique unique (band_id, slug),
  constraint bandie_songs_times_played_nonneg check (times_played >= 0),
  constraint bandie_songs_duration_nonneg check (duration_seconds is null or duration_seconds >= 0)
);

create index if not exists bandie_songs_band_id_idx
  on public.bandie_songs (band_id);

create index if not exists bandie_songs_created_at_idx
  on public.bandie_songs (created_at desc);

drop trigger if exists bandie_songs_set_updated_at on public.bandie_songs;
create trigger bandie_songs_set_updated_at
before update on public.bandie_songs
for each row execute function public.set_updated_at();

alter table public.bandie_songs enable row level security;

drop policy if exists "Band members can view songs" on public.bandie_songs;
create policy "Band members can view songs"
on public.bandie_songs
for select
to authenticated
using (
  public.platform_current_user_has_app_access('bandie')
  and public.bandie_current_user_is_band_member(band_id)
);

drop policy if exists "Band members can create songs" on public.bandie_songs;
create policy "Band members can create songs"
on public.bandie_songs
for insert
to authenticated
with check (
  public.platform_current_user_has_app_access('bandie')
  and public.bandie_current_user_is_band_member(band_id)
  and created_by = auth.uid()
);

drop policy if exists "Band members can update songs" on public.bandie_songs;
create policy "Band members can update songs"
on public.bandie_songs
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

drop policy if exists "Band leaders can delete songs" on public.bandie_songs;
create policy "Band leaders can delete songs"
on public.bandie_songs
for delete
to authenticated
using (
  public.platform_current_user_has_app_access('bandie')
  and public.bandie_current_user_owns_band(band_id)
);

-- ---------------------------------------------------------------------------
-- User integrations (safe columns only — tokens live in secrets table)
-- ---------------------------------------------------------------------------

create table if not exists public.bandie_user_integrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  provider text not null check (provider in ('dropbox')),
  provider_account_id text,
  provider_account_email text,

  access_type text not null default 'app_folder',
  token_expires_at timestamptz,

  status text not null default 'connected'
    check (status in ('connected', 'needs_reconnect', 'disconnected', 'revoked')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint bandie_user_integrations_user_provider_unique unique (user_id, provider)
);

create index if not exists bandie_user_integrations_user_id_idx
  on public.bandie_user_integrations (user_id);

drop trigger if exists bandie_user_integrations_set_updated_at on public.bandie_user_integrations;
create trigger bandie_user_integrations_set_updated_at
before update on public.bandie_user_integrations
for each row execute function public.set_updated_at();

alter table public.bandie_user_integrations enable row level security;

drop policy if exists "Users can view own integrations" on public.bandie_user_integrations;
create policy "Users can view own integrations"
on public.bandie_user_integrations
for select
to authenticated
using (
  public.platform_current_user_has_app_access('bandie')
  and user_id = auth.uid()
);

drop policy if exists "Users can update own integration status" on public.bandie_user_integrations;
create policy "Users can update own integration status"
on public.bandie_user_integrations
for update
to authenticated
using (
  public.platform_current_user_has_app_access('bandie')
  and user_id = auth.uid()
)
with check (
  public.platform_current_user_has_app_access('bandie')
  and user_id = auth.uid()
);

-- Inserts/deletes for integrations are server-side only (service role).

-- ---------------------------------------------------------------------------
-- Integration secrets (server-side only — no client policies)
-- ---------------------------------------------------------------------------

create table if not exists public.bandie_user_integration_secrets (
  integration_id uuid primary key
    references public.bandie_user_integrations(id) on delete cascade,
  encrypted_access_token text not null,
  encrypted_refresh_token text,
  updated_at timestamptz not null default now()
);

drop trigger if exists bandie_user_integration_secrets_set_updated_at
  on public.bandie_user_integration_secrets;
create trigger bandie_user_integration_secrets_set_updated_at
before update on public.bandie_user_integration_secrets
for each row execute function public.set_updated_at();

alter table public.bandie_user_integration_secrets enable row level security;

-- No policies: authenticated users cannot read or write tokens.

-- ---------------------------------------------------------------------------
-- OAuth state (server-side only)
-- ---------------------------------------------------------------------------

create table if not exists public.bandie_integration_oauth_states (
  id uuid primary key default gen_random_uuid(),
  state_hash text not null unique,
  user_id uuid not null references auth.users(id) on delete cascade,
  band_id uuid references public.bandie_bands(id) on delete cascade,
  purpose text not null default 'song_part_storage',
  payload jsonb not null default '{}'::jsonb,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists bandie_integration_oauth_states_expires_at_idx
  on public.bandie_integration_oauth_states (expires_at);

alter table public.bandie_integration_oauth_states enable row level security;

-- No policies: OAuth state is managed by server functions only.

-- ---------------------------------------------------------------------------
-- Band song-part storage mapping
-- ---------------------------------------------------------------------------

create table if not exists public.bandie_band_song_part_storage (
  id uuid primary key default gen_random_uuid(),

  band_id uuid not null references public.bandie_bands(id) on delete cascade,
  provider text not null check (provider in ('dropbox')),

  integration_id uuid not null references public.bandie_user_integrations(id) on delete cascade,
  owning_user_id uuid not null references auth.users(id),

  root_folder_path text not null,
  root_folder_id text,

  status text not null default 'active'
    check (status in (
      'active',
      'needs_reconnect',
      'folder_missing',
      'permission_error',
      'disconnected'
    )),

  last_health_check_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint bandie_band_song_part_storage_band_provider_unique unique (band_id, provider)
);

create index if not exists bandie_band_song_part_storage_band_id_idx
  on public.bandie_band_song_part_storage (band_id);

drop trigger if exists bandie_band_song_part_storage_set_updated_at
  on public.bandie_band_song_part_storage;
create trigger bandie_band_song_part_storage_set_updated_at
before update on public.bandie_band_song_part_storage
for each row execute function public.set_updated_at();

alter table public.bandie_band_song_part_storage enable row level security;

drop policy if exists "Band members can view song part storage" on public.bandie_band_song_part_storage;
create policy "Band members can view song part storage"
on public.bandie_band_song_part_storage
for select
to authenticated
using (
  public.platform_current_user_has_app_access('bandie')
  and public.bandie_current_user_is_band_member(band_id)
);

-- Writes are server-side only during setup; leaders may disconnect via API.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.bandie_current_user_can_manage_song_part_storage(target_band_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.bandie_current_user_owns_band(target_band_id);
$$;

grant execute on function public.bandie_current_user_can_manage_song_part_storage(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- RLS smoke tests (run manually after migration)
-- ---------------------------------------------------------------------------
-- 1. Band member can select bandie_songs for their band.
-- 2. Band member can select bandie_band_song_part_storage for their band.
-- 3. Authenticated user can select own bandie_user_integrations row.
-- 4. Authenticated user cannot select bandie_user_integration_secrets.
-- 5. Authenticated user cannot select bandie_integration_oauth_states.
