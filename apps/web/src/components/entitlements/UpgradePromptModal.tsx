import { Link } from 'react-router-dom';
import type { GateDecision } from '@bandie/data';
import { PLAN_DISPLAY_NAMES, UPGRADE_URL, type PlanCode } from '@bandie/data';

type UpgradePromptModalProps = {
  decision: GateDecision;
  onClose: () => void;
};

function requiredPlanLabel(decision: GateDecision): string {
  if (decision.requiredPlanName) {
    return decision.requiredPlanName;
  }
  if (decision.requiredPlan && decision.requiredPlan in PLAN_DISPLAY_NAMES) {
    return PLAN_DISPLAY_NAMES[decision.requiredPlan as PlanCode];
  }
  return 'a paid plan';
}

export function UpgradePromptModal({ decision, onClose }: UpgradePromptModalProps) {
  const upgradeTarget = requiredPlanLabel(decision);

  return (
    <div className="entitlements-dialog-backdrop" role="presentation" onClick={onClose}>
      <div
        className="entitlements-dialog surface-light"
        role="dialog"
        aria-modal="true"
        aria-labelledby="upgrade-prompt-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="upgrade-prompt-title">Upgrade to unlock more</h2>
        <p>{decision.message ?? 'This action is not available on your current plan.'}</p>

        {decision.currentPlanName ? (
          <p className="entitlements-dialog-meta">
            Current plan: <strong>{decision.currentPlanName}</strong>
            {typeof decision.usage === 'number' && typeof decision.limit === 'number' ? (
              <>
                {' '}
                · Usage: {decision.usage}/{decision.limit}
              </>
            ) : null}
          </p>
        ) : null}

        <div className="entitlements-dialog-actions">
          <button type="button" className="directory-btn directory-btn-secondary" onClick={onClose}>
            Maybe later
          </button>
          <Link
            className="directory-btn directory-btn-primary"
            to={decision.upgradeUrl ?? UPGRADE_URL}
            onClick={onClose}
          >
            View {upgradeTarget}
          </Link>
        </div>
      </div>
    </div>
  );
}
