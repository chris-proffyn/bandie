-- Home city travel radius for band profiles and directory

alter table public.bandie_bands
  add column if not exists travel_distance_miles integer;

alter table public.bandie_bands
  drop constraint if exists bandie_bands_travel_distance_miles_check;

alter table public.bandie_bands
  add constraint bandie_bands_travel_distance_miles_check
  check (travel_distance_miles is null or travel_distance_miles >= 0);
