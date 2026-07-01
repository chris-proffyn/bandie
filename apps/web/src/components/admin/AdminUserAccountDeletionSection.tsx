import { useEffect, useState } from 'react';
import {
  adminDeleteUserAccount,
  getAdminAccountDeletionPreview,
  type AdminAccountDeletionBandTransfer,
  type AdminAccountDeletionPreview,
  type AdminUserAccount,
} from '@bandie/data';

type AdminUserAccountDeletionSectionProps = {
  account: AdminUserAccount;
  onDeleted: () => void;
};

type TransferSelection = Record<string, string>;

export function AdminUserAccountDeletionSection({
  account,
  onDeleted,
}: AdminUserAccountDeletionSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const [preview, setPreview] = useState<AdminAccountDeletionPreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [transfers, setTransfers] = useState<TransferSelection>({});
  const [confirmEmail, setConfirmEmail] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const isDeleted = Boolean(account.account_deleted_at);

  useEffect(() => {
    if (!expanded || isDeleted) {
      return;
    }

    let cancelled = false;
    setLoadingPreview(true);
    setPreviewError(null);

    void getAdminAccountDeletionPreview(account.user_id)
      .then((result) => {
        if (!cancelled) {
          setPreview(result);
          const initialTransfers: TransferSelection = {};
          for (const band of result.bands_requiring_transfer) {
            const firstOption = band.member_options[0];
            if (firstOption) {
              initialTransfers[band.band_id] = firstOption.user_id;
            }
          }
          setTransfers(initialTransfers);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setPreview(null);
          setPreviewError(err instanceof Error ? err.message : 'Unable to load deletion preview.');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingPreview(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [account.user_id, expanded, isDeleted]);

  function renderBandTransfer(band: AdminAccountDeletionBandTransfer) {
    if (band.member_options.length === 0) {
      return (
        <p key={band.band_id} className="admin-account-note admin-account-deletion-warning">
          <strong>{band.band_name}</strong> has no other active members. Invite a member or assign a
          leader before deleting this account.
        </p>
      );
    }

    return (
      <div key={band.band_id} className="auth-field">
        <label htmlFor={`delete-leader-${band.band_id}`}>
          New leader for <strong>{band.band_name}</strong>
        </label>
        <select
          id={`delete-leader-${band.band_id}`}
          value={transfers[band.band_id] ?? ''}
          onChange={(event) =>
            setTransfers((current) => ({ ...current, [band.band_id]: event.target.value }))
          }
        >
          {band.member_options.map((member) => (
            <option key={member.user_id} value={member.user_id}>
              {member.display_name}
            </option>
          ))}
        </select>
      </div>
    );
  }

  const bandsMissingSuccessor =
    preview?.bands_requiring_transfer.some((band) => band.member_options.length === 0) ?? false;

  const transfersIncomplete =
    preview?.bands_requiring_transfer.some(
      (band) => band.member_options.length > 0 && !transfers[band.band_id],
    ) ?? false;

  const emailConfirmed =
    confirmEmail.trim().toLowerCase() === (account.email ?? '').trim().toLowerCase() &&
    confirmEmail.trim().length > 0;

  async function handleDelete() {
    if (!preview || !emailConfirmed || bandsMissingSuccessor || transfersIncomplete) {
      return;
    }

    setDeleting(true);
    setDeleteError(null);

    try {
      await adminDeleteUserAccount({
        userId: account.user_id,
        leadershipTransfers: preview.bands_requiring_transfer
          .filter((band) => band.member_options.length > 0)
          .map((band) => ({
            bandId: band.band_id,
            newLeaderUserId: transfers[band.band_id],
          })),
      });
      onDeleted();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Unable to delete account.');
    } finally {
      setDeleting(false);
    }
  }

  if (isDeleted) {
    return (
      <section className="admin-account-deletion-panel">
        <h5>Account status</h5>
        <p className="admin-account-note">
          This account was deleted
          {account.account_deleted_at
            ? ` on ${new Date(account.account_deleted_at).toLocaleString('en-GB')}`
            : ''}
          . Communications history is retained and shows as <strong>Deleted user</strong>.
        </p>
      </section>
    );
  }

  return (
    <section className="admin-account-deletion-panel">
      <div className="admin-account-deletion-head">
        <div>
          <h5>Delete account</h5>
          <p className="admin-account-note">
            Permanently removes access and scrubs profile data. Communications and band repertoire
            metadata are kept.
          </p>
        </div>
        <button
          type="button"
          className="admin-compact-button admin-account-deletion-toggle"
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? 'Hide' : 'Review deletion'}
        </button>
      </div>

      {expanded ? (
        <div className="admin-account-deletion-body">
          {loadingPreview ? <p className="admin-account-note">Loading deletion preview…</p> : null}
          {previewError ? <div className="auth-message auth-message-error">{previewError}</div> : null}

          {preview ? (
            <>
              {preview.is_platform_admin ? (
                <div className="auth-message auth-message-error">
                  Platform admin accounts cannot be deleted from this screen.
                </div>
              ) : null}

              {preview.dropbox_connected ? (
                <p className="admin-account-note">
                  Dropbox is connected
                  {preview.dropbox_band_count > 0
                    ? ` for ${preview.dropbox_band_count} band${preview.dropbox_band_count === 1 ? '' : 's'}`
                    : ''}
                  . Song metadata will be kept but file links will be removed.
                </p>
              ) : null}

              {preview.bands_requiring_transfer.length > 0 ? (
                <div className="admin-account-deletion-transfers">
                  <p className="admin-account-meta">Bands needing a successor leader</p>
                  {preview.bands_requiring_transfer.map(renderBandTransfer)}
                </div>
              ) : (
                <p className="admin-account-note">
                  No sole-leader bands require a manual transfer.
                </p>
              )}

              {!preview.is_platform_admin && !bandsMissingSuccessor ? (
                <>
                  <div className="auth-field">
                    <label htmlFor={`delete-confirm-${account.user_id}`}>
                      Type the user&apos;s email to confirm deletion
                    </label>
                    <input
                      id={`delete-confirm-${account.user_id}`}
                      type="email"
                      value={confirmEmail}
                      onChange={(event) => setConfirmEmail(event.target.value)}
                      placeholder={account.email ?? 'user@example.com'}
                      autoComplete="off"
                    />
                  </div>

                  {deleteError ? (
                    <div className="auth-message auth-message-error">{deleteError}</div>
                  ) : null}

                  <div className="admin-account-deletion-actions">
                    <button
                      type="button"
                      className="auth-button admin-account-delete-button"
                      disabled={
                        deleting ||
                        !emailConfirmed ||
                        transfersIncomplete ||
                        preview.is_platform_admin
                      }
                      onClick={() => void handleDelete()}
                    >
                      {deleting ? 'Deleting…' : 'Delete account permanently'}
                    </button>
                  </div>
                </>
              ) : null}
            </>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
