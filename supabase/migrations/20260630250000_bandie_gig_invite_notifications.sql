-- Gig invite notifications: link band invites to direct messages for the communications hub.

alter table public.bandie_gig_bands
  add column if not exists notification_message_id uuid references public.bandie_user_messages (id) on delete set null;

create index if not exists bandie_gig_bands_notification_message_idx
  on public.bandie_gig_bands (notification_message_id)
  where notification_message_id is not null;

comment on column public.bandie_gig_bands.notification_message_id is
  'Direct message sent to the band primary contact when the organiser invites the band.';

create or replace function public.bandie_format_gig_invite_message(
  p_gig public.bandie_gigs,
  p_organiser public.bandie_profiles,
  p_organiser_email text,
  p_running_order integer,
  p_slot_duration_minutes integer,
  p_personal_message text
)
returns text
language plpgsql
immutable
as $$
declare
  v_lines text[] := array[]::text[];
  v_when text;
  v_contact text;
begin
  v_when := to_char(p_gig.starts_at at time zone 'UTC', 'FMDD FMMonth YYYY, HH24:MI') || ' UTC';

  v_lines := array_append(v_lines, 'You have been invited to play a gig on Bandie.');
  v_lines := array_append(v_lines, '');
  v_lines := array_append(v_lines, 'Gig: ' || p_gig.title);
  v_lines := array_append(v_lines, 'Date & time: ' || v_when);

  if p_gig.ends_at is not null then
    v_lines := array_append(v_lines, 'Show end: ' || to_char(p_gig.ends_at at time zone 'UTC', 'FMDD FMMonth YYYY, HH24:MI') || ' UTC');
  end if;

  if coalesce(trim(p_gig.venue_name), '') <> '' then
    v_lines := array_append(v_lines, 'Venue: ' || trim(p_gig.venue_name));
  end if;

  if coalesce(trim(p_gig.venue_address), '') <> '' then
    v_lines := array_append(v_lines, 'Address: ' || trim(p_gig.venue_address));
  end if;

  if p_running_order is not null then
    v_lines := array_append(v_lines, 'Proposed slot: ' || p_running_order::text);
  end if;

  if p_slot_duration_minutes is not null then
    v_lines := array_append(v_lines, 'Slot duration: ' || p_slot_duration_minutes::text || ' minutes');
  elsif p_gig.default_slot_duration_minutes is not null then
    v_lines := array_append(v_lines, 'Default slot duration: ' || p_gig.default_slot_duration_minutes::text || ' minutes');
  end if;

  if coalesce(trim(p_gig.fee_notes), '') <> '' then
    v_lines := array_append(v_lines, 'Fee notes: ' || trim(p_gig.fee_notes));
  end if;

  if coalesce(trim(p_gig.notes), '') <> '' then
    v_lines := array_append(v_lines, 'Notes: ' || trim(p_gig.notes));
  end if;

  v_lines := array_append(v_lines, '');
  v_lines := array_append(v_lines, 'Organiser contact');

  v_contact := coalesce(nullif(trim(p_organiser.display_name), ''), 'Organiser');
  v_lines := array_append(v_lines, 'Name: ' || v_contact);

  if coalesce(trim(p_organiser.username), '') <> '' then
    v_lines := array_append(v_lines, 'Username: @' || trim(p_organiser.username));
  end if;

  if coalesce(trim(p_organiser_email), '') <> '' then
    v_lines := array_append(v_lines, 'Email: ' || trim(p_organiser_email));
  end if;

  if coalesce(trim(p_organiser.contact_phone), '') <> '' then
    v_lines := array_append(v_lines, 'Phone: ' || trim(p_organiser.contact_phone));
  end if;

  if coalesce(trim(p_personal_message), '') <> '' then
    v_lines := array_append(v_lines, '');
    v_lines := array_append(v_lines, 'Message from organiser:');
    v_lines := array_append(v_lines, trim(p_personal_message));
  end if;

  v_lines := array_append(v_lines, '');
  v_lines := array_append(v_lines, 'Respond from Gig invites in your band workspace or from Bandie communications.');

  return array_to_string(v_lines, E'\n');
end;
$$;

create or replace function public.bandie_organiser_invite_band_to_gig(
  p_gig_id uuid,
  p_band_id uuid,
  p_running_order integer default null,
  p_slot_duration_minutes integer default null,
  p_personal_message text default null
)
returns public.bandie_gig_bands
language plpgsql
security definer
set search_path = public
as $$
declare
  v_gig public.bandie_gigs;
  v_band public.bandie_bands;
  v_organiser public.bandie_profiles;
  v_email text;
  v_message_body text;
  v_message_id uuid;
  v_row public.bandie_gig_bands;
begin
  if not public.platform_current_user_has_app_access('bandie') then
    raise exception 'Access denied';
  end if;

  select * into v_gig
  from public.bandie_gigs
  where id = p_gig_id;

  if not found or v_gig.organiser_user_id <> auth.uid() then
    raise exception 'Gig not found or access denied';
  end if;

  if v_gig.status = 'confirmed' then
    raise exception 'Cannot invite bands to a confirmed gig. Re-open the gig first.';
  end if;

  select * into v_band
  from public.bandie_bands
  where id = p_band_id
    and public_profile_enabled = true;

  if not found then
    raise exception 'Band not found or profile is not published';
  end if;

  if exists (
    select 1
    from public.bandie_gig_bands gb
    where gb.gig_id = p_gig_id
      and gb.band_id = p_band_id
      and gb.invite_status <> 'cancelled'
  ) then
    raise exception 'This band is already invited to the gig';
  end if;

  select * into v_organiser
  from public.bandie_profiles
  where user_id = auth.uid();

  if not found then
    raise exception 'Organiser profile not found';
  end if;

  select u.email into v_email
  from auth.users u
  where u.id = auth.uid();

  v_message_body := public.bandie_format_gig_invite_message(
    v_gig,
    v_organiser,
    v_email,
    p_running_order,
    p_slot_duration_minutes,
    p_personal_message
  );

  insert into public.bandie_gig_bands (
    gig_id,
    band_id,
    invite_status,
    running_order,
    slot_duration_minutes
  )
  values (
    p_gig_id,
    p_band_id,
    'pending',
    p_running_order,
    p_slot_duration_minutes
  )
  returning * into v_row;

  insert into public.bandie_user_messages (
    sender_user_id,
    recipient_user_id,
    body
  )
  values (
    auth.uid(),
    v_band.owner_user_id,
    v_message_body
  )
  returning id into v_message_id;

  update public.bandie_gig_bands
  set notification_message_id = v_message_id
  where id = v_row.id
  returning * into v_row;

  return v_row;
end;
$$;

grant execute on function public.bandie_organiser_invite_band_to_gig(uuid, uuid, integer, integer, text) to authenticated;

create or replace function public.bandie_list_my_gig_invite_communications()
returns table (
  gig_band_id uuid,
  gig_id uuid,
  band_id uuid,
  band_name text,
  band_slug text,
  gig_title text,
  gig_starts_at timestamptz,
  venue_name text,
  venue_address text,
  invite_status text,
  running_order integer,
  slot_duration_minutes integer,
  sender_user_id uuid,
  recipient_user_id uuid,
  sender_display_name text,
  sender_username text,
  message_id uuid,
  message_body text,
  message_read_at timestamptz,
  invited_at timestamptz,
  direction text
)
language sql
security definer
set search_path = public
stable
as $$
  select
    gb.id as gig_band_id,
    g.id as gig_id,
    b.id as band_id,
    b.name as band_name,
    b.slug as band_slug,
    g.title as gig_title,
    g.starts_at as gig_starts_at,
    g.venue_name,
    g.venue_address,
    gb.invite_status,
    gb.running_order,
    gb.slot_duration_minutes,
    m.sender_user_id,
    m.recipient_user_id,
    sender_profile.display_name as sender_display_name,
    sender_profile.username as sender_username,
    m.id as message_id,
    m.body as message_body,
    m.read_at as message_read_at,
    gb.invited_at,
    case
      when m.recipient_user_id = auth.uid() then 'received'
      else 'sent'
    end as direction
  from public.bandie_gig_bands gb
  join public.bandie_gigs g on g.id = gb.gig_id
  join public.bandie_bands b on b.id = gb.band_id
  join public.bandie_user_messages m on m.id = gb.notification_message_id
  join public.bandie_profiles sender_profile on sender_profile.user_id = m.sender_user_id
  where public.platform_current_user_has_app_access('bandie')
    and gb.notification_message_id is not null
    and (
      m.recipient_user_id = auth.uid()
      or m.sender_user_id = auth.uid()
    )
  order by gb.invited_at desc
  limit 100;
$$;

grant execute on function public.bandie_list_my_gig_invite_communications() to authenticated;

create or replace function public.bandie_count_my_unread_gig_invite_notifications()
returns integer
language sql
security definer
set search_path = public
stable
as $$
  select count(*)::integer
  from public.bandie_gig_bands gb
  join public.bandie_user_messages m on m.id = gb.notification_message_id
  where public.platform_current_user_has_app_access('bandie')
    and m.recipient_user_id = auth.uid()
    and gb.invite_status = 'pending'
    and m.read_at is null;
$$;

grant execute on function public.bandie_count_my_unread_gig_invite_notifications() to authenticated;
