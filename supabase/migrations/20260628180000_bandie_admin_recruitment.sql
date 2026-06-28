-- Admin recruitment: list invites, leader contact, assign band leader

create or replace function public.bandie_list_band_invitations_for_owner(p_band_id uuid)
returns table (
  id uuid,
  band_id uuid,
  email text,
  invitee_display_name text,
  role text,
  token text,
  status text,
  expires_at timestamptz,
  created_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select
    i.id,
    i.band_id,
    i.email,
    coalesce(
      nullif(trim(p.display_name), ''),
      nullif(trim(u.raw_user_meta_data->>'display_name'), '')
    ) as invitee_display_name,
    i.role,
    i.token,
    i.status,
    i.expires_at,
    i.created_at
  from public.bandie_band_invitations i
  left join auth.users u on lower(u.email) = lower(i.email)
  left join public.bandie_profiles p on p.user_id = u.id
  where i.band_id = p_band_id
    and i.status = 'pending'
    and public.platform_current_user_has_app_access('bandie')
    and (
      public.bandie_current_user_is_app_admin()
      or exists (
        select 1
        from public.bandie_bands b
        where b.id = p_band_id
          and b.owner_user_id = auth.uid()
      )
    )
  order by i.created_at desc;
$$;

create or replace function public.bandie_get_band_leader_contact(p_band_id uuid)
returns table (
  user_id uuid,
  display_name text,
  email text,
  contact_phone text
)
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  leader_user_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not public.platform_current_user_has_app_access('bandie') then
    raise exception 'No app access';
  end if;

  if not public.bandie_current_user_is_app_admin()
     and not exists (
       select 1
       from public.bandie_band_members m
       where m.band_id = p_band_id
         and m.user_id = auth.uid()
         and m.status = 'active'
     ) then
    raise exception 'Not authorized';
  end if;

  select b.owner_user_id
  into leader_user_id
  from public.bandie_bands b
  where b.id = p_band_id;

  if leader_user_id is null then
    return;
  end if;

  return query
  select
    leader_user_id,
    coalesce(nullif(trim(p.display_name), ''), split_part(u.email, '@', 1)) as display_name,
    coalesce(nullif(trim(p.contact_email), ''), u.email::text) as email,
    nullif(trim(p.contact_phone), '') as contact_phone
  from auth.users u
  left join public.bandie_profiles p on p.user_id = u.id
  where u.id = leader_user_id;
end;
$$;

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

  if not public.bandie_current_user_is_app_admin() then
    raise exception 'Only platform admins can assign a band leader';
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
