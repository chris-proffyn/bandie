-- Band invitations and secure accept flow

create table if not exists public.bandie_band_invitations (
  id uuid primary key default gen_random_uuid(),
  band_id uuid not null references public.bandie_bands(id) on delete cascade,
  email text not null,
  role text not null default 'member',
  token text not null unique default replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  invited_by uuid not null references auth.users(id),
  status text not null default 'pending',
  expires_at timestamptz not null default (now() + interval '14 days'),
  created_at timestamptz not null default now(),

  constraint bandie_band_invitations_role_check
    check (role in ('owner', 'admin', 'member', 'viewer')),
  constraint bandie_band_invitations_status_check
    check (status in ('pending', 'accepted', 'revoked', 'expired'))
);

create index if not exists bandie_band_invitations_band_id_idx
  on public.bandie_band_invitations (band_id);

create index if not exists bandie_band_invitations_email_idx
  on public.bandie_band_invitations (lower(email));

alter table public.bandie_band_invitations enable row level security;

drop policy if exists "Band owners can view band invitations" on public.bandie_band_invitations;
create policy "Band owners can view band invitations"
on public.bandie_band_invitations
for select
to authenticated
using (
  public.platform_current_user_has_app_access('bandie')
  and exists (
    select 1
    from public.bandie_bands b
    where b.id = band_id
      and b.owner_user_id = auth.uid()
  )
);

drop policy if exists "Band owners can create band invitations" on public.bandie_band_invitations;
create policy "Band owners can create band invitations"
on public.bandie_band_invitations
for insert
to authenticated
with check (
  public.platform_current_user_has_app_access('bandie')
  and invited_by = auth.uid()
  and exists (
    select 1
    from public.bandie_bands b
    where b.id = band_id
      and b.owner_user_id = auth.uid()
  )
);

drop policy if exists "Band owners can revoke invitations" on public.bandie_band_invitations;
create policy "Band owners can revoke invitations"
on public.bandie_band_invitations
for update
to authenticated
using (
  public.platform_current_user_has_app_access('bandie')
  and exists (
    select 1
    from public.bandie_bands b
    where b.id = band_id
      and b.owner_user_id = auth.uid()
  )
)
with check (
  public.platform_current_user_has_app_access('bandie')
  and exists (
    select 1
    from public.bandie_bands b
    where b.id = band_id
      and b.owner_user_id = auth.uid()
  )
);

-- Users can read their own band memberships (needed for band switcher)
drop policy if exists "Users can view own band memberships" on public.bandie_band_members;
create policy "Users can view own band memberships"
on public.bandie_band_members
for select
to authenticated
using (
  public.platform_current_user_has_app_access('bandie')
  and user_id = auth.uid()
);

create or replace function public.bandie_accept_invitation(invite_token text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  invite record;
  member_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
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

  if not public.platform_current_user_has_app_access('bandie') then
    insert into public.platform_user_app_memberships (user_id, app_code, role, status)
    values (auth.uid(), 'bandie', 'user', 'active')
    on conflict (user_id, app_code) do update
    set status = 'active', updated_at = now();
  end if;

  insert into public.bandie_band_members (band_id, user_id, role, status)
  values (invite.band_id, auth.uid(), invite.role, 'active')
  on conflict (band_id, user_id) do update
  set role = excluded.role, status = 'active'
  returning id into member_id;

  update public.bandie_band_invitations
  set status = 'accepted'
  where id = invite.id;

  return invite.band_id;
end;
$$;

grant execute on function public.bandie_accept_invitation(text) to authenticated;
