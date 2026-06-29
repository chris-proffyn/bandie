-- Launch promo: 30-day full-access trials (Player Pro / Organiser Plus) without Stripe.
-- Platform setting launch_promo_ends_at controls the window; trials use source = launch_promo.

alter table public.bandie_subscriptions
  drop constraint if exists bandie_subscriptions_source_check;

alter table public.bandie_subscriptions
  add constraint bandie_subscriptions_source_check
  check (source in ('stripe', 'manual', 'system', 'migration', 'launch_promo'));

insert into public.bandie_platform_settings (key, value)
values (
  'launch_promo_ends_at',
  to_jsonb((now() + interval '30 days')::timestamptz::text)
)
on conflict (key) do nothing;

create or replace function public.bandie_launch_promo_ends_at()
returns timestamptz
language sql
stable
security definer
set search_path = public
as $$
  select nullif(trim(both '"' from (value #>> '{}')), '')::timestamptz
  from public.bandie_platform_settings
  where key = 'launch_promo_ends_at';
$$;

create or replace function public.bandie_launch_promo_is_active()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.bandie_launch_promo_ends_at() is not null
    and now() < public.bandie_launch_promo_ends_at();
$$;

grant execute on function public.bandie_launch_promo_ends_at() to authenticated;
grant execute on function public.bandie_launch_promo_is_active() to authenticated;

-- Downgrade expired launch trials (non-Stripe) to free plans.
create or replace function public.bandie_expire_launch_trials()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_leader_free_id uuid;
  v_organiser_free_id uuid;
  v_count integer := 0;
  v_row record;
begin
  select id into v_leader_free_id
  from public.bandie_plans
  where code = 'player_free' and status = 'active';

  select id into v_organiser_free_id
  from public.bandie_plans
  where code = 'organiser_free' and status = 'active';

  for v_row in
    select s.id, s.plan_scope
    from public.bandie_subscriptions s
    where s.subject_type = 'user'
      and s.status in ('active', 'trialing', 'past_due')
      and s.source = 'launch_promo'
      and s.stripe_subscription_id is null
      and s.trial_end is not null
      and s.trial_end <= now()
  loop
    update public.bandie_subscriptions
    set
      plan_id = case
        when v_row.plan_scope = 'organiser' then v_organiser_free_id
        else v_leader_free_id
      end,
      status = 'active',
      source = 'system',
      trial_end = null,
      current_period_start = null,
      current_period_end = null,
      cancel_at_period_end = false,
      grace_period_ends_at = null,
      updated_at = now()
    where id = v_row.id;

    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

grant execute on function public.bandie_expire_launch_trials() to authenticated;

create or replace function public.bandie_assign_default_user_subscriptions(
  p_user_id uuid,
  p_is_organiser boolean default false
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_leader_plan_id uuid;
  v_organiser_plan_id uuid;
  v_leader_code text;
  v_organiser_code text;
  v_trial_end timestamptz;
  v_status text;
  v_source text;
begin
  if public.bandie_launch_promo_is_active() then
    v_trial_end := public.bandie_launch_promo_ends_at();
    v_leader_code := 'player_pro';
    v_organiser_code := 'organiser_plus';
    v_status := 'trialing';
    v_source := 'launch_promo';
  else
    v_trial_end := null;
    v_leader_code := 'player_free';
    v_organiser_code := 'organiser_free';
    v_status := 'active';
    v_source := 'system';
  end if;

  select id into v_leader_plan_id
  from public.bandie_plans
  where code = v_leader_code and status = 'active';

  if v_leader_plan_id is null then
    raise exception 'Plan % is not configured', v_leader_code;
  end if;

  if not exists (
    select 1
    from public.bandie_subscriptions s
    where s.subject_type = 'user'
      and s.subject_id = p_user_id
      and s.plan_scope = 'leader'
      and s.status in ('active', 'trialing', 'past_due')
  ) then
    insert into public.bandie_subscriptions (
      subject_type,
      subject_id,
      plan_id,
      status,
      source,
      plan_scope,
      trial_end,
      current_period_end
    )
    values (
      'user',
      p_user_id,
      v_leader_plan_id,
      v_status,
      v_source,
      'leader',
      v_trial_end,
      v_trial_end
    );
  end if;

  if p_is_organiser then
    select id into v_organiser_plan_id
    from public.bandie_plans
    where code = v_organiser_code and status = 'active';

    if v_organiser_plan_id is null then
      raise exception 'Plan % is not configured', v_organiser_code;
    end if;

    if not exists (
      select 1
      from public.bandie_subscriptions s
      where s.subject_type = 'user'
        and s.subject_id = p_user_id
        and s.plan_scope = 'organiser'
        and s.status in ('active', 'trialing', 'past_due')
    ) then
      insert into public.bandie_subscriptions (
        subject_type,
        subject_id,
        plan_id,
        status,
        source,
        plan_scope,
        trial_end,
        current_period_end
      )
      values (
        'user',
        p_user_id,
        v_organiser_plan_id,
        v_status,
        v_source,
        'organiser',
        v_trial_end,
        v_trial_end
      );
    end if;
  end if;
end;
$$;

-- Backfill existing free (non-Stripe) subscriptions to launch trials while promo is active.
do $$
declare
  v_promo_end timestamptz;
  v_leader_pro_id uuid;
  v_organiser_plus_id uuid;
begin
  v_promo_end := public.bandie_launch_promo_ends_at();
  if v_promo_end is null or now() >= v_promo_end then
    return;
  end if;

  select id into v_leader_pro_id from public.bandie_plans where code = 'player_pro' and status = 'active';
  select id into v_organiser_plus_id from public.bandie_plans where code = 'organiser_plus' and status = 'active';

  update public.bandie_subscriptions s
  set
    plan_id = v_leader_pro_id,
    status = 'trialing',
    source = 'launch_promo',
    trial_end = v_promo_end,
    current_period_end = v_promo_end,
    updated_at = now()
  from public.bandie_plans pl
  where s.plan_id = pl.id
    and pl.code = 'player_free'
    and s.plan_scope = 'leader'
    and s.subject_type = 'user'
    and s.status in ('active', 'trialing')
    and s.stripe_subscription_id is null
    and v_leader_pro_id is not null;

  update public.bandie_subscriptions s
  set
    plan_id = v_organiser_plus_id,
    status = 'trialing',
    source = 'launch_promo',
    trial_end = v_promo_end,
    current_period_end = v_promo_end,
    updated_at = now()
  from public.bandie_plans pl
  where s.plan_id = pl.id
    and pl.code = 'organiser_free'
    and s.plan_scope = 'organiser'
    and s.subject_type = 'user'
    and s.status in ('active', 'trialing')
    and s.stripe_subscription_id is null
    and v_organiser_plus_id is not null;
end;
$$;
