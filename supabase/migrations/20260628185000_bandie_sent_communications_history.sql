-- Include resolved sent invites (accepted/declined) in communications history

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
    and (
      (i.status = 'pending' and i.expires_at > now())
      or i.status in ('accepted', 'declined')
    )
    and (
      public.bandie_current_user_is_app_admin()
      or b.owner_user_id = auth.uid()
    )
    and not exists (
      select 1
      from public.bandie_player_outreach po
      where po.band_invitation_id = i.id
    )
  order by i.created_at desc
  limit 100;
$$;

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
    and (
      (po.status = 'pending' and po.expires_at > now())
      or po.status in ('accepted', 'declined')
    )
    and (
      public.bandie_current_user_is_app_admin()
      or b.owner_user_id = auth.uid()
    )
  order by po.created_at desc
  limit 100;
$$;
