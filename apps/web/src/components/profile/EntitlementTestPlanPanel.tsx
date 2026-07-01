import { useCallback, useEffect, useState } from 'react';
import {
  formatEntitlementTestPlanLabel,
  getEntitlementTestPlanSettings,
  ORGANISER_ENTITLEMENT_TEST_PLAN_CODES,
  PLAYER_ENTITLEMENT_TEST_PLAN_CODES,
  updateEntitlementTestLeaderPlan,
  updateEntitlementTestOrganiserPlan,
  type EntitlementPlanScope,
  type OrganiserEntitlementTestPlanCode,
  type PlayerEntitlementTestPlanCode,
} from '@bandie/data';
import '../../styles/entitlements.css';

type EntitlementTestPlanPanelProps = {
  scope: EntitlementPlanScope;
  visible: boolean;
  subscriptionPlanName?: string;
  isLaunchPromo?: boolean;
  onUpdated?: () => void;
};

const PLAN_OPTIONS = {
  leader: PLAYER_ENTITLEMENT_TEST_PLAN_CODES,
  organiser: ORGANISER_ENTITLEMENT_TEST_PLAN_CODES,
} as const;

const PANEL_COPY = {
  leader: {
    title: 'Test player plan limits',
    intro:
      'Your account starts on Player Free limits so you can experience the product as a new member. Change this to simulate Plus or Pro, or use your full subscription plan.',
    subscriptionLabel: 'Use subscription plan',
  },
  organiser: {
    title: 'Test organiser plan limits',
    intro:
      'Your organiser workspace starts on Organiser Free limits. Change this to simulate Organiser Plus, or use your full subscription plan.',
    subscriptionLabel: 'Use subscription plan',
  },
} as const;

export function EntitlementTestPlanPanel({
  scope,
  visible,
  subscriptionPlanName,
  isLaunchPromo = false,
  onUpdated,
}: EntitlementTestPlanPanelProps) {
  const copy = PANEL_COPY[scope];
  const planOptions = PLAN_OPTIONS[scope];
  const [selected, setSelected] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const subscriptionOptionLabel = isLaunchPromo
    ? `Full launch access (${subscriptionPlanName ?? 'subscription plan'})`
    : subscriptionPlanName
      ? `Use my subscription (${subscriptionPlanName})`
      : copy.subscriptionLabel;

  const loadSettings = useCallback(async () => {
    if (!visible) {
      return;
    }

    const settings = await getEntitlementTestPlanSettings();
    const planCode = scope === 'leader' ? settings.leaderPlanCode : settings.organiserPlanCode;
    setSelected(planCode ?? '');
  }, [scope, visible]);

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
      const planCode = nextValue === '' ? null : nextValue;
      const updated =
        scope === 'leader'
          ? await updateEntitlementTestLeaderPlan(planCode as PlayerEntitlementTestPlanCode | null)
          : await updateEntitlementTestOrganiserPlan(
              planCode as OrganiserEntitlementTestPlanCode | null,
            );
      const activePlanCode =
        scope === 'leader' ? updated.leaderPlanCode : updated.organiserPlanCode;
      setSelected(activePlanCode ?? '');
      setMessage(
        activePlanCode
          ? `Operating as ${formatEntitlementTestPlanLabel(activePlanCode)} for entitlement checks.`
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
    <section className="billing-test-plan-panel" aria-labelledby={`entitlement-test-plan-${scope}`}>
      <h3 id={`entitlement-test-plan-${scope}`}>{copy.title}</h3>
      <p className="billing-test-plan-intro">{copy.intro}</p>

      <label className="billing-test-plan-field" htmlFor={`entitlement-test-${scope}-plan`}>
        <span>Operate as</span>
        <select
          id={`entitlement-test-${scope}-plan`}
          className="billing-test-plan-select"
          value={selected}
          disabled={loading}
          onChange={(event) => handleChange(event.target.value)}
        >
          <option value="">{subscriptionOptionLabel}</option>
          {planOptions.map((code) => (
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
