import { useState, type FormEvent } from 'react';
import { AdminOrganiserInvitesPanel } from '../../components/admin/AdminOrganiserInvitesPanel';
import { AdminAccountsBandsPanel } from '../../components/admin/AdminAccountsBandsPanel';
import { AdminAccountsUsersPanel } from '../../components/admin/AdminAccountsUsersPanel';

type AccountsTab = 'users' | 'bands';

export function AdminAccountsPage() {
  const [activeTab, setActiveTab] = useState<AccountsTab>('users');
  const [query, setQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [reloadToken, setReloadToken] = useState(0);

  function handleSearch(event: FormEvent) {
    event.preventDefault();
    setAppliedQuery(query.trim());
    setReloadToken((value) => value + 1);
  }

  function handleClearSearch() {
    setQuery('');
    setAppliedQuery('');
    setReloadToken((value) => value + 1);
  }

  return (
    <div className="admin-main admin-accounts-page">
      <section className="panel">
        <p className="my-bands-eyebrow">Accounts</p>
        <h2>Users and bands</h2>
        <p className="workspace-section-intro">
          Browse paginated users and bands, manage workspace roles, subscription plans, promo expiry,
          and entitlement test-plan overrides. Stripe-billed subscriptions remain read-only here.
        </p>

        <form className="admin-search-bar" onSubmit={handleSearch}>
          <div className="auth-field">
            <label htmlFor="adminAccountSearch">Search</label>
            <input
              id="adminAccountSearch"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name, username, email, band…"
            />
          </div>
          <button type="submit" className="auth-button">
            Search
          </button>
          {appliedQuery ? (
            <button type="button" className="auth-button auth-button-secondary" onClick={handleClearSearch}>
              Clear
            </button>
          ) : null}
        </form>
      </section>

      <div className="admin-accounts-tabs" role="tablist" aria-label="Accounts views">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'users'}
          className={`admin-plan-pill${activeTab === 'users' ? ' is-selected' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <span className="admin-plan-pill-name">Users</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'bands'}
          className={`admin-plan-pill${activeTab === 'bands' ? ' is-selected' : ''}`}
          onClick={() => setActiveTab('bands')}
        >
          <span className="admin-plan-pill-name">Bands</span>
        </button>
      </div>

      {activeTab === 'users' ? (
        <AdminAccountsUsersPanel query={appliedQuery} reloadToken={reloadToken} />
      ) : (
        <AdminAccountsBandsPanel query={appliedQuery} reloadToken={reloadToken} />
      )}

      <AdminOrganiserInvitesPanel />
    </div>
  );
}
