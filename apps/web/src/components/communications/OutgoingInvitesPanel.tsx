import { useCallback, useEffect, useState } from 'react';
import {
  formatBandMemberRoleLabel,
  formatInvitationStatusLabel,
  formatUserWithEmail,
  isInvitationAwaitingResponse,
  isResolvedInviteStatus,
  listMySentBandInvitations,
  listMySentPlayerOutreach,
  playerOutreachTypeLabel,
  revokeBandInvitation,
  revokePlayerOutreach,
  type SentBandInvitation,
  type SentPlayerOutreach,
} from '@bandie/data';

type OutgoingInvitesPanelProps = {
  onChanged?: () => void;
  hideResolvedInvites?: boolean;
};

function filterSentInvitations<T extends { status: string }>(
  rows: T[],
  hideResolvedInvites: boolean,
): T[] {
  if (!hideResolvedInvites) {
    return rows;
  }

  return rows.filter((row) => !isResolvedInviteStatus(row.status));
}

function formatTimestamp(value: string): string {
  return new Date(value).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function OutgoingBandInvitationsPanel({
  onChanged,
  hideResolvedInvites = false,
}: OutgoingInvitesPanelProps) {
  const [invitations, setInvitations] = useState<SentBandInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const loadInvitations = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const rows = await listMySentBandInvitations();
      setInvitations(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load sent invitations.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadInvitations();
  }, [loadInvitations]);

  async function handleRevoke(invitationId: string) {
    setRevokingId(invitationId);
    setError(null);

    try {
      await revokeBandInvitation(invitationId);
      await loadInvitations();
      onChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to revoke invitation.');
    } finally {
      setRevokingId(null);
    }
  }

  if (loading) {
    return <p className="workspace-empty-note">Loading sent invitations…</p>;
  }

  if (!invitations.length) {
    return null;
  }

  const visibleInvitations = filterSentInvitations(invitations, hideResolvedInvites);

  if (!visibleInvitations.length) {
    return null;
  }

  return (
    <div className="communications-section-body">
      {error ? <div className="auth-message auth-message-error">{error}</div> : null}

      <ul className="communications-outreach-list">
        {visibleInvitations.map((invitation) => (
          <li key={invitation.id} className="communications-outreach-item">
            <div className="communications-outreach-head">
              <div>
                <span className="communications-type-badge communications-type-badge-sent">Sent</span>
                <strong>{invitation.band_name}</strong>
                <div className="communications-item-meta">
                  To {formatUserWithEmail(invitation.invitee_display_name, invitation.email)} ·{' '}
                  {formatBandMemberRoleLabel(invitation.role)} · {formatTimestamp(invitation.created_at)} ·{' '}
                  {formatInvitationStatusLabel(invitation.status)}
                </div>
              </div>
              {isInvitationAwaitingResponse(invitation.status) ? (
                <div className="communications-item-actions">
                  <button
                    type="button"
                    className="auth-button auth-button-secondary"
                    disabled={revokingId === invitation.id}
                    onClick={() => {
                      void handleRevoke(invitation.id);
                    }}
                  >
                    {revokingId === invitation.id ? 'Revoking…' : 'Revoke'}
                  </button>
                </div>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function OutgoingPlayerOutreachPanel({
  onChanged,
  hideResolvedInvites = false,
}: OutgoingInvitesPanelProps) {
  const [outreach, setOutreach] = useState<SentPlayerOutreach[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const loadOutreach = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const rows = await listMySentPlayerOutreach();
      setOutreach(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load sent invites.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOutreach();
  }, [loadOutreach]);

  async function handleRevoke(outreachId: string) {
    setRevokingId(outreachId);
    setError(null);

    try {
      await revokePlayerOutreach(outreachId);
      await loadOutreach();
      onChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to revoke invite.');
    } finally {
      setRevokingId(null);
    }
  }

  if (loading) {
    return <p className="workspace-empty-note">Loading sent player invites…</p>;
  }

  if (!outreach.length) {
    return null;
  }

  const visibleOutreach = filterSentInvitations(outreach, hideResolvedInvites);

  if (!visibleOutreach.length) {
    return null;
  }

  return (
    <div className="communications-section-body">
      {error ? <div className="auth-message auth-message-error">{error}</div> : null}

      <ul className="communications-outreach-list">
        {visibleOutreach.map((item) => (
          <li key={item.id} className="communications-outreach-item">
            <div className="communications-outreach-head">
              <div>
                <span className="communications-type-badge communications-type-badge-sent">Sent</span>
                <span className="communications-type-badge">
                  {playerOutreachTypeLabel(item.invite_type)}
                </span>
                <strong>{item.player_display_name ?? item.player_email}</strong>
                <div className="communications-item-meta">
                  {item.band_name}
                  {item.band_part_title ? ` · ${item.band_part_title}` : null} ·{' '}
                  {formatTimestamp(item.created_at)} · {formatInvitationStatusLabel(item.status)}
                </div>
              </div>
              {isInvitationAwaitingResponse(item.status) ? (
                <div className="communications-item-actions">
                  <button
                    type="button"
                    className="auth-button auth-button-secondary"
                    disabled={revokingId === item.id}
                    onClick={() => {
                      void handleRevoke(item.id);
                    }}
                  >
                    {revokingId === item.id ? 'Revoking…' : 'Revoke'}
                  </button>
                </div>
              ) : null}
            </div>
            {item.message ? (
              <p className="communications-outreach-message">{item.message}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function OutgoingInvitesPanel({
  onChanged,
  hideResolvedInvites = false,
}: OutgoingInvitesPanelProps) {
  const [hasSent, setHasSent] = useState<boolean | null>(null);
  const [hasVisibleSent, setHasVisibleSent] = useState<boolean | null>(null);

  useEffect(() => {
    Promise.all([listMySentBandInvitations(), listMySentPlayerOutreach()])
      .then(([invitations, playerOutreach]) => {
        const allSent = [...invitations, ...playerOutreach];
        setHasSent(allSent.length > 0);
        setHasVisibleSent(
          filterSentInvitations(allSent, hideResolvedInvites).length > 0,
        );
      })
      .catch(() => {
        setHasSent(false);
        setHasVisibleSent(false);
      });
  }, [hideResolvedInvites]);

  if (hasSent === false) {
    return (
      <p className="workspace-empty-note">
        No invites sent yet. Invite players from the player directory or add members by email from a
        band overview.
      </p>
    );
  }

  if (hasVisibleSent === false) {
    return (
      <p className="workspace-empty-note">
        No open sent invites. Turn off “Hide accepted & declined” to see resolved invites.
      </p>
    );
  }

  return (
    <>
      <OutgoingPlayerOutreachPanel
        onChanged={onChanged}
        hideResolvedInvites={hideResolvedInvites}
      />
      <OutgoingBandInvitationsPanel
        onChanged={onChanged}
        hideResolvedInvites={hideResolvedInvites}
      />
    </>
  );
}
