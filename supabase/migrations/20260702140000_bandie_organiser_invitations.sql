-- Platform admin organiser invitations (same token/link pattern as band member invites)

create table if not exists public.bandie_organiser_invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  token text not null unique default replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  invited_by uuid not null references auth.users(id),
  status text not null default 'pending',
  expires_at timestamptz not null default (now() + interval '14 days'),
  created_at timestamptz not null default now(),

  constraint bandie_organiser_invitations_status_check
    check (status in ('pending', 'accepted', 'declined', 'revoked', 'expired'))
);

create index if not exists bandie_organiser_invitations_email_idx
  on public.bandie_organiser_invitations (lower(email));

create index if not exists bandie_organiser_invitations_status_idx
  on public.bandie_organiser_invitations (status, expires_at desc);

alter table public.bandie_organiser_invitations enable row level security;

-- No direct client policies: admin flows use security definer RPCs.

create or replace function public.bandie_create_organiser_invitation(p_email text)
returns public.bandie_organiser_invitations
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_email text := lower(trim(p_email));
  created public.bandie_organiser_invitations;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not public.bandie_current_user_is_app_admin() then
    raise exception 'Only platform admins can invite organisers';
  end if;

  if normalized_email is null or normalized_email = '' then
    raise exception 'Email is required';
  end if;

  if exists (
    select 1
    from public.bandie_organiser_invitations i
    where lower(i.email) = normalized_email
      and i.status = 'pending'
      and i.expires_at > now()
  ) then
    raise exception 'A pending organiser invitation already exists for this email';
  end if;

  insert into public.bandie_organiser_invitations (email, invited_by, status)
  values (normalized_email, auth.uid(), 'pending')
  returning * into created;

  return created;
end;
$$;

create or replace function public.bandie_list_organiser_invitations_for_admin()
returns table (
  id uuid,
  email text,
  invitee_display_name text,
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
    i.email,
    coalesce(
      nullif(trim(p.display_name), ''),
      nullif(trim(u.raw_user_meta_data->>'display_name'), '')
    ) as invitee_display_name,
    i.token,
    i.status,
    i.expires_at,
    i.created_at
  from public.bandie_organiser_invitations i
  left join auth.users u on lower(u.email) = lower(i.email)
  left join public.bandie_profiles p on p.user_id = u.id
  where public.bandie_current_user_is_app_admin()
  order by i.created_at desc;
$$;

create or replace function public.bandie_revoke_organiser_invitation(p_invitation_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not public.bandie_current_user_is_app_admin() then
    raise exception 'Only platform admins can revoke organiser invitations';
  end if;

  update public.bandie_organiser_invitations
  set status = 'revoked'
  where id = p_invitation_id
    and status = 'pending';
end;
$$;

create or replace function public.bandie_resolve_invite_token(p_token text)
returns text
language sql
security definer
set search_path = public
stable
as $$
  select case
    when exists (
      select 1
      from public.bandie_band_invitations i
      where i.token = p_token
        and i.status = 'pending'
        and i.expires_at > now()
    ) then 'band'
    when exists (
      select 1
      from public.bandie_organiser_invitations i
      where i.token = p_token
        and i.status = 'pending'
        and i.expires_at > now()
    ) then 'organiser'
    else null
  end;
$$;

create or replace function public.bandie_list_my_pending_organiser_invitations()
returns table (
  id uuid,
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
    i.token,
    i.expires_at,
    i.created_at
  from public.bandie_organiser_invitations i
  where i.status = 'pending'
    and i.expires_at > now()
    and auth.uid() is not null
    and lower(i.email) = lower(auth.jwt() ->> 'email')
  order by i.created_at desc;
$$;

create or replace function public.bandie_accept_organiser_invitation(p_token text)
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

  select *
  into invite
  from public.bandie_organiser_invitations i
  where i.token = p_token
    and i.status = 'pending'
    and i.expires_at > now()
  for update;

  if not found then
    raise exception 'Invitation not found or expired';
  end if;

  if lower(invite.email) <> lower(auth.jwt() ->> 'email') then
    raise exception 'Invitation email does not match signed-in user';
  end if;

  if not public.platform_current_user_has_app_access('bandie') then
    insert into public.platform_user_app_memberships (user_id, app_code, role, status)
    values (auth.uid(), 'bandie', 'user', 'active')
    on conflict (user_id, app_code) do update
    set status = 'active', updated_at = now();
  end if;

  insert into public.bandie_profiles (user_id, display_name, is_player, is_organiser)
  values (
    auth.uid(),
    coalesce(
      nullif(trim(auth.jwt() ->> 'email'), ''),
      split_part(auth.jwt() ->> 'email', '@', 1)
    ),
    false,
    true
  )
  on conflict (user_id) do update
  set
    is_organiser = true,
    updated_at = now();

  perform public.bandie_assign_default_user_subscriptions(auth.uid(), true);

  update public.bandie_organiser_invitations
  set status = 'accepted'
  where id = invite.id;
end;
$$;

create or replace function public.bandie_decline_organiser_invitation(p_token text)
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

  select *
  into invite
  from public.bandie_organiser_invitations i
  where i.token = p_token
    and i.status = 'pending'
    and i.expires_at > now()
  for update;

  if not found then
    raise exception 'Invitation not found or expired';
  end if;

  if lower(invite.email) <> lower(auth.jwt() ->> 'email') then
    raise exception 'Invitation email does not match signed-in user';
  end if;

  update public.bandie_organiser_invitations
  set status = 'declined'
  where id = invite.id;
end;
$$;

grant execute on function public.bandie_create_organiser_invitation(text) to authenticated;
grant execute on function public.bandie_list_organiser_invitations_for_admin() to authenticated;
grant execute on function public.bandie_revoke_organiser_invitation(uuid) to authenticated;
grant execute on function public.bandie_resolve_invite_token(text) to authenticated, anon;
grant execute on function public.bandie_list_my_pending_organiser_invitations() to authenticated;
grant execute on function public.bandie_accept_organiser_invitation(text) to authenticated;
grant execute on function public.bandie_decline_organiser_invitation(text) to authenticated;
