-- Fix band creation RLS: owners must read their band on insert.returning,
-- and the owner-membership trigger must not be blocked by RLS.

drop policy if exists "Bandie band owners can view own bands" on public.bandie_bands;
create policy "Bandie band owners can view own bands"
on public.bandie_bands
for select
to authenticated
using (
  public.platform_current_user_has_app_access('bandie')
  and owner_user_id = auth.uid()
);

drop policy if exists "Bandie band creators can add self as owner" on public.bandie_band_members;
create policy "Bandie band creators can add self as owner"
on public.bandie_band_members
for insert
to authenticated
with check (
  public.platform_current_user_has_app_access('bandie')
  and user_id = auth.uid()
  and role = 'owner'
  and status = 'active'
  and exists (
    select 1
    from public.bandie_bands b
    where b.id = band_id
      and b.owner_user_id = auth.uid()
  )
);

-- Users can reactivate their own Bandie app membership (e.g. after email confirm).
drop policy if exists "Users can update own Bandie app membership" on public.platform_user_app_memberships;
create policy "Users can update own Bandie app membership"
on public.platform_user_app_memberships
for update
to authenticated
using (
  user_id = auth.uid()
  and app_code = 'bandie'
)
with check (
  user_id = auth.uid()
  and app_code = 'bandie'
  and role = 'user'
  and status = 'active'
);

create or replace function public.bandie_add_owner_on_band_create()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.bandie_band_members (band_id, user_id, role, status)
  values (new.id, new.owner_user_id, 'owner', 'active')
  on conflict (band_id, user_id) do update
  set role = 'owner', status = 'active';

  return new;
end;
$$;
