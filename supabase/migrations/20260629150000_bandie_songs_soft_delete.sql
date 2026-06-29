-- Soft delete for band songs

alter table public.bandie_songs
  add column if not exists is_deleted boolean not null default false,
  add column if not exists deleted_at timestamptz;

alter table public.bandie_songs
  drop constraint if exists bandie_songs_band_slug_unique;

create unique index if not exists bandie_songs_band_slug_active_unique
  on public.bandie_songs (band_id, slug)
  where (is_deleted = false);

create index if not exists bandie_songs_band_active_idx
  on public.bandie_songs (band_id, created_at desc)
  where (is_deleted = false);

create index if not exists bandie_songs_band_deleted_idx
  on public.bandie_songs (band_id, deleted_at desc)
  where (is_deleted = true);

create or replace function public.bandie_guard_song_soft_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.is_deleted is distinct from new.is_deleted then
    if not public.bandie_current_user_owns_band(new.band_id) then
      raise exception 'Only band leaders can delete or restore songs.';
    end if;

    if new.is_deleted and new.deleted_at is null then
      new.deleted_at := now();
    elsif not new.is_deleted then
      new.deleted_at := null;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists bandie_songs_guard_soft_delete on public.bandie_songs;
create trigger bandie_songs_guard_soft_delete
before update on public.bandie_songs
for each row execute function public.bandie_guard_song_soft_delete();

-- Soft delete replaces hard delete for repertoire management.
drop policy if exists "Band leaders can delete songs" on public.bandie_songs;
