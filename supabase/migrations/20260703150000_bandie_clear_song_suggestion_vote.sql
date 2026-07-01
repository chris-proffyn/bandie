-- Allow members to remove their own song suggestion vote while voting is open.

create or replace function public.bandie_clear_song_suggestion_vote(p_suggestion_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_suggestion public.bandie_song_suggestions%rowtype;
  v_group public.bandie_song_suggestion_groups%rowtype;
  v_existing public.bandie_song_suggestion_votes%rowtype;
begin
  select * into v_suggestion from public.bandie_song_suggestions where id = p_suggestion_id;
  if not found then
    raise exception 'Suggestion not found.';
  end if;

  if v_suggestion.status <> 'active' then
    raise exception 'This suggestion is not open for voting.';
  end if;

  select * into v_group from public.bandie_song_suggestion_groups where id = v_suggestion.group_id;

  if not public.bandie_current_user_is_band_member(v_group.band_id) then
    raise exception 'You must be an approved band member to clear a vote.';
  end if;

  if not public.bandie_song_suggestion_voting_open(v_group) then
    raise exception 'Voting is closed for this group.';
  end if;

  select * into v_existing
  from public.bandie_song_suggestion_votes
  where suggestion_id = p_suggestion_id
    and member_user_id = auth.uid();

  if not found then
    raise exception 'You have not voted on this suggestion.';
  end if;

  if not v_group.allow_vote_changes then
    raise exception 'Vote changes are not allowed for this group.';
  end if;

  delete from public.bandie_song_suggestion_votes
  where id = v_existing.id;

  perform public.bandie_log_song_suggestion_event(
    v_suggestion.group_id,
    v_group.band_id,
    'vote_cleared',
    jsonb_build_object(
      'suggestion_id', p_suggestion_id,
      'previous_vote_state', v_existing.vote_state
    )
  );
end;
$$;

grant execute on function public.bandie_clear_song_suggestion_vote(uuid) to authenticated;
