-- Phase 17.4.3: Import open mic songs from a band song list (metadata + part slots)

create or replace function public.bandie_import_open_mic_songs_from_band(
  p_event_id uuid,
  p_band_id uuid,
  p_song_ids uuid[]
)
returns setof public.bandie_open_mic_songs
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event public.bandie_open_mic_events;
  v_song_id uuid;
  v_band_song public.bandie_songs;
  v_row public.bandie_open_mic_songs;
  v_sort integer;
  v_folder_count integer;
begin
  if not public.bandie_current_user_can_manage_open_mic_event(p_event_id) then
    raise exception 'Not authorised';
  end if;

  if not public.bandie_current_user_owns_band(p_band_id) then
    raise exception 'You must lead the band to import its songs';
  end if;

  if p_song_ids is null or cardinality(p_song_ids) = 0 then
    return;
  end if;

  select * into v_event from public.bandie_open_mic_events where id = p_event_id;
  if not found then
    raise exception 'Event not found';
  end if;

  foreach v_song_id in array p_song_ids
  loop
    select * into v_band_song
    from public.bandie_songs
    where id = v_song_id
      and band_id = p_band_id
      and is_deleted = false;

    if not found then
      continue;
    end if;

    if exists (
      select 1
      from public.bandie_open_mic_songs s
      where s.event_id = p_event_id
        and s.source_type = 'band_song'
        and s.source_song_id = v_band_song.id
    ) then
      continue;
    end if;

    select coalesce(max(sort_order), -1) + 1 into v_sort
    from public.bandie_open_mic_songs
    where event_id = p_event_id;

    insert into public.bandie_open_mic_songs (
      event_id,
      source_song_id,
      source_type,
      title,
      artist,
      song_key,
      duration_seconds,
      genre,
      notes,
      sort_order
    ) values (
      p_event_id,
      v_band_song.id,
      'band_song',
      v_band_song.title,
      v_band_song.artist,
      v_band_song.song_key,
      v_band_song.duration_seconds,
      v_band_song.genre,
      v_band_song.notes,
      v_sort
    )
    returning * into v_row;

    select count(*) into v_folder_count
    from public.bandie_song_part_folders f
    where f.song_id = v_band_song.id
      and f.band_id = p_band_id;

    if v_folder_count > 0 then
      insert into public.bandie_open_mic_song_slots (
        event_song_id,
        slot_name,
        required,
        sort_order,
        public_signup_enabled,
        enabled
      )
      select
        v_row.id,
        f.part_label,
        f.required_for_readiness,
        f.sort_order,
        true,
        true
      from public.bandie_song_part_folders f
      where f.song_id = v_band_song.id
        and f.band_id = p_band_id
      order by f.sort_order, f.created_at;
    elsif exists (
      select 1
      from public.bandie_band_song_part_templates t
      where t.band_id = p_band_id
    ) then
      insert into public.bandie_open_mic_song_slots (
        event_song_id,
        slot_name,
        required,
        sort_order,
        public_signup_enabled,
        enabled
      )
      select
        v_row.id,
        t.part_label,
        t.required_for_readiness,
        t.sort_order,
        true,
        true
      from public.bandie_band_song_part_templates t
      where t.band_id = p_band_id
      order by t.sort_order, t.created_at;
    elsif v_event.event_type = 'open_mic' then
      perform public.bandie_seed_open_mic_default_parts(p_event_id);
      perform public.bandie_open_mic_apply_parts_to_song(v_row.id);
    end if;

    perform public.bandie_open_mic_refresh_song_readiness(v_row.id);

    perform public.bandie_open_mic_log_activity(
      p_event_id,
      'import_song_from_band',
      'song',
      v_row.id,
      null,
      jsonb_build_object(
        'band_id', p_band_id,
        'source_song_id', v_band_song.id,
        'title', v_row.title
      )
    );

    return next v_row;
  end loop;

  return;
end;
$$;

grant execute on function public.bandie_import_open_mic_songs_from_band(uuid, uuid, uuid[]) to authenticated;
