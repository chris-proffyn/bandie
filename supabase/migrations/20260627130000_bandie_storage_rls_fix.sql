-- Fix storage RLS: ownership checks must bypass bandie_bands RLS (same pattern as band create fix).

create or replace function public.bandie_current_user_owns_band(target_band_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.bandie_bands b
    where b.id = target_band_id
      and b.owner_user_id = auth.uid()
  );
$$;

grant execute on function public.bandie_current_user_owns_band(uuid) to authenticated;

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
    and public.bandie_current_user_owns_band(public.bandie_storage_profile_band_id(object_path));
$$;

grant execute on function public.bandie_can_manage_profile_image(text) to authenticated;

drop policy if exists "Band owners can upload profile images" on storage.objects;
create policy "Band owners can upload profile images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'bandie-profile-images'
  and public.bandie_can_manage_profile_image(name)
);

drop policy if exists "Band owners can update profile images" on storage.objects;
create policy "Band owners can update profile images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'bandie-profile-images'
  and public.bandie_can_manage_profile_image(name)
)
with check (
  bucket_id = 'bandie-profile-images'
  and public.bandie_can_manage_profile_image(name)
);

drop policy if exists "Band owners can delete profile images" on storage.objects;
create policy "Band owners can delete profile images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'bandie-profile-images'
  and public.bandie_can_manage_profile_image(name)
);
