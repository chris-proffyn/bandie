-- Lineup member controls: temporary unavailability and band-owner leadership transfer.

alter table public.bandie_band_members
  add column if not exists lineup_unavailable boolean not null default false;

comment on column public.bandie_band_members.lineup_unavailable is
  'When true, the member is temporarily away from the lineup (e.g. holiday).';

-- Band owners (not only platform admins) may transfer leadership to an active member.
create or replace function public.bandie_assign_band_leader(
  p_band_id uuid,
  p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  old_owner_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not public.platform_current_user_has_app_access('bandie') then
    raise exception 'No app access';
  end if;

  if not public.bandie_current_user_is_app_admin()
     and not public.bandie_current_user_owns_band(p_band_id) then
    raise exception 'Only the band leader can transfer leadership';
  end if;

  if not exists (
    select 1
    from public.bandie_band_members m
    where m.band_id = p_band_id
      and m.user_id = p_user_id
      and m.status = 'active'
  ) then
    raise exception 'The new leader must be an active band member';
  end if;

  select b.owner_user_id
  into old_owner_id
  from public.bandie_bands b
  where b.id = p_band_id;

  if old_owner_id is null then
    raise exception 'Band not found';
  end if;

  if old_owner_id = p_user_id then
    return;
  end if;

  update public.bandie_bands
  set owner_user_id = p_user_id
  where id = p_band_id;

  update public.bandie_band_members
  set role = 'member'
  where band_id = p_band_id
    and user_id = old_owner_id;

  update public.bandie_band_members
  set role = 'owner'
  where band_id = p_band_id
    and user_id = p_user_id;
end;
$$;

grant execute on function public.bandie_assign_band_leader(uuid, uuid) to authenticated;
