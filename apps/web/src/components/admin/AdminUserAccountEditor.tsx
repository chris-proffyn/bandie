import { useEffect, useId, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import {
  adminSetUserSubscriptionPlan,
  adminSetUserSubscriptionTrialEnd,
  adminUpdateUserEntitlementTestPlan,
  adminUpdateUserWorkspaceRoles,
  formatAdminAccountDate,
  formatEntitlementTestPlanLabel,
  fromDateTimeLocalValue,
  isPlayerEntitlementTestPlanCode,
  isStripeBilledSubscription,
  PLAYER_ENTITLEMENT_TEST_PLAN_CODES,
  toDateTimeLocalValue,
  type AdminUserAccount,
} from '@bandie/data';

const LEADER_PLAN_OPTIONS = [
  { value: 'player_free', label: 'Player Free' },
  { value: 'player_plus', label: 'Player Plus' },
  { value: 'player_pro', label: 'Player Pro' },
] as const;

const ORGANISER_PLAN_OPTIONS = [
  { value: 'organiser_free', label: 'Organiser Free' },
  { value: 'organiser_plus', label: 'Organiser Plus' },
] as const;

type AdminUserAccountEditorProps = {
  account: AdminUserAccount;
  onSaved: () => void;
  onCancel: () => void;
};

export function AdminUserAccountEditor({ account, onSaved, onCancel }: AdminUserAccountEditorProps) {
  const titleId = useId();
  const [isPlayer, setIsPlayer] = useState(account.is_player);
  const [isOrganiser, setIsOrganiser] = useState(account.is_organiser);
  const [testPlanCode, setTestPlanCode] = useState(account.entitlement_test_leader_plan_code ?? '');
  const [leaderPlanCode, setLeaderPlanCode] = useState(account.leader_plan_code ?? 'player_free');
  const [organiserPlanCode, setOrganiserPlanCode] = useState(
    account.organiser_plan_code ?? 'organiser_free',
  );
  const [leaderTrialEnd, setLeaderTrialEnd] = useState(toDateTimeLocalValue(account.leader_trial_end));
  const [organiserTrialEnd, setOrganiserTrialEnd] = useState(
    toDateTimeLocalValue(account.organiser_trial_end),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setIsPlayer(account.is_player);
    setIsOrganiser(account.is_organiser);
    setTestPlanCode(account.entitlement_test_leader_plan_code ?? '');
    setLeaderPlanCode(account.leader_plan_code ?? 'player_free');
    setOrganiserPlanCode(account.organiser_plan_code ?? 'organiser_free');
    setLeaderTrialEnd(toDateTimeLocalValue(account.leader_trial_end));
    setOrganiserTrialEnd(toDateTimeLocalValue(account.organiser_trial_end));
    setError(null);
    setMessage(null);
  }, [account]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onCancel();
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onCancel]);

  const leaderStripe = isStripeBilledSubscription(account.leader_stripe_subscription_id);
  const organiserStripe = isStripeBilledSubscription(account.organiser_stripe_subscription_id);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      if (isPlayer !== account.is_player || isOrganiser !== account.is_organiser) {
        await adminUpdateUserWorkspaceRoles({
          userId: account.user_id,
          isPlayer,
          isOrganiser,
        });
      }

      const nextTestPlan = testPlanCode.trim() || null;
      const currentTestPlan = account.entitlement_test_leader_plan_code ?? null;
      const resolvedTestPlan =
        nextTestPlan && isPlayerEntitlementTestPlanCode(nextTestPlan) ? nextTestPlan : null;
      if (resolvedTestPlan !== currentTestPlan) {
        await adminUpdateUserEntitlementTestPlan(account.user_id, resolvedTestPlan);
      }

      if (
        account.leader_subscription_id &&
        !leaderStripe &&
        leaderPlanCode &&
        leaderPlanCode !== account.leader_plan_code
      ) {
        await adminSetUserSubscriptionPlan(account.user_id, 'leader', leaderPlanCode);
      }

      if (account.leader_subscription_id && !leaderStripe) {
        const nextLeaderTrial = fromDateTimeLocalValue(leaderTrialEnd);
        const currentLeaderTrial = account.leader_trial_end ?? null;
        if (nextLeaderTrial !== currentLeaderTrial) {
          await adminSetUserSubscriptionTrialEnd(account.user_id, 'leader', nextLeaderTrial);
        }
      }

      if (
        isOrganiser &&
        !organiserStripe &&
        organiserPlanCode &&
        (!account.organiser_subscription_id || organiserPlanCode !== account.organiser_plan_code)
      ) {
        await adminSetUserSubscriptionPlan(account.user_id, 'organiser', organiserPlanCode);
      }

      if (account.organiser_subscription_id && !organiserStripe) {
        const nextOrganiserTrial = fromDateTimeLocalValue(organiserTrialEnd);
        const currentOrganiserTrial = account.organiser_trial_end ?? null;
        if (nextOrganiserTrial !== currentOrganiserTrial) {
          await adminSetUserSubscriptionTrialEnd(account.user_id, 'organiser', nextOrganiserTrial);
        }
      } else if (
        isOrganiser &&
        !organiserStripe &&
        organiserTrialEnd.trim() &&
        !account.organiser_subscription_id
      ) {
        const nextOrganiserTrial = fromDateTimeLocalValue(organiserTrialEnd);
        if (nextOrganiserTrial) {
          await adminSetUserSubscriptionTrialEnd(account.user_id, 'organiser', nextOrganiserTrial);
        }
      }

      setMessage('User account updated.');
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save user account changes.');
    } finally {
      setSaving(false);
    }
  }

  return createPortal(
    <div className="admin-dialog-backdrop" role="presentation" onClick={onCancel}>
      <form
        className="admin-dialog admin-account-editor auth-form"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onSubmit={handleSubmit}
        onClick={(event) => event.stopPropagation()}
      >
      <div className="admin-account-editor-head">
        <div>
          <h4 id={titleId}>
            Manage {account.display_name ?? account.username ?? account.email ?? account.user_id}
          </h4>
          <p className="workspace-section-intro">
            {account.email ?? 'No email'} · joined {formatAdminAccountDate(account.created_at)}
          </p>
        </div>
        <button type="button" className="admin-compact-button" onClick={onCancel}>
          Close
        </button>
      </div>

      {error ? <div className="auth-message auth-message-error">{error}</div> : null}
      {message ? <div className="auth-message auth-message-success">{message}</div> : null}

      <div className="admin-account-editor-grid">
        <fieldset className="admin-account-fieldset">
          <legend>Workspace roles</legend>
          <label className="admin-checkbox-field">
            <input
              type="checkbox"
              checked={isPlayer}
              onChange={(event) => setIsPlayer(event.target.checked)}
            />
            Player
          </label>
          <label className="admin-checkbox-field">
            <input
              type="checkbox"
              checked={isOrganiser}
              onChange={(event) => setIsOrganiser(event.target.checked)}
            />
            Organiser
          </label>
        </fieldset>

        <div className="auth-field">
          <label htmlFor={`test-plan-${account.user_id}`}>Test player plan limits</label>
          <select
            id={`test-plan-${account.user_id}`}
            value={testPlanCode}
            onChange={(event) => setTestPlanCode(event.target.value)}
          >
            <option value="">None (use subscription plan)</option>
            {PLAYER_ENTITLEMENT_TEST_PLAN_CODES.map((code) => (
              <option key={code} value={code}>
                {formatEntitlementTestPlanLabel(code)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="admin-account-subscription-panels">
        <section className="admin-account-subscription-panel">
          <h5>Leader subscription</h5>
          {account.leader_subscription_id ? (
            <>
              <p className="admin-account-meta">
                {account.leader_plan_name ?? account.leader_plan_code ?? '—'} ·{' '}
                {account.leader_subscription_status ?? '—'} · source{' '}
                {account.leader_subscription_source ?? '—'}
              </p>
              {leaderStripe ? (
                <p className="admin-account-note">
                  Stripe-billed — change plan in Stripe or use{' '}
                  <Link to="/admin/billing">Billing admin</Link>.
                </p>
              ) : (
                <>
                  <div className="auth-field">
                    <label htmlFor={`leader-plan-${account.user_id}`}>Assigned plan</label>
                    <select
                      id={`leader-plan-${account.user_id}`}
                      value={leaderPlanCode}
                      onChange={(event) => setLeaderPlanCode(event.target.value)}
                    >
                      {LEADER_PLAN_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="auth-field">
                    <label htmlFor={`leader-trial-${account.user_id}`}>Promo / trial ends</label>
                    <input
                      id={`leader-trial-${account.user_id}`}
                      type="datetime-local"
                      value={leaderTrialEnd}
                      onChange={(event) => setLeaderTrialEnd(event.target.value)}
                    />
                  </div>
                </>
              )}
              <p className="admin-account-meta">
                Current promo end: {formatAdminAccountDate(account.leader_trial_end)}
              </p>
            </>
          ) : (
            <p className="admin-account-note">No active leader subscription.</p>
          )}
        </section>

        <section className="admin-account-subscription-panel">
          <h5>Organiser subscription</h5>
          {account.organiser_subscription_id ? (
            <>
              <p className="admin-account-meta">
                {account.organiser_plan_name ?? account.organiser_plan_code ?? '—'} ·{' '}
                {account.organiser_subscription_status ?? '—'} · source{' '}
                {account.organiser_subscription_source ?? '—'}
              </p>
              {organiserStripe ? (
                <p className="admin-account-note">
                  Stripe-billed — change plan in Stripe or use{' '}
                  <Link to="/admin/billing">Billing admin</Link>.
                </p>
              ) : (
                <>
                  <div className="auth-field">
                    <label htmlFor={`organiser-plan-${account.user_id}`}>Assigned plan</label>
                    <select
                      id={`organiser-plan-${account.user_id}`}
                      value={organiserPlanCode}
                      onChange={(event) => setOrganiserPlanCode(event.target.value)}
                    >
                      {ORGANISER_PLAN_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="auth-field">
                    <label htmlFor={`organiser-trial-${account.user_id}`}>Promo / trial ends</label>
                    <input
                      id={`organiser-trial-${account.user_id}`}
                      type="datetime-local"
                      value={organiserTrialEnd}
                      onChange={(event) => setOrganiserTrialEnd(event.target.value)}
                    />
                  </div>
                </>
              )}
              <p className="admin-account-meta">
                Current promo end: {formatAdminAccountDate(account.organiser_trial_end)}
              </p>
            </>
          ) : isOrganiser ? (
            <>
              <p className="admin-account-note">
                No organiser subscription yet. Choose a plan below and save to create one.
              </p>
              <div className="auth-field">
                <label htmlFor={`organiser-plan-new-${account.user_id}`}>Assigned plan</label>
                <select
                  id={`organiser-plan-new-${account.user_id}`}
                  value={organiserPlanCode}
                  onChange={(event) => setOrganiserPlanCode(event.target.value)}
                >
                  {ORGANISER_PLAN_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="auth-field">
                <label htmlFor={`organiser-trial-new-${account.user_id}`}>Promo / trial ends</label>
                <input
                  id={`organiser-trial-new-${account.user_id}`}
                  type="datetime-local"
                  value={organiserTrialEnd}
                  onChange={(event) => setOrganiserTrialEnd(event.target.value)}
                />
              </div>
            </>
          ) : (
            <p className="admin-account-note">
              No active organiser subscription. Enable the Organiser workspace role above, then assign
              a plan here.
            </p>
          )}
        </section>
      </div>

      {account.active_override_count > 0 ? (
        <p className="admin-account-note">
          {account.active_override_count} active entitlement override
          {account.active_override_count === 1 ? '' : 's'} — manage on{' '}
          <Link to="/admin/entitlements">Entitlements admin</Link>.
        </p>
      ) : null}

      <div className="admin-account-editor-actions">
        <button type="button" className="auth-button auth-button-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="auth-button" disabled={saving}>
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </form>
    </div>,
    document.body,
  );
}
