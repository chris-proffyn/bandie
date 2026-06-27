-- List pending band invitations with invitee display names (name before email in UI)

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
    and exists (
      select 1
      from public.bandie_bands b
      where b.id = p_band_id
        and b.owner_user_id = auth.uid()
    )
  order by i.created_at desc;
$$;

grant execute on function public.bandie_list_band_invitations_for_owner(uuid) to authenticated;
