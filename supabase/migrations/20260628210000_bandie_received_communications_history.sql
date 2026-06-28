-- Include resolved received invites (accepted/declined) in communications history

create or replace function public.bandie_list_my_received_band_invitations()
returns table (
  id uuid,
  band_id uuid,
  band_name text,
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
    b.name as band_name,
    i.role,
    i.token,
    i.status,
    i.expires_at,
    i.created_at
  from public.bandie_band_invitations i
  join public.bandie_bands b on b.id = i.band_id
  where public.platform_current_user_has_app_access('bandie')
    and auth.uid() is not null
    and lower(i.email) = lower(auth.jwt() ->> 'email')
    and (
      (i.status = 'pending' and i.expires_at > now())
      or i.status in ('accepted', 'declined')
    )
    and not exists (
      select 1
      from public.bandie_player_outreach po
      join public.bandie_profiles p on p.id = po.player_profile_id
      where po.band_invitation_id = i.id
        and p.user_id = auth.uid()
        and (
          (po.status = 'pending' and po.expires_at > now())
          or po.status in ('accepted', 'declined')
        )
    )
  order by i.created_at desc
  limit 100;
$$;

grant execute on function public.bandie_list_my_received_band_invitations() to authenticated;

create or replace function public.bandie_list_my_received_player_outreach()
returns table (
  id uuid,
  band_id uuid,
  band_name text,
  invite_type text,
  message text,
  band_part_title text,
  inviter_display_name text,
  band_invitation_token text,
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
    part.title as band_part_title,
    inviter.display_name as inviter_display_name,
    invitation.token as band_invitation_token,
    po.status,
    po.expires_at,
    po.created_at
  from public.bandie_player_outreach po
  join public.bandie_bands b on b.id = po.band_id
  join public.bandie_profiles player on player.id = po.player_profile_id
  left join public.bandie_band_parts part on part.id = po.band_part_id
  left join public.bandie_profiles inviter on inviter.user_id = po.invited_by
  left join public.bandie_band_invitations invitation on invitation.id = po.band_invitation_id
  where public.platform_current_user_has_app_access('bandie')
    and player.user_id = auth.uid()
    and (
      (po.status = 'pending' and po.expires_at > now())
      or po.status in ('accepted', 'declined')
    )
  order by po.created_at desc
  limit 100;
$$;

grant execute on function public.bandie_list_my_received_player_outreach() to authenticated;
