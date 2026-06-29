-- Allow organiser gig create when the user owns the row (organiser_user_id),
-- without requiring bandie_current_user_is_organiser() — keeps in sync with users
-- who have organiser workspace access via profile role flags.

drop policy if exists "Organisers can insert gigs" on public.bandie_gigs;

create policy "Organisers can insert gigs"
on public.bandie_gigs
for insert
to authenticated
with check (
  public.platform_current_user_has_app_access('bandie')
  and organiser_user_id = auth.uid()
  and created_by = auth.uid()
  and (
    venue_id is null
    or exists (
      select 1
      from public.bandie_organiser_venues v
      where v.id = venue_id
        and v.owner_user_id = auth.uid()
    )
  )
);

drop policy if exists "Organisers can view own gigs" on public.bandie_gigs;

create policy "Organisers can view own gigs"
on public.bandie_gigs
for select
to authenticated
using (
  public.platform_current_user_has_app_access('bandie')
  and organiser_user_id = auth.uid()
);

-- Same ownership model for inline venue create from gig flows.
drop policy if exists "Organisers can insert own venues" on public.bandie_organiser_venues;

create policy "Organisers can insert own venues"
on public.bandie_organiser_venues
for insert
to authenticated
with check (
  public.platform_current_user_has_app_access('bandie')
  and owner_user_id = auth.uid()
);
