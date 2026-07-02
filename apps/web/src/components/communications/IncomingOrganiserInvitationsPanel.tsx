import { useCallback, useEffect, useState } from 'react';
import {
  acceptOrganiserInvitation,
  declineOrganiserInvitation,
  listPendingOrganiserInvitationsForCurrentUser,
  type PendingOrganiserInvitation,
} from '@bandie/data';
import { useAuth } from '../../context/AuthContext';
import { HeadingWithHelp } from '../ui/InfoHelp';

type IncomingOrganiserInvitationsPanelProps = {
  onChanged?: () => void;
};

export function IncomingOrganiserInvitationsPanel({
  onChanged,
}: IncomingOrganiserInvitationsPanelProps) {
  const { refreshProfile } = useAuth();
  const [invitations, setInvitations] = useState<PendingOrganiserInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actingToken, setActingToken] = useState<string | null>(null);

  const loadInvitations = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      setInvitations(await listPendingOrganiserInvitationsForCurrentUser());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load organiser invitations.');
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
      await acceptOrganiserInvitation(token);
      await refreshProfile();
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
      await declineOrganiserInvitation(token);
      await loadInvitations();
      onChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to decline invitation.');
    } finally {
      setActingToken(null);
    }
  }

  if (loading) {
    return null;
  }

  if (invitations.length === 0) {
    return null;
  }

  return (
    <section className="panel communications-section">
      <div className="communications-section-head">
        <div>
          <HeadingWithHelp
            as="h2"
            helpLabel="About organiser invitations"
            help={<p>Platform invitations to join Bandie as an event organiser.</p>}
          >
            Organiser invitations
          </HeadingWithHelp>
        </div>
        <span className="communications-count-badge">{invitations.length}</span>
      </div>

      {error ? <div className="auth-message auth-message-error">{error}</div> : null}

      <ul className="invite-list workspace-invite-list">
        {invitations.map((invitation) => (
          <li key={invitation.id}>
            <span>
              Organiser workspace invitation · expires{' '}
              {new Date(invitation.expires_at).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
            <div className="communications-item-actions">
              <button
                type="button"
                className="auth-button auth-button-secondary"
                disabled={actingToken === invitation.token}
                onClick={() => void handleDecline(invitation.token)}
              >
                {actingToken === invitation.token ? 'Working…' : 'Decline'}
              </button>
              <button
                type="button"
                className="auth-button"
                disabled={actingToken === invitation.token}
                onClick={() => void handleAccept(invitation.token)}
              >
                {actingToken === invitation.token ? 'Working…' : 'Accept'}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
