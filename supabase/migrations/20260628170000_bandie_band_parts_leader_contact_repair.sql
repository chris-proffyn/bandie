-- Repair: 20260628150000 was recorded but band parts / leader contact objects are missing on remote.

alter table public.bandie_profiles
  add column if not exists contact_email text,
  add column if not exists contact_phone text;

create table if not exists public.bandie_band_parts (
  id uuid primary key default gen_random_uuid(),
  band_id uuid not null references public.bandie_bands(id) on delete cascade,
  title text not null,
  instrument_filter text,
  sort_order integer not null default 0,
  assigned_member_id uuid references public.bandie_band_members(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint bandie_band_parts_title_check check (char_length(trim(title)) > 0)
);

create index if not exists bandie_band_parts_band_id_idx
  on public.bandie_band_parts (band_id, sort_order);

create table if not exists public.bandie_player_outreach (
  id uuid primary key default gen_random_uuid(),
  band_id uuid not null references public.bandie_bands(id) on delete cascade,
  player_profile_id uuid not null references public.bandie_profiles(id) on delete cascade,
  band_part_id uuid references public.bandie_band_parts(id) on delete set null,
  invite_type text not null default 'join',
  message text,
  player_email text not null,
  invited_by uuid not null references auth.users(id),
  status text not null default 'pending',
  band_invitation_id uuid references public.bandie_band_invitations(id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days'),

  constraint bandie_player_outreach_type_check
    check (invite_type in ('audition', 'join')),
  constraint bandie_player_outreach_status_check
    check (status in ('pending', 'accepted', 'declined', 'revoked', 'expired'))
);

create index if not exists bandie_player_outreach_band_id_idx
  on public.bandie_player_outreach (band_id, created_at desc);

create index if not exists bandie_player_outreach_player_idx
  on public.bandie_player_outreach (player_profile_id, created_at desc);

alter table public.bandie_band_parts enable row level security;
alter table public.bandie_player_outreach enable row level security;

drop policy if exists "Band members can view band parts" on public.bandie_band_parts;
create policy "Band members can view band parts"
on public.bandie_band_parts
for select
to authenticated
using (
  public.platform_current_user_has_app_access('bandie')
  and (
    public.bandie_current_user_is_app_admin()
    or exists (
      select 1
      from public.bandie_band_members m
      where m.band_id = bandie_band_parts.band_id
        and m.user_id = auth.uid()
        and m.status = 'active'
    )
  )
);

drop policy if exists "Band leaders can insert band parts" on public.bandie_band_parts;
create policy "Band leaders can insert band parts"
on public.bandie_band_parts
for insert
to authenticated
with check (
  public.platform_current_user_has_app_access('bandie')
  and (
    public.bandie_current_user_is_app_admin()
    or public.bandie_current_user_owns_band(band_id)
  )
);

drop policy if exists "Band leaders can update band parts" on public.bandie_band_parts;
create policy "Band leaders can update band parts"
on public.bandie_band_parts
for update
to authenticated
using (
  public.platform_current_user_has_app_access('bandie')
  and (
    public.bandie_current_user_is_app_admin()
    or public.bandie_current_user_owns_band(band_id)
  )
)
with check (
  public.platform_current_user_has_app_access('bandie')
  and (
    public.bandie_current_user_is_app_admin()
    or public.bandie_current_user_owns_band(band_id)
  )
);

drop policy if exists "Band leaders can delete band parts" on public.bandie_band_parts;
create policy "Band leaders can delete band parts"
on public.bandie_band_parts
for delete
to authenticated
using (
  public.platform_current_user_has_app_access('bandie')
  and (
    public.bandie_current_user_is_app_admin()
    or public.bandie_current_user_owns_band(band_id)
  )
);

drop policy if exists "Band leaders can view player outreach" on public.bandie_player_outreach;
create policy "Band leaders can view player outreach"
on public.bandie_player_outreach
for select
to authenticated
using (
  public.platform_current_user_has_app_access('bandie')
  and (
    public.bandie_current_user_is_app_admin()
    or public.bandie_current_user_owns_band(band_id)
  )
);

drop policy if exists "Band leaders can create player outreach" on public.bandie_player_outreach;
create policy "Band leaders can create player outreach"
on public.bandie_player_outreach
for insert
to authenticated
with check (
  public.platform_current_user_has_app_access('bandie')
  and invited_by = auth.uid()
  and (
    public.bandie_current_user_is_app_admin()
    or public.bandie_current_user_owns_band(band_id)
  )
);

drop policy if exists "Band leaders can update player outreach" on public.bandie_player_outreach;
create policy "Band leaders can update player outreach"
on public.bandie_player_outreach
for update
to authenticated
using (
  public.platform_current_user_has_app_access('bandie')
  and (
    public.bandie_current_user_is_app_admin()
    or public.bandie_current_user_owns_band(band_id)
  )
)
with check (
  public.platform_current_user_has_app_access('bandie')
  and (
    public.bandie_current_user_is_app_admin()
    or public.bandie_current_user_owns_band(band_id)
  )
);

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

grant execute on function public.bandie_get_band_leader_contact(uuid) to authenticated;

create or replace function public.bandie_create_player_outreach(
  p_band_id uuid,
  p_player_profile_id uuid,
  p_invite_type text,
  p_band_part_id uuid default null,
  p_message text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  player_user_id uuid;
  player_email text;
  outreach_id uuid;
  invitation_id uuid;
  invite_role text := 'member';
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if p_invite_type not in ('audition', 'join') then
    raise exception 'Invalid invite type';
  end if;

  if not public.platform_current_user_has_app_access('bandie') then
    raise exception 'No app access';
  end if;

  if not public.bandie_current_user_is_app_admin()
     and not public.bandie_current_user_owns_band(p_band_id) then
    raise exception 'Only the band leader can invite players';
  end if;

  select p.user_id, u.email
  into player_user_id, player_email
  from public.bandie_profiles p
  join auth.users u on u.id = p.user_id
  where p.id = p_player_profile_id;

  if player_user_id is null or player_email is null then
    raise exception 'Player profile not found';
  end if;

  if player_user_id = auth.uid() then
    raise exception 'You cannot invite yourself';
  end if;

  insert into public.bandie_player_outreach (
    band_id,
    player_profile_id,
    band_part_id,
    invite_type,
    message,
    player_email,
    invited_by,
    status
  )
  values (
    p_band_id,
    p_player_profile_id,
    p_band_part_id,
    p_invite_type,
    nullif(trim(p_message), ''),
    lower(player_email),
    auth.uid(),
    'pending'
  )
  returning id into outreach_id;

  if p_invite_type = 'join' then
    insert into public.bandie_band_invitations (
      band_id,
      email,
      role,
      invited_by,
      status
    )
    values (
      p_band_id,
      lower(player_email),
      invite_role,
      auth.uid(),
      'pending'
    )
    returning id into invitation_id;

    update public.bandie_player_outreach
    set band_invitation_id = invitation_id
    where id = outreach_id;
  end if;

  return outreach_id;
end;
$$;

grant execute on function public.bandie_create_player_outreach(uuid, uuid, text, uuid, text) to authenticated;

create or replace function public.bandie_sync_band_size_from_parts(p_band_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  part_count integer;
begin
  select count(*)::integer
  into part_count
  from public.bandie_band_parts
  where band_id = p_band_id;

  update public.bandie_bands
  set band_size = nullif(part_count, 0)
  where id = p_band_id;

  return part_count;
end;
$$;

grant execute on function public.bandie_sync_band_size_from_parts(uuid) to authenticated;

notify pgrst, 'reload schema';
