create table public.early_access_requests (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text,
  interest_type text not null,
  organisation_name text not null,
  event_type text,
  location text,
  website_url text,
  message text,
  consent_contact boolean not null default false,
  consent_contact_at timestamptz,
  status text not null default 'new',
  source text not null default 'landing_page',
  page_url text,
  referrer_url text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  user_agent text,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.early_access_requests
add constraint early_access_interest_type_check
check (interest_type in ('organiser', 'vendor', 'both', 'other'));

alter table public.early_access_requests
add constraint early_access_event_type_check
check (event_type is null or event_type in ('car_boot_sale', 'farmers_market', 'craft_fair', 'food_market', 'community_event', 'charity_event', 'school_event', 'sports_event', 'other'));

alter table public.early_access_requests
add constraint early_access_status_check
check (status in ('new', 'reviewed', 'contacted', 'accepted', 'rejected', 'duplicate'));

create index early_access_requests_email_idx on public.early_access_requests (lower(email));
create index early_access_requests_status_idx on public.early_access_requests (status);
create index early_access_requests_interest_type_idx on public.early_access_requests (interest_type);
create index early_access_requests_submitted_at_idx on public.early_access_requests (submitted_at desc);

alter table public.early_access_requests enable row level security;

create or replace function public.set_early_access_requests_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger early_access_requests_updated_at
before update on public.early_access_requests
for each row execute function public.set_early_access_requests_updated_at();;
