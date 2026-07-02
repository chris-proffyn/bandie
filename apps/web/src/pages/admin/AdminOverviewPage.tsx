import { useEffect, useState } from 'react';
import { getAdminOverviewCounts, getAdminTestDataCounts, type AdminOverviewCounts } from '@bandie/data';
import { AdminTestDataToggle } from '../../components/admin/AdminTestDataToggle';
import { HeadingWithHelp } from '../../components/ui/InfoHelp';
import {
  readAdminHideTestData,
  saveAdminHideTestData,
} from '../../lib/adminTestDataPreference';

export function AdminOverviewPage() {
  const [counts, setCounts] = useState<AdminOverviewCounts | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hideTestData, setHideTestData] = useState(() => readAdminHideTestData());
  const [testDataCounts, setTestDataCounts] = useState({ test_user_count: 0, test_band_count: 0 });

  useEffect(() => {
    Promise.all([
      getAdminOverviewCounts({ hideTestData }),
      getAdminTestDataCounts(),
    ])
      .then(([nextCounts, nextTestDataCounts]) => {
        setCounts(nextCounts);
        setTestDataCounts(nextTestDataCounts);
        setError(null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Unable to load overview.');
      });
  }, [hideTestData]);

  function handleHideTestDataChange(nextHideTestData: boolean) {
    setHideTestData(nextHideTestData);
    saveAdminHideTestData(nextHideTestData);
  }

  return (
    <section className="panel">
      <p className="my-bands-eyebrow">Phase 12</p>
      <HeadingWithHelp
        as="h2"
        helpLabel="About platform overview"
        help={<p>Read-only counts across users, bands, and content.</p>}
      >
        Platform overview
      </HeadingWithHelp>
      <AdminTestDataToggle
        hideTestData={hideTestData}
        testUserCount={testDataCounts.test_user_count}
        testBandCount={testDataCounts.test_band_count}
        onChange={handleHideTestDataChange}
      />
      {error ? <div className="auth-message auth-message-error">{error}</div> : null}
      <div className="admin-overview-grid">
        <article className="admin-overview-card">
          <span>Users</span>
          <strong>{counts?.users ?? '—'}</strong>
        </article>
        <article className="admin-overview-card">
          <span>Bands</span>
          <strong>{counts?.bands ?? '—'}</strong>
        </article>
        <article className="admin-overview-card">
          <span>Songs</span>
          <strong>{counts?.songs ?? '—'}</strong>
        </article>
        <article className="admin-overview-card">
          <span>Setlists</span>
          <strong>{counts?.setlists ?? '—'}</strong>
        </article>
        <article className="admin-overview-card">
          <span>Active gigs</span>
          <strong>{counts?.gigs ?? '—'}</strong>
        </article>
      </div>
    </section>
  );
}
