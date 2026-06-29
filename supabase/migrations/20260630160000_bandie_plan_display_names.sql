-- Rename band-leader paid plan display names (codes unchanged).

update public.bandie_plans
set name = 'Player Plus', updated_at = now()
where code = 'band_standard';

update public.bandie_plans
set name = 'Player Pro', updated_at = now()
where code = 'band_pro';
