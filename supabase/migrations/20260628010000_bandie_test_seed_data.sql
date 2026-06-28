-- Seed fictitious bands and players for test data mode (test_user = true)

create extension if not exists pgcrypto with schema extensions;

create or replace function public.bandie_ensure_test_auth_user(
  p_user_id uuid,
  p_email text,
  p_display_name text default null
)
returns void
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
begin
  if exists (select 1 from auth.users where id = p_user_id) then
    return;
  end if;

  insert into auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  )
  values (
    '00000000-0000-0000-0000-000000000000',
    p_user_id,
    'authenticated',
    'authenticated',
    p_email,
    extensions.crypt('bandie-test-only-not-for-login', extensions.gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    coalesce(jsonb_build_object('display_name', p_display_name), '{}'::jsonb),
    now(),
    now(),
    '',
    '',
    '',
    ''
  );

  insert into auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  values (
    p_user_id,
    p_user_id,
    jsonb_build_object('sub', p_user_id::text, 'email', p_email),
    'email',
    p_user_id::text,
    now(),
    now(),
    now()
  )
  on conflict do nothing;

  insert into public.platform_user_app_memberships (user_id, app_code, role, status)
  values (p_user_id, 'bandie', 'user', 'active')
  on conflict (user_id, app_code) do nothing;
end;
$$;

do $$
declare
  v_owner_id uuid := '11111111-1111-4111-8111-111111111111';
  v_player_id uuid;
  v_email text;
  v_names text[] := array[
    'Alex Mercer', 'Priya Shah', 'Marcus O''Brien', 'Elena Vasquez', 'Tom Hughes',
    'Nina Kowalski', 'James Whitfield', 'Sofia Alvarez', 'Ryan Chen', 'Amelia Brooks',
    'Daniel Fraser', 'Chloe Nguyen', 'Oliver Pike', 'Grace Morrison', 'Ethan Clarke',
    'Hannah Lewis', 'Noah Patel', 'Isla Campbell', 'Lucas Reid', 'Maya Singh',
    'Ben Carter', 'Ruby Walsh', 'Sam Okonkwo', 'Freya Jensen', 'Jack Morrison',
    'Zara Ahmed', 'Callum Stewart', 'Imogen Hayes', 'Leo Barrett', 'Aisha Khan',
    'Finn Gallagher', 'Tess Robertson', 'Mohammed Ali', 'Ella Murphy', 'Chris Dalton',
    'Laura Quinn', 'Sean Byrne', 'Megan Doyle', 'Adam Hughes', 'Keira O''Neill',
    'Luke Brennan', 'Jasmine Cole', 'Patrick Lowe', 'Siobhan Murray', 'David Park',
    'Rachel Kim', 'Ian McLeod', 'Victoria Shaw', 'Gareth Owen', 'Natasha Reed'
  ];
  v_instruments text[] := array[
    'Drums', 'Vocals', 'Bass', 'Guitar', 'Keys', 'Saxophone', 'Trumpet', 'Violin',
    'Cello', 'Percussion', 'Harmonica', 'Banjo', 'Mandolin', 'Flute', 'Trombone'
  ];
  v_locations text[] := array[
    'London', 'Camden', 'Shoreditch', 'Hackney', 'Islington', 'Brixton', 'Clapham', 'Peckham',
    'Greenwich', 'Wimbledon', 'Stratford', 'Walthamstow', 'Ealing', 'Richmond', 'Kingston upon Thames',
    'Croydon', 'Bromley', 'Enfield', 'Harrow', 'Romford', 'Ilford', 'Watford', 'Uxbridge',
    'Slough', 'Sevenoaks'
  ];
  v_genres text[] := array[
    'Rock', 'Indie', 'Soul', 'Funk', 'Jazz', 'Blues', 'Folk', 'Pop', 'Punk', 'Ska',
    'Disco', 'Country', 'Reggae', 'Metal', 'Acoustic'
  ];
  i integer;
  v_primary text;
  v_location text;
  v_genre_a text;
  v_genre_b text;
  v_years integer;
  v_travel integer;
  v_fee_min integer;
  v_fee_max integer;
  v_open_deputy boolean;
  v_open_member boolean;
begin
  perform public.bandie_ensure_test_auth_user(
    v_owner_id,
    'bandie-test-band-owner@bandie.test',
    'Bandie Test Owner'
  );

  insert into public.bandie_bands (
    id, owner_user_id, name, slug, description, location, travel_distance_miles,
    genres, tagline, public_profile_enabled, fee_guidance_min, fee_guidance_max,
    availability_status, band_size, test_user
  )
  values
    (
      '33333333-3333-4333-8333-000000000001',
      v_owner_id,
      'Velvet Junction',
      'test-velvet-junction',
      'Funk, disco and groove-led party sets with a slick rhythm section and crowd-friendly repertoire.',
      'Hounslow',
      25,
      array['Funk', 'Disco', 'Soul'],
      'West London party band',
      true,
      800,
      1400,
      'available',
      5,
      true
    ),
    (
      '33333333-3333-4333-8333-000000000002',
      v_owner_id,
      'The Rusty Strings',
      'test-rusty-strings',
      'Indie and alt-rock covers with layered guitars and big chorus vocals.',
      'Camden',
      25,
      array['Indie', 'Rock', 'Alternative'],
      'North London indie covers',
      true,
      600,
      1100,
      'available',
      4,
      true
    ),
    (
      '33333333-3333-4333-8333-000000000003',
      v_owner_id,
      'Midnight Signal',
      'test-midnight-signal',
      'Synthwave and 80s electronic sets — neon visuals, sequenced keys and driving bass.',
      'Richmond',
      25,
      array['Synthwave', 'Electronic', '80s'],
      'South West London electronic act',
      true,
      700,
      1200,
      'limited',
      3,
      true
    ),
    (
      '33333333-3333-4333-8333-000000000004',
      v_owner_id,
      'Copper & Coal',
      'test-copper-and-coal',
      'Acoustic folk and Americana with mandolin, fiddle and three-part harmonies.',
      'Kingston upon Thames',
      25,
      array['Folk', 'Americana', 'Acoustic'],
      'South West London folk & Americana',
      true,
      500,
      900,
      'available',
      4,
      true
    ),
    (
      '33333333-3333-4333-8333-000000000005',
      v_owner_id,
      'Neon Parish',
      'test-neon-parish',
      'High-energy 80s pop and new wave covers for festivals and private parties.',
      'Wembley',
      25,
      array['Pop', 'New Wave', '80s'],
      'North West London 80s pop party band',
      true,
      650,
      1150,
      'available',
      5,
      true
    ),
    (
      '33333333-3333-4333-8333-000000000006',
      v_owner_id,
      'Harbor Dogs',
      'test-harbor-dogs',
      'Blues and classic rock with extended jams and soulful vocals.',
      'Greenwich',
      25,
      array['Blues', 'Rock', 'Soul'],
      'South East London blues rock',
      true,
      550,
      950,
      'available',
      4,
      true
    ),
    (
      '33333333-3333-4333-8333-000000000007',
      v_owner_id,
      'Static Bloom',
      'test-static-bloom',
      'Shoegaze and dream-pop — dense textures, drum loops and ethereal vocals.',
      'Hackney',
      25,
      array['Shoegaze', 'Dream Pop', 'Indie'],
      'East London shoegaze outfit',
      true,
      500,
      850,
      'limited',
      4,
      true
    ),
    (
      '33333333-3333-4333-8333-000000000008',
      v_owner_id,
      'Crown & Anchor',
      'test-crown-and-anchor',
      'Pub rock and classic covers built for Friday nights and beer gardens.',
      'Romford',
      25,
      array['Pub Rock', 'Classic Rock', 'Covers'],
      'East London pub rock favourites',
      true,
      450,
      800,
      'available',
      4,
      true
    ),
    (
      '33333333-3333-4333-8333-000000000009',
      v_owner_id,
      'Lunar Motel',
      'test-lunar-motel',
      'Late-night jazz lounge sets — standards, bossa and smooth improvisation.',
      'Covent Garden',
      20,
      array['Jazz', 'Bossa Nova', 'Lounge'],
      'Jazz lounge for upscale events',
      true,
      900,
      1600,
      'available',
      5,
      true
    ),
    (
      '33333333-3333-4333-8333-000000000010',
      v_owner_id,
      'Bricklane Rebels',
      'test-bricklane-rebels',
      'Ska and punk energy with horns, upstroke guitar and singalong choruses.',
      'Shoreditch',
      25,
      array['Ska', 'Punk', 'Reggae'],
      'East London ska punk',
      true,
      600,
      1000,
      'available',
      6,
      true
    )
  on conflict (slug) do update
  set
    name = excluded.name,
    description = excluded.description,
    location = excluded.location,
    travel_distance_miles = excluded.travel_distance_miles,
    genres = excluded.genres,
    tagline = excluded.tagline,
    public_profile_enabled = excluded.public_profile_enabled,
    fee_guidance_min = excluded.fee_guidance_min,
    fee_guidance_max = excluded.fee_guidance_max,
    availability_status = excluded.availability_status,
    band_size = excluded.band_size,
    test_user = true;

  for i in 1..50 loop
    v_player_id := ('22222222-2222-4222-8222-' || lpad(i::text, 12, '0'))::uuid;
    v_email := 'bandie-test-player-' || lpad(i::text, 2, '0') || '@bandie.test';
    v_primary := v_instruments[1 + ((i - 1) % array_length(v_instruments, 1))];
    v_location := v_locations[1 + ((i - 1) % array_length(v_locations, 1))];
    v_genre_a := v_genres[1 + ((i - 1) % array_length(v_genres, 1))];
    v_genre_b := v_genres[1 + (i % array_length(v_genres, 1))];
    v_years := 3 + (i % 18);
    v_travel := 10 + (i % 4) * 5;
    v_fee_min := 75 + (i % 6) * 25;
    v_fee_max := v_fee_min + 100 + (i % 4) * 50;
    v_open_deputy := (i % 3) <> 0;
    v_open_member := (i % 4) <> 0;

    perform public.bandie_ensure_test_auth_user(v_player_id, v_email, v_names[i]);

    insert into public.bandie_profiles (
      user_id,
      display_name,
      preferred_instrument,
      bio,
      location,
      genres,
      instruments,
      years_playing,
      travel_distance_miles,
      deputy_fee_guidance_min,
      deputy_fee_guidance_max,
      open_to_deputy_invites,
      open_to_member_invites,
      public_player_profile_enabled,
      onboarding_complete,
      test_user
    )
    values (
      v_player_id,
      v_names[i],
      v_primary,
      format(
        '%s player based in %s. Experienced with %s and %s gigs across London and the Home Counties.',
        v_primary,
        v_location,
        v_genre_a,
        v_genre_b
      ),
      v_location,
      array[v_genre_a, v_genre_b],
      array[v_primary, case when i % 2 = 0 then 'Backing vocals' else 'Acoustic guitar' end],
      v_years,
      v_travel,
      v_fee_min,
      v_fee_max,
      v_open_deputy,
      v_open_member,
      true,
      true,
      true
    )
    on conflict (user_id) do update
    set
      display_name = excluded.display_name,
      preferred_instrument = excluded.preferred_instrument,
      bio = excluded.bio,
      location = excluded.location,
      genres = excluded.genres,
      instruments = excluded.instruments,
      years_playing = excluded.years_playing,
      travel_distance_miles = excluded.travel_distance_miles,
      deputy_fee_guidance_min = excluded.deputy_fee_guidance_min,
      deputy_fee_guidance_max = excluded.deputy_fee_guidance_max,
      open_to_deputy_invites = excluded.open_to_deputy_invites,
      open_to_member_invites = excluded.open_to_member_invites,
      public_player_profile_enabled = excluded.public_player_profile_enabled,
      onboarding_complete = excluded.onboarding_complete,
      test_user = true;
  end loop;
end;
$$;

drop function if exists public.bandie_ensure_test_auth_user(uuid, text, text);
