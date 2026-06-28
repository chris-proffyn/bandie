-- Every band must have an active leader (owner). Repair existing data and enforce on membership changes.

create or replace function public.bandie_get_fallback_band_leader_user_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select m.user_id
  from public.platform_user_app_memberships m
  where m.app_code = 'bandie'
    and m.status = 'active'
    and m.role in ('admin', 'owner')
  order by
    case when m.role = 'owner' then 0 else 1 end,
    m.created_at,
    m.user_id
  limit 1;
$$;

grant execute on function public.bandie_get_fallback_band_leader_user_id() to authenticated;

create or replace function public.bandie_ensure_band_leader(p_band_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_owner uuid;
  resolved_owner uuid;
  fallback_admin uuid;
begin
  select b.owner_user_id
  into current_owner
  from public.bandie_bands b
  where b.id = p_band_id;

  if not found then
    return null;
  end if;

  if exists (
    select 1
    from public.bandie_band_members m
    where m.band_id = p_band_id
      and m.user_id = current_owner
      and m.role = 'owner'
      and m.status = 'active'
  ) then
    update public.bandie_band_members
    set role = 'member'
    where band_id = p_band_id
      and role = 'owner'
      and status = 'active'
      and user_id <> current_owner;

    return current_owner;
  end if;

  select m.user_id
  into resolved_owner
  from public.bandie_band_members m
  where m.band_id = p_band_id
    and m.role = 'owner'
    and m.status = 'active'
  order by m.created_at
  limit 1;

  if resolved_owner is not null then
    update public.bandie_bands
    set owner_user_id = resolved_owner
    where id = p_band_id;

    update public.bandie_band_members
    set role = 'member'
    where band_id = p_band_id
      and role = 'owner'
      and status = 'active'
      and user_id <> resolved_owner;

    return resolved_owner;
  end if;

  fallback_admin := public.bandie_get_fallback_band_leader_user_id();

  if fallback_admin is null then
    raise exception 'No Bandie platform admin available to assign as interim band leader';
  end if;

  insert into public.bandie_band_members (band_id, user_id, role, status)
  values (p_band_id, fallback_admin, 'owner', 'active')
  on conflict (band_id, user_id) do update
  set role = 'owner', status = 'active';

  update public.bandie_bands
  set owner_user_id = fallback_admin
  where id = p_band_id;

  update public.bandie_band_members
  set role = 'member'
  where band_id = p_band_id
    and role = 'owner'
    and status = 'active'
    and user_id <> fallback_admin;

  return fallback_admin;
end;
$$;

grant execute on function public.bandie_ensure_band_leader(uuid) to authenticated;

create or replace function public.bandie_band_members_ensure_leader_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_band_id uuid;
begin
  target_band_id := coalesce(new.band_id, old.band_id);
  perform public.bandie_ensure_band_leader(target_band_id);
  return coalesce(new, old);
end;
$$;

drop trigger if exists bandie_band_members_ensure_leader on public.bandie_band_members;
create trigger bandie_band_members_ensure_leader
after insert or update or delete on public.bandie_band_members
for each row execute function public.bandie_band_members_ensure_leader_trigger();

-- Repair all existing bands (idempotent).
do $$
declare
  band_row record;
begin
  for band_row in select id from public.bandie_bands order by created_at loop
    perform public.bandie_ensure_band_leader(band_row.id);
  end loop;
end;
$$;
