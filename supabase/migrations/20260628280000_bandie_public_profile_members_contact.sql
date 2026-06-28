-- Public band roster and primary contact for published profiles

create or replace function public.bandie_list_public_band_members(p_band_id uuid)
returns table (
  profile_id uuid,
  user_id uuid,
  display_name text,
  username text,
  preferred_instrument text,
  profile_image_url text,
  member_role text,
  is_primary_contact boolean,
  lineup_part_title text
)
language sql
security definer
set search_path = public
stable
as $$
  select
    p.id as profile_id,
    m.user_id,
    coalesce(nullif(trim(p.display_name), ''), 'Band member') as display_name,
    p.username,
    p.preferred_instrument,
    p.profile_image_url,
    m.role as member_role,
    (m.user_id = b.owner_user_id) as is_primary_contact,
    part.title as lineup_part_title
  from public.bandie_bands b
  join public.bandie_band_members m on m.band_id = b.id
  left join public.bandie_profiles p on p.user_id = m.user_id
  left join public.bandie_band_parts part
    on part.band_id = b.id
    and part.assigned_member_id = m.id
  where b.id = p_band_id
    and b.public_profile_enabled = true
    and m.status = 'active'
    and coalesce(m.lineup_unavailable, false) = false
  order by (m.user_id = b.owner_user_id) desc, m.created_at asc;
$$;

grant execute on function public.bandie_list_public_band_members(uuid) to anon, authenticated;

create or replace function public.bandie_get_public_band_primary_contact(p_band_id uuid)
returns table (
  user_id uuid,
  display_name text,
  username text,
  profile_image_url text
)
language sql
security definer
set search_path = public
stable
as $$
  select
    b.owner_user_id as user_id,
    coalesce(nullif(trim(p.display_name), ''), 'Band leader') as display_name,
    p.username,
    p.profile_image_url
  from public.bandie_bands b
  join public.bandie_band_members m
    on m.band_id = b.id
    and m.user_id = b.owner_user_id
    and m.status = 'active'
  left join public.bandie_profiles p on p.user_id = b.owner_user_id
  where b.id = p_band_id
    and b.public_profile_enabled = true
    and b.owner_user_id is not null;
$$;

grant execute on function public.bandie_get_public_band_primary_contact(uuid) to anon, authenticated;
