-- Allow band leaders to withdraw all active suggestions while suggestions are open.

create or replace function public.bandie_clear_all_song_suggestions(p_group_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group public.bandie_song_suggestion_groups%rowtype;
  v_cleared_count integer;
begin
  select * into v_group from public.bandie_song_suggestion_groups where id = p_group_id;
  if not found then
    raise exception 'Group not found.';
  end if;

  if not public.bandie_current_user_owns_band(v_group.band_id) then
    raise exception 'Only the band leader can clear suggestions.';
  end if;

  if v_group.status <> 'open_for_suggestions' or now() > v_group.suggestion_closes_at then
    raise exception 'Suggestions are closed for this group.';
  end if;

  select count(*)::integer into v_cleared_count
  from public.bandie_song_suggestions
  where group_id = p_group_id
    and status = 'active';

  if v_cleared_count = 0 then
    raise exception 'There are no active suggestions to clear.';
  end if;

  update public.bandie_song_suggestions
  set
    status = 'withdrawn',
    updated_at = now()
  where group_id = p_group_id
    and status = 'active';

  delete from public.bandie_song_suggestion_votes
  where group_id = p_group_id;

  perform public.bandie_log_song_suggestion_event(
    p_group_id,
    v_group.band_id,
    'suggestions_cleared',
    jsonb_build_object('cleared_count', v_cleared_count)
  );
end;
$$;

grant execute on function public.bandie_clear_all_song_suggestions(uuid) to authenticated;
