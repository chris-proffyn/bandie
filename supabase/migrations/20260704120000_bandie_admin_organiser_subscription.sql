-- Admin accounts: allow creating organiser (and leader) subscriptions when assigning a plan.

create or replace function public.bandie_admin_set_user_subscription_plan(
  p_user_id uuid,
  p_plan_scope text,
  p_plan_code text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_subscription_id uuid;
  v_plan_id uuid;
  v_stripe_subscription_id text;
  v_status text;
begin
  if not public.bandie_current_user_is_app_admin() then
    raise exception 'Admin access required';
  end if;

  if p_plan_scope not in ('leader', 'organiser') then
    raise exception 'Invalid plan scope';
  end if;

  select id into v_plan_id
  from public.bandie_plans
  where code = p_plan_code
    and status = 'active';

  if v_plan_id is null then
    raise exception 'Plan not found or inactive';
  end if;

  if p_plan_scope = 'leader' and p_plan_code not in ('player_free', 'player_plus', 'player_pro') then
    raise exception 'Invalid leader plan code';
  end if;

  if p_plan_scope = 'organiser' and p_plan_code not in ('organiser_free', 'organiser_plus') then
    raise exception 'Invalid organiser plan code';
  end if;

  v_status := case
    when p_plan_code in ('player_plus', 'player_pro', 'organiser_plus') then 'trialing'
    else 'active'
  end;

  select s.id, s.stripe_subscription_id
  into v_subscription_id, v_stripe_subscription_id
  from public.bandie_subscriptions s
  where s.subject_type = 'user'
    and s.subject_id = p_user_id
    and s.plan_scope = p_plan_scope
    and s.status in ('active', 'trialing', 'past_due')
  order by s.created_at desc
  limit 1
  for update;

  if v_subscription_id is null then
    if p_plan_scope = 'organiser' then
      if not exists (
        select 1
        from public.bandie_profiles p
        where p.user_id = p_user_id
          and p.is_organiser = true
      ) then
        raise exception 'Enable the Organiser workspace role before assigning an organiser plan';
      end if;
    end if;

    insert into public.bandie_subscriptions (
      subject_type,
      subject_id,
      plan_id,
      status,
      source,
      plan_scope
    )
    values (
      'user',
      p_user_id,
      v_plan_id,
      v_status,
      'manual',
      p_plan_scope
    );

    return;
  end if;

  if v_stripe_subscription_id is not null then
    raise exception 'Cannot change plan on a Stripe-billed subscription from admin accounts';
  end if;

  update public.bandie_subscriptions
  set
    plan_id = v_plan_id,
    status = v_status,
    updated_at = now()
  where id = v_subscription_id;
end;
$$;

create or replace function public.bandie_admin_set_user_subscription_trial_end(
  p_user_id uuid,
  p_plan_scope text,
  p_trial_end timestamptz
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_subscription_id uuid;
  v_stripe_subscription_id text;
begin
  if not public.bandie_current_user_is_app_admin() then
    raise exception 'Admin access required';
  end if;

  if p_plan_scope not in ('leader', 'organiser') then
    raise exception 'Invalid plan scope';
  end if;

  select s.id, s.stripe_subscription_id
  into v_subscription_id, v_stripe_subscription_id
  from public.bandie_subscriptions s
  where s.subject_type = 'user'
    and s.subject_id = p_user_id
    and s.plan_scope = p_plan_scope
    and s.status in ('active', 'trialing', 'past_due')
  order by s.created_at desc
  limit 1
  for update;

  if v_subscription_id is null then
    raise exception 'No active subscription found for this scope — assign a plan first';
  end if;

  if v_stripe_subscription_id is not null then
    raise exception 'Cannot change trial end on a Stripe-billed subscription from admin accounts';
  end if;

  update public.bandie_subscriptions
  set
    trial_end = p_trial_end,
    current_period_end = coalesce(p_trial_end, current_period_end),
    status = case
      when p_trial_end is not null and p_trial_end > now() then 'trialing'
      else status
    end,
    updated_at = now()
  where id = v_subscription_id;
end;
$$;
