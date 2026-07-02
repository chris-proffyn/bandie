-- Members and band leaders may update suggestion details (not title) while suggestions or voting are open.

drop function if exists public.bandie_update_song_suggestion_media(uuid, text, text, text);

create or replace function public.bandie_update_song_suggestion_details(
  p_suggestion_id uuid,
  p_artist text,
  p_suggested_genre text default null,
  p_decade text default null,
  p_youtube_url text default null,
  p_spotify_url text default null,
  p_other_media_url text default null,
  p_rationale text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_suggestion public.bandie_song_suggestions%rowtype;
  v_group public.bandie_song_suggestion_groups%rowtype;
  v_is_leader boolean;
begin
  select * into v_suggestion from public.bandie_song_suggestions where id = p_suggestion_id;
  if not found then
    raise exception 'Suggestion not found.';
  end if;

  if v_suggestion.status <> 'active' then
    raise exception 'This suggestion cannot be edited.';
  end if;

  select * into v_group from public.bandie_song_suggestion_groups where id = v_suggestion.group_id;

  if v_group.status in ('confirmed', 'archived', 'cancelled') then
    raise exception 'This group is finalized.';
  end if;

  v_is_leader := public.bandie_current_user_owns_band(v_group.band_id);

  if v_suggestion.suggested_by <> auth.uid() and not v_is_leader then
    raise exception 'You can only edit your own suggestions.';
  end if;

  if not public.bandie_current_user_is_band_member(v_group.band_id) then
    raise exception 'You must be an approved band member to edit a suggestion.';
  end if;

  if not (
    (v_group.status = 'open_for_suggestions' and now() <= v_group.suggestion_closes_at)
    or public.bandie_song_suggestion_voting_open(v_group)
  ) then
    raise exception 'This suggestion can no longer be updated for this group.';
  end if;

  if char_length(trim(coalesce(p_artist, ''))) = 0 then
    raise exception 'Artist is required.';
  end if;

  update public.bandie_song_suggestions
  set
    artist = trim(p_artist),
    suggested_genre = nullif(trim(coalesce(p_suggested_genre, '')), ''),
    decade = nullif(trim(coalesce(p_decade, '')), ''),
    youtube_url = nullif(trim(coalesce(p_youtube_url, '')), ''),
    spotify_url = nullif(trim(coalesce(p_spotify_url, '')), ''),
    other_media_url = nullif(trim(coalesce(p_other_media_url, '')), ''),
    rationale = nullif(trim(coalesce(p_rationale, '')), ''),
    updated_at = now()
  where id = p_suggestion_id;

  perform public.bandie_log_song_suggestion_event(
    v_suggestion.group_id,
    v_group.band_id,
    'suggestion_details_updated',
    jsonb_build_object(
      'suggestion_id', p_suggestion_id,
      'song_title', v_suggestion.song_title,
      'edited_by_leader', v_is_leader and v_suggestion.suggested_by <> auth.uid()
    )
  );
end;
$$;

grant execute on function public.bandie_update_song_suggestion_details(
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  text
) to authenticated;
