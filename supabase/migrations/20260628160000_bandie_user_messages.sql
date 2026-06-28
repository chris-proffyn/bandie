-- Direct messages between Bandie users (workspace notifications / communications).

create table if not exists public.bandie_user_messages (
  id uuid primary key default gen_random_uuid(),
  sender_user_id uuid not null references auth.users(id) on delete cascade,
  recipient_user_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now(),

  constraint bandie_user_messages_body_not_empty
    check (char_length(trim(body)) > 0),
  constraint bandie_user_messages_not_self
    check (sender_user_id <> recipient_user_id)
);

create index if not exists bandie_user_messages_recipient_created_idx
  on public.bandie_user_messages (recipient_user_id, created_at desc);

create index if not exists bandie_user_messages_sender_created_idx
  on public.bandie_user_messages (sender_user_id, created_at desc);

alter table public.bandie_user_messages enable row level security;

drop policy if exists "Users can view own messages" on public.bandie_user_messages;
create policy "Users can view own messages"
on public.bandie_user_messages
for select
to authenticated
using (
  public.platform_current_user_has_app_access('bandie')
  and (sender_user_id = auth.uid() or recipient_user_id = auth.uid())
);

drop policy if exists "Users can send messages" on public.bandie_user_messages;
create policy "Users can send messages"
on public.bandie_user_messages
for insert
to authenticated
with check (
  public.platform_current_user_has_app_access('bandie')
  and sender_user_id = auth.uid()
  and recipient_user_id <> auth.uid()
);

drop policy if exists "Recipients can mark messages read" on public.bandie_user_messages;
create policy "Recipients can mark messages read"
on public.bandie_user_messages
for update
to authenticated
using (
  public.platform_current_user_has_app_access('bandie')
  and recipient_user_id = auth.uid()
)
with check (
  public.platform_current_user_has_app_access('bandie')
  and recipient_user_id = auth.uid()
);

create or replace function public.bandie_list_my_messages()
returns table (
  id uuid,
  sender_user_id uuid,
  recipient_user_id uuid,
  sender_display_name text,
  sender_username text,
  recipient_display_name text,
  recipient_username text,
  body text,
  read_at timestamptz,
  created_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select
    m.id,
    m.sender_user_id,
    m.recipient_user_id,
    sender_profile.display_name as sender_display_name,
    sender_profile.username as sender_username,
    recipient_profile.display_name as recipient_display_name,
    recipient_profile.username as recipient_username,
    m.body,
    m.read_at,
    m.created_at
  from public.bandie_user_messages m
  join public.bandie_profiles sender_profile
    on sender_profile.user_id = m.sender_user_id
  join public.bandie_profiles recipient_profile
    on recipient_profile.user_id = m.recipient_user_id
  where public.platform_current_user_has_app_access('bandie')
    and (m.sender_user_id = auth.uid() or m.recipient_user_id = auth.uid())
  order by m.created_at desc
  limit 100;
$$;

grant execute on function public.bandie_list_my_messages() to authenticated;

create or replace function public.bandie_count_my_unread_messages()
returns integer
language sql
security definer
set search_path = public
stable
as $$
  select count(*)::integer
  from public.bandie_user_messages m
  where public.platform_current_user_has_app_access('bandie')
    and m.recipient_user_id = auth.uid()
    and m.read_at is null;
$$;

grant execute on function public.bandie_count_my_unread_messages() to authenticated;
