-- Venue photo on organiser venues + storage RLS for venues/{venue_id}/photo.{ext}

alter table public.bandie_organiser_venues
  add column if not exists image_url text;

comment on column public.bandie_organiser_venues.image_url is
  'Public URL for venue photo in bandie-profile-images (venues/{venue_id}/photo.{ext}).';

create or replace function public.bandie_storage_organiser_venue_id(object_path text)
returns uuid
language sql
immutable
as $$
  select nullif((string_to_array(object_path, '/'))[2], '')::uuid;
$$;

create or replace function public.bandie_can_manage_organiser_venue_image(object_path text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select
    auth.uid() is not null
    and public.platform_current_user_has_app_access('bandie')
    and coalesce((string_to_array(object_path, '/'))[1], '') = 'venues'
    and split_part(storage.filename(object_path), '.', 1) = 'photo'
    and (
      exists (
        select 1
        from public.bandie_organiser_venues v
        where v.id = public.bandie_storage_organiser_venue_id(object_path)
          and v.owner_user_id = auth.uid()
      )
      or public.bandie_current_user_is_app_admin()
    );
$$;

grant execute on function public.bandie_storage_organiser_venue_id(text) to authenticated;
grant execute on function public.bandie_can_manage_organiser_venue_image(text) to authenticated;

drop policy if exists "Organisers can upload venue images" on storage.objects;
create policy "Organisers can upload venue images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'bandie-profile-images'
  and public.bandie_can_manage_organiser_venue_image(name)
);

drop policy if exists "Organisers can update venue images" on storage.objects;
create policy "Organisers can update venue images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'bandie-profile-images'
  and public.bandie_can_manage_organiser_venue_image(name)
)
with check (
  bucket_id = 'bandie-profile-images'
  and public.bandie_can_manage_organiser_venue_image(name)
);

drop policy if exists "Organisers can delete venue images" on storage.objects;
create policy "Organisers can delete venue images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'bandie-profile-images'
  and public.bandie_can_manage_organiser_venue_image(name)
);
