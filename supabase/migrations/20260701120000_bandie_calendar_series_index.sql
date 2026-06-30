-- Calendar recurring series lookup

create index if not exists bandie_calendar_events_series_key_idx
  on public.bandie_calendar_events (series_key)
  where series_key is not null;
