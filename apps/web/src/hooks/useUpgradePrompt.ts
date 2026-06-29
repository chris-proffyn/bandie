import { useCallback, useState } from 'react';
import { isEntitlementGateError, type GateDecision } from '@bandie/data';

export function useUpgradePrompt() {
  const [decision, setDecision] = useState<GateDecision | null>(null);

  const clearUpgradePrompt = useCallback(() => {
    setDecision(null);
  }, []);

  const handleEntitlementError = useCallback((error: unknown): boolean => {
    if (isEntitlementGateError(error)) {
      setDecision(error.decision);
      return true;
    }
    return false;
  }, []);

  return {
    upgradeDecision: decision,
    clearUpgradePrompt,
    handleEntitlementError,
    showUpgradePrompt: decision !== null,
  };
}
