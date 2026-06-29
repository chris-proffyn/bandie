-- Phase 11: Booking enquiry inbox metadata

create table if not exists public.bandie_booking_enquiries (
  id uuid primary key default gen_random_uuid(),
  band_id uuid not null references public.bandie_bands(id) on delete cascade,
  message_id uuid not null references public.bandie_user_messages(id) on delete cascade,
  sender_user_id uuid not null references auth.users(id) on delete cascade,
  recipient_user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'new'
    check (status in ('new', 'read', 'replied', 'archived')),
  preferred_date date,
  venue_summary text,
  set_duration_minutes integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bandie_booking_enquiries_message_unique unique (message_id)
);

create index if not exists bandie_booking_enquiries_recipient_idx
  on public.bandie_booking_enquiries (recipient_user_id, created_at desc);

create index if not exists bandie_booking_enquiries_sender_idx
  on public.bandie_booking_enquiries (sender_user_id, created_at desc);

create index if not exists bandie_booking_enquiries_band_idx
  on public.bandie_booking_enquiries (band_id, created_at desc);

drop trigger if exists bandie_booking_enquiries_set_updated_at on public.bandie_booking_enquiries;
create trigger bandie_booking_enquiries_set_updated_at
before update on public.bandie_booking_enquiries
for each row execute function public.set_updated_at();

alter table public.bandie_booking_enquiries enable row level security;

drop policy if exists "Booking enquiry participants can view" on public.bandie_booking_enquiries;
create policy "Booking enquiry participants can view"
on public.bandie_booking_enquiries
for select
to authenticated
using (
  public.platform_current_user_has_app_access('bandie')
  and (sender_user_id = auth.uid() or recipient_user_id = auth.uid())
);

drop policy if exists "Senders can create booking enquiries" on public.bandie_booking_enquiries;
create policy "Senders can create booking enquiries"
on public.bandie_booking_enquiries
for insert
to authenticated
with check (
  public.platform_current_user_has_app_access('bandie')
  and sender_user_id = auth.uid()
);

drop policy if exists "Participants can update booking enquiry status" on public.bandie_booking_enquiries;
create policy "Participants can update booking enquiry status"
on public.bandie_booking_enquiries
for update
to authenticated
using (
  public.platform_current_user_has_app_access('bandie')
  and (sender_user_id = auth.uid() or recipient_user_id = auth.uid())
)
with check (
  public.platform_current_user_has_app_access('bandie')
  and (sender_user_id = auth.uid() or recipient_user_id = auth.uid())
);

create or replace function public.bandie_list_my_booking_enquiries()
returns table (
  id uuid,
  band_id uuid,
  band_name text,
  message_id uuid,
  sender_user_id uuid,
  recipient_user_id uuid,
  sender_display_name text,
  sender_username text,
  status text,
  preferred_date date,
  venue_summary text,
  set_duration_minutes integer,
  message_body text,
  message_read_at timestamptz,
  created_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select
    e.id,
    e.band_id,
    b.name as band_name,
    e.message_id,
    e.sender_user_id,
    e.recipient_user_id,
    sp.display_name as sender_display_name,
    sp.username as sender_username,
    e.status,
    e.preferred_date,
    e.venue_summary,
    e.set_duration_minutes,
    m.body as message_body,
    m.read_at as message_read_at,
    e.created_at
  from public.bandie_booking_enquiries e
  join public.bandie_user_messages m on m.id = e.message_id
  join public.bandie_bands b on b.id = e.band_id
  left join public.bandie_profiles sp on sp.user_id = e.sender_user_id
  where e.recipient_user_id = auth.uid()
     or e.sender_user_id = auth.uid()
  order by e.created_at desc;
$$;

grant execute on function public.bandie_list_my_booking_enquiries() to authenticated;

create or replace function public.bandie_count_booking_enquiries_sent_this_month(p_user_id uuid)
returns integer
language sql
security definer
set search_path = public
stable
as $$
  select count(*)::integer
  from public.bandie_booking_enquiries
  where sender_user_id = p_user_id
    and created_at >= date_trunc('month', now());
$$;

grant execute on function public.bandie_count_booking_enquiries_sent_this_month(uuid) to authenticated;
