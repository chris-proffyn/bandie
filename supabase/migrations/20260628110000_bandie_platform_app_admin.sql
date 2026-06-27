-- Per-app platform admin: explicit flag on memberships + Bandie-wide admin RLS.
--
-- Admin designation lives on platform_user_app_memberships.role ('admin' or 'owner').
-- is_app_admin is a stored generated column for clarity in queries and reporting.
--
-- Promote a user to Bandie app admin (SQL editor / service role):
--   update public.platform_user_app_memberships m
--   set role = 'admin'
--   from public.bandie_profiles p
--   where m.user_id = p.user_id
--     and m.app_code = 'bandie'
--     and p.display_name = 'Chrisso X';

alter table public.platform_user_app_memberships
  add column if not exists is_app_admin boolean
  generated always as (role in ('admin', 'owner')) stored;

-- ---------------------------------------------------------------------------
-- Helper functions
-- ---------------------------------------------------------------------------

create or replace function public.platform_current_user_is_app_admin(target_app_code text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.platform_current_user_has_app_role(
    target_app_code,
    array['admin', 'owner']
  );
$$;

create or replace function public.bandie_current_user_is_app_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.platform_current_user_is_app_admin('bandie');
$$;

grant execute on function public.platform_current_user_is_app_admin(text) to authenticated;
grant execute on function public.bandie_current_user_is_app_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- bandie_profiles
-- ---------------------------------------------------------------------------

drop policy if exists "Bandie app admins can view all profiles" on public.bandie_profiles;
create policy "Bandie app admins can view all profiles"
on public.bandie_profiles
for select
to authenticated
using (public.bandie_current_user_is_app_admin());

drop policy if exists "Bandie app admins can insert profiles" on public.bandie_profiles;
create policy "Bandie app admins can insert profiles"
on public.bandie_profiles
for insert
to authenticated
with check (public.bandie_current_user_is_app_admin());

drop policy if exists "Bandie app admins can update all profiles" on public.bandie_profiles;
create policy "Bandie app admins can update all profiles"
on public.bandie_profiles
for update
to authenticated
using (public.bandie_current_user_is_app_admin())
with check (public.bandie_current_user_is_app_admin());

-- ---------------------------------------------------------------------------
-- bandie_bands
-- ---------------------------------------------------------------------------

drop policy if exists "Bandie app admins can view all bands" on public.bandie_bands;
create policy "Bandie app admins can view all bands"
on public.bandie_bands
for select
to authenticated
using (public.bandie_current_user_is_app_admin());

drop policy if exists "Bandie app admins can update all bands" on public.bandie_bands;
create policy "Bandie app admins can update all bands"
on public.bandie_bands
for update
to authenticated
using (public.bandie_current_user_is_app_admin())
with check (public.bandie_current_user_is_app_admin());

-- ---------------------------------------------------------------------------
-- bandie_band_members
-- ---------------------------------------------------------------------------

drop policy if exists "Bandie app admins can view all band memberships" on public.bandie_band_members;
create policy "Bandie app admins can view all band memberships"
on public.bandie_band_members
for select
to authenticated
using (public.bandie_current_user_is_app_admin());

drop policy if exists "Bandie app admins can manage band memberships" on public.bandie_band_members;
create policy "Bandie app admins can manage band memberships"
on public.bandie_band_members
for all
to authenticated
using (public.bandie_current_user_is_app_admin())
with check (public.bandie_current_user_is_app_admin());

-- ---------------------------------------------------------------------------
-- bandie_band_media, social links, public dates
-- ---------------------------------------------------------------------------

drop policy if exists "Bandie app admins can view all band media" on public.bandie_band_media;
create policy "Bandie app admins can view all band media"
on public.bandie_band_media
for select
to authenticated
using (public.bandie_current_user_is_app_admin());

drop policy if exists "Bandie app admins can manage all band media" on public.bandie_band_media;
create policy "Bandie app admins can manage all band media"
on public.bandie_band_media
for all
to authenticated
using (public.bandie_current_user_is_app_admin())
with check (public.bandie_current_user_is_app_admin());

drop policy if exists "Bandie app admins can view all band social links" on public.bandie_band_social_links;
create policy "Bandie app admins can view all band social links"
on public.bandie_band_social_links
for select
to authenticated
using (public.bandie_current_user_is_app_admin());

drop policy if exists "Bandie app admins can manage all band social links" on public.bandie_band_social_links;
create policy "Bandie app admins can manage all band social links"
on public.bandie_band_social_links
for all
to authenticated
using (public.bandie_current_user_is_app_admin())
with check (public.bandie_current_user_is_app_admin());

drop policy if exists "Bandie app admins can view all band public dates" on public.bandie_band_public_dates;
create policy "Bandie app admins can view all band public dates"
on public.bandie_band_public_dates
for select
to authenticated
using (public.bandie_current_user_is_app_admin());

drop policy if exists "Bandie app admins can manage all band public dates" on public.bandie_band_public_dates;
create policy "Bandie app admins can manage all band public dates"
on public.bandie_band_public_dates
for all
to authenticated
using (public.bandie_current_user_is_app_admin())
with check (public.bandie_current_user_is_app_admin());

-- ---------------------------------------------------------------------------
-- bandie_band_invitations
-- ---------------------------------------------------------------------------

drop policy if exists "Bandie app admins can view all band invitations" on public.bandie_band_invitations;
create policy "Bandie app admins can view all band invitations"
on public.bandie_band_invitations
for select
to authenticated
using (public.bandie_current_user_is_app_admin());

drop policy if exists "Bandie app admins can create band invitations" on public.bandie_band_invitations;
create policy "Bandie app admins can create band invitations"
on public.bandie_band_invitations
for insert
to authenticated
with check (
  public.bandie_current_user_is_app_admin()
  and invited_by = auth.uid()
);

drop policy if exists "Bandie app admins can revoke band invitations" on public.bandie_band_invitations;
create policy "Bandie app admins can revoke band invitations"
on public.bandie_band_invitations
for update
to authenticated
using (public.bandie_current_user_is_app_admin())
with check (public.bandie_current_user_is_app_admin());

-- ---------------------------------------------------------------------------
-- Storage: band and user profile images
-- ---------------------------------------------------------------------------

create or replace function public.bandie_can_manage_profile_image(object_path text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select
    auth.uid() is not null
    and public.platform_current_user_has_app_access('bandie')
    and coalesce((string_to_array(object_path, '/'))[1], '') = 'bands'
    and split_part(storage.filename(object_path), '.', 1) in ('logo', 'hero')
    and (
      public.bandie_current_user_owns_band(public.bandie_storage_profile_band_id(object_path))
      or public.bandie_current_user_is_app_admin()
    );
$$;

create or replace function public.bandie_can_manage_user_profile_image(object_path text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select
    auth.uid() is not null
    and public.platform_current_user_has_app_access('bandie')
    and coalesce((string_to_array(object_path, '/'))[1], '') = 'users'
    and split_part(storage.filename(object_path), '.', 1) = 'avatar'
    and (
      coalesce((string_to_array(object_path, '/'))[2], '') = auth.uid()::text
      or public.bandie_current_user_is_app_admin()
    );
$$;

grant execute on function public.bandie_can_manage_profile_image(text) to authenticated;
grant execute on function public.bandie_can_manage_user_profile_image(text) to authenticated;
