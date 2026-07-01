-- Allow members to withdraw their own song suggestions while suggestions are open.

create or replace function public.bandie_withdraw_song_suggestion(p_suggestion_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_suggestion public.bandie_song_suggestions%rowtype;
  v_group public.bandie_song_suggestion_groups%rowtype;
begin
  select * into v_suggestion from public.bandie_song_suggestions where id = p_suggestion_id;
  if not found then
    raise exception 'Suggestion not found.';
  end if;

  if v_suggestion.suggested_by <> auth.uid() then
    raise exception 'You can only withdraw your own suggestions.';
  end if;

  if v_suggestion.status <> 'active' then
    raise exception 'This suggestion cannot be withdrawn.';
  end if;

  select * into v_group from public.bandie_song_suggestion_groups where id = v_suggestion.group_id;

  if not public.bandie_current_user_is_band_member(v_group.band_id) then
    raise exception 'You must be an approved band member to withdraw a suggestion.';
  end if;

  if v_group.status <> 'open_for_suggestions' or now() > v_group.suggestion_closes_at then
    raise exception 'Suggestions are closed for this group.';
  end if;

  update public.bandie_song_suggestions
  set
    status = 'withdrawn',
    updated_at = now()
  where id = p_suggestion_id;

  delete from public.bandie_song_suggestion_votes
  where suggestion_id = p_suggestion_id;

  perform public.bandie_log_song_suggestion_event(
    v_suggestion.group_id,
    v_group.band_id,
    'suggestion_withdrawn',
    jsonb_build_object(
      'suggestion_id', p_suggestion_id,
      'song_title', v_suggestion.song_title
    )
  );
end;
$$;

grant execute on function public.bandie_withdraw_song_suggestion(uuid) to authenticated;
