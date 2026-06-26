-- Bandie app registration and initial schema (app code: bandie)

insert into public.platform_apps (app_code, app_name, description)
values ('bandie', 'Bandie', 'Band management and promotion platform')
on conflict (app_code) do update
set
  app_name = excluded.app_name,
  description = excluded.description,
  status = 'active',
  updated_at = now();

-- Prototype onboarding: authenticated users can self-join Bandie during MVP.
drop policy if exists "Authenticated users can join Bandie prototype" on public.platform_user_app_memberships;
create policy "Authenticated users can join Bandie prototype"
on public.platform_user_app_memberships
for insert
to authenticated
with check (
  user_id = auth.uid()
  and app_code = 'bandie'
  and role = 'user'
  and status = 'active'
);

-- ---------------------------------------------------------------------------
-- Bandie user profiles
-- ---------------------------------------------------------------------------

create table if not exists public.bandie_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text,
  preferred_instrument text,
  profile_image_url text,
  onboarding_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint bandie_profiles_user_unique unique (user_id)
);

drop trigger if exists bandie_profiles_set_updated_at on public.bandie_profiles;
create trigger bandie_profiles_set_updated_at
before update on public.bandie_profiles
for each row execute function public.set_updated_at();

alter table public.bandie_profiles enable row level security;

drop policy if exists "Bandie users can view own profile" on public.bandie_profiles;
create policy "Bandie users can view own profile"
on public.bandie_profiles
for select
to authenticated
using (
  user_id = auth.uid()
  and public.platform_current_user_has_app_access('bandie')
);

drop policy if exists "Bandie users can insert own profile" on public.bandie_profiles;
create policy "Bandie users can insert own profile"
on public.bandie_profiles
for insert
to authenticated
with check (
  user_id = auth.uid()
  and public.platform_current_user_has_app_access('bandie')
);

drop policy if exists "Bandie users can update own profile" on public.bandie_profiles;
create policy "Bandie users can update own profile"
on public.bandie_profiles
for update
to authenticated
using (
  user_id = auth.uid()
  and public.platform_current_user_has_app_access('bandie')
)
with check (
  user_id = auth.uid()
  and public.platform_current_user_has_app_access('bandie')
);

-- ---------------------------------------------------------------------------
-- Bands and membership
-- ---------------------------------------------------------------------------

create table if not exists public.bandie_bands (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  slug text not null unique,
  description text,
  location text,
  public_profile_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists bandie_bands_set_updated_at on public.bandie_bands;
create trigger bandie_bands_set_updated_at
before update on public.bandie_bands
for each row execute function public.set_updated_at();

create table if not exists public.bandie_band_members (
  id uuid primary key default gen_random_uuid(),
  band_id uuid not null references public.bandie_bands(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member',
  status text not null default 'active',
  created_at timestamptz not null default now(),

  constraint bandie_band_members_unique unique (band_id, user_id),
  constraint bandie_band_members_role_check
    check (role in ('owner', 'admin', 'member', 'viewer')),
  constraint bandie_band_members_status_check
    check (status in ('active', 'invited', 'removed'))
);

create or replace function public.bandie_current_user_is_band_member(target_band_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.bandie_band_members bm
    where bm.band_id = target_band_id
      and bm.user_id = auth.uid()
      and bm.status = 'active'
  );
$$;

grant execute on function public.bandie_current_user_is_band_member(uuid) to authenticated;

alter table public.bandie_bands enable row level security;
alter table public.bandie_band_members enable row level security;

drop policy if exists "Bandie users can create bands" on public.bandie_bands;
create policy "Bandie users can create bands"
on public.bandie_bands
for insert
to authenticated
with check (
  public.platform_current_user_has_app_access('bandie')
  and owner_user_id = auth.uid()
);

drop policy if exists "Bandie members can view their bands" on public.bandie_bands;
create policy "Bandie members can view their bands"
on public.bandie_bands
for select
to authenticated
using (
  public.platform_current_user_has_app_access('bandie')
  and public.bandie_current_user_is_band_member(id)
);

drop policy if exists "Bandie band owners can update bands" on public.bandie_bands;
create policy "Bandie band owners can update bands"
on public.bandie_bands
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

drop policy if exists "Bandie members can view band memberships" on public.bandie_band_members;
create policy "Bandie members can view band memberships"
on public.bandie_band_members
for select
to authenticated
using (
  public.platform_current_user_has_app_access('bandie')
  and public.bandie_current_user_is_band_member(band_id)
);

drop policy if exists "Bandie band owners can manage memberships" on public.bandie_band_members;
create policy "Bandie band owners can manage memberships"
on public.bandie_band_members
for insert
to authenticated
with check (
  public.platform_current_user_has_app_access('bandie')
  and exists (
    select 1
    from public.bandie_bands b
    where b.id = band_id
      and b.owner_user_id = auth.uid()
  )
);

drop policy if exists "Bandie band owners can update memberships" on public.bandie_band_members;
create policy "Bandie band owners can update memberships"
on public.bandie_band_members
for update
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

-- When a user creates a band, they become the owner member automatically.
create or replace function public.bandie_add_owner_on_band_create()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.bandie_band_members (band_id, user_id, role, status)
  values (new.id, new.owner_user_id, 'owner', 'active')
  on conflict (band_id, user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists bandie_bands_add_owner_member on public.bandie_bands;
create trigger bandie_bands_add_owner_member
after insert on public.bandie_bands
for each row execute function public.bandie_add_owner_on_band_create();
