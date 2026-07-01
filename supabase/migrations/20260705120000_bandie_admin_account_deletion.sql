-- Admin account deletion: soft delete profiles, leadership transfer, Dropbox disconnect.

alter table public.bandie_profiles
  add column if not exists account_deleted_at timestamptz,
  add column if not exists account_deleted_by uuid references auth.users(id);

comment on column public.bandie_profiles.account_deleted_at is
  'When set, the account is deleted: sign-in blocked, PII scrubbed, communications show Deleted user.';

create index if not exists bandie_profiles_account_deleted_at_idx
  on public.bandie_profiles (account_deleted_at)
  where account_deleted_at is not null;

-- ---------------------------------------------------------------------------
-- Display helpers for communications and directory surfaces
-- ---------------------------------------------------------------------------

create or replace function public.bandie_profile_communication_display_name(
  p_display_name text,
  p_account_deleted_at timestamptz
)
returns text
language sql
immutable
as $$
  select case
    when p_account_deleted_at is not null then 'Deleted user'
    else nullif(trim(p_display_name), '')
  end;
$$;

create or replace function public.bandie_profile_account_is_deleted(p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.bandie_profiles p
    where p.user_id = p_user_id
      and p.account_deleted_at is not null
  );
$$;

grant execute on function public.bandie_profile_account_is_deleted(uuid) to authenticated, anon;

-- Block deleted accounts from username/email login resolution.
create or replace function public.bandie_resolve_login_email(p_identifier text)
returns text
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_raw text := trim(coalesce(p_identifier, ''));
  v_identifier text := lower(v_raw);
  v_email text;
  v_deleted boolean;
begin
  if v_raw = '' then
    return null;
  end if;

  if position('@' in v_raw) > 0 then
    select p.account_deleted_at is not null
    into v_deleted
    from auth.users u
    join public.bandie_profiles p on p.user_id = u.id
    where lower(u.email) = lower(v_raw)
    limit 1;

    if coalesce(v_deleted, false) then
      return null;
    end if;

    return v_raw;
  end if;

  select u.email, p.account_deleted_at is not null
  into v_email, v_deleted
  from public.bandie_profiles p
  join auth.users u on u.id = p.user_id
  where lower(p.username) = v_identifier
  limit 1;

  if coalesce(v_deleted, false) then
    return null;
  end if;

  return v_email;
end;
$$;

-- ---------------------------------------------------------------------------
-- Communications: show Deleted user for deleted accounts
-- ---------------------------------------------------------------------------

create or replace function public.bandie_list_my_messages()
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
    public.bandie_profile_communication_display_name(
      sender_profile.display_name,
      sender_profile.account_deleted_at
    ) as sender_display_name,
    case
      when sender_profile.account_deleted_at is not null then null
      else sender_profile.username
    end as sender_username,
    public.bandie_profile_communication_display_name(
      recipient_profile.display_name,
      recipient_profile.account_deleted_at
    ) as recipient_display_name,
    case
      when recipient_profile.account_deleted_at is not null then null
      else recipient_profile.username
    end as recipient_username,
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

-- Booking enquiries inbox
create or replace function public.bandie_list_my_booking_enquiries()
returns table (
  id uuid,
  band_id uuid,
  band_name text,
  message_id uuid,
  sender_user_id uuid,
  recipient_user_id uuid,
  sender_display_name text,
  sender_username text,
  status text,
  preferred_date date,
  venue_summary text,
  set_duration_minutes integer,
  message_body text,
  message_read_at timestamptz,
  created_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select
    e.id,
    e.band_id,
    b.name as band_name,
    e.message_id,
    e.sender_user_id,
    e.recipient_user_id,
    public.bandie_profile_communication_display_name(
      sp.display_name,
      sp.account_deleted_at
    ) as sender_display_name,
    case when sp.account_deleted_at is not null then null else sp.username end as sender_username,
    e.status,
    e.preferred_date,
    e.venue_summary,
    e.set_duration_minutes,
    m.body as message_body,
    m.read_at as message_read_at,
    e.created_at
  from public.bandie_booking_enquiries e
  join public.bandie_user_messages m on m.id = e.message_id
  join public.bandie_bands b on b.id = e.band_id
  left join public.bandie_profiles sp on sp.user_id = e.sender_user_id
  where e.recipient_user_id = auth.uid()
     or e.sender_user_id = auth.uid()
  order by e.created_at desc;
$$;

-- Gig invite communications
create or replace function public.bandie_list_my_gig_invite_communications()
returns table (
  gig_band_id uuid,
  gig_id uuid,
  band_id uuid,
  band_name text,
  band_slug text,
  gig_title text,
  gig_starts_at timestamptz,
  venue_name text,
  venue_address text,
  invite_status text,
  running_order integer,
  slot_duration_minutes integer,
  sender_user_id uuid,
  recipient_user_id uuid,
  sender_display_name text,
  sender_username text,
  message_id uuid,
  message_body text,
  message_read_at timestamptz,
  invited_at timestamptz,
  direction text
)
language sql
security definer
set search_path = public
stable
as $$
  select
    gb.id as gig_band_id,
    g.id as gig_id,
    b.id as band_id,
    b.name as band_name,
    b.slug as band_slug,
    g.title as gig_title,
    g.starts_at as gig_starts_at,
    g.venue_name,
    g.venue_address,
    gb.invite_status,
    gb.running_order,
    gb.slot_duration_minutes,
    m.sender_user_id,
    m.recipient_user_id,
    public.bandie_profile_communication_display_name(
      sender_profile.display_name,
      sender_profile.account_deleted_at
    ) as sender_display_name,
    case
      when sender_profile.account_deleted_at is not null then null
      else sender_profile.username
    end as sender_username,
    m.id as message_id,
    m.body as message_body,
    m.read_at as message_read_at,
    gb.invited_at,
    case
      when m.recipient_user_id = auth.uid() then 'received'
      else 'sent'
    end as direction
  from public.bandie_gig_bands gb
  join public.bandie_gigs g on g.id = gb.gig_id
  join public.bandie_bands b on b.id = gb.band_id
  join public.bandie_user_messages m on m.id = gb.notification_message_id
  join public.bandie_profiles sender_profile on sender_profile.user_id = m.sender_user_id
  where public.platform_current_user_has_app_access('bandie')
    and gb.notification_message_id is not null
    and (
      m.recipient_user_id = auth.uid()
      or m.sender_user_id = auth.uid()
    )
  order by gb.invited_at desc
  limit 100;
$$;

-- Received player outreach (inviter name)
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
    public.bandie_profile_communication_display_name(
      inviter.display_name,
      inviter.account_deleted_at
    ) as inviter_display_name,
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

-- Sent player outreach (player name)
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
    public.bandie_profile_communication_display_name(
      player.display_name,
      player.account_deleted_at
    ) as player_display_name,
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
      or public.bandie_current_user_owns_band(po.band_id)
    )
  order by po.created_at desc
  limit 100;
$$;

-- ---------------------------------------------------------------------------
-- Admin accounts list: include deletion status
-- ---------------------------------------------------------------------------

drop function if exists public.bandie_admin_list_user_accounts(text, integer, integer, boolean);

create or replace function public.bandie_admin_list_user_accounts(
  p_query text default null,
  p_limit integer default 20,
  p_offset integer default 0,
  p_hide_test_data boolean default false
)
returns table (
  user_id uuid,
  display_name text,
  username text,
  email text,
  is_player boolean,
  is_organiser boolean,
  test_user boolean,
  account_deleted_at timestamptz,
  entitlement_test_leader_plan_code text,
  leader_subscription_id uuid,
  leader_plan_code text,
  leader_plan_name text,
  leader_subscription_status text,
  leader_subscription_source text,
  leader_trial_end timestamptz,
  leader_stripe_subscription_id text,
  organiser_subscription_id uuid,
  organiser_plan_code text,
  organiser_plan_name text,
  organiser_subscription_status text,
  organiser_subscription_source text,
  organiser_trial_end timestamptz,
  organiser_stripe_subscription_id text,
  active_override_count integer,
  created_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select
    p.user_id,
    p.display_name,
    p.username,
    u.email::text,
    p.is_player,
    p.is_organiser,
    p.test_user,
    p.account_deleted_at,
    p.entitlement_test_leader_plan_code,
    leader_sub.subscription_id,
    leader_sub.plan_code,
    leader_sub.plan_name,
    leader_sub.status,
    leader_sub.source,
    leader_sub.trial_end,
    leader_sub.stripe_subscription_id,
    organiser_sub.subscription_id,
    organiser_sub.plan_code,
    organiser_sub.plan_name,
    organiser_sub.status,
    organiser_sub.source,
    organiser_sub.trial_end,
    organiser_sub.stripe_subscription_id,
    coalesce(override_counts.cnt, 0) as active_override_count,
    p.created_at
  from public.bandie_profiles p
  join auth.users u on u.id = p.user_id
  left join lateral (
    select
      s.id as subscription_id,
      pl.code as plan_code,
      pl.name as plan_name,
      s.status,
      s.source,
      s.trial_end,
      s.stripe_subscription_id
    from public.bandie_subscriptions s
    join public.bandie_plans pl on pl.id = s.plan_id
    where s.subject_type = 'user'
      and s.subject_id = p.user_id
      and s.plan_scope = 'leader'
      and s.status in ('active', 'trialing', 'past_due')
    order by s.created_at desc
    limit 1
  ) leader_sub on true
  left join lateral (
    select
      s.id as subscription_id,
      pl.code as plan_code,
      pl.name as plan_name,
      s.status,
      s.source,
      s.trial_end,
      s.stripe_subscription_id
    from public.bandie_subscriptions s
    join public.bandie_plans pl on pl.id = s.plan_id
    where s.subject_type = 'user'
      and s.subject_id = p.user_id
      and s.plan_scope = 'organiser'
      and s.status in ('active', 'trialing', 'past_due')
    order by s.created_at desc
    limit 1
  ) organiser_sub on true
  left join lateral (
    select count(*)::integer as cnt
    from public.bandie_entitlement_overrides o
    where o.subject_type = 'user'
      and o.subject_id = p.user_id
      and (o.expires_at is null or o.expires_at > now())
  ) override_counts on true
  where public.bandie_current_user_is_app_admin()
    and (not coalesce(p_hide_test_data, false) or not p.test_user)
    and (
      p_query is null
      or trim(p_query) = ''
      or p.display_name ilike '%' || trim(p_query) || '%'
      or p.username ilike '%' || trim(p_query) || '%'
      or u.email ilike '%' || trim(p_query) || '%'
    )
  order by p.created_at desc, p.display_name nulls last
  limit greatest(1, least(coalesce(p_limit, 20), 100))
  offset greatest(coalesce(p_offset, 0), 0);
$$;

grant execute on function public.bandie_admin_list_user_accounts(text, integer, integer, boolean) to authenticated;

-- Exclude deleted users from admin search (active accounts only).
create or replace function public.bandie_admin_search_users(p_query text, p_limit integer default 25)
returns table (
  user_id uuid,
  display_name text,
  username text,
  email text
)
language sql
security definer
set search_path = public
stable
as $$
  select
    p.user_id,
    p.display_name,
    p.username,
    u.email::text
  from public.bandie_profiles p
  join auth.users u on u.id = p.user_id
  where public.bandie_current_user_is_app_admin()
    and p.account_deleted_at is null
    and (
      p_query is null
      or trim(p_query) = ''
      or p.display_name ilike '%' || trim(p_query) || '%'
      or p.username ilike '%' || trim(p_query) || '%'
      or u.email ilike '%' || trim(p_query) || '%'
    )
  order by p.display_name nulls last, p.username
  limit greatest(1, least(coalesce(p_limit, 25), 100));
$$;

-- ---------------------------------------------------------------------------
-- Deletion preview + execute
-- ---------------------------------------------------------------------------

create or replace function public.bandie_admin_get_user_account_deletion_preview(p_user_id uuid)
returns table (
  account_deleted_at timestamptz,
  is_platform_admin boolean,
  dropbox_connected boolean,
  dropbox_band_count integer,
  bands_requiring_transfer jsonb
)
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_deleted_at timestamptz;
  v_is_admin boolean;
  v_dropbox_connected boolean;
  v_dropbox_band_count integer;
  v_bands jsonb;
begin
  if not public.bandie_current_user_is_app_admin() then
    raise exception 'Only platform admins can preview account deletion';
  end if;

  if not exists (select 1 from public.bandie_profiles p where p.user_id = p_user_id) then
    raise exception 'User not found';
  end if;

  select p.account_deleted_at
  into v_deleted_at
  from public.bandie_profiles p
  where p.user_id = p_user_id;

  select exists (
    select 1
    from public.platform_user_app_memberships m
    where m.user_id = p_user_id
      and m.app_code = 'bandie'
      and m.is_app_admin
  )
  into v_is_admin;

  select exists (
    select 1
    from public.bandie_user_integrations i
    where i.user_id = p_user_id
      and i.provider = 'dropbox'
      and i.status = 'connected'
  )
  into v_dropbox_connected;

  select count(*)::integer
  into v_dropbox_band_count
  from public.bandie_band_song_part_storage s
  where s.owning_user_id = p_user_id
    and s.status = 'active';

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'band_id', b.id,
        'band_name', b.name,
        'member_options', coalesce(members.options, '[]'::jsonb)
      )
      order by b.name
    ),
    '[]'::jsonb
  )
  into v_bands
  from public.bandie_bands b
  join public.bandie_band_members leader
    on leader.band_id = b.id
   and leader.user_id = p_user_id
   and leader.status = 'active'
   and leader.role = 'owner'
  left join lateral (
    select jsonb_agg(
      jsonb_build_object(
        'user_id', m.user_id,
        'display_name', coalesce(
          nullif(trim(p.display_name), ''),
          nullif(trim(p.username), ''),
          split_part(u.email, '@', 1)
        )
      )
      order by m.created_at
    ) as options
    from public.bandie_band_members m
    join auth.users u on u.id = m.user_id
    left join public.bandie_profiles p on p.user_id = m.user_id
    where m.band_id = b.id
      and m.status = 'active'
      and m.user_id <> p_user_id
      and p.account_deleted_at is null
  ) members on true
  where public.bandie_count_band_leaders(b.id) <= 1;

  return query
  select
    v_deleted_at,
    v_is_admin,
    v_dropbox_connected,
    v_dropbox_band_count,
    v_bands;
end;
$$;

grant execute on function public.bandie_admin_get_user_account_deletion_preview(uuid) to authenticated;

create or replace function public.bandie_admin_disconnect_user_dropbox(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_integration_id uuid;
begin
  select i.id
  into v_integration_id
  from public.bandie_user_integrations i
  where i.user_id = p_user_id
    and i.provider = 'dropbox'
  limit 1;

  if v_integration_id is null then
    return;
  end if;

  update public.bandie_user_integrations
  set status = 'disconnected', updated_at = now()
  where id = v_integration_id;

  delete from public.bandie_user_integration_secrets
  where integration_id = v_integration_id;

  update public.bandie_band_song_part_storage
  set status = 'disconnected', updated_at = now()
  where integration_id = v_integration_id
     or owning_user_id = p_user_id;

  update public.bandie_song_part_files f
  set
    dropbox_file_id = null,
    dropbox_path_lower = null,
    dropbox_rev = null,
    dropbox_content_hash = null,
    storage_id = null,
    status = 'unavailable',
    updated_at = now()
  where f.storage_id in (
    select s.id
    from public.bandie_band_song_part_storage s
    where s.owning_user_id = p_user_id
  )
     or f.band_id in (
    select s.band_id
    from public.bandie_band_song_part_storage s
    where s.owning_user_id = p_user_id
  );

  update public.bandie_song_part_folders folder
  set
    dropbox_folder_id = null,
    dropbox_path_lower = null,
    updated_at = now()
  where folder.band_id in (
    select s.band_id
    from public.bandie_band_song_part_storage s
    where s.owning_user_id = p_user_id
  );
end;
$$;

create or replace function public.bandie_admin_delete_user_account(
  p_user_id uuid,
  p_leadership_transfers jsonb default '[]'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  transfer record;
  v_band_id uuid;
  v_new_leader uuid;
  v_other_leader uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not public.bandie_current_user_is_app_admin() then
    raise exception 'Only platform admins can delete user accounts';
  end if;

  if p_user_id = auth.uid() then
    raise exception 'You cannot delete your own account from the admin portal';
  end if;

  if not exists (select 1 from public.bandie_profiles p where p.user_id = p_user_id) then
    raise exception 'User not found';
  end if;

  if exists (
    select 1
    from public.bandie_profiles p
    where p.user_id = p_user_id
      and p.account_deleted_at is not null
  ) then
    raise exception 'Account is already deleted';
  end if;

  if exists (
    select 1
    from public.platform_user_app_memberships m
    where m.user_id = p_user_id
      and m.app_code = 'bandie'
      and m.is_app_admin
  ) then
    raise exception 'Cannot delete a platform admin account';
  end if;

  -- Validate sole-leader bands have a transfer and eligible successor.
  for v_band_id in
    select b.id
    from public.bandie_bands b
    join public.bandie_band_members m
      on m.band_id = b.id
     and m.user_id = p_user_id
     and m.status = 'active'
     and m.role = 'owner'
    where public.bandie_count_band_leaders(b.id) <= 1
  loop
    select (t.value ->> 'new_leader_user_id')::uuid
    into v_new_leader
    from jsonb_array_elements(coalesce(p_leadership_transfers, '[]'::jsonb)) t(value)
    where (t.value ->> 'band_id')::uuid = v_band_id
    limit 1;

    if v_new_leader is null then
      raise exception 'Assign a new leader for band % before deleting this account', v_band_id;
    end if;

    if v_new_leader = p_user_id then
      raise exception 'New leader must be a different user';
    end if;

    if not exists (
      select 1
      from public.bandie_band_members m
      join public.bandie_profiles p on p.user_id = m.user_id
      where m.band_id = v_band_id
        and m.user_id = v_new_leader
        and m.status = 'active'
        and p.account_deleted_at is null
    ) then
      raise exception 'New leader must be an active member of the band';
    end if;
  end loop;

  -- Apply leadership transfers for sole-leader bands.
  for transfer in
    select
      (t.value ->> 'band_id')::uuid as band_id,
      (t.value ->> 'new_leader_user_id')::uuid as new_leader_user_id
    from jsonb_array_elements(coalesce(p_leadership_transfers, '[]'::jsonb)) t(value)
  loop
    if transfer.band_id is null or transfer.new_leader_user_id is null then
      continue;
    end if;

    insert into public.bandie_band_members (band_id, user_id, role, status)
    values (transfer.band_id, transfer.new_leader_user_id, 'owner', 'active')
    on conflict (band_id, user_id) do update
    set role = 'owner', status = 'active';

    update public.bandie_bands
    set owner_user_id = transfer.new_leader_user_id
    where id = transfer.band_id;
  end loop;

  -- Bands where user is leader with other leaders: transfer primary if needed.
  for v_band_id in
    select b.id
    from public.bandie_bands b
    join public.bandie_band_members m
      on m.band_id = b.id
     and m.user_id = p_user_id
     and m.status = 'active'
     and m.role = 'owner'
    where b.owner_user_id = p_user_id
      and public.bandie_count_band_leaders(b.id) > 1
  loop
    select m.user_id
    into v_other_leader
    from public.bandie_band_members m
    join public.bandie_profiles p on p.user_id = m.user_id
    where m.band_id = v_band_id
      and m.status = 'active'
      and m.role = 'owner'
      and m.user_id <> p_user_id
      and p.account_deleted_at is null
    order by m.created_at
    limit 1;

    if v_other_leader is not null then
      update public.bandie_bands
      set owner_user_id = v_other_leader
      where id = v_band_id;
    end if;
  end loop;

  -- Remove user from lineup parts and band memberships.
  update public.bandie_band_parts
  set assigned_member_id = null
  where assigned_member_id in (
    select m.id
    from public.bandie_band_members m
    where m.user_id = p_user_id
      and m.status = 'active'
  );

  update public.bandie_band_members
  set status = 'removed'
  where user_id = p_user_id
    and status = 'active';

  perform public.bandie_admin_disconnect_user_dropbox(p_user_id);

  update public.bandie_subscriptions
  set status = 'cancelled', updated_at = now()
  where subject_type = 'user'
    and subject_id = p_user_id
    and status in ('active', 'trialing', 'past_due')
    and stripe_subscription_id is null;

  update public.platform_user_app_memberships
  set status = 'revoked', updated_at = now()
  where user_id = p_user_id
    and app_code = 'bandie';

  update public.bandie_profiles
  set
    display_name = 'Deleted user',
    username = 'deleted_' || replace(p_user_id::text, '-', ''),
    profile_image_url = null,
    bio = null,
    gear_notes = null,
    contact_email = null,
    contact_phone = null,
    public_player_profile_enabled = false,
    open_to_deputy_invites = false,
    open_to_member_invites = false,
    is_player = false,
    is_organiser = false,
    entitlement_test_leader_plan_code = null,
    entitlement_test_organiser_plan_code = null,
    account_deleted_at = now(),
    account_deleted_by = auth.uid(),
    updated_at = now()
  where user_id = p_user_id;
end;
$$;

grant execute on function public.bandie_admin_disconnect_user_dropbox(uuid) to authenticated;
grant execute on function public.bandie_admin_delete_user_account(uuid, jsonb) to authenticated;
