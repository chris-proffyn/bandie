-- Align bandie_plans.code with bandie_plans.name (snake_case of display name).
-- band_standard → player_plus, band_pro → player_pro

update public.bandie_plans
set code = 'player_plus', updated_at = now()
where code = 'band_standard';

update public.bandie_plans
set code = 'player_pro', updated_at = now()
where code = 'band_pro';

-- Historical references stored as plan codes (not FKs)
update public.bandie_gate_decision_logs
set current_plan_code = 'player_plus'
where current_plan_code = 'band_standard';

update public.bandie_gate_decision_logs
set current_plan_code = 'player_pro'
where current_plan_code = 'band_pro';

update public.bandie_gate_decision_logs
set required_plan_code = 'player_plus'
where required_plan_code = 'band_standard';

update public.bandie_gate_decision_logs
set required_plan_code = 'player_pro'
where required_plan_code = 'band_pro';

update public.bandie_daily_metric_snapshots
set segment_key = 'player_plus'
where segment_type = 'plan' and segment_key = 'band_standard';

update public.bandie_daily_metric_snapshots
set segment_key = 'player_pro'
where segment_type = 'plan' and segment_key = 'band_pro';
