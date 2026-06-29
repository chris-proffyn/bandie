import { useEffect, useState, type ReactNode } from 'react';
import { canPerform, type EntitlementCheckInput, type GateDecision } from '@bandie/data';
import { UpgradePromptModal } from './UpgradePromptModal';

type FeatureGateProps = {
  check: EntitlementCheckInput;
  children: ReactNode;
  fallback?: ReactNode;
  loadingFallback?: ReactNode;
};

export function FeatureGate({
  check,
  children,
  fallback = null,
  loadingFallback = null,
}: FeatureGateProps) {
  const [decision, setDecision] = useState<GateDecision | null>(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void canPerform(check).then((result) => {
      if (!cancelled) {
        setDecision(result);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [check]);

  if (loading) {
    return <>{loadingFallback}</>;
  }

  if (!decision?.allowed) {
    return (
      <>
        {fallback}
        {decision && !dismissed ? (
          <UpgradePromptModal decision={decision} onClose={() => setDismissed(true)} />
        ) : null}
      </>
    );
  }

  return <>{children}</>;
}
