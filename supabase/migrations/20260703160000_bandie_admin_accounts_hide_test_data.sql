-- Admin accounts: optional exclusion of fictitious test_user rows

drop function if exists public.bandie_admin_list_user_accounts(text, integer, integer);
drop function if exists public.bandie_admin_count_user_accounts(text);
drop function if exists public.bandie_admin_list_band_accounts(text, integer, integer);
drop function if exists public.bandie_admin_count_band_accounts(text);

create or replace function public.bandie_admin_list_user_accounts(
  p_query text default null,
  p_limit integer default 20,
  p_offset integer default 0,
  p_hide_test_data boolean default false
)
returns table (
  user_id uuid,
  display_name text,
  username text,
  email text,
  is_player boolean,
  is_organiser boolean,
  test_user boolean,
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
    p.test_user,
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
    and (not coalesce(p_hide_test_data, false) or not p.test_user)
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

create or replace function public.bandie_admin_count_user_accounts(
  p_query text default null,
  p_hide_test_data boolean default false
)
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
    and (not coalesce(p_hide_test_data, false) or not p.test_user)
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
  p_offset integer default 0,
  p_hide_test_data boolean default false
)
returns table (
  band_id uuid,
  name text,
  slug text,
  owner_user_id uuid,
  owner_display_name text,
  owner_email text,
  test_user boolean,
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
    b.test_user,
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
    and (not coalesce(p_hide_test_data, false) or not b.test_user)
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

create or replace function public.bandie_admin_count_band_accounts(
  p_query text default null,
  p_hide_test_data boolean default false
)
returns integer
language sql
security definer
set search_path = public
stable
as $$
  select count(*)::integer
  from public.bandie_bands b
  where public.bandie_current_user_is_app_admin()
    and (not coalesce(p_hide_test_data, false) or not b.test_user)
    and (
      p_query is null
      or trim(p_query) = ''
      or b.name ilike '%' || trim(p_query) || '%'
      or b.slug ilike '%' || trim(p_query) || '%'
    );
$$;

create or replace function public.bandie_admin_test_data_counts()
returns table (
  test_user_count integer,
  test_band_count integer
)
language sql
security definer
set search_path = public
stable
as $$
  select
    (select count(*)::integer from public.bandie_profiles p where p.test_user) as test_user_count,
    (select count(*)::integer from public.bandie_bands b where b.test_user) as test_band_count
  where public.bandie_current_user_is_app_admin();
$$;

grant execute on function public.bandie_admin_list_user_accounts(text, integer, integer, boolean) to authenticated;
grant execute on function public.bandie_admin_count_user_accounts(text, boolean) to authenticated;
grant execute on function public.bandie_admin_list_band_accounts(text, integer, integer, boolean) to authenticated;
grant execute on function public.bandie_admin_count_band_accounts(text, boolean) to authenticated;
grant execute on function public.bandie_admin_test_data_counts() to authenticated;
