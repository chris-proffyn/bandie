-- Geography reference data for directory area filters (countries + regions).

create table if not exists public.bandie_countries (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  name text not null,
  sort_order integer not null default 0,
  constraint bandie_countries_code_key unique (code)
);

create table if not exists public.bandie_regions (
  id uuid primary key default gen_random_uuid(),
  country_id uuid not null references public.bandie_countries (id) on delete cascade,
  code text not null,
  name text not null,
  search_keywords text[] not null default '{}',
  sort_order integer not null default 0,
  constraint bandie_regions_country_code_key unique (country_id, code)
);

create index if not exists bandie_regions_country_id_idx on public.bandie_regions (country_id);

alter table public.bandie_bands
  add column if not exists country_id uuid references public.bandie_countries (id) on delete set null,
  add column if not exists region_id uuid references public.bandie_regions (id) on delete set null;

alter table public.bandie_profiles
  add column if not exists country_id uuid references public.bandie_countries (id) on delete set null,
  add column if not exists region_id uuid references public.bandie_regions (id) on delete set null;

create index if not exists bandie_bands_country_id_idx on public.bandie_bands (country_id);
create index if not exists bandie_bands_region_id_idx on public.bandie_bands (region_id);
create index if not exists bandie_profiles_country_id_idx on public.bandie_profiles (country_id);
create index if not exists bandie_profiles_region_id_idx on public.bandie_profiles (region_id);

insert into public.bandie_countries (code, name, sort_order)
values
  ('GB', 'United Kingdom', 10),
  ('IE', 'Ireland', 20),
  ('US', 'United States', 30),
  ('AU', 'Australia', 40)
on conflict (code) do update
set
  name = excluded.name,
  sort_order = excluded.sort_order;

insert into public.bandie_regions (country_id, code, name, search_keywords, sort_order)
select
  c.id,
  v.code,
  v.name,
  v.search_keywords,
  v.sort_order
from public.bandie_countries c
cross join (
  values
    (
      'south-west',
      'South West',
      array[
        'south west', 'southwest', 'bristol', 'bath', 'plymouth', 'exeter', 'cornwall', 'devon',
        'somerset', 'dorset', 'gloucester', 'cheltenham', 'salisbury', 'taunton', 'truro', 'torbay'
      ],
      10
    ),
    (
      'south-east',
      'South East',
      array[
        'south east', 'southeast', 'surrey', 'sussex', 'kent', 'hampshire', 'brighton', 'hove',
        'portsmouth', 'southampton', 'reading', 'oxford', 'winchester', 'canterbury', 'guildford',
        'bournemouth', 'chichester', 'eastbourne', 'hastings', 'sevenoaks', 'tonbridge'
      ],
      20
    ),
    (
      'greater-london',
      'Greater London',
      array[
        'london', 'camden', 'shoreditch', 'hackney', 'islington', 'brixton', 'clapham', 'peckham',
        'greenwich', 'wimbledon', 'stratford', 'walthamstow', 'ealing', 'richmond', 'kingston',
        'croydon', 'bromley', 'enfield', 'harrow', 'romford', 'ilford', 'watford', 'uxbridge',
        'slough', 'hounslow', 'wembley', 'covent garden', 'westminster', 'chelsea', 'fulham',
        'tottenham', 'barnet', 'lewisham', 'southwark', 'tower hamlets', 'newham', 'redbridge'
      ],
      30
    ),
    (
      'midlands',
      'Midlands',
      array[
        'midlands', 'west midlands', 'east midlands', 'birmingham', 'coventry', 'leicester',
        'nottingham', 'derby', 'wolverhampton', 'stoke', 'worcester', 'northampton', 'lincoln',
        'stafford', 'shrewsbury', 'telford', 'solihull', 'dudley', 'walsall'
      ],
      40
    ),
    (
      'cambridge-east',
      'Cambridge and the East',
      array[
        'cambridge', 'east anglia', 'norfolk', 'suffolk', 'peterborough', 'norwich', 'ipswich',
        'colchester', 'ely', 'huntingdon', 'bedford', 'luton', 'st albans', 'stevenage'
      ],
      50
    ),
    (
      'essex',
      'Essex',
      array[
        'essex', 'chelmsford', 'basildon', 'southend', 'harlow', 'brentwood', 'maldon', 'braintree',
        'witham', 'clacton', 'harwich', 'rayleigh', 'wickford'
      ],
      60
    ),
    (
      'lancashire',
      'Lancashire',
      array[
        'lancashire', 'manchester', 'liverpool', 'preston', 'blackpool', 'bolton', 'wigan',
        'burnley', 'blackburn', 'lancaster', 'chester', 'warrington', 'stockport', 'oldham',
        'rochdale', 'salford', 'merseyside', 'greater manchester'
      ],
      70
    ),
    (
      'yorkshire',
      'Yorkshire',
      array[
        'yorkshire', 'leeds', 'sheffield', 'york', 'bradford', 'hull', 'doncaster', 'rotherham',
        'huddersfield', 'halifax', 'harrogate', 'scarborough', 'barnsley', 'wakefield', 'whitby'
      ],
      80
    ),
    (
      'cumbria',
      'Cumbria',
      array[
        'cumbria', 'carlisle', 'kendal', 'barrow', 'workington', 'whitehaven', 'penrith',
        'lake district', 'windermere', 'keswick', 'ambleside'
      ],
      90
    ),
    (
      'northumberland',
      'Northumberland',
      array[
        'northumberland', 'newcastle', 'sunderland', 'durham', 'middlesbrough', 'darlington',
        'hexham', 'alnwick', 'berwick', 'gateshead', 'tyne', 'wearside', 'teesside'
      ],
      100
    )
) as v(code, name, search_keywords, sort_order)
where c.code = 'GB'
on conflict (country_id, code) do update
set
  name = excluded.name,
  search_keywords = excluded.search_keywords,
  sort_order = excluded.sort_order;

-- Assign UK + Greater London to seeded test listings (London-area locations).
update public.bandie_bands b
set
  country_id = (select id from public.bandie_countries where code = 'GB'),
  region_id = (select id from public.bandie_regions where code = 'greater-london')
where b.test_user = true;

update public.bandie_profiles p
set
  country_id = (select id from public.bandie_countries where code = 'GB'),
  region_id = (select id from public.bandie_regions where code = 'greater-london')
where p.test_user = true;

alter table public.bandie_countries enable row level security;
alter table public.bandie_regions enable row level security;

drop policy if exists bandie_countries_public_read on public.bandie_countries;
create policy bandie_countries_public_read
  on public.bandie_countries
  for select
  to anon, authenticated
  using (true);

drop policy if exists bandie_regions_public_read on public.bandie_regions;
create policy bandie_regions_public_read
  on public.bandie_regions
  for select
  to anon, authenticated
  using (true);

grant select on public.bandie_countries to anon, authenticated;
grant select on public.bandie_regions to anon, authenticated;
