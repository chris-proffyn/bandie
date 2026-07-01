-- Default new users to Player Free / Organiser Free test-plan experience, even during launch promo or platform access offers.

alter table public.bandie_profiles
  add column if not exists entitlement_test_organiser_plan_code text;

alter table public.bandie_profiles
  drop constraint if exists bandie_profiles_entitlement_test_organiser_plan_code_check;

alter table public.bandie_profiles
  add constraint bandie_profiles_entitlement_test_organiser_plan_code_check
  check (
    entitlement_test_organiser_plan_code is null
    or entitlement_test_organiser_plan_code in ('organiser_free', 'organiser_plus')
  );

comment on column public.bandie_profiles.entitlement_test_leader_plan_code is
  'Simulated player plan for entitlement checks. Defaults to player_free on signup; null uses the subscription plan.';

comment on column public.bandie_profiles.entitlement_test_organiser_plan_code is
  'Simulated organiser plan for entitlement checks. Defaults to organiser_free when organiser role is granted; null uses the subscription plan.';

create or replace function public.bandie_apply_default_entitlement_test_plans(
  p_user_id uuid,
  p_is_organiser boolean default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_organiser boolean;
begin
  select coalesce(p_is_organiser, p.is_organiser, false)
  into v_is_organiser
  from public.bandie_profiles p
  where p.user_id = p_user_id;

  if not found then
    return;
  end if;

  update public.bandie_profiles
  set
    entitlement_test_leader_plan_code = coalesce(entitlement_test_leader_plan_code, 'player_free'),
    entitlement_test_organiser_plan_code = case
      when v_is_organiser then coalesce(entitlement_test_organiser_plan_code, 'organiser_free')
      else entitlement_test_organiser_plan_code
    end,
    updated_at = now()
  where user_id = p_user_id;
end;
$$;

grant execute on function public.bandie_apply_default_entitlement_test_plans(uuid, boolean) to authenticated;

create or replace function public.bandie_profiles_assign_default_subscriptions()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.bandie_assign_default_user_subscriptions(
    new.user_id,
    coalesce(new.is_organiser, false)
  );
  perform public.bandie_apply_default_entitlement_test_plans(
    new.user_id,
    coalesce(new.is_organiser, false)
  );
  return new;
end;
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

  if p_is_organiser then
    perform public.bandie_apply_default_entitlement_test_plans(p_user_id, true);
  end if;
end;
$$;

-- Existing accounts without a test plan default to free-tier simulation.
update public.bandie_profiles
set entitlement_test_leader_plan_code = 'player_free'
where entitlement_test_leader_plan_code is null;

update public.bandie_profiles
set entitlement_test_organiser_plan_code = 'organiser_free'
where is_organiser = true
  and entitlement_test_organiser_plan_code is null;

-- Existing profiles accepting an organiser invite skip the insert trigger (ON CONFLICT path).
create or replace function public.bandie_accept_organiser_invitation(p_token text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  invite record;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select *
  into invite
  from public.bandie_organiser_invitations i
  where i.token = p_token
    and i.status = 'pending'
    and i.expires_at > now()
  for update;

  if not found then
    raise exception 'Invitation not found or expired';
  end if;

  if lower(invite.email) <> lower(auth.jwt() ->> 'email') then
    raise exception 'Invitation email does not match signed-in user';
  end if;

  if not public.platform_current_user_has_app_access('bandie') then
    insert into public.platform_user_app_memberships (user_id, app_code, role, status)
    values (auth.uid(), 'bandie', 'user', 'active')
    on conflict (user_id, app_code) do update
    set status = 'active', updated_at = now();
  end if;

  insert into public.bandie_profiles (user_id, display_name, is_player, is_organiser)
  values (
    auth.uid(),
    coalesce(
      nullif(trim(auth.jwt() ->> 'email'), ''),
      split_part(auth.jwt() ->> 'email', '@', 1)
    ),
    false,
    true
  )
  on conflict (user_id) do update
  set
    is_organiser = true,
    updated_at = now();

  perform public.bandie_assign_default_user_subscriptions(auth.uid(), true);
  perform public.bandie_apply_default_entitlement_test_plans(auth.uid(), true);

  update public.bandie_organiser_invitations
  set status = 'accepted'
  where id = invite.id;
end;
$$;
