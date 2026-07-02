import { useCallback, useEffect, useState, type FormEvent } from 'react';
import {
  createOrganiserInvitation,
  listOrganiserInvitationsForAdmin,
  revokeOrganiserInvitation,
  type OrganiserInvitation,
} from '@bandie/data';
import { getAppOrigin } from '../../lib/bandieClient';
import { HeadingWithHelp } from '../ui/InfoHelp';

function formatUserWithEmail(displayName: string | null | undefined, email: string): string {
  if (displayName?.trim()) {
    return `${displayName.trim()} (${email})`;
  }
  return email;
}

export function AdminOrganiserInvitesPanel() {
  const [email, setEmail] = useState('');
  const [invitations, setInvitations] = useState<OrganiserInvitation[]>([]);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadInvitations = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      setInvitations(await listOrganiserInvitationsForAdmin());
    } catch (err) {
      setInvitations([]);
      setError(err instanceof Error ? err.message : 'Unable to load organiser invitations.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadInvitations();
  }, [loadInvitations]);

  async function handleInvite(event: FormEvent) {
    event.preventDefault();
    if (!email.trim()) {
      return;
    }

    setSubmitting(true);
    setError(null);
    setInviteLink(null);

    try {
      const invitation = await createOrganiserInvitation(email);
      setInviteLink(`${getAppOrigin()}/invite/${invitation.token}`);
      setEmail('');
      await loadInvitations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create organiser invitation.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRevoke(invitationId: string) {
    setError(null);

    try {
      await revokeOrganiserInvitation(invitationId);
      await loadInvitations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to revoke invitation.');
    }
  }

  const pendingInvitations = invitations.filter((row) => row.status === 'pending');

  return (
    <section className="panel">
      <p className="my-bands-eyebrow">Organisers</p>
      <HeadingWithHelp
        as="h2"
        helpLabel="About organiser invites"
        help={
          <p>
            Invite someone to join Bandie as an event organiser. Share the invite link with the email
            address you enter — the same one-to-one token pattern as band member invitations.
          </p>
        }
      >
        Invite organiser
      </HeadingWithHelp>

      <form className="auth-form workspace-invite-form" onSubmit={handleInvite}>
        {error ? <div className="auth-message auth-message-error">{error}</div> : null}
        {inviteLink ? (
          <div className="auth-message auth-message-success">
            Organiser invitation created. Share this link with the invitee:
            <br />
            <a href={inviteLink}>{inviteLink}</a>
          </div>
        ) : null}

        <div className="auth-field">
          <label htmlFor="adminOrganiserInviteEmail">Organiser email</label>
          <input
            id="adminOrganiserInviteEmail"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@example.com"
          />
        </div>

        <button type="submit" className="auth-button" disabled={submitting}>
          {submitting ? 'Creating invite…' : 'Create organiser invitation'}
        </button>
      </form>

      <h3>Organiser invitations</h3>
      {loading ? <p className="workspace-empty-note">Loading…</p> : null}
      {!loading && pendingInvitations.length === 0 ? (
        <p className="workspace-empty-note">No pending organiser invitations.</p>
      ) : null}
      {pendingInvitations.length > 0 ? (
        <ul className="invite-list workspace-invite-list">
          {pendingInvitations.map((invitation) => (
            <li key={invitation.id}>
              <span>
                {formatUserWithEmail(invitation.invitee_display_name, invitation.email)} · pending
                · expires{' '}
                {new Date(invitation.expires_at).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
              <button
                type="button"
                className="auth-button auth-button-secondary"
                onClick={() => void handleRevoke(invitation.id)}
              >
                Revoke
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
