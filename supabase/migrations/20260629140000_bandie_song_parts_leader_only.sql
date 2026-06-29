-- Revert member template seeding RPC; restrict song part folder writes to band leaders.

drop function if exists public.bandie_ensure_band_song_part_templates(uuid);

drop policy if exists "Band members can create song part folders" on public.bandie_song_part_folders;
create policy "Band leaders can create song part folders"
on public.bandie_song_part_folders
for insert
to authenticated
with check (
  public.platform_current_user_has_app_access('bandie')
  and public.bandie_current_user_owns_band(band_id)
);

drop policy if exists "Band members can update song part folders" on public.bandie_song_part_folders;
create policy "Band leaders can update song part folders"
on public.bandie_song_part_folders
for update
to authenticated
using (
  public.platform_current_user_has_app_access('bandie')
  and public.bandie_current_user_owns_band(band_id)
)
with check (
  public.platform_current_user_has_app_access('bandie')
  and public.bandie_current_user_owns_band(band_id)
);

drop policy if exists "Band members can delete song part folders" on public.bandie_song_part_folders;
create policy "Band leaders can delete song part folders"
on public.bandie_song_part_folders
for delete
to authenticated
using (
  public.platform_current_user_has_app_access('bandie')
  and public.bandie_current_user_owns_band(band_id)
);
