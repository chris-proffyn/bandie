-- Let users on launch-promo full access simulate lower player tiers for entitlement testing.

alter table public.bandie_profiles
  add column if not exists entitlement_test_leader_plan_code text;

alter table public.bandie_profiles
  drop constraint if exists bandie_profiles_entitlement_test_leader_plan_code_check;

alter table public.bandie_profiles
  add constraint bandie_profiles_entitlement_test_leader_plan_code_check
  check (
    entitlement_test_leader_plan_code is null
    or entitlement_test_leader_plan_code in ('player_free', 'player_plus', 'player_pro')
  );

comment on column public.bandie_profiles.entitlement_test_leader_plan_code is
  'When set, users on an active launch_promo leader subscription operate as this player plan for entitlement checks.';
