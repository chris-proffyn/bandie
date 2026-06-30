import { useCallback, useEffect, useState } from 'react';
import {
  formatEntitlementTestPlanLabel,
  getEntitlementTestPlanSettings,
  PLAYER_ENTITLEMENT_TEST_PLAN_CODES,
  updateEntitlementTestLeaderPlan,
  type PlayerEntitlementTestPlanCode,
} from '@bandie/data';
import '../../styles/entitlements.css';

type EntitlementTestPlanPanelProps = {
  visible: boolean;
  subscriptionPlanName?: string;
  isLaunchPromo?: boolean;
  onUpdated?: () => void;
};

export function EntitlementTestPlanPanel({
  visible,
  subscriptionPlanName,
  isLaunchPromo = false,
  onUpdated,
}: EntitlementTestPlanPanelProps) {
  const [selected, setSelected] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const defaultOptionLabel = isLaunchPromo
    ? 'Full launch access (Player Pro)'
    : subscriptionPlanName
      ? `Use my subscription (${subscriptionPlanName})`
      : 'Use my subscription';

  const loadSettings = useCallback(async () => {
    if (!visible) {
      return;
    }

    const settings = await getEntitlementTestPlanSettings();
    setSelected(settings.leaderPlanCode ?? '');
  }, [visible]);

  useEffect(() => {
    loadSettings().catch((err) => {
      setError(err instanceof Error ? err.message : 'Unable to load plan testing settings.');
    });
  }, [loadSettings]);

  if (!visible) {
    return null;
  }

  async function handleChange(nextValue: string) {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const planCode =
        nextValue === '' ? null : (nextValue as PlayerEntitlementTestPlanCode);
      const updated = await updateEntitlementTestLeaderPlan(planCode);
      setSelected(updated.leaderPlanCode ?? '');
      setMessage(
        updated.leaderPlanCode
          ? `Operating as ${formatEntitlementTestPlanLabel(updated.leaderPlanCode)} for entitlement checks.`
          : isLaunchPromo
            ? 'Using full launch access for entitlement checks.'
            : 'Using your subscription plan for entitlement checks.',
      );
      onUpdated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update plan testing.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="billing-test-plan-panel" aria-labelledby="entitlement-test-plan-heading">
      <h3 id="entitlement-test-plan-heading">Test player plan limits</h3>
      <p className="billing-test-plan-intro">
        {isLaunchPromo
          ? 'During launch full access you can simulate Player Free, Plus, or Pro to verify limits and upgrade prompts. Your launch access is unchanged.'
          : 'Simulate Player Free, Plus, or Pro to verify limits and upgrade prompts. Your paid subscription is unchanged.'}{' '}
        This only affects entitlement checks while enforcement is enabled.
      </p>

      <label className="billing-test-plan-field" htmlFor="entitlement-test-leader-plan">
        <span>Operate as</span>
        <select
          id="entitlement-test-leader-plan"
          className="billing-test-plan-select"
          value={selected}
          disabled={loading}
          onChange={(event) => handleChange(event.target.value)}
        >
          <option value="">{defaultOptionLabel}</option>
          {PLAYER_ENTITLEMENT_TEST_PLAN_CODES.map((code) => (
            <option key={code} value={code}>
              {formatEntitlementTestPlanLabel(code)}
            </option>
          ))}
        </select>
      </label>

      {message ? <p className="billing-notice">{message}</p> : null}
      {error ? <p className="form-error">{error}</p> : null}
    </section>
  );
}
