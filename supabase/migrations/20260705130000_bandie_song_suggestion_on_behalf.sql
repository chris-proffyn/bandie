-- Allow band leaders to submit song suggestions on behalf of active band members.

drop function if exists public.bandie_submit_song_suggestion(
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  integer,
  text,
  text,
  text,
  text,
  text
);

create or replace function public.bandie_submit_song_suggestion(
  p_group_id uuid,
  p_song_title text,
  p_artist text,
  p_suggested_genre text default null,
  p_decade text default null,
  p_vocal_suitability text default null,
  p_song_key text default null,
  p_estimated_length_seconds integer default null,
  p_difficulty_estimate text default 'unknown',
  p_youtube_url text default null,
  p_spotify_url text default null,
  p_other_media_url text default null,
  p_rationale text default null,
  p_suggested_by_user_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group public.bandie_song_suggestion_groups%rowtype;
  v_suggestion_id uuid;
  v_member_count integer;
  v_suggester_id uuid;
begin
  select * into v_group from public.bandie_song_suggestion_groups where id = p_group_id;
  if not found then
    raise exception 'Suggestion group not found.';
  end if;

  if not public.bandie_current_user_is_band_member(v_group.band_id) then
    raise exception 'You must be an approved band member to suggest songs.';
  end if;

  if v_group.status <> 'open_for_suggestions' or now() > v_group.suggestion_closes_at then
    raise exception 'Suggestions are closed for this group.';
  end if;

  v_suggester_id := auth.uid();

  if p_suggested_by_user_id is not null and p_suggested_by_user_id <> auth.uid() then
    if not public.bandie_current_user_owns_band(v_group.band_id) then
      raise exception 'Only the band leader can submit suggestions on behalf of another member.';
    end if;

    if not exists (
      select 1
      from public.bandie_band_members m
      where m.band_id = v_group.band_id
        and m.user_id = p_suggested_by_user_id
        and m.status = 'active'
    ) then
      raise exception 'Suggested member is not an active band member.';
    end if;

    v_suggester_id := p_suggested_by_user_id;
  elsif p_suggested_by_user_id is not null then
    v_suggester_id := p_suggested_by_user_id;
  end if;

  if v_group.max_suggestions_per_member is not null then
    select count(*)::integer into v_member_count
    from public.bandie_song_suggestions s
    where s.group_id = p_group_id
      and s.suggested_by = v_suggester_id
      and s.status in ('active', 'selected', 'not_selected', 'converted_to_catalogue');

    if v_member_count >= v_group.max_suggestions_per_member then
      raise exception 'This member has reached the maximum number of suggestions for this group.';
    end if;
  end if;

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
    rationale
  )
  values (
    p_group_id,
    v_group.band_id,
    v_suggester_id,
    trim(p_song_title),
    trim(p_artist),
    nullif(trim(coalesce(p_suggested_genre, '')), ''),
    nullif(trim(coalesce(p_decade, '')), ''),
    p_vocal_suitability,
    nullif(trim(coalesce(p_song_key, '')), ''),
    p_estimated_length_seconds,
    coalesce(p_difficulty_estimate, 'unknown'),
    nullif(trim(coalesce(p_youtube_url, '')), ''),
    nullif(trim(coalesce(p_spotify_url, '')), ''),
    nullif(trim(coalesce(p_other_media_url, '')), ''),
    nullif(trim(coalesce(p_rationale, '')), '')
  )
  returning id into v_suggestion_id;

  if public.bandie_song_suggestion_voting_open(v_group) then
    insert into public.bandie_song_suggestion_votes (
      group_id,
      suggestion_id,
      band_id,
      member_user_id,
      vote_state
    )
    values (
      p_group_id,
      v_suggestion_id,
      v_group.band_id,
      v_suggester_id,
      'happy_to_play'
    )
    on conflict (suggestion_id, member_user_id) do update
    set vote_state = 'happy_to_play', updated_at = now();
  end if;

  perform public.bandie_log_song_suggestion_event(
    p_group_id,
    v_group.band_id,
    'suggestion_added',
    jsonb_build_object(
      'suggestion_id', v_suggestion_id,
      'song_title', trim(p_song_title),
      'suggested_by', v_suggester_id,
      'submitted_by', auth.uid()
    )
  );

  return v_suggestion_id;
end;
$$;

grant execute on function public.bandie_submit_song_suggestion(
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  integer,
  text,
  text,
  text,
  text,
  text,
  uuid
) to authenticated;
