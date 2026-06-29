-- Band-level song part templates + folder delete policy

create table if not exists public.bandie_band_song_part_templates (
  id uuid primary key default gen_random_uuid(),
  band_id uuid not null references public.bandie_bands(id) on delete cascade,
  part_key text not null,
  part_label text not null,
  sort_order integer not null default 0,
  required_for_readiness boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bandie_band_song_part_templates_band_part_unique unique (band_id, part_key),
  constraint bandie_band_song_part_templates_label_check check (char_length(trim(part_label)) > 0)
);

create index if not exists bandie_band_song_part_templates_band_id_idx
  on public.bandie_band_song_part_templates (band_id, sort_order);

drop trigger if exists bandie_band_song_part_templates_set_updated_at
  on public.bandie_band_song_part_templates;
create trigger bandie_band_song_part_templates_set_updated_at
before update on public.bandie_band_song_part_templates
for each row execute function public.set_updated_at();

alter table public.bandie_band_song_part_templates enable row level security;

drop policy if exists "Band members can view song part templates" on public.bandie_band_song_part_templates;
create policy "Band members can view song part templates"
on public.bandie_band_song_part_templates
for select
to authenticated
using (
  public.platform_current_user_has_app_access('bandie')
  and public.bandie_current_user_is_band_member(band_id)
);

drop policy if exists "Band leaders can insert song part templates" on public.bandie_band_song_part_templates;
create policy "Band leaders can insert song part templates"
on public.bandie_band_song_part_templates
for insert
to authenticated
with check (
  public.platform_current_user_has_app_access('bandie')
  and public.bandie_current_user_owns_band(band_id)
);

drop policy if exists "Band leaders can update song part templates" on public.bandie_band_song_part_templates;
create policy "Band leaders can update song part templates"
on public.bandie_band_song_part_templates
for update
to authenticated
using (
  public.platform_current_user_has_app_access('bandie')
  and public.bandie_current_user_owns_band(band_id)
)
with check (
  public.platform_current_user_has_app_access('bandie')
  and public.bandie_current_user_owns_band(band_id)
);

drop policy if exists "Band leaders can delete song part templates" on public.bandie_band_song_part_templates;
create policy "Band leaders can delete song part templates"
on public.bandie_band_song_part_templates
for delete
to authenticated
using (
  public.platform_current_user_has_app_access('bandie')
  and public.bandie_current_user_owns_band(band_id)
);

drop policy if exists "Band members can delete song part folders" on public.bandie_song_part_folders;
create policy "Band members can delete song part folders"
on public.bandie_song_part_folders
for delete
to authenticated
using (
  public.platform_current_user_has_app_access('bandie')
  and public.bandie_current_user_is_band_member(band_id)
);
