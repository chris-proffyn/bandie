-- Allow any band member to seed default song-part templates when adding songs.
-- Leaders retain RLS control for manual template CRUD.

create or replace function public.bandie_ensure_band_song_part_templates(p_band_id uuid)
returns setof public.bandie_band_song_part_templates
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.platform_current_user_has_app_access('bandie') then
    raise exception 'Access denied';
  end if;

  if not public.bandie_current_user_is_band_member(p_band_id) then
    raise exception 'Band membership required';
  end if;

  if not exists (
    select 1
    from public.bandie_band_song_part_templates
    where band_id = p_band_id
    limit 1
  ) then
    insert into public.bandie_band_song_part_templates (
      band_id,
      part_key,
      part_label,
      sort_order,
      required_for_readiness
    )
    values
      (p_band_id, 'guitar', 'Guitar', 0, true),
      (p_band_id, 'bass', 'Bass', 1, true),
      (p_band_id, 'drums', 'Drums', 2, true),
      (p_band_id, 'vocals', 'Vocals', 3, true),
      (p_band_id, 'shared', 'Shared', 4, false);
  end if;

  return query
  select *
  from public.bandie_band_song_part_templates
  where band_id = p_band_id
  order by sort_order asc, created_at asc;
end;
$$;

grant execute on function public.bandie_ensure_band_song_part_templates(uuid) to authenticated;

-- Backfill bands that already have songs but no templates (pre-RPC deployments).
insert into public.bandie_band_song_part_templates (
  band_id,
  part_key,
  part_label,
  sort_order,
  required_for_readiness
)
select
  b.id,
  defaults.part_key,
  defaults.part_label,
  defaults.sort_order,
  defaults.required_for_readiness
from public.bandie_bands b
cross join (
  values
    ('guitar', 'Guitar', 0, true),
    ('bass', 'Bass', 1, true),
    ('drums', 'Drums', 2, true),
    ('vocals', 'Vocals', 3, true),
    ('shared', 'Shared', 4, false)
) as defaults(part_key, part_label, sort_order, required_for_readiness)
where exists (
  select 1
  from public.bandie_songs s
  where s.band_id = b.id
)
and not exists (
  select 1
  from public.bandie_band_song_part_templates t
  where t.band_id = b.id
);
