-- Leader: create a new suggestion group from not-selected songs in a confirmed group.

create or replace function public.bandie_carry_over_not_selected_suggestions(
  p_source_group_id uuid,
  p_name text,
  p_suggestion_closes_at timestamptz,
  p_voting_closes_at timestamptz default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_source public.bandie_song_suggestion_groups%rowtype;
  v_new_group_id uuid;
  v_suggestion public.bandie_song_suggestions%rowtype;
  v_carried_count integer := 0;
begin
  select * into v_source
  from public.bandie_song_suggestion_groups
  where id = p_source_group_id;

  if not found then
    raise exception 'Suggestion group not found.';
  end if;

  if not public.bandie_current_user_owns_band(v_source.band_id) then
    raise exception 'Only the band leader can carry over unselected songs.';
  end if;

  if v_source.status <> 'confirmed' then
    raise exception 'Songs can only be carried over from a confirmed group.';
  end if;

  if char_length(trim(coalesce(p_name, ''))) = 0 then
    raise exception 'New group name is required.';
  end if;

  if p_suggestion_closes_at <= now() then
    raise exception 'Suggestions close date must be in the future.';
  end if;

  if p_voting_closes_at is not null and p_voting_closes_at < p_suggestion_closes_at then
    raise exception 'Voting must close on or after suggestions close.';
  end if;

  select count(*)::integer into v_carried_count
  from public.bandie_song_suggestions s
  where s.group_id = p_source_group_id
    and s.status = 'not_selected';

  if v_carried_count = 0 then
    raise exception 'There are no unselected songs to carry over.';
  end if;

  insert into public.bandie_song_suggestion_groups (
    band_id,
    created_by,
    updated_by,
    name,
    description,
    preferred_genres,
    preferred_decades,
    vocal_suitability,
    target_song_count,
    max_suggestions_per_member,
    suggestion_closes_at,
    voting_closes_at,
    vote_visibility,
    allow_member_comments,
    allow_vote_changes,
    tie_break_mode,
    selection_mode,
    status
  )
  values (
    v_source.band_id,
    auth.uid(),
    auth.uid(),
    trim(p_name),
    v_source.description,
    v_source.preferred_genres,
    v_source.preferred_decades,
    v_source.vocal_suitability,
    v_source.target_song_count,
    v_source.max_suggestions_per_member,
    p_suggestion_closes_at,
    p_voting_closes_at,
    v_source.vote_visibility,
    v_source.allow_member_comments,
    v_source.allow_vote_changes,
    v_source.tie_break_mode,
    v_source.selection_mode,
    'open_for_suggestions'
  )
  returning id into v_new_group_id;

  for v_suggestion in
    select *
    from public.bandie_song_suggestions
    where group_id = p_source_group_id
      and status = 'not_selected'
    order by created_at asc
  loop
    insert into public.bandie_song_suggestions (
      group_id,
      band_id,
      suggested_by,
      song_title,
      artist,
      suggested_genre,
      decade,
      vocal_suitability,
      song_key,
      estimated_length_seconds,
      difficulty_estimate,
      youtube_url,
      spotify_url,
      other_media_url,
      rationale,
      duplicate_of_suggestion_id,
      status
    )
    values (
      v_new_group_id,
      v_suggestion.band_id,
      v_suggestion.suggested_by,
      v_suggestion.song_title,
      v_suggestion.artist,
      v_suggestion.suggested_genre,
      v_suggestion.decade,
      v_suggestion.vocal_suitability,
      v_suggestion.song_key,
      v_suggestion.estimated_length_seconds,
      v_suggestion.difficulty_estimate,
      v_suggestion.youtube_url,
      v_suggestion.spotify_url,
      v_suggestion.other_media_url,
      v_suggestion.rationale,
      v_suggestion.id,
      'active'
    );
  end loop;

  perform public.bandie_log_song_suggestion_event(
    v_new_group_id,
    v_source.band_id,
    'group_created',
    jsonb_build_object(
      'name', trim(p_name),
      'carried_over_from_group_id', p_source_group_id,
      'carried_over_count', v_carried_count
    )
  );

  perform public.bandie_log_song_suggestion_event(
    p_source_group_id,
    v_source.band_id,
    'not_selected_carried_over',
    jsonb_build_object(
      'new_group_id', v_new_group_id,
      'new_group_name', trim(p_name),
      'carried_over_count', v_carried_count
    )
  );

  return v_new_group_id;
end;
$$;

grant execute on function public.bandie_carry_over_not_selected_suggestions(
  uuid,
  text,
  timestamptz,
  timestamptz
) to authenticated;
