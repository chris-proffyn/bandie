import { useEffect, useState, type FormEvent } from 'react';
import { getAdminTestDataCounts } from '@bandie/data';
import { AdminOrganiserInvitesPanel } from '../../components/admin/AdminOrganiserInvitesPanel';
import { AdminAccountsBandsPanel } from '../../components/admin/AdminAccountsBandsPanel';
import { AdminAccountsUsersPanel } from '../../components/admin/AdminAccountsUsersPanel';
import { AdminTestDataToggle } from '../../components/admin/AdminTestDataToggle';
import { HeadingWithHelp } from '../../components/ui/InfoHelp';
import {
  readAdminHideTestData,
  saveAdminHideTestData,
} from '../../lib/adminTestDataPreference';

type AccountsTab = 'users' | 'bands';

export function AdminAccountsPage() {
  const [activeTab, setActiveTab] = useState<AccountsTab>('users');
  const [query, setQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [reloadToken, setReloadToken] = useState(0);
  const [hideTestData, setHideTestData] = useState(() => readAdminHideTestData());
  const [testDataCounts, setTestDataCounts] = useState({ test_user_count: 0, test_band_count: 0 });

  useEffect(() => {
    getAdminTestDataCounts()
      .then((counts) => setTestDataCounts(counts))
      .catch(() => {
        setTestDataCounts({ test_user_count: 0, test_band_count: 0 });
      });
  }, [reloadToken]);

  function handleHideTestDataChange(nextHideTestData: boolean) {
    setHideTestData(nextHideTestData);
    saveAdminHideTestData(nextHideTestData);
    setReloadToken((value) => value + 1);
  }

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
        <HeadingWithHelp
          as="h2"
          helpLabel="About users and bands"
          help={
            <p>
              Browse paginated users and bands, manage workspace roles, subscription plans, promo expiry,
              and entitlement test-plan overrides. Stripe-billed subscriptions remain read-only here.
            </p>
          }
        >
          Users and bands
        </HeadingWithHelp>

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

        <AdminTestDataToggle
          hideTestData={hideTestData}
          testUserCount={testDataCounts.test_user_count}
          testBandCount={testDataCounts.test_band_count}
          onChange={handleHideTestDataChange}
        />
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
        <AdminAccountsUsersPanel
          query={appliedQuery}
          reloadToken={reloadToken}
          hideTestData={hideTestData}
        />
      ) : (
        <AdminAccountsBandsPanel
          query={appliedQuery}
          reloadToken={reloadToken}
          hideTestData={hideTestData}
        />
      )}

      <AdminOrganiserInvitesPanel />
    </div>
  );
}
