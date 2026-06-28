-- Multiple band leaders: any active member with role 'owner' is a leader.
-- bandie_bands.owner_user_id remains the primary contact pointer.

create or replace function public.bandie_current_user_owns_band(target_band_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.bandie_band_members m
    where m.band_id = target_band_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.role = 'owner'
  );
$$;

create or replace function public.bandie_count_band_leaders(p_band_id uuid)
returns integer
language sql
security definer
set search_path = public
stable
as $$
  select count(*)::integer
  from public.bandie_band_members m
  where m.band_id = p_band_id
    and m.status = 'active'
    and m.role = 'owner';
$$;

grant execute on function public.bandie_count_band_leaders(uuid) to authenticated;

create or replace function public.bandie_ensure_band_leader(p_band_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_primary uuid;
  resolved_primary uuid;
  fallback_admin uuid;
  leader_count integer;
begin
  select b.owner_user_id
  into current_primary
  from public.bandie_bands b
  where b.id = p_band_id;

  if not found then
    return null;
  end if;

  select public.bandie_count_band_leaders(p_band_id)
  into leader_count;

  if leader_count > 0 then
    if exists (
      select 1
      from public.bandie_band_members m
      where m.band_id = p_band_id
        and m.user_id = current_primary
        and m.role = 'owner'
        and m.status = 'active'
    ) then
      return current_primary;
    end if;

    select m.user_id
    into resolved_primary
    from public.bandie_band_members m
    where m.band_id = p_band_id
      and m.role = 'owner'
      and m.status = 'active'
    order by m.created_at
    limit 1;

    update public.bandie_bands
    set owner_user_id = resolved_primary
    where id = p_band_id;

    return resolved_primary;
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

  return fallback_admin;
end;
$$;

create or replace function public.bandie_add_band_leader(
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
    raise exception 'Only band leaders can assign leaders';
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

  update public.bandie_band_members
  set role = 'owner'
  where band_id = p_band_id
    and user_id = p_user_id
    and status = 'active';
end;
$$;

grant execute on function public.bandie_add_band_leader(uuid, uuid) to authenticated;

create or replace function public.bandie_remove_band_leader(
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
    raise exception 'Only band leaders can remove leaders';
  end if;

  if not exists (
    select 1
    from public.bandie_band_members m
    where m.band_id = p_band_id
      and m.user_id = p_user_id
      and m.status = 'active'
      and m.role = 'owner'
  ) then
    raise exception 'Member is not a band leader';
  end if;

  if public.bandie_count_band_leaders(p_band_id) <= 1 then
    raise exception 'At least one band leader is required';
  end if;

  update public.bandie_band_members
  set role = 'member'
  where band_id = p_band_id
    and user_id = p_user_id
    and status = 'active';

  perform public.bandie_ensure_band_leader(p_band_id);
end;
$$;

grant execute on function public.bandie_remove_band_leader(uuid, uuid) to authenticated;

-- Backward-compatible alias: add a co-leader (no longer transfers sole leadership).
create or replace function public.bandie_assign_band_leader(
  p_band_id uuid,
  p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.bandie_add_band_leader(p_band_id, p_user_id);
end;
$$;

create or replace function public.bandie_list_band_leaders(p_band_id uuid)
returns table (
  user_id uuid,
  display_name text,
  email text,
  contact_phone text,
  is_primary boolean
)
language sql
security definer
set search_path = public
stable
as $$
  select
    m.user_id,
    coalesce(nullif(trim(p.display_name), ''), split_part(u.email, '@', 1)) as display_name,
    coalesce(nullif(trim(p.contact_email), ''), u.email::text) as email,
    nullif(trim(p.contact_phone), '') as contact_phone,
    (m.user_id = b.owner_user_id) as is_primary
  from public.bandie_band_members m
  join public.bandie_bands b on b.id = m.band_id
  join auth.users u on u.id = m.user_id
  left join public.bandie_profiles p on p.user_id = m.user_id
  where m.band_id = p_band_id
    and m.status = 'active'
    and m.role = 'owner'
    and public.platform_current_user_has_app_access('bandie')
    and (
      public.bandie_current_user_is_app_admin()
      or public.bandie_current_user_is_band_member(p_band_id)
    )
  order by (m.user_id = b.owner_user_id) desc, m.created_at;
$$;

grant execute on function public.bandie_list_band_leaders(uuid) to authenticated;

create or replace function public.bandie_remove_band_member(
  p_band_id uuid,
  p_member_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target record;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not public.platform_current_user_has_app_access('bandie') then
    raise exception 'No app access';
  end if;

  if not public.bandie_current_user_is_app_admin()
     and not public.bandie_current_user_owns_band(p_band_id) then
    raise exception 'Only band leaders can remove members';
  end if;

  select m.id, m.user_id, m.role
  into target
  from public.bandie_band_members m
  where m.id = p_member_id
    and m.band_id = p_band_id
    and m.status = 'active';

  if not found then
    raise exception 'Member not found';
  end if;

  if target.role = 'owner' and public.bandie_count_band_leaders(p_band_id) <= 1 then
    raise exception 'Assign another leader before removing the last band leader';
  end if;

  update public.bandie_band_parts
  set assigned_member_id = null
  where band_id = p_band_id
    and assigned_member_id = p_member_id;

  update public.bandie_band_members
  set status = 'removed'
  where id = p_member_id;

  perform public.bandie_ensure_band_leader(p_band_id);
end;
$$;

grant execute on function public.bandie_remove_band_member(uuid, uuid) to authenticated;

-- RLS: any band leader (owner role) may update band and manage memberships.

drop policy if exists "Bandie band owners can update bands" on public.bandie_bands;
create policy "Bandie band owners can update bands"
on public.bandie_bands
for update
to authenticated
using (
  public.platform_current_user_has_app_access('bandie')
  and public.bandie_current_user_owns_band(id)
)
with check (
  public.platform_current_user_has_app_access('bandie')
  and public.bandie_current_user_owns_band(id)
);

drop policy if exists "Bandie band owners can manage memberships" on public.bandie_band_members;
create policy "Bandie band owners can manage memberships"
on public.bandie_band_members
for insert
to authenticated
with check (
  public.platform_current_user_has_app_access('bandie')
  and public.bandie_current_user_owns_band(band_id)
);

drop policy if exists "Bandie band owners can update memberships" on public.bandie_band_members;
create policy "Bandie band owners can update memberships"
on public.bandie_band_members
for update
to authenticated
using (
  public.platform_current_user_has_app_access('bandie')
  and public.bandie_current_user_owns_band(band_id)
)
with check (
  public.platform_current_user_has_app_access('bandie')
  and public.bandie_current_user_owns_band(band_id)
);

-- Invitations: leaders (not only primary owner_user_id)

drop policy if exists "Band owners can view band invitations" on public.bandie_band_invitations;
create policy "Band owners can view band invitations"
on public.bandie_band_invitations
for select
to authenticated
using (
  public.platform_current_user_has_app_access('bandie')
  and public.bandie_current_user_owns_band(band_id)
);

drop policy if exists "Band owners can create band invitations" on public.bandie_band_invitations;
create policy "Band owners can create band invitations"
on public.bandie_band_invitations
for insert
to authenticated
with check (
  public.platform_current_user_has_app_access('bandie')
  and public.bandie_current_user_owns_band(band_id)
);

drop policy if exists "Band owners can revoke invitations" on public.bandie_band_invitations;
create policy "Band owners can revoke invitations"
on public.bandie_band_invitations
for select
to authenticated
using (
  public.platform_current_user_has_app_access('bandie')
  and public.bandie_current_user_owns_band(band_id)
);

-- Fix revoke policy (was incorrectly select in old migration copy - use update)
drop policy if exists "Band owners can revoke invitations" on public.bandie_band_invitations;
create policy "Band owners can revoke invitations"
on public.bandie_band_invitations
for update
to authenticated
using (
  public.platform_current_user_has_app_access('bandie')
  and public.bandie_current_user_owns_band(band_id)
)
with check (
  public.platform_current_user_has_app_access('bandie')
  and public.bandie_current_user_owns_band(band_id)
);

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
      or public.bandie_current_user_owns_band(p_band_id)
    )
  order by i.created_at desc;
$$;

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
      or public.bandie_current_user_owns_band(i.band_id)
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
      or public.bandie_current_user_owns_band(po.band_id)
    )
  order by po.created_at desc
  limit 100;
$$;

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

  select po.*
  into outreach
  from public.bandie_player_outreach po
  where po.id = p_outreach_id
    and po.status = 'pending'
  for update of po;

  if not found then
    raise exception 'Outreach invite not found or already closed';
  end if;

  if not public.bandie_current_user_is_app_admin()
     and not public.bandie_current_user_owns_band(outreach.band_id) then
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

-- Public profile child tables: any band leader may manage content.

drop policy if exists "Bandie band owners can manage media" on public.bandie_band_media;
create policy "Bandie band owners can manage media"
on public.bandie_band_media
for all
to authenticated
using (
  public.platform_current_user_has_app_access('bandie')
  and public.bandie_current_user_owns_band(band_id)
)
with check (
  public.platform_current_user_has_app_access('bandie')
  and public.bandie_current_user_owns_band(band_id)
);

drop policy if exists "Bandie band owners can manage social links" on public.bandie_band_social_links;
create policy "Bandie band owners can manage social links"
on public.bandie_band_social_links
for all
to authenticated
using (
  public.platform_current_user_has_app_access('bandie')
  and public.bandie_current_user_owns_band(band_id)
)
with check (
  public.platform_current_user_has_app_access('bandie')
  and public.bandie_current_user_owns_band(band_id)
);

drop policy if exists "Bandie band owners can manage public dates" on public.bandie_band_public_dates;
create policy "Bandie band owners can manage public dates"
on public.bandie_band_public_dates
for all
to authenticated
using (
  public.platform_current_user_has_app_access('bandie')
  and public.bandie_current_user_owns_band(band_id)
)
with check (
  public.platform_current_user_has_app_access('bandie')
  and public.bandie_current_user_owns_band(band_id)
);
