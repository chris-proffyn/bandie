-- Phase 8.2: Entitlement framework — plans, capabilities, subscriptions, usage meters, overrides.
-- Product decisions: docs/project/bandie_entitlements_admin_portal_functional_technical_spec.md §20.1–§20.2
-- Seeds (8.3) and @bandie/data service (8.4) follow in separate work.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.bandie_get_band_primary_leader_user_id(p_band_id uuid)
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select b.owner_user_id
  from public.bandie_bands b
  where b.id = p_band_id;
$$;

grant execute on function public.bandie_get_band_primary_leader_user_id(uuid) to authenticated;

create or replace function public.bandie_user_can_view_entitlement_subject(
  p_subject_type text,
  p_subject_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if auth.uid() is null then
    return false;
  end if;

  if not public.platform_current_user_has_app_access('bandie') then
    return false;
  end if;

  if public.bandie_current_user_is_app_admin() then
    return true;
  end if;

  case p_subject_type
    when 'user' then
      return p_subject_id = auth.uid();
    when 'band' then
      return public.bandie_current_user_is_band_member(p_subject_id);
  else
    return false;
  end case;
end;
$$;

grant execute on function public.bandie_user_can_view_entitlement_subject(text, uuid) to authenticated;

create or replace function public.bandie_user_can_manage_entitlement_subject(
  p_subject_type text,
  p_subject_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if auth.uid() is null then
    return false;
  end if;

  if not public.platform_current_user_has_app_access('bandie') then
    return false;
  end if;

  if public.bandie_current_user_is_app_admin() then
    return true;
  end if;

  case p_subject_type
    when 'user' then
      return p_subject_id = auth.uid();
    when 'band' then
      return public.bandie_current_user_owns_band(p_subject_id);
  else
    return false;
  end case;
end;
$$;

grant execute on function public.bandie_user_can_manage_entitlement_subject(text, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- bandie_plans
-- ---------------------------------------------------------------------------

create table if not exists public.bandie_plans (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  name text not null,
  description text,
  subject_type text not null
    check (subject_type in ('user', 'band', 'organiser', 'event')),
  billing_interval text not null default 'free'
    check (billing_interval in ('free', 'monthly', 'annual', 'one_off')),
  status text not null default 'draft'
    check (status in ('draft', 'active', 'retired')),
  is_public boolean not null default false,
  display_order integer not null default 0,
  stripe_product_id text,
  stripe_price_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bandie_plans_code_check check (char_length(trim(code)) > 0),
  constraint bandie_plans_name_check check (char_length(trim(name)) > 0)
);

create unique index if not exists bandie_plans_code_unique
  on public.bandie_plans (code);

create index if not exists bandie_plans_subject_status_idx
  on public.bandie_plans (subject_type, status, display_order);

drop trigger if exists bandie_plans_set_updated_at on public.bandie_plans;
create trigger bandie_plans_set_updated_at
before update on public.bandie_plans
for each row execute function public.set_updated_at();

alter table public.bandie_plans enable row level security;

drop policy if exists "Anyone can view public active plans" on public.bandie_plans;
create policy "Anyone can view public active plans"
on public.bandie_plans
for select
to anon, authenticated
using (status = 'active' and is_public = true);

drop policy if exists "Bandie users can view active plans" on public.bandie_plans;
create policy "Bandie users can view active plans"
on public.bandie_plans
for select
to authenticated
using (
  public.platform_current_user_has_app_access('bandie')
  and status = 'active'
);

drop policy if exists "Bandie app admins can view all plans" on public.bandie_plans;
create policy "Bandie app admins can view all plans"
on public.bandie_plans
for select
to authenticated
using (public.bandie_current_user_is_app_admin());

drop policy if exists "Bandie app admins can manage plans" on public.bandie_plans;
create policy "Bandie app admins can manage plans"
on public.bandie_plans
for all
to authenticated
using (public.bandie_current_user_is_app_admin())
with check (public.bandie_current_user_is_app_admin());

-- ---------------------------------------------------------------------------
-- bandie_capabilities
-- ---------------------------------------------------------------------------

create table if not exists public.bandie_capabilities (
  id uuid primary key default gen_random_uuid(),
  key text not null,
  name text not null,
  description text,
  category text not null default 'general',
  value_type text not null default 'boolean'
    check (value_type in ('boolean', 'integer', 'bytes', 'rate', 'text')),
  default_value jsonb not null default 'false'::jsonb,
  created_at timestamptz not null default now(),
  constraint bandie_capabilities_key_check check (char_length(trim(key)) > 0),
  constraint bandie_capabilities_name_check check (char_length(trim(name)) > 0)
);

create unique index if not exists bandie_capabilities_key_unique
  on public.bandie_capabilities (key);

create index if not exists bandie_capabilities_category_idx
  on public.bandie_capabilities (category, key);

alter table public.bandie_capabilities enable row level security;

drop policy if exists "Bandie users can view capabilities" on public.bandie_capabilities;
create policy "Bandie users can view capabilities"
on public.bandie_capabilities
for select
to authenticated
using (public.platform_current_user_has_app_access('bandie'));

drop policy if exists "Bandie app admins can manage capabilities" on public.bandie_capabilities;
create policy "Bandie app admins can manage capabilities"
on public.bandie_capabilities
for all
to authenticated
using (public.bandie_current_user_is_app_admin())
with check (public.bandie_current_user_is_app_admin());

-- ---------------------------------------------------------------------------
-- bandie_plan_entitlements
-- ---------------------------------------------------------------------------

create table if not exists public.bandie_plan_entitlements (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.bandie_plans(id) on delete cascade,
  capability_key text not null references public.bandie_capabilities(key) on delete restrict,
  value jsonb not null,
  effective_from timestamptz,
  effective_to timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists bandie_plan_entitlements_plan_capability_unique
  on public.bandie_plan_entitlements (plan_id, capability_key);

create index if not exists bandie_plan_entitlements_capability_idx
  on public.bandie_plan_entitlements (capability_key);

drop trigger if exists bandie_plan_entitlements_set_updated_at on public.bandie_plan_entitlements;
create trigger bandie_plan_entitlements_set_updated_at
before update on public.bandie_plan_entitlements
for each row execute function public.set_updated_at();

alter table public.bandie_plan_entitlements enable row level security;

drop policy if exists "Bandie users can view plan entitlements for active plans" on public.bandie_plan_entitlements;
create policy "Bandie users can view plan entitlements for active plans"
on public.bandie_plan_entitlements
for select
to authenticated
using (
  public.platform_current_user_has_app_access('bandie')
  and exists (
    select 1
    from public.bandie_plans p
    where p.id = plan_id
      and p.status = 'active'
  )
);

drop policy if exists "Bandie app admins can view all plan entitlements" on public.bandie_plan_entitlements;
create policy "Bandie app admins can view all plan entitlements"
on public.bandie_plan_entitlements
for select
to authenticated
using (public.bandie_current_user_is_app_admin());

drop policy if exists "Bandie app admins can manage plan entitlements" on public.bandie_plan_entitlements;
create policy "Bandie app admins can manage plan entitlements"
on public.bandie_plan_entitlements
for all
to authenticated
using (public.bandie_current_user_is_app_admin())
with check (public.bandie_current_user_is_app_admin());

-- ---------------------------------------------------------------------------
-- bandie_subscriptions
-- ---------------------------------------------------------------------------

create table if not exists public.bandie_subscriptions (
  id uuid primary key default gen_random_uuid(),
  subject_type text not null
    check (subject_type in ('user', 'band', 'organiser', 'event')),
  subject_id uuid not null,
  plan_id uuid not null references public.bandie_plans(id) on delete restrict,
  status text not null default 'active'
    check (status in ('active', 'trialing', 'past_due', 'cancelled', 'expired')),
  source text not null default 'system'
    check (source in ('stripe', 'manual', 'system', 'migration')),
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  trial_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists bandie_subscriptions_subject_idx
  on public.bandie_subscriptions (subject_type, subject_id, status);

create index if not exists bandie_subscriptions_plan_idx
  on public.bandie_subscriptions (plan_id);

create unique index if not exists bandie_subscriptions_one_active_per_subject
  on public.bandie_subscriptions (subject_type, subject_id)
  where status in ('active', 'trialing', 'past_due');

drop trigger if exists bandie_subscriptions_set_updated_at on public.bandie_subscriptions;
create trigger bandie_subscriptions_set_updated_at
before update on public.bandie_subscriptions
for each row execute function public.set_updated_at();

alter table public.bandie_subscriptions enable row level security;

drop policy if exists "Users can view own subscriptions" on public.bandie_subscriptions;
create policy "Users can view own subscriptions"
on public.bandie_subscriptions
for select
to authenticated
using (
  public.platform_current_user_has_app_access('bandie')
  and public.bandie_user_can_view_entitlement_subject(subject_type, subject_id)
);

drop policy if exists "Bandie app admins can manage subscriptions" on public.bandie_subscriptions;
create policy "Bandie app admins can manage subscriptions"
on public.bandie_subscriptions
for all
to authenticated
using (public.bandie_current_user_is_app_admin())
with check (public.bandie_current_user_is_app_admin());

-- ---------------------------------------------------------------------------
-- bandie_usage_meters
-- ---------------------------------------------------------------------------

create table if not exists public.bandie_usage_meters (
  id uuid primary key default gen_random_uuid(),
  subject_type text not null
    check (subject_type in ('user', 'band', 'organiser', 'event')),
  subject_id uuid not null,
  meter_key text not null,
  current_value numeric not null default 0,
  period_start timestamptz,
  period_end timestamptz,
  updated_at timestamptz not null default now(),
  constraint bandie_usage_meters_key_check check (char_length(trim(meter_key)) > 0),
  constraint bandie_usage_meters_value_nonneg check (current_value >= 0)
);

create unique index if not exists bandie_usage_meters_subject_meter_open_period_unique
  on public.bandie_usage_meters (subject_type, subject_id, meter_key)
  where period_start is null;

create unique index if not exists bandie_usage_meters_subject_meter_period_unique
  on public.bandie_usage_meters (subject_type, subject_id, meter_key, period_start)
  where period_start is not null;

create index if not exists bandie_usage_meters_subject_idx
  on public.bandie_usage_meters (subject_type, subject_id, meter_key);

drop trigger if exists bandie_usage_meters_set_updated_at on public.bandie_usage_meters;
create trigger bandie_usage_meters_set_updated_at
before update on public.bandie_usage_meters
for each row execute function public.set_updated_at();

alter table public.bandie_usage_meters enable row level security;

drop policy if exists "Users can view entitlement usage meters" on public.bandie_usage_meters;
create policy "Users can view entitlement usage meters"
on public.bandie_usage_meters
for select
to authenticated
using (
  public.platform_current_user_has_app_access('bandie')
  and public.bandie_user_can_view_entitlement_subject(subject_type, subject_id)
);

-- Writes via bandie_set_usage_meter() only (no direct client insert/update policies).

-- ---------------------------------------------------------------------------
-- bandie_entitlement_overrides
-- ---------------------------------------------------------------------------

create table if not exists public.bandie_entitlement_overrides (
  id uuid primary key default gen_random_uuid(),
  subject_type text not null
    check (subject_type in ('user', 'band', 'organiser', 'event')),
  subject_id uuid not null,
  capability_key text not null references public.bandie_capabilities(key) on delete restrict,
  value jsonb not null,
  reason text not null,
  starts_at timestamptz,
  expires_at timestamptz,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  constraint bandie_entitlement_overrides_reason_check check (char_length(trim(reason)) > 0)
);

create index if not exists bandie_entitlement_overrides_subject_idx
  on public.bandie_entitlement_overrides (subject_type, subject_id, capability_key);

create index if not exists bandie_entitlement_overrides_expires_idx
  on public.bandie_entitlement_overrides (expires_at)
  where expires_at is not null;

alter table public.bandie_entitlement_overrides enable row level security;

drop policy if exists "Users can view own entitlement overrides" on public.bandie_entitlement_overrides;
create policy "Users can view own entitlement overrides"
on public.bandie_entitlement_overrides
for select
to authenticated
using (
  public.platform_current_user_has_app_access('bandie')
  and public.bandie_user_can_view_entitlement_subject(subject_type, subject_id)
);

drop policy if exists "Bandie app admins can manage entitlement overrides" on public.bandie_entitlement_overrides;
create policy "Bandie app admins can manage entitlement overrides"
on public.bandie_entitlement_overrides
for all
to authenticated
using (public.bandie_current_user_is_app_admin())
with check (public.bandie_current_user_is_app_admin());

-- ---------------------------------------------------------------------------
-- Usage meter RPC (security definer — bypasses RLS for controlled writes)
-- ---------------------------------------------------------------------------

create or replace function public.bandie_set_usage_meter(
  p_subject_type text,
  p_subject_id uuid,
  p_meter_key text,
  p_current_value numeric,
  p_period_start timestamptz default null,
  p_period_end timestamptz default null
)
returns public.bandie_usage_meters
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.bandie_usage_meters;
  v_meter_key text := trim(p_meter_key);
begin
  if p_current_value < 0 then
    raise exception 'Usage meter value cannot be negative';
  end if;

  if not public.bandie_user_can_manage_entitlement_subject(p_subject_type, p_subject_id) then
    raise exception 'Not allowed to update usage meter for this subject';
  end if;

  if p_period_start is null then
    update public.bandie_usage_meters m
    set
      current_value = p_current_value,
      updated_at = now()
    where m.subject_type = p_subject_type
      and m.subject_id = p_subject_id
      and m.meter_key = v_meter_key
      and m.period_start is null
    returning * into v_row;

    if not found then
      insert into public.bandie_usage_meters (
        subject_type,
        subject_id,
        meter_key,
        current_value,
        period_start,
        period_end
      )
      values (
        p_subject_type,
        p_subject_id,
        v_meter_key,
        p_current_value,
        null,
        null
      )
      returning * into v_row;
    end if;
  else
    update public.bandie_usage_meters m
    set
      current_value = p_current_value,
      period_end = p_period_end,
      updated_at = now()
    where m.subject_type = p_subject_type
      and m.subject_id = p_subject_id
      and m.meter_key = v_meter_key
      and m.period_start = p_period_start
    returning * into v_row;

    if not found then
      insert into public.bandie_usage_meters (
        subject_type,
        subject_id,
        meter_key,
        current_value,
        period_start,
        period_end
      )
      values (
        p_subject_type,
        p_subject_id,
        v_meter_key,
        p_current_value,
        p_period_start,
        p_period_end
      )
      returning * into v_row;
    end if;
  end if;

  return v_row;
end;
$$;

grant execute on function public.bandie_set_usage_meter(text, uuid, text, numeric, timestamptz, timestamptz)
  to authenticated;
