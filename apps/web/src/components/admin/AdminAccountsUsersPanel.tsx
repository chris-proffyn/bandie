import { useCallback, useEffect, useState } from 'react';
import {
  ADMIN_ACCOUNTS_PAGE_SIZE,
  formatAdminAccountDate,
  formatAdminWorkspaceRoles,
  formatEntitlementTestPlanLabel,
  isPlayerEntitlementTestPlanCode,
  listAdminUserAccounts,
  type AdminUserAccount,
} from '@bandie/data';
import { AdminPagination } from './AdminPagination';
import { AdminUserAccountEditor } from './AdminUserAccountEditor';
import { HeadingWithHelp } from '../ui/InfoHelp';
import { TestDataBadge } from '../common/TestDataBadge';

type AdminAccountsUsersPanelProps = {
  query: string;
  reloadToken: number;
  hideTestData: boolean;
};

export function AdminAccountsUsersPanel({
  query,
  reloadToken,
  hideTestData,
}: AdminAccountsUsersPanelProps) {
  const [page, setPage] = useState<{
    rows: AdminUserAccount[];
    total: number;
    offset: number;
  }>({ rows: [], total: 0, offset: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const loadUsers = useCallback(async (offset: number) => {
    setLoading(true);
    setError(null);

    try {
      const result = await listAdminUserAccounts({
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
      setSelectedUserId((current) =>
        current && result.rows.some((row) => row.user_id === current) ? current : null,
      );
    } catch (err) {
      setPage({ rows: [], total: 0, offset: 0 });
      setError(err instanceof Error ? err.message : 'Unable to load users.');
    } finally {
      setLoading(false);
    }
  }, [hideTestData, query]);

  useEffect(() => {
    setSelectedUserId(null);
    void loadUsers(0);
  }, [loadUsers, reloadToken]);

  const selectedAccount = page.rows.find((row) => row.user_id === selectedUserId) ?? null;

  return (
    <section className="panel admin-accounts-section">
      <div className="admin-accounts-section-head">
        <div>
          <HeadingWithHelp
            as="h3"
            helpLabel="About users"
            help={
              <p>
                Browse accounts with leader and organiser plans, test-plan overrides, and promo expiry.
              </p>
            }
          >
            Users
          </HeadingWithHelp>
        </div>
        {!loading ? (
          <span className="communications-count-badge">{page.total}</span>
        ) : null}
      </div>

      {error ? <div className="auth-message auth-message-error">{error}</div> : null}
      {loading ? <p className="workspace-empty-note">Loading users…</p> : null}

      {!loading && page.rows.length === 0 ? (
        <p className="workspace-empty-note">
          {hideTestData
            ? 'No live users matched this search. Try showing test data.'
            : 'No users matched this search.'}
        </p>
      ) : null}

      {!loading && page.rows.length > 0 ? (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table admin-table-compact admin-accounts-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Roles</th>
                  <th>Leader plan</th>
                  <th>Organiser plan</th>
                  <th>Test plan</th>
                  <th>Promo ends</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {page.rows.map((user) => (
                  <tr key={user.user_id} className={selectedUserId === user.user_id ? 'is-selected' : ''}>
                    <td>
                      <div className="admin-account-name-cell">
                        <span>{user.display_name ?? '—'}</span>
                        <TestDataBadge testUser={user.test_user} />
                        {user.account_deleted_at ? (
                          <span className="admin-deleted-badge">Deleted</span>
                        ) : null}
                      </div>
                    </td>
                    <td>{user.username ?? '—'}</td>
                    <td>{user.email ?? '—'}</td>
                    <td>{formatAdminWorkspaceRoles(user.is_player, user.is_organiser)}</td>
                    <td>{user.leader_plan_name ?? user.leader_plan_code ?? '—'}</td>
                    <td>{user.organiser_plan_name ?? user.organiser_plan_code ?? '—'}</td>
                    <td>
                      {user.entitlement_test_leader_plan_code &&
                      isPlayerEntitlementTestPlanCode(user.entitlement_test_leader_plan_code)
                        ? formatEntitlementTestPlanLabel(user.entitlement_test_leader_plan_code)
                        : '—'}
                    </td>
                    <td>
                      <div className="admin-account-date-stack">
                        <span>L: {formatAdminAccountDate(user.leader_trial_end)}</span>
                        <span>O: {formatAdminAccountDate(user.organiser_trial_end)}</span>
                      </div>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="admin-compact-button"
                        aria-pressed={selectedUserId === user.user_id}
                        onClick={() => setSelectedUserId(user.user_id)}
                      >
                        Manage
                      </button>
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
            onPageChange={(nextOffset) => {
              setSelectedUserId(null);
              void loadUsers(nextOffset);
            }}
          />
        </>
      ) : null}

      {selectedAccount ? (
        <AdminUserAccountEditor
          account={selectedAccount}
          onCancel={() => setSelectedUserId(null)}
          onSaved={() => void loadUsers(page.offset)}
          onDeleted={() => void loadUsers(page.offset)}
        />
      ) : null}
    </section>
  );
}
