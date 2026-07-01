-- Admin accounts: paginated user/band lists and admin management RPCs

create or replace function public.bandie_admin_list_user_accounts(
  p_query text default null,
  p_limit integer default 20,
  p_offset integer default 0
)
returns table (
  user_id uuid,
  display_name text,
  username text,
  email text,
  is_player boolean,
  is_organiser boolean,
  entitlement_test_leader_plan_code text,
  leader_subscription_id uuid,
  leader_plan_code text,
  leader_plan_name text,
  leader_subscription_status text,
  leader_subscription_source text,
  leader_trial_end timestamptz,
  leader_stripe_subscription_id text,
  organiser_subscription_id uuid,
  organiser_plan_code text,
  organiser_plan_name text,
  organiser_subscription_status text,
  organiser_subscription_source text,
  organiser_trial_end timestamptz,
  organiser_stripe_subscription_id text,
  active_override_count integer,
  created_at timestamptz
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
    u.email::text,
    p.is_player,
    p.is_organiser,
    p.entitlement_test_leader_plan_code,
    leader_sub.subscription_id,
    leader_sub.plan_code,
    leader_sub.plan_name,
    leader_sub.status,
    leader_sub.source,
    leader_sub.trial_end,
    leader_sub.stripe_subscription_id,
    organiser_sub.subscription_id,
    organiser_sub.plan_code,
    organiser_sub.plan_name,
    organiser_sub.status,
    organiser_sub.source,
    organiser_sub.trial_end,
    organiser_sub.stripe_subscription_id,
    coalesce(override_counts.cnt, 0) as active_override_count,
    p.created_at
  from public.bandie_profiles p
  join auth.users u on u.id = p.user_id
  left join lateral (
    select
      s.id as subscription_id,
      pl.code as plan_code,
      pl.name as plan_name,
      s.status,
      s.source,
      s.trial_end,
      s.stripe_subscription_id
    from public.bandie_subscriptions s
    join public.bandie_plans pl on pl.id = s.plan_id
    where s.subject_type = 'user'
      and s.subject_id = p.user_id
      and s.plan_scope = 'leader'
      and s.status in ('active', 'trialing', 'past_due')
    order by s.created_at desc
    limit 1
  ) leader_sub on true
  left join lateral (
    select
      s.id as subscription_id,
      pl.code as plan_code,
      pl.name as plan_name,
      s.status,
      s.source,
      s.trial_end,
      s.stripe_subscription_id
    from public.bandie_subscriptions s
    join public.bandie_plans pl on pl.id = s.plan_id
    where s.subject_type = 'user'
      and s.subject_id = p.user_id
      and s.plan_scope = 'organiser'
      and s.status in ('active', 'trialing', 'past_due')
    order by s.created_at desc
    limit 1
  ) organiser_sub on true
  left join lateral (
    select count(*)::integer as cnt
    from public.bandie_entitlement_overrides o
    where o.subject_type = 'user'
      and o.subject_id = p.user_id
      and (o.expires_at is null or o.expires_at > now())
  ) override_counts on true
  where public.bandie_current_user_is_app_admin()
    and (
      p_query is null
      or trim(p_query) = ''
      or p.display_name ilike '%' || trim(p_query) || '%'
      or p.username ilike '%' || trim(p_query) || '%'
      or u.email ilike '%' || trim(p_query) || '%'
    )
  order by p.created_at desc, p.display_name nulls last
  limit greatest(1, least(coalesce(p_limit, 20), 100))
  offset greatest(coalesce(p_offset, 0), 0);
$$;

create or replace function public.bandie_admin_count_user_accounts(p_query text default null)
returns integer
language sql
security definer
set search_path = public
stable
as $$
  select count(*)::integer
  from public.bandie_profiles p
  join auth.users u on u.id = p.user_id
  where public.bandie_current_user_is_app_admin()
    and (
      p_query is null
      or trim(p_query) = ''
      or p.display_name ilike '%' || trim(p_query) || '%'
      or p.username ilike '%' || trim(p_query) || '%'
      or u.email ilike '%' || trim(p_query) || '%'
    );
$$;

create or replace function public.bandie_admin_list_band_accounts(
  p_query text default null,
  p_limit integer default 20,
  p_offset integer default 0
)
returns table (
  band_id uuid,
  name text,
  slug text,
  owner_user_id uuid,
  owner_display_name text,
  owner_email text,
  leader_plan_code text,
  leader_plan_name text,
  leader_subscription_source text,
  leader_trial_end timestamptz,
  member_count integer,
  song_count integer,
  created_at timestamptz
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
    owner_profile.display_name as owner_display_name,
    owner_user.email::text as owner_email,
    leader_sub.code as leader_plan_code,
    leader_sub.name as leader_plan_name,
    leader_sub.source as leader_subscription_source,
    leader_sub.trial_end as leader_trial_end,
    coalesce(member_counts.cnt, 0) as member_count,
    coalesce(song_counts.cnt, 0) as song_count,
    b.created_at
  from public.bandie_bands b
  left join public.bandie_profiles owner_profile on owner_profile.user_id = b.owner_user_id
  left join auth.users owner_user on owner_user.id = b.owner_user_id
  left join lateral (
    select s.source, s.trial_end, pl.code, pl.name
    from public.bandie_subscriptions s
    join public.bandie_plans pl on pl.id = s.plan_id
    where s.subject_type = 'user'
      and s.subject_id = b.owner_user_id
      and s.plan_scope = 'leader'
      and s.status in ('active', 'trialing', 'past_due')
    order by s.created_at desc
    limit 1
  ) leader_sub on true
  left join lateral (
    select count(*)::integer as cnt
    from public.bandie_band_members m
    where m.band_id = b.id
      and m.status = 'active'
  ) member_counts on true
  left join lateral (
    select count(*)::integer as cnt
    from public.bandie_songs s
    where s.band_id = b.id
      and s.is_deleted = false
  ) song_counts on true
  where public.bandie_current_user_is_app_admin()
    and (
      p_query is null
      or trim(p_query) = ''
      or b.name ilike '%' || trim(p_query) || '%'
      or b.slug ilike '%' || trim(p_query) || '%'
    )
  order by b.created_at desc, b.name
  limit greatest(1, least(coalesce(p_limit, 20), 100))
  offset greatest(coalesce(p_offset, 0), 0);
$$;

create or replace function public.bandie_admin_count_band_accounts(p_query text default null)
returns integer
language sql
security definer
set search_path = public
stable
as $$
  select count(*)::integer
  from public.bandie_bands b
  where public.bandie_current_user_is_app_admin()
    and (
      p_query is null
      or trim(p_query) = ''
      or b.name ilike '%' || trim(p_query) || '%'
      or b.slug ilike '%' || trim(p_query) || '%'
    );
$$;

create or replace function public.bandie_admin_update_user_workspace_roles(
  p_user_id uuid,
  p_is_player boolean,
  p_is_organiser boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.bandie_current_user_is_app_admin() then
    raise exception 'Admin access required';
  end if;

  if not p_is_player and not p_is_organiser then
    raise exception 'User must be a player, organiser, or both';
  end if;

  update public.bandie_profiles
  set
    is_player = p_is_player,
    is_organiser = p_is_organiser,
    updated_at = now()
  where user_id = p_user_id;

  if not found then
    raise exception 'User profile not found';
  end if;
end;
$$;

create or replace function public.bandie_admin_update_user_entitlement_test_plan(
  p_user_id uuid,
  p_plan_code text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.bandie_current_user_is_app_admin() then
    raise exception 'Admin access required';
  end if;

  if p_plan_code is not null
    and p_plan_code not in ('player_free', 'player_plus', 'player_pro') then
    raise exception 'Invalid test plan code';
  end if;

  update public.bandie_profiles
  set
    entitlement_test_leader_plan_code = p_plan_code,
    updated_at = now()
  where user_id = p_user_id;

  if not found then
    raise exception 'User profile not found';
  end if;
end;
$$;

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
    raise exception 'No active subscription found for this scope';
  end if;

  if v_stripe_subscription_id is not null then
    raise exception 'Cannot change plan on a Stripe-billed subscription from admin accounts';
  end if;

  update public.bandie_subscriptions
  set
    plan_id = v_plan_id,
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
    raise exception 'No active subscription found for this scope';
  end if;

  if v_stripe_subscription_id is not null then
    raise exception 'Cannot change trial end on a Stripe-billed subscription from admin accounts';
  end if;

  update public.bandie_subscriptions
  set
    trial_end = p_trial_end,
    updated_at = now()
  where id = v_subscription_id;
end;
$$;

grant execute on function public.bandie_admin_list_user_accounts(text, integer, integer) to authenticated;
grant execute on function public.bandie_admin_count_user_accounts(text) to authenticated;
grant execute on function public.bandie_admin_list_band_accounts(text, integer, integer) to authenticated;
grant execute on function public.bandie_admin_count_band_accounts(text) to authenticated;
grant execute on function public.bandie_admin_update_user_workspace_roles(uuid, boolean, boolean) to authenticated;
grant execute on function public.bandie_admin_update_user_entitlement_test_plan(uuid, text) to authenticated;
grant execute on function public.bandie_admin_set_user_subscription_plan(uuid, text, text) to authenticated;
grant execute on function public.bandie_admin_set_user_subscription_trial_end(uuid, text, timestamptz) to authenticated;
