import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  acceptAllPendingInvitations,
  acceptBandInvitation,
  formatBandMemberRoleLabel,
  listPendingInvitationsForCurrentUser,
  type PendingBandInvitation,
} from '@bandie/data';
import { useAuth } from '../../context/AuthContext';

export function PendingInvitesPage() {
  const navigate = useNavigate();
  const { refreshBands } = useAuth();
  const [invitations, setInvitations] = useState<PendingBandInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acceptingToken, setAcceptingToken] = useState<string | null>(null);
  const [acceptingAll, setAcceptingAll] = useState(false);

  const loadInvitations = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const pending = await listPendingInvitationsForCurrentUser();
      setInvitations(pending);

      if (pending.length === 0) {
        navigate('/app', { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load invitations.');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadInvitations();
  }, [loadInvitations]);

  async function handleAccept(token: string) {
    setAcceptingToken(token);
    setError(null);

    try {
      await acceptBandInvitation(token);
      await refreshBands();
      await loadInvitations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to accept invitation.');
    } finally {
      setAcceptingToken(null);
    }
  }

  async function handleAcceptAll() {
    if (!invitations.length) {
      return;
    }

    setAcceptingAll(true);
    setError(null);

    try {
      await acceptAllPendingInvitations(invitations);
      await refreshBands();
      navigate('/app', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to accept invitations.');
      await loadInvitations();
    } finally {
      setAcceptingAll(false);
    }
  }

  if (loading) {
    return (
      <div className="panel">
        <p>Checking for band invitations…</p>
      </div>
    );
  }

  return (
    <div className="panel" style={{ maxWidth: 720 }}>
      <h2>Band invitations waiting for you</h2>
      <p>
        You have {invitations.length} open {invitations.length === 1 ? 'invitation' : 'invitations'}.
        Accept to join the band workspace immediately.
      </p>

      {error ? <div className="auth-message auth-message-error">{error}</div> : null}

      <ul className="invite-list">
        {invitations.map((invitation) => (
          <li key={invitation.id}>
            <div>
              <strong>{invitation.band_name}</strong>
              <div style={{ color: '#bbb6aa', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                Join as {formatBandMemberRoleLabel(invitation.role)}
              </div>
            </div>
            <button
              type="button"
              className="auth-button auth-button-secondary"
              disabled={acceptingAll || acceptingToken === invitation.token}
              onClick={() => handleAccept(invitation.token)}
            >
              {acceptingToken === invitation.token ? 'Accepting…' : 'Accept'}
            </button>
          </li>
        ))}
      </ul>

      <div className="auth-links" style={{ marginTop: '1.5rem' }}>
        <button
          type="button"
          className="auth-button"
          disabled={acceptingAll || Boolean(acceptingToken)}
          onClick={handleAcceptAll}
        >
          {acceptingAll ? 'Accepting all…' : 'Accept all invitations'}
        </button>
        <Link to="/app">Skip for now</Link>
      </div>
    </div>
  );
}
