-- Set which active band leader is the primary public contact (bandie_bands.owner_user_id).

create or replace function public.bandie_set_primary_band_contact(
  p_band_id uuid,
  p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not public.platform_current_user_has_app_access('bandie') then
    raise exception 'No app access';
  end if;

  if not public.bandie_current_user_is_app_admin()
     and not public.bandie_current_user_owns_band(p_band_id) then
    raise exception 'Only band leaders can assign the primary contact';
  end if;

  if not exists (
    select 1
    from public.bandie_bands b
    where b.id = p_band_id
  ) then
    raise exception 'Band not found';
  end if;

  if not exists (
    select 1
    from public.bandie_band_members m
    where m.band_id = p_band_id
      and m.user_id = p_user_id
      and m.status = 'active'
      and m.role = 'owner'
  ) then
    raise exception 'Primary contact must be an active band leader';
  end if;

  update public.bandie_bands
  set owner_user_id = p_user_id
  where id = p_band_id
    and owner_user_id is distinct from p_user_id;
end;
$$;

grant execute on function public.bandie_set_primary_band_contact(uuid, uuid) to authenticated;
