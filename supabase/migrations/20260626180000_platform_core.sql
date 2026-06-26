-- Platform core schema for shared multi-app Supabase instance (proff-rsd-mt-1)

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- App registry
-- ---------------------------------------------------------------------------

create table if not exists public.platform_apps (
  id uuid primary key default gen_random_uuid(),
  app_code text not null unique,
  app_name text not null,
  description text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint platform_apps_app_code_format
    check (app_code ~ '^[a-z][a-z0-9_]*$'),

  constraint platform_apps_status_check
    check (status in ('active', 'paused', 'archived'))
);

drop trigger if exists platform_apps_set_updated_at on public.platform_apps;
create trigger platform_apps_set_updated_at
before update on public.platform_apps
for each row execute function public.set_updated_at();

alter table public.platform_apps enable row level security;

drop policy if exists "Authenticated users can view active apps" on public.platform_apps;
create policy "Authenticated users can view active apps"
on public.platform_apps
for select
to authenticated
using (status = 'active');

-- ---------------------------------------------------------------------------
-- User / app memberships
-- ---------------------------------------------------------------------------

create table if not exists public.platform_user_app_memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  app_code text not null references public.platform_apps(app_code) on delete cascade,
  role text not null default 'user',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint platform_user_app_memberships_unique
    unique (user_id, app_code),

  constraint platform_user_app_memberships_role_check
    check (role in ('owner', 'admin', 'member', 'user', 'viewer')),

  constraint platform_user_app_memberships_status_check
    check (status in ('active', 'invited', 'suspended', 'removed'))
);

drop trigger if exists platform_user_app_memberships_set_updated_at on public.platform_user_app_memberships;
create trigger platform_user_app_memberships_set_updated_at
before update on public.platform_user_app_memberships
for each row execute function public.set_updated_at();

alter table public.platform_user_app_memberships enable row level security;

drop policy if exists "Users can view their own app memberships" on public.platform_user_app_memberships;
create policy "Users can view their own app memberships"
on public.platform_user_app_memberships
for select
to authenticated
using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Cross-app user profile (optional shared metadata)
-- ---------------------------------------------------------------------------

create table if not exists public.platform_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  default_app_code text references public.platform_apps(app_code),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists platform_profiles_set_updated_at on public.platform_profiles;
create trigger platform_profiles_set_updated_at
before update on public.platform_profiles
for each row execute function public.set_updated_at();

alter table public.platform_profiles enable row level security;

drop policy if exists "Users can view own platform profile" on public.platform_profiles;
create policy "Users can view own platform profile"
on public.platform_profiles
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can insert own platform profile" on public.platform_profiles;
create policy "Users can insert own platform profile"
on public.platform_profiles
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "Users can update own platform profile" on public.platform_profiles;
create policy "Users can update own platform profile"
on public.platform_profiles
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Audit log (server-side writes; no client read policies)
-- ---------------------------------------------------------------------------

create table if not exists public.platform_audit_log (
  id uuid primary key default gen_random_uuid(),
  app_code text references public.platform_apps(app_code),
  actor_user_id uuid references auth.users(id),
  action text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);

alter table public.platform_audit_log enable row level security;

-- ---------------------------------------------------------------------------
-- Helper functions
-- ---------------------------------------------------------------------------

create or replace function public.platform_current_user_has_app_access(target_app_code text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.platform_user_app_memberships m
    where m.user_id = auth.uid()
      and m.app_code = target_app_code
      and m.status = 'active'
  );
$$;

create or replace function public.platform_current_user_has_app_role(
  target_app_code text,
  allowed_roles text[]
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.platform_user_app_memberships m
    where m.user_id = auth.uid()
      and m.app_code = target_app_code
      and m.status = 'active'
      and m.role = any(allowed_roles)
  );
$$;

grant execute on function public.platform_current_user_has_app_access(text) to authenticated;
grant execute on function public.platform_current_user_has_app_role(text, text[]) to authenticated;
