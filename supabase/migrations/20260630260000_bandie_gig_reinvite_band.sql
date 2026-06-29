-- Allow re-inviting bands after a cancelled or rejected invite by reactivating the existing row.

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
  v_existing public.bandie_gig_bands;
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

  select * into v_existing
  from public.bandie_gig_bands gb
  where gb.gig_id = p_gig_id
    and gb.band_id = p_band_id;

  if found and v_existing.invite_status in ('pending', 'accepted') then
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

  if found then
    update public.bandie_gig_bands
    set
      invite_status = 'pending',
      running_order = p_running_order,
      slot_duration_minutes = p_slot_duration_minutes,
      setlist_id = null,
      responded_at = null,
      responded_by = null,
      invited_at = now(),
      updated_at = now()
    where id = v_existing.id
    returning * into v_row;
  else
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
  end if;

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
