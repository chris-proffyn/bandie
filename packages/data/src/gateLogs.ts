import { getBandieClient } from './context';
import { getCurrentSession } from './auth';
import type { GateDecision } from './entitlementTypes';
import { isEntitlementEnforcementEnabled } from './entitlementEnforcement';

export async function logGateDecision(
  input: {
    subjectType: string;
    subjectId: string;
    capability: string;
  },
  decision: GateDecision,
): Promise<void> {
  if (!isEntitlementEnforcementEnabled() || decision.allowed) {
    return;
  }

  const session = await getCurrentSession();
  const client = getBandieClient();

  const { error } = await client.from('bandie_gate_decision_logs').insert({
    actor_id: session?.user?.id ?? null,
    subject_type: input.subjectType,
    subject_id: input.subjectId,
    capability_key: input.capability,
    allowed: decision.allowed,
    reason_code: decision.reasonCode ?? null,
    current_plan_code: decision.currentPlan ?? null,
    required_plan_code: decision.requiredPlan ?? null,
    usage_value: decision.usage ?? null,
    limit_value: decision.limit ?? null,
    metadata: {
      message: decision.message ?? null,
    },
  });

  if (error) {
    console.warn('Failed to log gate decision', error.message);
  }
}

export type GateDecisionLog = {
  id: string;
  actor_id: string | null;
  subject_type: string;
  subject_id: string;
  capability_key: string;
  allowed: boolean;
  reason_code: string | null;
  current_plan_code: string | null;
  required_plan_code: string | null;
  usage_value: number | null;
  limit_value: number | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export async function listGateDecisionLogs(limit = 100): Promise<GateDecisionLog[]> {
  const client = getBandieClient();
  const { data, error } = await client
    .from('bandie_gate_decision_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as GateDecisionLog[];
}
