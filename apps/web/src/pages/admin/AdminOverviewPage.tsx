import { useEffect, useState } from 'react';
import { getAdminOverviewCounts, type AdminOverviewCounts } from '@bandie/data';

export function AdminOverviewPage() {
  const [counts, setCounts] = useState<AdminOverviewCounts | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAdminOverviewCounts()
      .then(setCounts)
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Unable to load overview.');
      });
  }, []);

  return (
    <section className="panel">
      <p className="my-bands-eyebrow">Phase 12</p>
      <h2>Platform overview</h2>
      <p className="my-bands-lead">Read-only counts across users, bands, and content.</p>
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
