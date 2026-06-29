export type EntitlementPlanScope = 'leader' | 'organiser';

export type EntitlementSubjectType = 'user' | 'band';

export type GateReasonCode =
  | 'feature_locked'
  | 'limit_reached'
  | 'plan_missing'
  | 'not_authenticated';

export type GateDecision = {
  allowed: boolean;
  reasonCode?: GateReasonCode;
  message?: string;
  currentPlan?: string;
  currentPlanName?: string;
  requiredPlan?: string;
  requiredPlanName?: string;
  usage?: number;
  limit?: number | null;
  capability?: string;
  upgradeUrl?: string;
  entitlementValue?: boolean | number | string | null;
};

export type EntitlementCheckInput = {
  capability: string;
  subjectType: EntitlementSubjectType;
  subjectId: string;
  bandId?: string;
  requestedAmount?: number;
  planScope?: EntitlementPlanScope;
};

export type UsageMeterEntry = {
  meterKey: string;
  label: string;
  current: number;
  limit: number | null;
  status: 'ok' | 'limit_reached' | 'unlimited';
};

export type UsageSummary = {
  planCode: string;
  planName: string;
  planScope: EntitlementPlanScope;
  usage: UsageMeterEntry[];
};

export const PLAN_CODES = {
  PLAYER_FREE: 'player_free',
  PLAYER_PLUS: 'player_plus',
  PLAYER_PRO: 'player_pro',
  ORGANISER_FREE: 'organiser_free',
  ORGANISER_PLUS: 'organiser_plus',
} as const;

export type PlanCode = (typeof PLAN_CODES)[keyof typeof PLAN_CODES];

export const PLAN_DISPLAY_NAMES: Record<PlanCode, string> = {
  player_free: 'Player Free',
  player_plus: 'Player Plus',
  player_pro: 'Player Pro',
  organiser_free: 'Organiser Free',
  organiser_plus: 'Organiser Plus',
};

export const UPGRADE_URL = '/app/profile';
