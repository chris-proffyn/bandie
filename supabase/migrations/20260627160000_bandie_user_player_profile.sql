-- Musician / player profile fields on bandie_profiles

alter table public.bandie_profiles
  add column if not exists bio text,
  add column if not exists location text,
  add column if not exists genres text[] not null default '{}',
  add column if not exists instruments text[] not null default '{}',
  add column if not exists years_playing integer,
  add column if not exists public_player_profile_enabled boolean not null default false;

-- User avatar uploads: users/{user_id}/avatar.{ext}

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
    and coalesce((string_to_array(object_path, '/'))[2], '') = auth.uid()::text
    and split_part(storage.filename(object_path), '.', 1) = 'avatar';
$$;

grant execute on function public.bandie_can_manage_user_profile_image(text) to authenticated;

drop policy if exists "Users can upload own profile image" on storage.objects;
create policy "Users can upload own profile image"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'bandie-profile-images'
  and public.bandie_can_manage_user_profile_image(name)
);

drop policy if exists "Users can update own profile image" on storage.objects;
create policy "Users can update own profile image"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'bandie-profile-images'
  and public.bandie_can_manage_user_profile_image(name)
)
with check (
  bucket_id = 'bandie-profile-images'
  and public.bandie_can_manage_user_profile_image(name)
);

drop policy if exists "Users can delete own profile image" on storage.objects;
create policy "Users can delete own profile image"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'bandie-profile-images'
  and public.bandie_can_manage_user_profile_image(name)
);

-- Band members can view profiles of other members in shared bands

drop policy if exists "Band members can view bandmate profiles" on public.bandie_profiles;
create policy "Band members can view bandmate profiles"
on public.bandie_profiles
for select
to authenticated
using (
  public.platform_current_user_has_app_access('bandie')
  and exists (
    select 1
    from public.bandie_band_members mine
    join public.bandie_band_members theirs
      on theirs.band_id = mine.band_id
    where mine.user_id = auth.uid()
      and mine.status = 'active'
      and theirs.user_id = bandie_profiles.user_id
      and theirs.status = 'active'
  )
);
