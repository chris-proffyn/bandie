import type { EntitlementPlanScope, UserSubscriptionSummary, WorkspaceMode } from '@bandie/data';
import { PLAN_CODES } from '@bandie/data';

export type PlanPillTone = 'free' | 'plus' | 'pro' | 'organiser';

export function workspaceModeToPlanScope(workspaceMode: WorkspaceMode): EntitlementPlanScope {
  return workspaceMode === 'organiser' ? 'organiser' : 'leader';
}

export function defaultPlanCodeForScope(planScope: EntitlementPlanScope): string {
  return planScope === 'organiser' ? PLAN_CODES.ORGANISER_FREE : PLAN_CODES.PLAYER_FREE;
}

export function resolveWorkspacePlanCode(
  subscriptions: UserSubscriptionSummary[],
  workspaceMode: WorkspaceMode,
): string {
  const planScope = workspaceModeToPlanScope(workspaceMode);
  const subscription = subscriptions.find((row) => row.planScope === planScope);
  return subscription?.planCode ?? defaultPlanCodeForScope(planScope);
}

export function formatPlanPillLabel(planCode: string): string {
  switch (planCode) {
    case PLAN_CODES.PLAYER_PLUS:
      return 'Plus';
    case PLAN_CODES.PLAYER_PRO:
      return 'Pro';
    case PLAN_CODES.ORGANISER_PLUS:
      return 'Org+';
    case PLAN_CODES.PLAYER_FREE:
    case PLAN_CODES.ORGANISER_FREE:
    default:
      return 'Free';
  }
}

export function planPillTone(planCode: string): PlanPillTone {
  switch (planCode) {
    case PLAN_CODES.PLAYER_PLUS:
      return 'plus';
    case PLAN_CODES.PLAYER_PRO:
      return 'pro';
    case PLAN_CODES.ORGANISER_PLUS:
      return 'organiser';
    default:
      return 'free';
  }
}

export function resolveWorkspacePlanPill(
  subscriptions: UserSubscriptionSummary[],
  workspaceMode: WorkspaceMode,
): { label: string; tone: PlanPillTone; planCode: string; planName: string | null } {
  const planCode = resolveWorkspacePlanCode(subscriptions, workspaceMode);
  const planScope = workspaceModeToPlanScope(workspaceMode);
  const subscription = subscriptions.find((row) => row.planScope === planScope);

  return {
    label: formatPlanPillLabel(planCode),
    tone: planPillTone(planCode),
    planCode,
    planName: subscription?.planName ?? null,
  };
}
