import { useCallback, useEffect, useState } from 'react';
import {
  formatLaunchPromoEndDate,
  getLaunchPromoStatus,
  listPublicPlanOffers,
  listUserSubscriptions,
  openBillingPortal,
  startPlanCheckout,
  type LaunchPromoStatus,
  type PublicPlanOffer,
  type UserSubscriptionSummary,
  type EntitlementPlanScope,
} from '@bandie/data';
import { EntitlementTestPlanPanel } from './EntitlementTestPlanPanel';
import '../../styles/entitlements.css';

type BillingPanelProps = {
  showLeaderPlans: boolean;
  showOrganiserPlans: boolean;
  billingNotice?: string | null;
};

function scopeTitle(scope: EntitlementPlanScope): string {
  return scope === 'organiser' ? 'Organiser plan' : 'Player plan';
}

function ScopeSection({
  scope,
  subscription,
  offers,
  loading,
  launchPromoActive,
  onUpgrade,
  onManage,
}: {
  scope: EntitlementPlanScope;
  subscription: UserSubscriptionSummary | undefined;
  offers: PublicPlanOffer[];
  loading: boolean;
  launchPromoActive: boolean;
  onUpgrade: (planCode: string) => void;
  onManage: () => void;
}) {
  const currentCode = subscription?.planCode;
  const paidOffers = offers.filter((offer) => offer.isPaid);
  const hasStripe = Boolean(subscription?.stripeSubscriptionId);
  const onLaunchTrial = Boolean(subscription?.isLaunchPromo && launchPromoActive);
  const showUpgradeActions = !onLaunchTrial;

  return (
    <section className="billing-scope-panel">
      <h3>{scopeTitle(scope)}</h3>
      {subscription ? (
        <>
          <p className="billing-current-plan">
            {subscription.testPlanOverride ? (
              <>
                Operating as: <strong>{subscription.planName}</strong> (testing)
                <span className="billing-plan-testing-note">
                  {' '}
                  — launch access: {subscription.subscriptionPlanName}
                </span>
              </>
            ) : (
              <>
                Current: <strong>{subscription.planName}</strong>
              </>
            )}
            {subscription.isLaunchPromo && launchPromoActive && subscription.trialEnd
              ? ` — launch access until ${formatLaunchPromoEndDate(subscription.trialEnd)}`
              : null}
            {subscription.source === 'stripe' ? ' (Stripe)' : ''}
            {subscription.cancelAtPeriodEnd && subscription.currentPeriodEnd
              ? ` — cancels ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
              : null}
          </p>
        </>
      ) : (
        <p className="billing-current-plan">No active subscription found.</p>
      )}

      <ul className="billing-plan-list">
        {offers.map((offer) => {
          const isCurrent = offer.code === currentCode;
          const isUpgrade =
            offer.isPaid &&
            !isCurrent &&
            offer.displayOrder > (offers.find((o) => o.code === currentCode)?.displayOrder ?? 0);

          return (
            <li key={offer.code} className={`billing-plan-item${isCurrent ? ' current' : ''}`}>
              <div>
                <strong>{offer.name}</strong>
                <span className="billing-plan-price">{offer.priceLabel}</span>
                {offer.description ? <p>{offer.description}</p> : null}
              </div>
              {isCurrent ? (
                <span className="billing-plan-badge">Current</span>
              ) : isUpgrade && showUpgradeActions ? (
                <button
                  type="button"
                  className="billing-upgrade-button"
                  disabled={loading}
                  onClick={() => onUpgrade(offer.code)}
                >
                  Upgrade
                </button>
              ) : null}
            </li>
          );
        })}
      </ul>

      {hasStripe ? (
        <button
          type="button"
          className="billing-manage-button"
          disabled={loading}
          onClick={onManage}
        >
          Manage subscription
        </button>
      ) : showUpgradeActions && paidOffers.length > 0 && !subscription?.stripeSubscriptionId ? (
        <p className="workspace-empty-note">Paid plans are billed monthly via Stripe Checkout.</p>
      ) : onLaunchTrial ? (
        <p className="workspace-empty-note">
          Paid plans will be available when launch access ends. Your content is kept if you stay on
          Free.
        </p>
      ) : null}
    </section>
  );
}

export function BillingPanel({
  showLeaderPlans,
  showOrganiserPlans,
  billingNotice,
}: BillingPanelProps) {
  const [subscriptions, setSubscriptions] = useState<UserSubscriptionSummary[]>([]);
  const [leaderOffers, setLeaderOffers] = useState<PublicPlanOffer[]>([]);
  const [organiserOffers, setOrganiserOffers] = useState<PublicPlanOffer[]>([]);
  const [launchPromo, setLaunchPromo] = useState<LaunchPromoStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(billingNotice ?? null);

  const refresh = useCallback(async () => {
    setError(null);
    const [subs, leader, organiser, promo] = await Promise.all([
      listUserSubscriptions(),
      showLeaderPlans ? listPublicPlanOffers('leader') : Promise.resolve([]),
      showOrganiserPlans ? listPublicPlanOffers('organiser') : Promise.resolve([]),
      getLaunchPromoStatus(),
    ]);
    setSubscriptions(subs);
    setLeaderOffers(leader);
    setOrganiserOffers(organiser);
    setLaunchPromo(promo);
  }, [showLeaderPlans, showOrganiserPlans]);

  useEffect(() => {
    refresh().catch((err) => {
      setError(err instanceof Error ? err.message : 'Unable to load billing.');
    });
  }, [refresh]);

  useEffect(() => {
    if (billingNotice) {
      setMessage(billingNotice);
    }
  }, [billingNotice]);

  const leaderSub = subscriptions.find((sub) => sub.planScope === 'leader');
  const organiserSub = subscriptions.find((sub) => sub.planScope === 'organiser');
  const launchPromoActive = launchPromo?.active ?? false;
  const hasLaunchTrial = subscriptions.some((sub) => sub.isLaunchPromo);
  const showLeaderPlanTesting = Boolean(
    showLeaderPlans && leaderSub?.isLaunchPromo && launchPromoActive,
  );

  async function handleUpgrade(planCode: string, planScope: EntitlementPlanScope) {
    setLoading(true);
    setError(null);
    try {
      const url = await startPlanCheckout(planCode, planScope);
      window.location.assign(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed.');
      setLoading(false);
    }
  }

  async function handleManage(planScope: EntitlementPlanScope) {
    setLoading(true);
    setError(null);
    try {
      const url = await openBillingPortal(planScope);
      window.location.assign(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to open billing portal.');
      setLoading(false);
    }
  }

  return (
    <section className="billing-panel surface-light">
      <h2>Billing & plans</h2>
      <p className="billing-panel-intro">
        Subscriptions apply to your account. Band features follow your player plan; organiser features
        follow your organiser plan.
      </p>

      {launchPromoActive && hasLaunchTrial && launchPromo?.endsAt ? (
        <p className="billing-notice billing-launch-promo-notice">
          Launch access — you have full Player Pro
          {showOrganiserPlans ? ' and Organiser Plus' : ''} features until{' '}
          <strong>{formatLaunchPromoEndDate(launchPromo.endsAt)}</strong>
          {launchPromo.daysRemaining != null ? ` (${launchPromo.daysRemaining} day(s) left)` : null}.
        </p>
      ) : null}

      {message ? <p className="billing-notice">{message}</p> : null}
      {error ? <p className="form-error">{error}</p> : null}

      {showLeaderPlans ? (
        <>
          <EntitlementTestPlanPanel
            visible={showLeaderPlanTesting}
            onUpdated={() => {
              refresh().catch((err) => {
                setError(err instanceof Error ? err.message : 'Unable to refresh billing.');
              });
            }}
          />
          <ScopeSection
            scope="leader"
            subscription={leaderSub}
            offers={leaderOffers}
            loading={loading}
            launchPromoActive={launchPromoActive}
            onUpgrade={(code) => handleUpgrade(code, 'leader')}
            onManage={() => handleManage('leader')}
          />
        </>
      ) : null}

      {showOrganiserPlans ? (
        <ScopeSection
          scope="organiser"
          subscription={organiserSub}
          offers={organiserOffers}
          loading={loading}
          launchPromoActive={launchPromoActive}
          onUpgrade={(code) => handleUpgrade(code, 'organiser')}
          onManage={() => handleManage('organiser')}
        />
      ) : null}
    </section>
  );
}
