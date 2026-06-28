-- Assign all bands and player profiles to England (United Kingdom) / Greater London.

update public.bandie_bands
set
  country_id = (
    select id from public.bandie_countries where code = 'GB'
  ),
  region_id = (
    select r.id
    from public.bandie_regions r
    inner join public.bandie_countries c on c.id = r.country_id
    where c.code = 'GB'
      and r.code = 'greater-london'
  )
where true;

update public.bandie_profiles
set
  country_id = (
    select id from public.bandie_countries where code = 'GB'
  ),
  region_id = (
    select r.id
    from public.bandie_regions r
    inner join public.bandie_countries c on c.id = r.country_id
    where c.code = 'GB'
      and r.code = 'greater-london'
  )
where true;
