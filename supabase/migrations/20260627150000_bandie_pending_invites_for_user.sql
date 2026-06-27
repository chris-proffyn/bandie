-- Allow invitees to list their own pending band invitations

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
  order by i.created_at desc;
$$;

grant execute on function public.bandie_list_my_pending_invitations() to authenticated;
