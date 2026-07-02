import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ADMIN_ACCOUNTS_PAGE_SIZE,
  formatAdminAccountDate,
  listAdminBandAccounts,
  type AdminBandAccount,
} from '@bandie/data';
import { AdminPagination } from './AdminPagination';
import { HeadingWithHelp } from '../ui/InfoHelp';
import { TestDataBadge } from '../common/TestDataBadge';

type AdminAccountsBandsPanelProps = {
  query: string;
  reloadToken: number;
  hideTestData: boolean;
};

export function AdminAccountsBandsPanel({
  query,
  reloadToken,
  hideTestData,
}: AdminAccountsBandsPanelProps) {
  const [page, setPage] = useState<{
    rows: AdminBandAccount[];
    total: number;
    offset: number;
  }>({ rows: [], total: 0, offset: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBands = useCallback(async (offset: number) => {
    setLoading(true);
    setError(null);

    try {
      const result = await listAdminBandAccounts({
        query,
        limit: ADMIN_ACCOUNTS_PAGE_SIZE,
        offset,
        hideTestData,
      });
      setPage({
        rows: result.rows,
        total: result.total,
        offset: result.offset,
      });
    } catch (err) {
      setPage({ rows: [], total: 0, offset: 0 });
      setError(err instanceof Error ? err.message : 'Unable to load bands.');
    } finally {
      setLoading(false);
    }
  }, [hideTestData, query]);

  useEffect(() => {
    void loadBands(0);
  }, [loadBands, reloadToken]);

  return (
    <section className="panel admin-accounts-section">
      <div className="admin-accounts-section-head">
        <div>
          <HeadingWithHelp
            as="h3"
            helpLabel="About bands"
            help={
              <p>
                Band workspaces with primary leader plan, member count, and repertoire size.
              </p>
            }
          >
            Bands
          </HeadingWithHelp>
        </div>
        {!loading ? (
          <span className="communications-count-badge">{page.total}</span>
        ) : null}
      </div>

      {error ? <div className="auth-message auth-message-error">{error}</div> : null}
      {loading ? <p className="workspace-empty-note">Loading bands…</p> : null}

      {!loading && page.rows.length === 0 ? (
        <p className="workspace-empty-note">
          {hideTestData
            ? 'No live bands matched this search. Try showing test data.'
            : 'No bands matched this search.'}
        </p>
      ) : null}

      {!loading && page.rows.length > 0 ? (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table admin-table-compact admin-accounts-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Slug</th>
                  <th>Primary leader</th>
                  <th>Leader plan</th>
                  <th>Promo ends</th>
                  <th>Members</th>
                  <th>Songs</th>
                  <th>Created</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {page.rows.map((band) => (
                  <tr key={band.band_id}>
                    <td>
                      <div className="admin-account-name-cell">
                        <span>{band.name}</span>
                        <TestDataBadge testUser={band.test_user} />
                      </div>
                    </td>
                    <td>{band.slug}</td>
                    <td>
                      <div className="admin-account-date-stack">
                        <span>{band.owner_display_name ?? '—'}</span>
                        <span>{band.owner_email ?? '—'}</span>
                      </div>
                    </td>
                    <td>{band.leader_plan_name ?? band.leader_plan_code ?? '—'}</td>
                    <td>{formatAdminAccountDate(band.leader_trial_end)}</td>
                    <td>{band.member_count}</td>
                    <td>{band.song_count}</td>
                    <td>{formatAdminAccountDate(band.created_at)}</td>
                    <td>
                      <Link to={`/app/${band.band_id}`} className="admin-compact-button">
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <AdminPagination
            total={page.total}
            limit={ADMIN_ACCOUNTS_PAGE_SIZE}
            offset={page.offset}
            onPageChange={(nextOffset) => void loadBands(nextOffset)}
          />
        </>
      ) : null}
    </section>
  );
}
