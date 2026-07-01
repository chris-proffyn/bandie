-- Platform access mode: beta / promo full-access windows

insert into public.bandie_platform_settings (key, value)
values (
  'platform_access_mode',
  jsonb_build_object('mode', 'off', 'ends_at', null, 'note', null)
)
on conflict (key) do nothing;

create or replace function public.bandie_get_platform_access_mode()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_raw jsonb;
  v_mode text;
  v_ends_at timestamptz;
  v_active boolean;
  v_days integer;
begin
  select value into v_raw
  from public.bandie_platform_settings
  where key = 'platform_access_mode';

  if v_raw is null then
    return jsonb_build_object(
      'mode', 'off',
      'active', false,
      'ends_at', null,
      'days_remaining', null,
      'label', null
    );
  end if;

  v_mode := coalesce(nullif(trim(v_raw->>'mode'), ''), 'off');
  v_ends_at := nullif(trim(v_raw->>'ends_at'), '')::timestamptz;

  v_active := v_mode in ('beta', 'promo')
    and (v_ends_at is null or now() < v_ends_at);

  if v_active and v_ends_at is not null then
    v_days := greatest(1, ceil(extract(epoch from (v_ends_at - now())) / 86400.0)::integer);
  else
    v_days := null;
  end if;

  return jsonb_build_object(
    'mode', v_mode,
    'active', v_active,
    'ends_at', v_ends_at,
    'days_remaining', v_days,
    'label', case
      when not v_active then null
      when v_mode = 'beta' then 'Beta'
      when v_mode = 'promo' then 'Promo'
      else null
    end,
    'note', nullif(trim(v_raw->>'note'), '')
  );
end;
$$;

grant execute on function public.bandie_get_platform_access_mode() to anon, authenticated;
