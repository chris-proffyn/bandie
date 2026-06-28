-- Relocate seeded test bands and players to London and surrounding area (within ~25 miles)

update public.bandie_bands
set
  location = case slug
    when 'test-velvet-junction' then 'Hounslow'
    when 'test-rusty-strings' then 'Camden'
    when 'test-midnight-signal' then 'Richmond'
    when 'test-copper-and-coal' then 'Kingston upon Thames'
    when 'test-neon-parish' then 'Wembley'
    when 'test-harbor-dogs' then 'Greenwich'
    when 'test-static-bloom' then 'Hackney'
    when 'test-crown-and-anchor' then 'Romford'
    when 'test-lunar-motel' then 'Covent Garden'
    when 'test-bricklane-rebels' then 'Shoreditch'
    else location
  end,
  tagline = case slug
    when 'test-rusty-strings' then 'North London indie covers'
    when 'test-midnight-signal' then 'South West London electronic act'
    when 'test-copper-and-coal' then 'South West London folk & Americana'
    when 'test-neon-parish' then 'North West London 80s pop party band'
    when 'test-harbor-dogs' then 'South East London blues rock'
    when 'test-static-bloom' then 'East London shoegaze outfit'
    when 'test-crown-and-anchor' then 'East London pub rock favourites'
    else tagline
  end,
  travel_distance_miles = least(travel_distance_miles, 25)
where test_user = true;

do $$
declare
  v_locations text[] := array[
    'London', 'Camden', 'Shoreditch', 'Hackney', 'Islington', 'Brixton', 'Clapham', 'Peckham',
    'Greenwich', 'Wimbledon', 'Stratford', 'Walthamstow', 'Ealing', 'Richmond', 'Kingston upon Thames',
    'Croydon', 'Bromley', 'Enfield', 'Harrow', 'Romford', 'Ilford', 'Watford', 'Uxbridge',
    'Slough', 'Sevenoaks'
  ];
  v_instruments text[] := array[
    'Drums', 'Vocals', 'Bass', 'Guitar', 'Keys', 'Saxophone', 'Trumpet', 'Violin',
    'Cello', 'Percussion', 'Harmonica', 'Banjo', 'Mandolin', 'Flute', 'Trombone'
  ];
  v_genres text[] := array[
    'Rock', 'Indie', 'Soul', 'Funk', 'Jazz', 'Blues', 'Folk', 'Pop', 'Punk', 'Ska',
    'Disco', 'Country', 'Reggae', 'Metal', 'Acoustic'
  ];
  r record;
  i integer := 0;
  v_location text;
  v_primary text;
  v_genre_a text;
  v_genre_b text;
begin
  for r in
    select user_id, preferred_instrument
    from public.bandie_profiles
    where test_user = true
    order by user_id
  loop
    i := i + 1;
    v_location := v_locations[1 + ((i - 1) % array_length(v_locations, 1))];
    v_primary := coalesce(r.preferred_instrument, v_instruments[1 + ((i - 1) % array_length(v_instruments, 1))]);
    v_genre_a := v_genres[1 + ((i - 1) % array_length(v_genres, 1))];
    v_genre_b := v_genres[1 + (i % array_length(v_genres, 1))];

    update public.bandie_profiles
    set
      location = v_location,
      travel_distance_miles = least(travel_distance_miles, 10 + ((i - 1) % 4) * 5),
      bio = format(
        '%s player based in %s. Experienced with %s and %s gigs across London and the Home Counties.',
        v_primary,
        v_location,
        v_genre_a,
        v_genre_b
      )
    where user_id = r.user_id;
  end loop;
end;
$$;
