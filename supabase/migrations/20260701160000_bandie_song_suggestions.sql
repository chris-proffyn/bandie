-- Phase 20: Song suggestion groups, voting, and confirmed snapshots

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.bandie_song_suggestion_groups (
  id uuid primary key default gen_random_uuid(),
  band_id uuid not null references public.bandie_bands(id) on delete cascade,
  created_by uuid not null references auth.users(id),
  updated_by uuid references auth.users(id),

  name text not null,
  description text,
  preferred_genres text[] not null default '{}',
  preferred_decades text[] not null default '{}',
  vocal_suitability text not null default 'any'
    check (vocal_suitability in ('any', 'male_vocal', 'female_vocal', 'mixed_vocal', 'instrumental')),

  target_song_count integer not null check (target_song_count > 0),
  max_suggestions_per_member integer check (max_suggestions_per_member is null or max_suggestions_per_member > 0),

  suggestion_closes_at timestamptz not null,
  voting_closes_at timestamptz,

  vote_visibility text not null default 'member_visible'
    check (vote_visibility in ('member_visible', 'aggregate_only')),

  allow_member_comments boolean not null default false,
  allow_vote_changes boolean not null default true,
  tie_break_mode text not null default 'leader_decides'
    check (tie_break_mode in ('leader_decides', 'happy_count', 'lowest_rather_not', 'earliest_submitted')),

  status text not null default 'open_for_suggestions'
    check (status in (
      'draft',
      'open_for_suggestions',
      'suggestions_closed',
      'voting_closed',
      'confirmed',
      'archived',
      'cancelled'
    )),

  suggestions_closed_at timestamptz,
  voting_closed_at timestamptz,
  confirmed_at timestamptz,
  confirmed_by uuid references auth.users(id),
  skeleton_setlist_id uuid references public.bandie_setlists(id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint bandie_song_suggestion_groups_name_check check (char_length(trim(name)) > 0),
  constraint bandie_song_suggestion_groups_voting_after_suggestions
    check (voting_closes_at is null or voting_closes_at >= suggestion_closes_at)
);

create index if not exists bandie_song_suggestion_groups_band_status_idx
  on public.bandie_song_suggestion_groups (band_id, status);

create index if not exists bandie_song_suggestion_groups_closing_dates_idx
  on public.bandie_song_suggestion_groups (suggestion_closes_at, voting_closes_at);

drop trigger if exists bandie_song_suggestion_groups_set_updated_at on public.bandie_song_suggestion_groups;
create trigger bandie_song_suggestion_groups_set_updated_at
before update on public.bandie_song_suggestion_groups
for each row execute function public.set_updated_at();

create table if not exists public.bandie_song_suggestions (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.bandie_song_suggestion_groups(id) on delete cascade,
  band_id uuid not null references public.bandie_bands(id) on delete cascade,
  suggested_by uuid not null references auth.users(id),

  song_title text not null,
  artist text not null,
  suggested_genre text,
  decade text,
  vocal_suitability text check (vocal_suitability in ('any', 'male_vocal', 'female_vocal', 'mixed_vocal', 'instrumental')),
  song_key text,
  estimated_length_seconds integer check (estimated_length_seconds is null or estimated_length_seconds > 0),
  difficulty_estimate text not null default 'unknown'
    check (difficulty_estimate in ('easy', 'medium', 'hard', 'unknown')),

  youtube_url text,
  spotify_url text,
  other_media_url text,
  rationale text,

  duplicate_of_suggestion_id uuid references public.bandie_song_suggestions(id) on delete set null,
  existing_catalogue_song_id uuid references public.bandie_songs(id) on delete set null,

  status text not null default 'active'
    check (status in ('active', 'withdrawn', 'leader_vetoed', 'selected', 'not_selected', 'converted_to_catalogue')),

  leader_vetoed_at timestamptz,
  leader_vetoed_by uuid references auth.users(id),
  leader_veto_reason text,

  final_rank integer,
  final_score integer,
  selected_at timestamptz,
  selection_override boolean not null default false,
  selection_override_reason text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint bandie_song_suggestions_title_check check (char_length(trim(song_title)) > 0),
  constraint bandie_song_suggestions_artist_check check (char_length(trim(artist)) > 0)
);

create index if not exists bandie_song_suggestions_group_idx
  on public.bandie_song_suggestions (group_id, created_at desc);

create index if not exists bandie_song_suggestions_band_title_artist_idx
  on public.bandie_song_suggestions (band_id, lower(song_title), lower(artist));

drop trigger if exists bandie_song_suggestions_set_updated_at on public.bandie_song_suggestions;
create trigger bandie_song_suggestions_set_updated_at
before update on public.bandie_song_suggestions
for each row execute function public.set_updated_at();

create table if not exists public.bandie_song_suggestion_votes (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.bandie_song_suggestion_groups(id) on delete cascade,
  suggestion_id uuid not null references public.bandie_song_suggestions(id) on delete cascade,
  band_id uuid not null references public.bandie_bands(id) on delete cascade,
  member_user_id uuid not null references auth.users(id),

  vote_state text not null check (vote_state in ('happy_to_play', 'meh', 'rather_not')),
  comment text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint bandie_song_suggestion_votes_unique unique (suggestion_id, member_user_id)
);

create index if not exists bandie_song_suggestion_votes_group_member_idx
  on public.bandie_song_suggestion_votes (group_id, member_user_id);

create index if not exists bandie_song_suggestion_votes_suggestion_idx
  on public.bandie_song_suggestion_votes (suggestion_id);

drop trigger if exists bandie_song_suggestion_votes_set_updated_at on public.bandie_song_suggestion_votes;
create trigger bandie_song_suggestion_votes_set_updated_at
before update on public.bandie_song_suggestion_votes
for each row execute function public.set_updated_at();

create table if not exists public.bandie_song_suggestion_group_events (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.bandie_song_suggestion_groups(id) on delete cascade,
  band_id uuid not null references public.bandie_bands(id) on delete cascade,
  actor_user_id uuid references auth.users(id),
  event_type text not null,
  event_payload jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists bandie_song_suggestion_group_events_group_idx
  on public.bandie_song_suggestion_group_events (group_id, created_at desc);

create table if not exists public.bandie_song_suggestion_confirmed_songs (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.bandie_song_suggestion_groups(id) on delete cascade,
  suggestion_id uuid not null references public.bandie_song_suggestions(id) on delete cascade,
  band_id uuid not null references public.bandie_bands(id) on delete cascade,

  final_rank integer not null,
  final_score integer not null default 0,
  happy_count integer not null default 0,
  meh_count integer not null default 0,
  rather_not_count integer not null default 0,
  total_votes integer not null default 0,

  song_title text not null,
  artist text not null,
  suggested_by uuid references auth.users(id),
  selected_by uuid references auth.users(id),
  selection_override boolean not null default false,
  selection_override_reason text,

  created_catalogue_song_id uuid references public.bandie_songs(id) on delete set null,
  created_setlist_item_id uuid references public.bandie_setlist_items(id) on delete set null,

  created_at timestamptz not null default now(),

  constraint bandie_song_suggestion_confirmed_songs_unique unique (group_id, suggestion_id)
);

-- ---------------------------------------------------------------------------
-- Vote summary view
-- ---------------------------------------------------------------------------

create or replace view public.bandie_song_suggestion_vote_summary as
select
  s.id as suggestion_id,
  s.group_id,
  s.band_id,
  count(v.id) as total_votes,
  count(*) filter (where v.vote_state = 'happy_to_play') as happy_count,
  count(*) filter (where v.vote_state = 'meh') as meh_count,
  count(*) filter (where v.vote_state = 'rather_not') as rather_not_count,
  (
    count(*) filter (where v.vote_state = 'happy_to_play') * 2 +
    count(*) filter (where v.vote_state = 'meh') * 1
  ) as score
from public.bandie_song_suggestions s
left join public.bandie_song_suggestion_votes v on v.suggestion_id = s.id
where s.status = 'active'
group by s.id, s.group_id, s.band_id;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.bandie_song_suggestion_groups enable row level security;
alter table public.bandie_song_suggestions enable row level security;
alter table public.bandie_song_suggestion_votes enable row level security;
alter table public.bandie_song_suggestion_group_events enable row level security;
alter table public.bandie_song_suggestion_confirmed_songs enable row level security;

drop policy if exists "Band members can view song suggestion groups" on public.bandie_song_suggestion_groups;
create policy "Band members can view song suggestion groups"
on public.bandie_song_suggestion_groups for select to authenticated
using (
  public.platform_current_user_has_app_access('bandie')
  and public.bandie_current_user_is_band_member(band_id)
);

drop policy if exists "Band leaders can insert song suggestion groups" on public.bandie_song_suggestion_groups;
create policy "Band leaders can insert song suggestion groups"
on public.bandie_song_suggestion_groups for insert to authenticated
with check (
  public.platform_current_user_has_app_access('bandie')
  and public.bandie_current_user_owns_band(band_id)
  and created_by = auth.uid()
);

drop policy if exists "Band leaders can update song suggestion groups" on public.bandie_song_suggestion_groups;
create policy "Band leaders can update song suggestion groups"
on public.bandie_song_suggestion_groups for update to authenticated
using (
  public.platform_current_user_has_app_access('bandie')
  and public.bandie_current_user_owns_band(band_id)
)
with check (
  public.platform_current_user_has_app_access('bandie')
  and public.bandie_current_user_owns_band(band_id)
);

drop policy if exists "Band members can view song suggestions" on public.bandie_song_suggestions;
create policy "Band members can view song suggestions"
on public.bandie_song_suggestions for select to authenticated
using (
  public.platform_current_user_has_app_access('bandie')
  and public.bandie_current_user_is_band_member(band_id)
);

drop policy if exists "Band members can view song suggestion votes" on public.bandie_song_suggestion_votes;
create policy "Band members can view song suggestion votes"
on public.bandie_song_suggestion_votes for select to authenticated
using (
  public.platform_current_user_has_app_access('bandie')
  and public.bandie_current_user_is_band_member(band_id)
);

drop policy if exists "Band members can view song suggestion events" on public.bandie_song_suggestion_group_events;
create policy "Band members can view song suggestion events"
on public.bandie_song_suggestion_group_events for select to authenticated
using (
  public.platform_current_user_has_app_access('bandie')
  and public.bandie_current_user_is_band_member(band_id)
);

drop policy if exists "Band members can view confirmed song suggestions" on public.bandie_song_suggestion_confirmed_songs;
create policy "Band members can view confirmed song suggestions"
on public.bandie_song_suggestion_confirmed_songs for select to authenticated
using (
  public.platform_current_user_has_app_access('bandie')
  and public.bandie_current_user_is_band_member(band_id)
);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.bandie_log_song_suggestion_event(
  p_group_id uuid,
  p_band_id uuid,
  p_event_type text,
  p_payload jsonb default '{}'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.bandie_song_suggestion_group_events (
    group_id,
    band_id,
    actor_user_id,
    event_type,
    event_payload
  )
  values (
    p_group_id,
    p_band_id,
    auth.uid(),
    p_event_type,
    coalesce(p_payload, '{}'::jsonb)
  );
end;
$$;

grant execute on function public.bandie_log_song_suggestion_event(uuid, uuid, text, jsonb) to authenticated;

create or replace function public.bandie_song_suggestion_voting_open(p_group public.bandie_song_suggestion_groups)
returns boolean
language sql
stable
as $$
  select
    p_group.status in ('open_for_suggestions', 'suggestions_closed')
    and (p_group.voting_closed_at is null or now() <= p_group.voting_closed_at)
    and (p_group.voting_closes_at is null or now() <= p_group.voting_closes_at);
$$;

-- ---------------------------------------------------------------------------
-- RPC: submit suggestion + auto-vote
-- ---------------------------------------------------------------------------

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
  p_rationale text default null
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

  if v_group.max_suggestions_per_member is not null then
    select count(*)::integer into v_member_count
    from public.bandie_song_suggestions s
    where s.group_id = p_group_id
      and s.suggested_by = auth.uid()
      and s.status in ('active', 'selected', 'not_selected', 'converted_to_catalogue');

    if v_member_count >= v_group.max_suggestions_per_member then
      raise exception 'You have reached the maximum number of suggestions for this group.';
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
    auth.uid(),
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
      auth.uid(),
      'happy_to_play'
    )
    on conflict (suggestion_id, member_user_id) do update
    set vote_state = 'happy_to_play', updated_at = now();
  end if;

  perform public.bandie_log_song_suggestion_event(
    p_group_id,
    v_group.band_id,
    'suggestion_added',
    jsonb_build_object('suggestion_id', v_suggestion_id, 'song_title', trim(p_song_title))
  );

  return v_suggestion_id;
end;
$$;

grant execute on function public.bandie_submit_song_suggestion(uuid, text, text, text, text, text, text, integer, text, text, text, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- RPC: vote
-- ---------------------------------------------------------------------------

create or replace function public.bandie_vote_on_song_suggestion(
  p_suggestion_id uuid,
  p_vote_state text,
  p_comment text default null
)
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
  if p_vote_state not in ('happy_to_play', 'meh', 'rather_not') then
    raise exception 'Invalid vote state.';
  end if;

  select * into v_suggestion from public.bandie_song_suggestions where id = p_suggestion_id;
  if not found then
    raise exception 'Suggestion not found.';
  end if;

  if v_suggestion.status <> 'active' then
    raise exception 'This suggestion is not open for voting.';
  end if;

  select * into v_group from public.bandie_song_suggestion_groups where id = v_suggestion.group_id;

  if not public.bandie_current_user_is_band_member(v_group.band_id) then
    raise exception 'You must be an approved band member to vote.';
  end if;

  if not public.bandie_song_suggestion_voting_open(v_group) then
    raise exception 'Voting is closed for this group.';
  end if;

  select * into v_existing
  from public.bandie_song_suggestion_votes
  where suggestion_id = p_suggestion_id and member_user_id = auth.uid();

  if found and not v_group.allow_vote_changes then
    raise exception 'Vote changes are not allowed for this group.';
  end if;

  insert into public.bandie_song_suggestion_votes (
    group_id,
    suggestion_id,
    band_id,
    member_user_id,
    vote_state,
    comment
  )
  values (
    v_suggestion.group_id,
    p_suggestion_id,
    v_group.band_id,
    auth.uid(),
    p_vote_state,
    nullif(trim(coalesce(p_comment, '')), '')
  )
  on conflict (suggestion_id, member_user_id) do update
  set
    vote_state = excluded.vote_state,
    comment = excluded.comment,
    updated_at = now();

  perform public.bandie_log_song_suggestion_event(
    v_suggestion.group_id,
    v_group.band_id,
    case when v_existing.id is null then 'vote_cast' else 'vote_changed' end,
    jsonb_build_object('suggestion_id', p_suggestion_id, 'vote_state', p_vote_state)
  );
end;
$$;

grant execute on function public.bandie_vote_on_song_suggestion(uuid, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- RPC: leader transitions
-- ---------------------------------------------------------------------------

create or replace function public.bandie_close_song_suggestions(p_group_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group public.bandie_song_suggestion_groups%rowtype;
begin
  select * into v_group from public.bandie_song_suggestion_groups where id = p_group_id;
  if not found then raise exception 'Group not found.'; end if;
  if not public.bandie_current_user_owns_band(v_group.band_id) then
    raise exception 'Only the band leader can close suggestions.';
  end if;

  update public.bandie_song_suggestion_groups
  set status = 'suggestions_closed', suggestions_closed_at = now(), updated_by = auth.uid()
  where id = p_group_id;

  perform public.bandie_log_song_suggestion_event(p_group_id, v_group.band_id, 'suggestions_closed', '{}');
end;
$$;

grant execute on function public.bandie_close_song_suggestions(uuid) to authenticated;

create or replace function public.bandie_reopen_song_suggestions(p_group_id uuid, p_new_closes_at timestamptz)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group public.bandie_song_suggestion_groups%rowtype;
begin
  select * into v_group from public.bandie_song_suggestion_groups where id = p_group_id;
  if not found then raise exception 'Group not found.'; end if;
  if not public.bandie_current_user_owns_band(v_group.band_id) then
    raise exception 'Only the band leader can reopen suggestions.';
  end if;
  if p_new_closes_at <= now() then
    raise exception 'Suggestion closing date must be in the future.';
  end if;

  update public.bandie_song_suggestion_groups
  set
    status = 'open_for_suggestions',
    suggestion_closes_at = p_new_closes_at,
    suggestions_closed_at = null,
    updated_by = auth.uid()
  where id = p_group_id;

  perform public.bandie_log_song_suggestion_event(
    p_group_id,
    v_group.band_id,
    'suggestions_reopened',
    jsonb_build_object('suggestion_closes_at', p_new_closes_at)
  );
end;
$$;

grant execute on function public.bandie_reopen_song_suggestions(uuid, timestamptz) to authenticated;

create or replace function public.bandie_close_song_suggestion_voting(p_group_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group public.bandie_song_suggestion_groups%rowtype;
begin
  select * into v_group from public.bandie_song_suggestion_groups where id = p_group_id;
  if not found then raise exception 'Group not found.'; end if;
  if not public.bandie_current_user_owns_band(v_group.band_id) then
    raise exception 'Only the band leader can close voting.';
  end if;

  update public.bandie_song_suggestion_groups
  set status = 'voting_closed', voting_closed_at = now(), updated_by = auth.uid()
  where id = p_group_id;

  perform public.bandie_log_song_suggestion_event(p_group_id, v_group.band_id, 'voting_closed', '{}');
end;
$$;

grant execute on function public.bandie_close_song_suggestion_voting(uuid) to authenticated;

create or replace function public.bandie_veto_song_suggestion(p_suggestion_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_suggestion public.bandie_song_suggestions%rowtype;
  v_reason text := nullif(trim(coalesce(p_reason, '')), '');
begin
  if v_reason is null then
    raise exception 'A veto reason is required.';
  end if;

  select * into v_suggestion from public.bandie_song_suggestions where id = p_suggestion_id;
  if not found then raise exception 'Suggestion not found.'; end if;
  if not public.bandie_current_user_owns_band(v_suggestion.band_id) then
    raise exception 'Only the band leader can veto suggestions.';
  end if;

  update public.bandie_song_suggestions
  set
    status = 'leader_vetoed',
    leader_vetoed_at = now(),
    leader_vetoed_by = auth.uid(),
    leader_veto_reason = v_reason
  where id = p_suggestion_id;

  perform public.bandie_log_song_suggestion_event(
    v_suggestion.group_id,
    v_suggestion.band_id,
    'suggestion_vetoed',
    jsonb_build_object('suggestion_id', p_suggestion_id, 'reason', v_reason)
  );
end;
$$;

grant execute on function public.bandie_veto_song_suggestion(uuid, text) to authenticated;

create or replace function public.bandie_reset_song_suggestion_votes(
  p_group_id uuid,
  p_message text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group public.bandie_song_suggestion_groups%rowtype;
begin
  select * into v_group from public.bandie_song_suggestion_groups where id = p_group_id;
  if not found then raise exception 'Group not found.'; end if;
  if not public.bandie_current_user_owns_band(v_group.band_id) then
    raise exception 'Only the band leader can reset votes.';
  end if;

  delete from public.bandie_song_suggestion_votes where group_id = p_group_id;

  if v_group.status = 'voting_closed' then
    update public.bandie_song_suggestion_groups
    set status = 'suggestions_closed', voting_closed_at = null, updated_by = auth.uid()
    where id = p_group_id;
  end if;

  perform public.bandie_log_song_suggestion_event(
    p_group_id,
    v_group.band_id,
    'votes_reset',
    jsonb_build_object('message', nullif(trim(coalesce(p_message, '')), ''))
  );
end;
$$;

grant execute on function public.bandie_reset_song_suggestion_votes(uuid, text) to authenticated;

create or replace function public.bandie_confirm_song_suggestion_group(
  p_group_id uuid,
  p_selections jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group public.bandie_song_suggestion_groups%rowtype;
  v_item jsonb;
  v_suggestion_id uuid;
  v_override_reason text;
  v_rank integer := 0;
  v_summary record;
begin
  select * into v_group from public.bandie_song_suggestion_groups where id = p_group_id;
  if not found then raise exception 'Group not found.'; end if;
  if not public.bandie_current_user_owns_band(v_group.band_id) then
    raise exception 'Only the band leader can confirm the selection.';
  end if;
  if v_group.status in ('confirmed', 'archived', 'cancelled') then
    raise exception 'This group is already finalized.';
  end if;
  if p_selections is null or jsonb_typeof(p_selections) <> 'array' or jsonb_array_length(p_selections) = 0 then
    raise exception 'At least one song must be selected.';
  end if;

  for v_item in select * from jsonb_array_elements(p_selections)
  loop
    v_suggestion_id := (v_item->>'suggestion_id')::uuid;
    v_override_reason := nullif(trim(coalesce(v_item->>'override_reason', '')), '');
    v_rank := v_rank + 1;

    select * into v_summary
    from public.bandie_song_suggestion_vote_summary
    where suggestion_id = v_suggestion_id;

    update public.bandie_song_suggestions
    set
      status = 'selected',
      final_rank = v_rank,
      final_score = coalesce(v_summary.score, 0),
      selected_at = now(),
      selection_override = v_override_reason is not null,
      selection_override_reason = v_override_reason
    where id = v_suggestion_id and group_id = p_group_id and status = 'active';

    if not found then
      raise exception 'Invalid or ineligible suggestion in selection.';
    end if;

    insert into public.bandie_song_suggestion_confirmed_songs (
      group_id,
      suggestion_id,
      band_id,
      final_rank,
      final_score,
      happy_count,
      meh_count,
      rather_not_count,
      total_votes,
      song_title,
      artist,
      suggested_by,
      selected_by,
      selection_override,
      selection_override_reason
    )
    select
      p_group_id,
      s.id,
      s.band_id,
      v_rank,
      coalesce(v_summary.score, 0),
      coalesce(v_summary.happy_count, 0),
      coalesce(v_summary.meh_count, 0),
      coalesce(v_summary.rather_not_count, 0),
      coalesce(v_summary.total_votes, 0),
      s.song_title,
      s.artist,
      s.suggested_by,
      auth.uid(),
      v_override_reason is not null,
      v_override_reason
    from public.bandie_song_suggestions s
    where s.id = v_suggestion_id;
  end loop;

  update public.bandie_song_suggestions
  set status = 'not_selected'
  where group_id = p_group_id and status = 'active';

  update public.bandie_song_suggestion_groups
  set
    status = 'confirmed',
    confirmed_at = now(),
    confirmed_by = auth.uid(),
    voting_closed_at = coalesce(voting_closed_at, now()),
    updated_by = auth.uid()
  where id = p_group_id;

  perform public.bandie_log_song_suggestion_event(
    p_group_id,
    v_group.band_id,
    'group_confirmed',
    jsonb_build_object('selection_count', v_rank)
  );
end;
$$;

grant execute on function public.bandie_confirm_song_suggestion_group(uuid, jsonb) to authenticated;
