import { useCallback, useEffect, useState } from 'react';
import {
  acceptAllPendingInvitations,
  acceptBandInvitation,
  declineBandInvitation,
  formatBandMemberRoleLabel,
  formatInvitationStatusLabel,
  isInvitationAwaitingResponse,
  isResolvedInviteStatus,
  listMyReceivedBandInvitations,
  type ReceivedBandInvitation,
} from '@bandie/data';
import { useAuth } from '../../context/AuthContext';

type IncomingBandInvitationsPanelProps = {
  onChanged?: () => void;
  compact?: boolean;
  hideResolvedInvites?: boolean;
};

function filterReceivedInvitations(
  rows: ReceivedBandInvitation[],
  hideResolvedInvites: boolean,
): ReceivedBandInvitation[] {
  if (!hideResolvedInvites) {
    return rows;
  }

  return rows.filter((row) => !isResolvedInviteStatus(row.status));
}

export function IncomingBandInvitationsPanel({
  onChanged,
  compact = false,
  hideResolvedInvites = false,
}: IncomingBandInvitationsPanelProps) {
  const { refreshBands } = useAuth();
  const [invitations, setInvitations] = useState<ReceivedBandInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actingToken, setActingToken] = useState<string | null>(null);
  const [acceptingAll, setAcceptingAll] = useState(false);

  const loadInvitations = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const rows = await listMyReceivedBandInvitations();
      setInvitations(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load invitations.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadInvitations();
  }, [loadInvitations]);

  async function handleAccept(token: string) {
    setActingToken(token);
    setError(null);

    try {
      await acceptBandInvitation(token);
      await refreshBands();
      await loadInvitations();
      onChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to accept invitation.');
    } finally {
      setActingToken(null);
    }
  }

  async function handleDecline(token: string) {
    setActingToken(token);
    setError(null);

    try {
      await declineBandInvitation(token);
      await loadInvitations();
      onChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to decline invitation.');
    } finally {
      setActingToken(null);
    }
  }

  async function handleAcceptAll() {
    const pendingInvitations = invitations.filter((invitation) =>
      isInvitationAwaitingResponse(invitation.status),
    );

    if (!pendingInvitations.length) {
      return;
    }

    setAcceptingAll(true);
    setError(null);

    try {
      await acceptAllPendingInvitations(pendingInvitations);
      await refreshBands();
      await loadInvitations();
      onChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to accept invitations.');
      await loadInvitations();
    } finally {
      setAcceptingAll(false);
    }
  }

  if (loading) {
    return <p className="workspace-empty-note">Loading band invitations…</p>;
  }

  const visibleInvitations = filterReceivedInvitations(invitations, hideResolvedInvites);
  const pendingInvitations = invitations.filter((invitation) =>
    isInvitationAwaitingResponse(invitation.status),
  );

  if (!invitations.length) {
    if (compact) {
      return null;
    }

    return (
      <p className="workspace-empty-note">
        No pending band invitations. When a band leader invites you by email, it will appear here.
      </p>
    );
  }

  if (!visibleInvitations.length) {
    return (
      <p className="workspace-empty-note">
        No open band invitations. Turn off “Hide accepted & declined” to see resolved invites.
      </p>
    );
  }

  return (
    <div className="communications-section-body">
      {error ? <div className="auth-message auth-message-error">{error}</div> : null}

      <ul className="invite-list">
        {visibleInvitations.map((invitation) => {
          const awaitingResponse = isInvitationAwaitingResponse(invitation.status);

          return (
            <li key={invitation.id}>
              <div>
                <strong>{invitation.band_name}</strong>
                <div className="communications-item-meta">
                  Join as {formatBandMemberRoleLabel(invitation.role)}
                  {!awaitingResponse ? ` · ${formatInvitationStatusLabel(invitation.status)}` : null}
                </div>
              </div>
              {awaitingResponse ? (
                <div className="communications-item-actions">
                  <button
                    type="button"
                    className="auth-button auth-button-secondary"
                    disabled={acceptingAll || actingToken === invitation.token}
                    onClick={() => {
                      void handleDecline(invitation.token);
                    }}
                  >
                    {actingToken === invitation.token ? 'Working…' : 'Decline'}
                  </button>
                  <button
                    type="button"
                    className="auth-button"
                    disabled={acceptingAll || actingToken === invitation.token}
                    onClick={() => {
                      void handleAccept(invitation.token);
                    }}
                  >
                    {actingToken === invitation.token ? 'Working…' : 'Accept'}
                  </button>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>

      {pendingInvitations.length > 1 ? (
        <div className="communications-section-actions">
          <button
            type="button"
            className="auth-button"
            disabled={acceptingAll || Boolean(actingToken)}
            onClick={() => {
              void handleAcceptAll();
            }}
          >
            {acceptingAll ? 'Accepting all…' : 'Accept all invitations'}
          </button>
        </div>
      ) : null}
    </div>
  );
}
