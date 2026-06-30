-- Player-to-player direct messaging from workspace player profiles.

create or replace function public.bandie_upsert_plan_entitlement(
  p_plan_code text,
  p_capability_key text,
  p_value jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan_id uuid;
begin
  select id into v_plan_id
  from public.bandie_plans
  where code = p_plan_code;

  if v_plan_id is null then
    raise exception 'Plan % not found', p_plan_code;
  end if;

  insert into public.bandie_plan_entitlements (plan_id, capability_key, value)
  values (v_plan_id, p_capability_key, p_value)
  on conflict (plan_id, capability_key) do update set
    value = excluded.value,
    updated_at = now();
end;
$$;

insert into public.bandie_capabilities (key, name, description, category, value_type, default_value)
values
  (
    'player_message.send',
    'Message players',
    'Send direct messages to other players from their profile',
    'profile',
    'boolean',
    'true'
  )
on conflict (key) do update set
  name = excluded.name,
  description = excluded.description,
  category = excluded.category,
  value_type = excluded.value_type,
  default_value = excluded.default_value;

-- Player Free can message bandmates (profiles opened from band workspace).
select public.bandie_upsert_plan_entitlement('player_free', 'player_message.send', 'true');
select public.bandie_upsert_plan_entitlement('player_plus', 'player_message.send', 'true');
select public.bandie_upsert_plan_entitlement('player_pro', 'player_message.send', 'true');

drop function public.bandie_upsert_plan_entitlement(text, text, jsonb);
