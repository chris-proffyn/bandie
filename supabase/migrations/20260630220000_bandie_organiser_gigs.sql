-- Gigs are organiser-owned events. Bands are invited via bandie_gig_bands;
-- band leaders accept/reject and assign setlists per invite.

-- ---------------------------------------------------------------------------
-- Schema changes
-- ---------------------------------------------------------------------------

alter table public.bandie_gigs
  add column if not exists organiser_user_id uuid references auth.users (id),
  add column if not exists venue_id uuid references public.bandie_organiser_venues (id) on delete set null;

create table if not exists public.bandie_gig_bands (
  id uuid primary key default gen_random_uuid(),
  gig_id uuid not null references public.bandie_gigs (id) on delete cascade,
  band_id uuid not null references public.bandie_bands (id) on delete cascade,
  invite_status text not null default 'pending'
    check (invite_status in ('pending', 'accepted', 'rejected', 'cancelled')),
  running_order integer,
  setlist_id uuid references public.bandie_setlists (id) on delete set null,
  invited_at timestamptz not null default now(),
  responded_at timestamptz,
  responded_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bandie_gig_bands_unique_band unique (gig_id, band_id),
  constraint bandie_gig_bands_running_order_positive check (running_order is null or running_order > 0)
);

create index if not exists bandie_gig_bands_gig_idx
  on public.bandie_gig_bands (gig_id, running_order nulls last);

create index if not exists bandie_gig_bands_band_idx
  on public.bandie_gig_bands (band_id, invite_status);

-- Migrate legacy single-band gigs into junction rows.
update public.bandie_gigs
set organiser_user_id = created_by
where organiser_user_id is null;

insert into public.bandie_gig_bands (gig_id, band_id, invite_status, setlist_id, invited_at, responded_at, responded_by)
select
  g.id,
  g.band_id,
  'accepted',
  g.setlist_id,
  g.created_at,
  g.created_at,
  g.created_by
from public.bandie_gigs g
where not exists (
  select 1
  from public.bandie_gig_bands gb
  where gb.gig_id = g.id and gb.band_id = g.band_id
);

alter table public.bandie_gigs
  alter column organiser_user_id set not null;

-- Drop legacy band-scoped policies before removing band_id / setlist_id columns.
drop policy if exists "Band members can view gigs" on public.bandie_gigs;
drop policy if exists "Band leaders can insert gigs" on public.bandie_gigs;
drop policy if exists "Band leaders can update gigs" on public.bandie_gigs;
drop policy if exists "Band leaders can delete gigs" on public.bandie_gigs;

alter table public.bandie_gigs
  drop column if exists band_id,
  drop column if exists setlist_id;

drop index if exists public.bandie_gigs_band_starts_idx;
drop index if exists public.bandie_gigs_band_status_idx;

create index if not exists bandie_gigs_organiser_starts_idx
  on public.bandie_gigs (organiser_user_id, starts_at desc);

create index if not exists bandie_gigs_organiser_status_idx
  on public.bandie_gigs (organiser_user_id, status);

drop trigger if exists bandie_gig_bands_set_updated_at on public.bandie_gig_bands;
create trigger bandie_gig_bands_set_updated_at
before update on public.bandie_gig_bands
for each row execute function public.set_updated_at();

comment on table public.bandie_gigs is
  'Performance events owned by an organiser. Bands participate via bandie_gig_bands invites.';

comment on table public.bandie_gig_bands is
  'Band invitations to a gig: accept/reject by band leader; setlist assignment per band.';

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.bandie_current_user_owns_gig(p_gig_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.bandie_gigs g
    where g.id = p_gig_id
      and g.organiser_user_id = auth.uid()
  );
$$;

grant execute on function public.bandie_current_user_owns_gig(uuid) to authenticated;

create or replace function public.bandie_current_user_can_view_gig(p_gig_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.bandie_gigs g
    where g.id = p_gig_id
      and (
        g.organiser_user_id = auth.uid()
        or exists (
          select 1
          from public.bandie_gig_bands gb
          where gb.gig_id = g.id
            and public.bandie_current_user_is_band_member(gb.band_id)
        )
      )
  );
$$;

grant execute on function public.bandie_current_user_can_view_gig(uuid) to authenticated;

create or replace function public.bandie_gig_band_setlist_belongs_to_band(
  p_setlist_id uuid,
  p_band_id uuid
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select p_setlist_id is null
    or exists (
      select 1
      from public.bandie_setlists s
      where s.id = p_setlist_id
        and s.band_id = p_band_id
    );
$$;

grant execute on function public.bandie_gig_band_setlist_belongs_to_band(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- RLS: bandie_gigs
-- ---------------------------------------------------------------------------

alter table public.bandie_gig_bands enable row level security;

drop policy if exists "Organisers and invited bands can view gigs" on public.bandie_gigs;
create policy "Organisers and invited bands can view gigs"
on public.bandie_gigs
for select
to authenticated
using (
  public.platform_current_user_has_app_access('bandie')
  and public.bandie_current_user_can_view_gig(id)
);

drop policy if exists "Organisers can insert gigs" on public.bandie_gigs;
create policy "Organisers can insert gigs"
on public.bandie_gigs
for insert
to authenticated
with check (
  public.platform_current_user_has_app_access('bandie')
  and public.bandie_current_user_is_organiser()
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

drop policy if exists "Organisers can update own gigs" on public.bandie_gigs;
create policy "Organisers can update own gigs"
on public.bandie_gigs
for update
to authenticated
using (
  public.platform_current_user_has_app_access('bandie')
  and organiser_user_id = auth.uid()
)
with check (
  public.platform_current_user_has_app_access('bandie')
  and organiser_user_id = auth.uid()
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

drop policy if exists "Organisers can delete own gigs" on public.bandie_gigs;
create policy "Organisers can delete own gigs"
on public.bandie_gigs
for delete
to authenticated
using (
  public.platform_current_user_has_app_access('bandie')
  and organiser_user_id = auth.uid()
);

drop policy if exists "Bandie app admins can view all gigs" on public.bandie_gigs;
create policy "Bandie app admins can view all gigs"
on public.bandie_gigs
for select
to authenticated
using (public.bandie_current_user_is_app_admin());

drop policy if exists "Bandie app admins can manage all gigs" on public.bandie_gigs;
create policy "Bandie app admins can manage all gigs"
on public.bandie_gigs
for all
to authenticated
using (public.bandie_current_user_is_app_admin())
with check (public.bandie_current_user_is_app_admin());

-- ---------------------------------------------------------------------------
-- RLS: bandie_gig_bands
-- ---------------------------------------------------------------------------

drop policy if exists "Gig viewers can view gig bands" on public.bandie_gig_bands;
create policy "Gig viewers can view gig bands"
on public.bandie_gig_bands
for select
to authenticated
using (
  public.platform_current_user_has_app_access('bandie')
  and public.bandie_current_user_can_view_gig(gig_id)
);

drop policy if exists "Organisers can invite bands to gigs" on public.bandie_gig_bands;
create policy "Organisers can invite bands to gigs"
on public.bandie_gig_bands
for insert
to authenticated
with check (
  public.platform_current_user_has_app_access('bandie')
  and public.bandie_current_user_owns_gig(gig_id)
);

drop policy if exists "Organisers can update gig band invites" on public.bandie_gig_bands;
create policy "Organisers can update gig band invites"
on public.bandie_gig_bands
for update
to authenticated
using (
  public.platform_current_user_has_app_access('bandie')
  and public.bandie_current_user_owns_gig(gig_id)
)
with check (
  public.platform_current_user_has_app_access('bandie')
  and public.bandie_current_user_owns_gig(gig_id)
  and public.bandie_gig_band_setlist_belongs_to_band(setlist_id, band_id)
);

drop policy if exists "Band leaders can respond to gig invites" on public.bandie_gig_bands;

create or replace function public.bandie_respond_gig_invite(
  p_gig_band_id uuid,
  p_accept boolean
)
returns public.bandie_gig_bands
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.bandie_gig_bands;
begin
  if not public.platform_current_user_has_app_access('bandie') then
    raise exception 'App access required';
  end if;

  select * into v_row
  from public.bandie_gig_bands
  where id = p_gig_band_id
  for update;

  if not found then
    raise exception 'Gig invite not found';
  end if;

  if not public.bandie_current_user_owns_band(v_row.band_id) then
    raise exception 'Only band leaders can respond to gig invites';
  end if;

  if v_row.invite_status <> 'pending' then
    raise exception 'This invite has already been responded to';
  end if;

  update public.bandie_gig_bands
  set
    invite_status = case when p_accept then 'accepted' else 'rejected' end,
    responded_at = now(),
    responded_by = auth.uid()
  where id = p_gig_band_id
  returning * into v_row;

  return v_row;
end;
$$;

grant execute on function public.bandie_respond_gig_invite(uuid, boolean) to authenticated;

create or replace function public.bandie_assign_gig_setlist(
  p_gig_band_id uuid,
  p_setlist_id uuid
)
returns public.bandie_gig_bands
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.bandie_gig_bands;
begin
  if not public.platform_current_user_has_app_access('bandie') then
    raise exception 'App access required';
  end if;

  select * into v_row
  from public.bandie_gig_bands
  where id = p_gig_band_id
  for update;

  if not found then
    raise exception 'Gig invite not found';
  end if;

  if not public.bandie_current_user_owns_band(v_row.band_id) then
    raise exception 'Only band leaders can assign a setlist';
  end if;

  if v_row.invite_status <> 'accepted' then
    raise exception 'Setlist can only be assigned after accepting the gig invite';
  end if;

  if not public.bandie_gig_band_setlist_belongs_to_band(p_setlist_id, v_row.band_id) then
    raise exception 'Setlist must belong to this band';
  end if;

  update public.bandie_gig_bands
  set setlist_id = p_setlist_id
  where id = p_gig_band_id
  returning * into v_row;

  return v_row;
end;
$$;

grant execute on function public.bandie_assign_gig_setlist(uuid, uuid) to authenticated;

drop policy if exists "Organisers can remove gig band invites" on public.bandie_gig_bands;
create policy "Organisers can remove gig band invites"
on public.bandie_gig_bands
for delete
to authenticated
using (
  public.platform_current_user_has_app_access('bandie')
  and public.bandie_current_user_owns_gig(gig_id)
);

drop policy if exists "Bandie app admins can manage all gig bands" on public.bandie_gig_bands;
create policy "Bandie app admins can manage all gig bands"
on public.bandie_gig_bands
for all
to authenticated
using (public.bandie_current_user_is_app_admin())
with check (public.bandie_current_user_is_app_admin());

-- ---------------------------------------------------------------------------
-- Entitlements: gigs are organiser-scoped
-- ---------------------------------------------------------------------------

update public.bandie_capabilities
set description = 'Maximum active gigs per organiser'
where key = 'gigs.active_max_count';

insert into public.bandie_plan_entitlements (plan_id, capability_key, value)
select p.id, v.capability_key, v.value::jsonb
from public.bandie_plans p
cross join (
  values
    ('player_free', 'gig.create', 'false'),
    ('player_plus', 'gig.create', 'false'),
    ('player_pro', 'gig.create', 'false'),
    ('player_free', 'gigs.active_max_count', '0'),
    ('player_plus', 'gigs.active_max_count', '0'),
    ('player_pro', 'gigs.active_max_count', '0'),
    ('organiser_free', 'gig.create', 'true'),
    ('organiser_free', 'gigs.active_max_count', '10'),
    ('organiser_plus', 'gig.create', 'true'),
    ('organiser_plus', 'gigs.active_max_count', 'null')
) as v(plan_code, capability_key, value)
where p.code = v.plan_code
on conflict (plan_id, capability_key) do update set
  value = excluded.value,
  updated_at = now();
