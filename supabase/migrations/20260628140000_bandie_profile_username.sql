-- Player profile usernames + login resolution by username or email

alter table public.bandie_profiles
  add column if not exists username text;

comment on column public.bandie_profiles.username is
  'Unique login handle (lowercase letters and numbers). Defaults from display name as lastname + first initial.';

alter table public.bandie_profiles
  drop constraint if exists bandie_profiles_username_format_check;

alter table public.bandie_profiles
  add constraint bandie_profiles_username_format_check
  check (username is null or username ~ '^[a-z0-9]{3,30}$');

drop index if exists bandie_profiles_username_lower_idx;

create unique index bandie_profiles_username_lower_idx
  on public.bandie_profiles (lower(username))
  where username is not null;

create or replace function public.bandie_propose_username(p_display_name text)
returns text
language plpgsql
immutable
as $$
declare
  v_parts text[];
  v_first text;
  v_last text;
  v_last_norm text;
  v_initial text;
  v_candidate text;
begin
  v_parts := regexp_split_to_array(trim(coalesce(p_display_name, '')), '\s+');

  if coalesce(array_length(v_parts, 1), 0) = 0 or v_parts[1] = '' then
    return '';
  end if;

  if array_length(v_parts, 1) = 1 then
    return left(regexp_replace(lower(v_parts[1]), '[^a-z0-9]', '', 'g'), 30);
  end if;

  v_first := v_parts[1];
  v_last := v_parts[array_length(v_parts, 1)];
  v_last_norm := regexp_replace(lower(v_last), '[^a-z0-9]', '', 'g');
  v_initial := left(regexp_replace(lower(v_first), '[^a-z0-9]', '', 'g'), 1);

  if v_last_norm = '' then
    v_last_norm := regexp_replace(lower(v_first), '[^a-z0-9]', '', 'g');
    v_initial := '';
  end if;

  v_candidate := left(v_last_norm || coalesce(v_initial, ''), 30);

  if char_length(v_candidate) < 3 then
    v_candidate := left(regexp_replace(lower(array_to_string(v_parts, '')), '[^a-z0-9]', '', 'g'), 30);
  end if;

  if char_length(v_candidate) < 3 then
    v_candidate := 'player';
  end if;

  return v_candidate;
end;
$$;

create or replace function public.bandie_allocate_username(
  p_display_name text,
  p_exclude_user_id uuid default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_base text := public.bandie_propose_username(p_display_name);
  v_candidate text;
  v_suffix integer := 0;
begin
  if v_base = '' then
    v_base := 'player';
  end if;

  loop
    v_candidate := case
      when v_suffix = 0 then v_base
      else left(v_base, greatest(1, 30 - char_length(v_suffix::text))) || v_suffix::text
    end;

    exit when not exists (
      select 1
      from public.bandie_profiles p
      where lower(p.username) = lower(v_candidate)
        and (p_exclude_user_id is null or p.user_id <> p_exclude_user_id)
    );

    v_suffix := v_suffix + 1;
    exit when v_suffix > 999;
  end loop;

  return v_candidate;
end;
$$;

create or replace function public.bandie_ensure_profile_username(p_user_id uuid default auth.uid())
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.bandie_profiles%rowtype;
  v_username text;
begin
  if p_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_profile
  from public.bandie_profiles
  where user_id = p_user_id;

  if not found then
    return null;
  end if;

  if v_profile.username is not null and trim(v_profile.username) <> '' then
    return v_profile.username;
  end if;

  v_username := public.bandie_allocate_username(v_profile.display_name, p_user_id);

  update public.bandie_profiles
  set username = v_username
  where user_id = p_user_id;

  return v_username;
end;
$$;

create or replace function public.bandie_resolve_login_email(p_identifier text)
returns text
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_raw text := trim(coalesce(p_identifier, ''));
  v_identifier text := lower(v_raw);
  v_email text;
begin
  if v_raw = '' then
    return null;
  end if;

  if position('@' in v_raw) > 0 then
    return v_raw;
  end if;

  select u.email into v_email
  from public.bandie_profiles p
  join auth.users u on u.id = p.user_id
  where lower(p.username) = v_identifier
  limit 1;

  return v_email;
end;
$$;

create or replace function public.bandie_profiles_set_default_username()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.username is null or trim(new.username) = '' then
    new.username := public.bandie_allocate_username(new.display_name, new.user_id);
  else
    new.username := lower(trim(new.username));
  end if;

  return new;
end;
$$;

drop trigger if exists bandie_profiles_set_default_username on public.bandie_profiles;

create trigger bandie_profiles_set_default_username
before insert on public.bandie_profiles
for each row
execute function public.bandie_profiles_set_default_username();

grant execute on function public.bandie_propose_username(text) to authenticated;
grant execute on function public.bandie_allocate_username(text, uuid) to authenticated;
grant execute on function public.bandie_ensure_profile_username(uuid) to authenticated;
grant execute on function public.bandie_resolve_login_email(text) to anon, authenticated;

do $$
declare
  r record;
begin
  for r in
    select user_id, display_name
    from public.bandie_profiles
    where username is null or trim(username) = ''
    order by user_id
  loop
    update public.bandie_profiles
    set username = public.bandie_allocate_username(r.display_name, r.user_id)
    where user_id = r.user_id;
  end loop;
end;
$$;
