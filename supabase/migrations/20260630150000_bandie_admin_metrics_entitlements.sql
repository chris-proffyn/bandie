-- Phases 12–14: Admin portal, metrics, entitlement admin

-- Audit events
create table if not exists public.bandie_audit_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  actor_id uuid references auth.users(id) on delete set null,
  subject_type text,
  subject_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists bandie_audit_events_created_idx
  on public.bandie_audit_events (created_at desc);

create index if not exists bandie_audit_events_actor_idx
  on public.bandie_audit_events (actor_id, created_at desc);

alter table public.bandie_audit_events enable row level security;

drop policy if exists "Platform admins can read audit events" on public.bandie_audit_events;
create policy "Platform admins can read audit events"
on public.bandie_audit_events
for select
to authenticated
using (
  public.bandie_current_user_is_app_admin()
);

drop policy if exists "Platform admins can insert audit events" on public.bandie_audit_events;
create policy "Platform admins can insert audit events"
on public.bandie_audit_events
for insert
to authenticated
with check (
  public.bandie_current_user_is_app_admin()
  and actor_id = auth.uid()
);

-- Admin roles (extends binary app admin)
create table if not exists public.bandie_admin_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  admin_role text not null default 'platform_admin',
  status text not null default 'active' check (status in ('active', 'suspended', 'revoked')),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bandie_admin_users_user_unique unique (user_id)
);

drop trigger if exists bandie_admin_users_set_updated_at on public.bandie_admin_users;
create trigger bandie_admin_users_set_updated_at
before update on public.bandie_admin_users
for each row execute function public.set_updated_at();

alter table public.bandie_admin_users enable row level security;

drop policy if exists "Platform admins can manage admin users" on public.bandie_admin_users;
create policy "Platform admins can manage admin users"
on public.bandie_admin_users
for all
to authenticated
using (public.bandie_current_user_is_app_admin())
with check (public.bandie_current_user_is_app_admin());

-- Platform settings (enforcement toggle, etc.)
create table if not exists public.bandie_platform_settings (
  key text primary key,
  value jsonb not null,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

alter table public.bandie_platform_settings enable row level security;

drop policy if exists "Anyone authenticated can read platform settings" on public.bandie_platform_settings;
create policy "Anyone authenticated can read platform settings"
on public.bandie_platform_settings
for select
to authenticated
using (public.platform_current_user_has_app_access('bandie'));

drop policy if exists "Platform admins can manage platform settings" on public.bandie_platform_settings;
create policy "Platform admins can manage platform settings"
on public.bandie_platform_settings
for all
to authenticated
using (public.bandie_current_user_is_app_admin())
with check (
  public.bandie_current_user_is_app_admin()
  and updated_by = auth.uid()
);

insert into public.bandie_platform_settings (key, value)
values ('entitlements_enforced', 'false'::jsonb)
on conflict (key) do nothing;

-- Metric events
create table if not exists public.bandie_metric_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  user_id uuid references auth.users(id) on delete set null,
  subject_type text,
  subject_id uuid,
  context jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists bandie_metric_events_occurred_idx
  on public.bandie_metric_events (occurred_at desc);

create index if not exists bandie_metric_events_name_idx
  on public.bandie_metric_events (event_name, occurred_at desc);

alter table public.bandie_metric_events enable row level security;

drop policy if exists "Authenticated users can insert metric events" on public.bandie_metric_events;
create policy "Authenticated users can insert metric events"
on public.bandie_metric_events
for insert
to authenticated
with check (
  public.platform_current_user_has_app_access('bandie')
  and (user_id is null or user_id = auth.uid())
);

drop policy if exists "Platform admins can read metric events" on public.bandie_metric_events;
create policy "Platform admins can read metric events"
on public.bandie_metric_events
for select
to authenticated
using (public.bandie_current_user_is_app_admin());

-- Daily metric snapshots
create table if not exists public.bandie_daily_metric_snapshots (
  id uuid primary key default gen_random_uuid(),
  metric_date date not null,
  metric_key text not null,
  segment_type text not null default 'global',
  segment_key text not null default 'all',
  value numeric not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bandie_daily_metric_snapshots_unique
    unique (metric_date, metric_key, segment_type, segment_key)
);

create index if not exists bandie_daily_metric_snapshots_date_idx
  on public.bandie_daily_metric_snapshots (metric_date desc, metric_key);

drop trigger if exists bandie_daily_metric_snapshots_set_updated_at on public.bandie_daily_metric_snapshots;
create trigger bandie_daily_metric_snapshots_set_updated_at
before update on public.bandie_daily_metric_snapshots
for each row execute function public.set_updated_at();

alter table public.bandie_daily_metric_snapshots enable row level security;

drop policy if exists "Platform admins can read metric snapshots" on public.bandie_daily_metric_snapshots;
create policy "Platform admins can read metric snapshots"
on public.bandie_daily_metric_snapshots
for select
to authenticated
using (public.bandie_current_user_is_app_admin());

drop policy if exists "Platform admins can manage metric snapshots" on public.bandie_daily_metric_snapshots;
create policy "Platform admins can manage metric snapshots"
on public.bandie_daily_metric_snapshots
for all
to authenticated
using (public.bandie_current_user_is_app_admin())
with check (public.bandie_current_user_is_app_admin());

-- Gate decision logs
create table if not exists public.bandie_gate_decision_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  subject_type text not null,
  subject_id uuid not null,
  capability_key text not null,
  allowed boolean not null,
  reason_code text,
  current_plan_code text,
  required_plan_code text,
  usage_value numeric,
  limit_value numeric,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists bandie_gate_decision_logs_created_idx
  on public.bandie_gate_decision_logs (created_at desc);

alter table public.bandie_gate_decision_logs enable row level security;

drop policy if exists "Actors can insert gate logs" on public.bandie_gate_decision_logs;
create policy "Actors can insert gate logs"
on public.bandie_gate_decision_logs
for insert
to authenticated
with check (
  public.platform_current_user_has_app_access('bandie')
  and (actor_id is null or actor_id = auth.uid())
);

drop policy if exists "Platform admins can read gate logs" on public.bandie_gate_decision_logs;
create policy "Platform admins can read gate logs"
on public.bandie_gate_decision_logs
for select
to authenticated
using (public.bandie_current_user_is_app_admin());

-- Entitlement drafts
create table if not exists public.bandie_entitlement_drafts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  status text not null default 'draft'
    check (status in ('draft', 'published', 'discarded')),
  created_by uuid not null references auth.users(id),
  published_by uuid references auth.users(id),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bandie_entitlement_draft_items (
  id uuid primary key default gen_random_uuid(),
  draft_id uuid not null references public.bandie_entitlement_drafts(id) on delete cascade,
  plan_id uuid not null references public.bandie_plans(id) on delete cascade,
  capability_key text not null references public.bandie_capabilities(key) on delete cascade,
  old_value jsonb,
  new_value jsonb not null,
  change_type text not null default 'update'
    check (change_type in ('create', 'update', 'delete')),
  created_at timestamptz not null default now()
);

create index if not exists bandie_entitlement_draft_items_draft_idx
  on public.bandie_entitlement_draft_items (draft_id);

drop trigger if exists bandie_entitlement_drafts_set_updated_at on public.bandie_entitlement_drafts;
create trigger bandie_entitlement_drafts_set_updated_at
before update on public.bandie_entitlement_drafts
for each row execute function public.set_updated_at();

alter table public.bandie_entitlement_drafts enable row level security;
alter table public.bandie_entitlement_draft_items enable row level security;

drop policy if exists "Platform admins manage entitlement drafts" on public.bandie_entitlement_drafts;
create policy "Platform admins manage entitlement drafts"
on public.bandie_entitlement_drafts
for all
to authenticated
using (public.bandie_current_user_is_app_admin())
with check (
  public.bandie_current_user_is_app_admin()
  and created_by = auth.uid()
);

drop policy if exists "Platform admins manage draft items" on public.bandie_entitlement_draft_items;
create policy "Platform admins manage draft items"
on public.bandie_entitlement_draft_items
for all
to authenticated
using (
  public.bandie_current_user_is_app_admin()
  and exists (
    select 1 from public.bandie_entitlement_drafts d
    where d.id = draft_id and d.status = 'draft'
  )
)
with check (
  public.bandie_current_user_is_app_admin()
  and exists (
    select 1 from public.bandie_entitlement_drafts d
    where d.id = draft_id and d.status = 'draft'
  )
);

-- Admin search helpers
create or replace function public.bandie_admin_search_users(p_query text, p_limit integer default 25)
returns table (
  user_id uuid,
  display_name text,
  username text,
  email text
)
language sql
security definer
set search_path = public
stable
as $$
  select
    p.user_id,
    p.display_name,
    p.username,
    u.email::text
  from public.bandie_profiles p
  join auth.users u on u.id = p.user_id
  where public.bandie_current_user_is_app_admin()
    and (
      p_query is null
      or trim(p_query) = ''
      or p.display_name ilike '%' || trim(p_query) || '%'
      or p.username ilike '%' || trim(p_query) || '%'
      or u.email ilike '%' || trim(p_query) || '%'
    )
  order by p.display_name nulls last, p.username
  limit greatest(1, least(coalesce(p_limit, 25), 100));
$$;

grant execute on function public.bandie_admin_search_users(text, integer) to authenticated;

create or replace function public.bandie_admin_search_bands(p_query text, p_limit integer default 25)
returns table (
  band_id uuid,
  name text,
  slug text,
  owner_user_id uuid,
  owner_display_name text
)
language sql
security definer
set search_path = public
stable
as $$
  select
    b.id as band_id,
    b.name,
    b.slug,
    b.owner_user_id,
    p.display_name as owner_display_name
  from public.bandie_bands b
  left join public.bandie_profiles p on p.user_id = b.owner_user_id
  where public.bandie_current_user_is_app_admin()
    and (
      p_query is null
      or trim(p_query) = ''
      or b.name ilike '%' || trim(p_query) || '%'
      or b.slug ilike '%' || trim(p_query) || '%'
    )
  order by b.name
  limit greatest(1, least(coalesce(p_limit, 25), 100));
$$;

grant execute on function public.bandie_admin_search_bands(text, integer) to authenticated;

-- Daily metrics aggregation
create or replace function public.bandie_aggregate_daily_metrics(p_metric_date date default (current_date - 1))
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_dau integer;
  v_wau integer;
  v_mau integer;
begin
  if not public.bandie_current_user_is_app_admin() then
    raise exception 'Admin access required';
  end if;

  select count(distinct user_id)::integer into v_dau
  from public.bandie_metric_events
  where user_id is not null
    and occurred_at::date = p_metric_date
    and event_name = 'session_active';

  select count(distinct user_id)::integer into v_wau
  from public.bandie_metric_events
  where user_id is not null
    and occurred_at >= p_metric_date - interval '6 days'
    and occurred_at < p_metric_date + interval '1 day'
    and event_name = 'session_active';

  select count(distinct user_id)::integer into v_mau
  from public.bandie_metric_events
  where user_id is not null
    and occurred_at >= p_metric_date - interval '29 days'
    and occurred_at < p_metric_date + interval '1 day'
    and event_name = 'session_active';

  insert into public.bandie_daily_metric_snapshots (metric_date, metric_key, segment_type, segment_key, value)
  values
    (p_metric_date, 'dau', 'global', 'all', coalesce(v_dau, 0)),
    (p_metric_date, 'wau', 'global', 'all', coalesce(v_wau, 0)),
    (p_metric_date, 'mau', 'global', 'all', coalesce(v_mau, 0))
  on conflict (metric_date, metric_key, segment_type, segment_key)
  do update set value = excluded.value, updated_at = now();

  insert into public.bandie_daily_metric_snapshots (metric_date, metric_key, segment_type, segment_key, value)
  select p_metric_date, 'users_total', 'global', 'all', count(*)::numeric
  from public.bandie_profiles
  on conflict (metric_date, metric_key, segment_type, segment_key)
  do update set value = excluded.value, updated_at = now();

  insert into public.bandie_daily_metric_snapshots (metric_date, metric_key, segment_type, segment_key, value)
  select p_metric_date, 'bands_total', 'global', 'all', count(*)::numeric
  from public.bandie_bands
  on conflict (metric_date, metric_key, segment_type, segment_key)
  do update set value = excluded.value, updated_at = now();

  insert into public.bandie_daily_metric_snapshots (metric_date, metric_key, segment_type, segment_key, value)
  select p_metric_date, 'songs_total', 'global', 'all', count(*)::numeric
  from public.bandie_songs
  where is_deleted = false
  on conflict (metric_date, metric_key, segment_type, segment_key)
  do update set value = excluded.value, updated_at = now();

  insert into public.bandie_daily_metric_snapshots (metric_date, metric_key, segment_type, segment_key, value)
  select p_metric_date, 'setlists_total', 'global', 'all', count(*)::numeric
  from public.bandie_setlists
  where status <> 'archived'
  on conflict (metric_date, metric_key, segment_type, segment_key)
  do update set value = excluded.value, updated_at = now();

  insert into public.bandie_daily_metric_snapshots (metric_date, metric_key, segment_type, segment_key, value)
  select p_metric_date, 'gigs_total', 'global', 'all', count(*)::numeric
  from public.bandie_gigs
  where status not in ('archived', 'cancelled')
  on conflict (metric_date, metric_key, segment_type, segment_key)
  do update set value = excluded.value, updated_at = now();

  insert into public.bandie_daily_metric_snapshots (metric_date, metric_key, segment_type, segment_key, value)
  select
    p_metric_date,
    'subscriptions_by_plan',
    'plan',
    pl.code,
    count(*)::numeric
  from public.bandie_subscriptions s
  join public.bandie_plans pl on pl.id = s.plan_id
  where s.status in ('active', 'trialing', 'past_due')
  group by pl.code
  on conflict (metric_date, metric_key, segment_type, segment_key)
  do update set value = excluded.value, updated_at = now();
end;
$$;

grant execute on function public.bandie_aggregate_daily_metrics(date) to authenticated;

-- Publish entitlement draft
create or replace function public.bandie_publish_entitlement_draft(p_draft_id uuid, p_reason text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_draft public.bandie_entitlement_drafts%rowtype;
  v_item record;
begin
  if not public.bandie_current_user_is_app_admin() then
    raise exception 'Admin access required';
  end if;

  select * into v_draft from public.bandie_entitlement_drafts where id = p_draft_id;
  if not found or v_draft.status <> 'draft' then
    raise exception 'Draft not found or not publishable';
  end if;

  for v_item in
    select * from public.bandie_entitlement_draft_items where draft_id = p_draft_id
  loop
    if v_item.change_type = 'delete' then
      delete from public.bandie_plan_entitlements
      where plan_id = v_item.plan_id and capability_key = v_item.capability_key;
    else
      insert into public.bandie_plan_entitlements (plan_id, capability_key, value)
      values (v_item.plan_id, v_item.capability_key, v_item.new_value)
      on conflict (plan_id, capability_key)
      do update set value = excluded.value, updated_at = now();
    end if;
  end loop;

  update public.bandie_entitlement_drafts
  set status = 'published', published_by = auth.uid(), published_at = now(), updated_at = now()
  where id = p_draft_id;

  insert into public.bandie_audit_events (event_type, actor_id, subject_type, subject_id, metadata)
  values (
    'entitlement_draft.published',
    auth.uid(),
    'entitlement_draft',
    p_draft_id,
    jsonb_build_object('reason', p_reason, 'draft_name', v_draft.name)
  );
end;
$$;

grant execute on function public.bandie_publish_entitlement_draft(uuid, text) to authenticated;
