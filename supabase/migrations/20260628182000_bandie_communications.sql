-- Communications: invitation decline, message replies, player outreach inbox

-- Allow invitees to decline band invitations
alter table public.bandie_band_invitations
  drop constraint if exists bandie_band_invitations_status_check;

alter table public.bandie_band_invitations
  add constraint bandie_band_invitations_status_check
    check (status in ('pending', 'accepted', 'declined', 'revoked', 'expired'));

create or replace function public.bandie_decline_invitation(invite_token text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  invite record;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not public.platform_current_user_has_app_access('bandie') then
    raise exception 'No app access';
  end if;

  select *
  into invite
  from public.bandie_band_invitations i
  where i.token = invite_token
    and i.status = 'pending'
    and i.expires_at > now()
  for update;

  if not found then
    raise exception 'Invitation not found or expired';
  end if;

  if lower(invite.email) <> lower(auth.jwt() ->> 'email') then
    raise exception 'Invitation email does not match signed-in user';
  end if;

  update public.bandie_band_invitations
  set status = 'declined'
  where id = invite.id;

  update public.bandie_player_outreach
  set status = 'declined'
  where band_invitation_id = invite.id
    and status = 'pending';
end;
$$;

grant execute on function public.bandie_decline_invitation(text) to authenticated;

-- Hide join invites that are surfaced via player outreach
create or replace function public.bandie_list_my_pending_invitations()
returns table (
  id uuid,
  band_id uuid,
  band_name text,
  role text,
  token text,
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
    i.expires_at,
    i.created_at
  from public.bandie_band_invitations i
  join public.bandie_bands b on b.id = i.band_id
  where i.status = 'pending'
    and i.expires_at > now()
    and auth.uid() is not null
    and lower(i.email) = lower(auth.jwt() ->> 'email')
    and not exists (
      select 1
      from public.bandie_player_outreach po
      join public.bandie_profiles p on p.id = po.player_profile_id
      where po.band_invitation_id = i.id
        and po.status = 'pending'
        and p.user_id = auth.uid()
    )
  order by i.created_at desc;
$$;

-- Message replies
alter table public.bandie_user_messages
  add column if not exists reply_to_message_id uuid
    references public.bandie_user_messages(id) on delete set null;

create index if not exists bandie_user_messages_reply_to_idx
  on public.bandie_user_messages (reply_to_message_id)
  where reply_to_message_id is not null;

drop function if exists public.bandie_list_my_messages();

create function public.bandie_list_my_messages()
returns table (
  id uuid,
  sender_user_id uuid,
  recipient_user_id uuid,
  sender_display_name text,
  sender_username text,
  recipient_display_name text,
  recipient_username text,
  body text,
  read_at timestamptz,
  reply_to_message_id uuid,
  reply_to_body text,
  created_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select
    m.id,
    m.sender_user_id,
    m.recipient_user_id,
    sender_profile.display_name as sender_display_name,
    sender_profile.username as sender_username,
    recipient_profile.display_name as recipient_display_name,
    recipient_profile.username as recipient_username,
    m.body,
    m.read_at,
    m.reply_to_message_id,
    parent.body as reply_to_body,
    m.created_at
  from public.bandie_user_messages m
  join public.bandie_profiles sender_profile
    on sender_profile.user_id = m.sender_user_id
  join public.bandie_profiles recipient_profile
    on recipient_profile.user_id = m.recipient_user_id
  left join public.bandie_user_messages parent
    on parent.id = m.reply_to_message_id
  where public.platform_current_user_has_app_access('bandie')
    and (m.sender_user_id = auth.uid() or m.recipient_user_id = auth.uid())
  order by m.created_at desc
  limit 100;
$$;

grant execute on function public.bandie_list_my_messages() to authenticated;

-- Player outreach inbox for invited players
drop policy if exists "Players can view their outreach" on public.bandie_player_outreach;
create policy "Players can view their outreach"
on public.bandie_player_outreach
for select
to authenticated
using (
  public.platform_current_user_has_app_access('bandie')
  and exists (
    select 1
    from public.bandie_profiles p
    where p.id = player_profile_id
      and p.user_id = auth.uid()
  )
);

drop policy if exists "Players can respond to their outreach" on public.bandie_player_outreach;
create policy "Players can respond to their outreach"
on public.bandie_player_outreach
for update
to authenticated
using (
  public.platform_current_user_has_app_access('bandie')
  and status = 'pending'
  and exists (
    select 1
    from public.bandie_profiles p
    where p.id = player_profile_id
      and p.user_id = auth.uid()
  )
)
with check (
  public.platform_current_user_has_app_access('bandie')
  and status in ('accepted', 'declined')
  and exists (
    select 1
    from public.bandie_profiles p
    where p.id = player_profile_id
      and p.user_id = auth.uid()
  )
);

create or replace function public.bandie_list_my_pending_player_outreach()
returns table (
  id uuid,
  band_id uuid,
  band_name text,
  invite_type text,
  message text,
  band_part_title text,
  inviter_display_name text,
  band_invitation_token text,
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
    and po.status = 'pending'
    and po.expires_at > now()
  order by po.created_at desc;
$$;

grant execute on function public.bandie_list_my_pending_player_outreach() to authenticated;

create or replace function public.bandie_count_my_pending_player_outreach()
returns integer
language sql
security definer
set search_path = public
stable
as $$
  select count(*)::integer
  from public.bandie_player_outreach po
  join public.bandie_profiles player on player.id = po.player_profile_id
  where public.platform_current_user_has_app_access('bandie')
    and player.user_id = auth.uid()
    and po.status = 'pending'
    and po.expires_at > now();
$$;

grant execute on function public.bandie_count_my_pending_player_outreach() to authenticated;

create or replace function public.bandie_respond_to_player_outreach(
  p_outreach_id uuid,
  p_accept boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  outreach record;
  invite_token text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not public.platform_current_user_has_app_access('bandie') then
    raise exception 'No app access';
  end if;

  select po.*, invitation.token as invitation_token
  into outreach
  from public.bandie_player_outreach po
  join public.bandie_profiles player on player.id = po.player_profile_id
  left join public.bandie_band_invitations invitation on invitation.id = po.band_invitation_id
  where po.id = p_outreach_id
    and player.user_id = auth.uid()
    and po.status = 'pending'
    and po.expires_at > now()
  for update of po;

  if not found then
    raise exception 'Outreach invite not found or expired';
  end if;

  if p_accept then
    if outreach.invite_type = 'join' and outreach.invitation_token is not null then
      perform public.bandie_accept_invitation(outreach.invitation_token);
    end if;

    update public.bandie_player_outreach
    set status = 'accepted'
    where id = outreach.id;
  else
    if outreach.invitation_token is not null then
      perform public.bandie_decline_invitation(outreach.invitation_token);
    else
      update public.bandie_player_outreach
      set status = 'declined'
      where id = outreach.id;
    end if;
  end if;
end;
$$;

grant execute on function public.bandie_respond_to_player_outreach(uuid, boolean) to authenticated;
