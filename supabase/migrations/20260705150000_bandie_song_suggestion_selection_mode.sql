-- Song suggestion groups: Best vs Inclusive selection mode

alter table public.bandie_song_suggestion_groups
  add column if not exists selection_mode text not null default 'best'
    check (selection_mode in ('best', 'inclusive'));

comment on column public.bandie_song_suggestion_groups.selection_mode is
  'best = top N by score; inclusive = when target >= band size, each member who suggested gets their highest-scoring song, then fill by score.';
