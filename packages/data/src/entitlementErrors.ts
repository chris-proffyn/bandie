import type { GateDecision } from './entitlementTypes';

export class EntitlementGateError extends Error {
  readonly decision: GateDecision;

  constructor(decision: GateDecision) {
    super(decision.message ?? 'This action is not allowed on your current plan.');
    this.name = 'EntitlementGateError';
    this.decision = decision;
  }
}

export function isEntitlementGateError(error: unknown): error is EntitlementGateError {
  return error instanceof EntitlementGateError;
}
