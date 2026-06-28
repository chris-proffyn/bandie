-- Sent invitations and player outreach for band leaders (communications hub)

create or replace function public.bandie_list_my_sent_band_invitations()
returns table (
  id uuid,
  band_id uuid,
  band_name text,
  email text,
  invitee_display_name text,
  role text,
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
    b.name as band_name,
    i.email,
    coalesce(
      nullif(trim(p.display_name), ''),
      nullif(trim(u.raw_user_meta_data->>'display_name'), '')
    ) as invitee_display_name,
    i.role,
    i.status,
    i.expires_at,
    i.created_at
  from public.bandie_band_invitations i
  join public.bandie_bands b on b.id = i.band_id
  left join auth.users u on lower(u.email) = lower(i.email)
  left join public.bandie_profiles p on p.user_id = u.id
  where public.platform_current_user_has_app_access('bandie')
    and i.status = 'pending'
    and i.expires_at > now()
    and (
      public.bandie_current_user_is_app_admin()
      or b.owner_user_id = auth.uid()
    )
    and not exists (
      select 1
      from public.bandie_player_outreach po
      where po.band_invitation_id = i.id
        and po.status = 'pending'
    )
  order by i.created_at desc;
$$;

grant execute on function public.bandie_list_my_sent_band_invitations() to authenticated;

create or replace function public.bandie_list_my_sent_player_outreach()
returns table (
  id uuid,
  band_id uuid,
  band_name text,
  invite_type text,
  message text,
  player_display_name text,
  player_email text,
  band_part_title text,
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
    po.id,
    po.band_id,
    b.name as band_name,
    po.invite_type,
    po.message,
    player.display_name as player_display_name,
    po.player_email,
    part.title as band_part_title,
    po.status,
    po.expires_at,
    po.created_at
  from public.bandie_player_outreach po
  join public.bandie_bands b on b.id = po.band_id
  join public.bandie_profiles player on player.id = po.player_profile_id
  left join public.bandie_band_parts part on part.id = po.band_part_id
  where public.platform_current_user_has_app_access('bandie')
    and po.invited_by = auth.uid()
    and po.status = 'pending'
    and po.expires_at > now()
    and (
      public.bandie_current_user_is_app_admin()
      or b.owner_user_id = auth.uid()
    )
  order by po.created_at desc;
$$;

grant execute on function public.bandie_list_my_sent_player_outreach() to authenticated;

create or replace function public.bandie_revoke_player_outreach(p_outreach_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  outreach record;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not public.platform_current_user_has_app_access('bandie') then
    raise exception 'No app access';
  end if;

  select po.*, b.owner_user_id
  into outreach
  from public.bandie_player_outreach po
  join public.bandie_bands b on b.id = po.band_id
  where po.id = p_outreach_id
    and po.status = 'pending'
  for update of po;

  if not found then
    raise exception 'Outreach invite not found or already closed';
  end if;

  if not public.bandie_current_user_is_app_admin()
     and outreach.owner_user_id <> auth.uid() then
    raise exception 'Only the band leader can revoke this invite';
  end if;

  update public.bandie_player_outreach
  set status = 'revoked'
  where id = outreach.id;

  if outreach.band_invitation_id is not null then
    update public.bandie_band_invitations
    set status = 'revoked'
    where id = outreach.band_invitation_id
      and status = 'pending';
  end if;
end;
$$;

grant execute on function public.bandie_revoke_player_outreach(uuid) to authenticated;
