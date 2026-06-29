import { useEffect, useState } from 'react';
import {
  ensureLaunchTrialsExpired,
  formatLaunchPromoEndDate,
  getLaunchPromoStatus,
  listStripeWebhookEvents,
  listUserSubscriptions,
  searchAdminUsers,
  syncStripePlanCatalogueAsAdmin,
  type AdminSearchUser,
  type LaunchPromoStatus,
  type UserSubscriptionSummary,
} from '@bandie/data';

function formatAdminUserLabel(user: AdminSearchUser): string {
  const name = user.display_name ?? user.username ?? 'Unknown user';
  const parts = [name];

  if (user.username && user.username !== user.display_name) {
    parts.push(`@${user.username}`);
  }
  if (user.email) {
    parts.push(user.email);
  }

  return parts.join(' · ');
}

function buildUserSearchQuery(email: string, nameOrUsername: string): string {
  const trimmedEmail = email.trim();
  const trimmedName = nameOrUsername.trim();

  if (trimmedEmail && trimmedName) {
    return trimmedEmail;
  }

  return trimmedEmail || trimmedName;
}

export function AdminBillingPage() {
  const [webhooks, setWebhooks] = useState<
    Array<{ id: string; stripeEventId: string; eventType: string; processedAt: string }>
  >([]);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchEmail, setSearchEmail] = useState('');
  const [searchName, setSearchName] = useState('');
  const [matchedUsers, setMatchedUsers] = useState<AdminSearchUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userSubs, setUserSubs] = useState<UserSubscriptionSummary[]>([]);
  const [launchPromo, setLaunchPromo] = useState<LaunchPromoStatus | null>(null);

  useEffect(() => {
    listStripeWebhookEvents(30)
      .then(setWebhooks)
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load webhooks.'));

    getLaunchPromoStatus()
      .then(setLaunchPromo)
      .catch(() => setLaunchPromo(null));
  }, []);

  async function handleSyncPlans() {
    setLoading(true);
    setError(null);
    setSyncMessage(null);
    try {
      const plans = await syncStripePlanCatalogueAsAdmin();
      setSyncMessage(`Stripe catalogue synced for ${Object.keys(plans).length} paid plan(s).`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed.');
    } finally {
      setLoading(false);
    }
  }

  async function loadSubscriptionsForUser(userId: string, users: AdminSearchUser[]) {
    setSelectedUserId(userId);
    const subs = await listUserSubscriptions(userId);
    setUserSubs(subs);

    const user = users.find((row) => row.user_id === userId);
    const label = user ? formatAdminUserLabel(user) : userId;
    setSyncMessage(
      subs.length > 0
        ? `Showing ${subs.length} subscription(s) for ${label}.`
        : `No active subscriptions for ${label}.`,
    );
  }

  async function handleSearchUsers(event: React.FormEvent) {
    event.preventDefault();

    const query = buildUserSearchQuery(searchEmail, searchName);
    if (!query) {
      setError('Enter an email or name to search.');
      return;
    }

    setLoading(true);
    setError(null);
    setSyncMessage(null);
    setSelectedUserId(null);
    setUserSubs([]);

    try {
      const users = await searchAdminUsers(query, 25);
      setMatchedUsers(users);

      if (users.length === 0) {
        setError('No users matched those filters.');
        return;
      }

      setSyncMessage(
        users.length === 1
          ? 'One user matched — subscriptions loaded below.'
          : `${users.length} users matched — choose one from the list.`,
      );

      if (users.length === 1) {
        await loadSubscriptionsForUser(users[0].user_id, users);
      }
    } catch (err) {
      setMatchedUsers([]);
      setError(err instanceof Error ? err.message : 'Search failed.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectUser(userId: string) {
    if (!userId) {
      setSelectedUserId(null);
      setUserSubs([]);
      setSyncMessage(null);
      return;
    }

    setLoading(true);
    setError(null);
    setSyncMessage(null);

    try {
      await loadSubscriptionsForUser(userId, matchedUsers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load subscriptions.');
    } finally {
      setLoading(false);
    }
  }

  async function handleExpireLaunchTrials() {
    setLoading(true);
    setError(null);
    setSyncMessage(null);
    try {
      await ensureLaunchTrialsExpired();
      setSyncMessage('Expired launch trials reconciled.');
      setLaunchPromo(await getLaunchPromoStatus());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to expire launch trials.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-main admin-billing-page">
      <header className="admin-billing-header">
        <p className="admin-billing-eyebrow">Billing</p>
        <h1>Stripe & subscriptions</h1>
        <p className="admin-billing-intro">
          Products, webhooks, and subscription lookup. Run plan sync once after configuring{' '}
          <code>STRIPE_SECRET_KEY</code>.
        </p>
      </header>

      {error ? <p className="admin-billing-alert admin-billing-alert-error">{error}</p> : null}
      {syncMessage ? <p className="admin-billing-alert">{syncMessage}</p> : null}

      <section className="panel admin-billing-section">
        <h2>Launch promo access</h2>
        <p className="admin-billing-note">
          New sign-ups receive Player Pro (and Organiser Plus for organisers) until the promo end
          date. Stripe subscriptions are not affected.
        </p>
        {launchPromo?.endsAt ? (
          <p className="admin-billing-note">
            Promo ends:{' '}
            <strong>
              {formatLaunchPromoEndDate(launchPromo.endsAt)}
              {launchPromo.active && launchPromo.daysRemaining != null
                ? ` (${launchPromo.daysRemaining} day(s) left)`
                : ' (ended)'}
            </strong>
          </p>
        ) : (
          <p className="admin-billing-note">No launch promo end date is configured.</p>
        )}
        <div className="admin-billing-actions">
          <button
            type="button"
            className="admin-compact-button"
            disabled={loading}
            onClick={() => void handleExpireLaunchTrials()}
          >
            Reconcile expired trials
          </button>
        </div>
        <p className="admin-billing-note">
          Setting: <code>bandie_platform_settings.launch_promo_ends_at</code>
        </p>
      </section>

      <section className="panel admin-billing-section">
        <h2>Stripe plan catalogue</h2>
        <p className="admin-billing-note">
          Creates Stripe products/prices for Player Plus (£4), Player Pro (£10), and Organiser Plus
          (£15) and stores IDs on <code>bandie_plans</code>.
        </p>
        <div className="admin-billing-actions">
          <button
            type="button"
            className="admin-compact-button"
            disabled={loading}
            onClick={handleSyncPlans}
          >
            {loading ? 'Syncing…' : 'Sync Stripe plans'}
          </button>
        </div>
        <p className="admin-billing-note">
          Stripe Dashboard:{' '}
          <a href="https://dashboard.stripe.com/test/products" target="_blank" rel="noreferrer">
            Test products
          </a>{' '}
          ·{' '}
          <a href="https://dashboard.stripe.com/test/webhooks" target="_blank" rel="noreferrer">
            Test webhooks
          </a>
        </p>
      </section>

      <section className="panel admin-billing-section">
        <h2>Recent webhook events</h2>
        {webhooks.length === 0 ? (
          <p className="admin-billing-note">No webhook events recorded yet.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table admin-table-compact">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Type</th>
                  <th>Stripe event ID</th>
                </tr>
              </thead>
              <tbody>
                {webhooks.map((event) => (
                  <tr key={event.id}>
                    <td>{new Date(event.processedAt).toLocaleString()}</td>
                    <td>{event.eventType}</td>
                    <td>
                      <code className="admin-inline-code">{event.stripeEventId}</code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="panel admin-billing-section admin-billing-lookup">
        <h2>User subscription lookup</h2>
        <p className="admin-billing-note">
          Filter by email and/or name, then pick a user to view active subscriptions.
        </p>
        <form className="admin-user-lookup-form" onSubmit={(event) => void handleSearchUsers(event)}>
          <div className="admin-user-lookup-filters">
            <label className="admin-compact-field" htmlFor="billing-search-email">
              <span>Email</span>
              <input
                id="billing-search-email"
                type="search"
                value={searchEmail}
                onChange={(event) => setSearchEmail(event.target.value)}
                placeholder="player@example.com"
                autoComplete="off"
              />
            </label>
            <label className="admin-compact-field" htmlFor="billing-search-name">
              <span>Name or username</span>
              <input
                id="billing-search-name"
                type="search"
                value={searchName}
                onChange={(event) => setSearchName(event.target.value)}
                placeholder="Display name"
                autoComplete="off"
              />
            </label>
            <button type="submit" className="admin-compact-button" disabled={loading}>
              {loading ? 'Searching…' : 'Search'}
            </button>
          </div>
        </form>
        <label className="admin-compact-field admin-user-lookup-select" htmlFor="billing-user-select">
          <span>User</span>
          <select
            id="billing-user-select"
            value={selectedUserId ?? ''}
            disabled={loading || matchedUsers.length === 0}
            onChange={(event) => void handleSelectUser(event.target.value)}
          >
            <option value="">
              {matchedUsers.length === 0 ? 'Run a search to list users' : 'Select a user…'}
            </option>
            {matchedUsers.map((user) => (
              <option key={user.user_id} value={user.user_id}>
                {formatAdminUserLabel(user)}
              </option>
            ))}
          </select>
        </label>
        {selectedUserId && userSubs.length > 0 ? (
          <ul className="admin-subscription-results">
            {userSubs.map((sub) => (
              <li key={sub.id} className="admin-subscription-row">
                <strong>{sub.planName}</strong>
                <span className="admin-subscription-meta">
                  {sub.planScope} · {sub.status}
                </span>
                {sub.stripeSubscriptionId ? (
                  <a
                    className="admin-subscription-link"
                    href={`https://dashboard.stripe.com/test/subscriptions/${sub.stripeSubscriptionId}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Stripe
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        ) : selectedUserId && userSubs.length === 0 ? (
          <p className="admin-billing-note">No active or past-due subscriptions for this user.</p>
        ) : null}
      </section>
    </div>
  );
}
