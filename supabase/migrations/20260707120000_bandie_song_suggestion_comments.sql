-- Song suggestion discussion comments (separate from optional vote comments).

create table if not exists public.bandie_song_suggestion_comments (
  id uuid primary key default gen_random_uuid(),
  suggestion_id uuid not null references public.bandie_song_suggestions(id) on delete cascade,
  group_id uuid not null references public.bandie_song_suggestion_groups(id) on delete cascade,
  band_id uuid not null references public.bandie_bands(id) on delete cascade,
  author_user_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bandie_song_suggestion_comments_body_check
    check (char_length(trim(body)) > 0 and char_length(body) <= 2000)
);

create index if not exists bandie_song_suggestion_comments_suggestion_created_idx
  on public.bandie_song_suggestion_comments (suggestion_id, created_at asc);

create index if not exists bandie_song_suggestion_comments_group_idx
  on public.bandie_song_suggestion_comments (group_id);

drop trigger if exists bandie_song_suggestion_comments_set_updated_at on public.bandie_song_suggestion_comments;
create trigger bandie_song_suggestion_comments_set_updated_at
before update on public.bandie_song_suggestion_comments
for each row execute function public.set_updated_at();

alter table public.bandie_song_suggestion_comments enable row level security;

drop policy if exists "Band members can view song suggestion comments" on public.bandie_song_suggestion_comments;
create policy "Band members can view song suggestion comments"
on public.bandie_song_suggestion_comments for select to authenticated
using (
  public.platform_current_user_has_app_access('bandie')
  and public.bandie_current_user_is_band_member(band_id)
);

create or replace function public.bandie_add_song_suggestion_comment(
  p_suggestion_id uuid,
  p_body text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_suggestion public.bandie_song_suggestions%rowtype;
  v_group public.bandie_song_suggestion_groups%rowtype;
  v_body text;
  v_comment_id uuid;
begin
  v_body := nullif(trim(coalesce(p_body, '')), '');
  if v_body is null then
    raise exception 'Comment cannot be empty.';
  end if;

  if char_length(v_body) > 2000 then
    raise exception 'Comment must be 2000 characters or fewer.';
  end if;

  select * into v_suggestion from public.bandie_song_suggestions where id = p_suggestion_id;
  if not found then
    raise exception 'Suggestion not found.';
  end if;

  if v_suggestion.status <> 'active' then
    raise exception 'Comments are only allowed on active suggestions.';
  end if;

  select * into v_group from public.bandie_song_suggestion_groups where id = v_suggestion.group_id;

  if v_group.status in ('confirmed', 'archived', 'cancelled') then
    raise exception 'Comments are closed for this group.';
  end if;

  if not public.bandie_current_user_is_band_member(v_group.band_id) then
    raise exception 'You must be an approved band member to comment.';
  end if;

  insert into public.bandie_song_suggestion_comments (
    suggestion_id,
    group_id,
    band_id,
    author_user_id,
    body
  )
  values (
    p_suggestion_id,
    v_suggestion.group_id,
    v_group.band_id,
    auth.uid(),
    v_body
  )
  returning id into v_comment_id;

  perform public.bandie_log_song_suggestion_event(
    v_suggestion.group_id,
    v_group.band_id,
    'comment_added',
    jsonb_build_object(
      'suggestion_id', p_suggestion_id,
      'comment_id', v_comment_id
    )
  );

  return v_comment_id;
end;
$$;

grant execute on function public.bandie_add_song_suggestion_comment(uuid, text) to authenticated;
