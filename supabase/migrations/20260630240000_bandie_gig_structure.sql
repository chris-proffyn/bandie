-- Gig planning structure: slots, durations, and per-band slot overrides.

alter table public.bandie_gigs
  add column if not exists slot_count integer,
  add column if not exists default_slot_duration_minutes integer;

alter table public.bandie_gig_bands
  add column if not exists slot_duration_minutes integer;

alter table public.bandie_gigs
  drop constraint if exists bandie_gigs_slot_count_positive;

alter table public.bandie_gigs
  add constraint bandie_gigs_slot_count_positive
  check (slot_count is null or slot_count > 0);

alter table public.bandie_gigs
  drop constraint if exists bandie_gigs_default_slot_duration_positive;

alter table public.bandie_gigs
  add constraint bandie_gigs_default_slot_duration_positive
  check (default_slot_duration_minutes is null or default_slot_duration_minutes > 0);

alter table public.bandie_gig_bands
  drop constraint if exists bandie_gig_bands_slot_duration_positive;

alter table public.bandie_gig_bands
  add constraint bandie_gig_bands_slot_duration_positive
  check (slot_duration_minutes is null or slot_duration_minutes > 0);

comment on column public.bandie_gigs.slot_count is
  'Number of performance slots on the running order.';

comment on column public.bandie_gigs.default_slot_duration_minutes is
  'Default set length in minutes for each slot unless overridden per band.';

comment on column public.bandie_gig_bands.running_order is
  'Slot position (1-based) on the gig running order.';

comment on column public.bandie_gig_bands.slot_duration_minutes is
  'Optional override of default slot duration for this band.';
