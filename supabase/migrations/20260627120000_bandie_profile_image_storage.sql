-- Public storage bucket for band profile logos and hero images

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'bandie-profile-images',
  'bandie-profile-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.bandie_storage_profile_band_id(object_path text)
returns uuid
language sql
immutable
as $$
  select nullif((string_to_array(object_path, '/'))[2], '')::uuid;
$$;

drop policy if exists "Public can read band profile images" on storage.objects;
create policy "Public can read band profile images"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'bandie-profile-images');

drop policy if exists "Band owners can upload profile images" on storage.objects;
create policy "Band owners can upload profile images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'bandie-profile-images'
  and (storage.foldername(name))[1] = 'bands'
  and split_part(storage.filename(name), '.', 1) in ('logo', 'hero')
  and public.platform_current_user_has_app_access('bandie')
  and exists (
    select 1
    from public.bandie_bands b
    where b.id = public.bandie_storage_profile_band_id(name)
      and b.owner_user_id = auth.uid()
  )
);

drop policy if exists "Band owners can update profile images" on storage.objects;
create policy "Band owners can update profile images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'bandie-profile-images'
  and (storage.foldername(name))[1] = 'bands'
  and public.platform_current_user_has_app_access('bandie')
  and exists (
    select 1
    from public.bandie_bands b
    where b.id = public.bandie_storage_profile_band_id(name)
      and b.owner_user_id = auth.uid()
  )
)
with check (
  bucket_id = 'bandie-profile-images'
  and (storage.foldername(name))[1] = 'bands'
  and split_part(storage.filename(name), '.', 1) in ('logo', 'hero')
  and public.platform_current_user_has_app_access('bandie')
  and exists (
    select 1
    from public.bandie_bands b
    where b.id = public.bandie_storage_profile_band_id(name)
      and b.owner_user_id = auth.uid()
  )
);

drop policy if exists "Band owners can delete profile images" on storage.objects;
create policy "Band owners can delete profile images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'bandie-profile-images'
  and (storage.foldername(name))[1] = 'bands'
  and public.platform_current_user_has_app_access('bandie')
  and exists (
    select 1
    from public.bandie_bands b
    where b.id = public.bandie_storage_profile_band_id(name)
      and b.owner_user_id = auth.uid()
  )
);
