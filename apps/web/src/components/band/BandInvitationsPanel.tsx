import { useEffect, useState, type FormEvent } from 'react';
import {
  createBandInvitation,
  formatBandMemberRoleLabel,
  formatUserWithEmail,
  listBandInvitations,
  revokeBandInvitation,
  type BandInvitation,
} from '@bandie/data';
import { getAppOrigin } from '../../lib/bandieClient';

type BandInvitationsPanelProps = {
  bandId: string;
};

export function BandInvitationsPanel({ bandId }: BandInvitationsPanelProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'member' | 'admin' | 'viewer'>('member');
  const [invitations, setInvitations] = useState<BandInvitation[]>([]);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function loadInvitations() {
    const rows = await listBandInvitations(bandId);
    setInvitations(rows);
  }

  useEffect(() => {
    loadInvitations().catch(() => setInvitations([]));
  }, [bandId]);

  async function handleInvite(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setInviteLink(null);
    setSubmitting(true);

    try {
      const invitation = await createBandInvitation({ bandId, email, role });
      setInviteLink(`${getAppOrigin()}/invite/${invitation.token}`);
      setEmail('');
      await loadInvitations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create invitation.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRevoke(invitationId: string) {
    await revokeBandInvitation(invitationId);
    await loadInvitations();
  }

  return (
    <div className="band-invitations-panel">
      <form className="auth-form workspace-invite-form" onSubmit={handleInvite}>
        {error ? <div className="auth-message auth-message-error">{error}</div> : null}
        {inviteLink ? (
          <div className="auth-message auth-message-success">
            Invitation created. Share this link:
            <br />
            <a href={inviteLink}>{inviteLink}</a>
          </div>
        ) : null}
        <div className="profile-editor-row-grid">
          <div className="auth-field">
            <label htmlFor="inviteEmail">Member email</label>
            <input
              id="inviteEmail"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="auth-field">
            <label htmlFor="inviteRole">Role</label>
            <select id="inviteRole" value={role} onChange={(e) => setRole(e.target.value as typeof role)}>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
        </div>
        <button className="auth-button" type="submit" disabled={submitting}>
          {submitting ? 'Creating invite…' : 'Create invitation'}
        </button>
      </form>

      {invitations.length ? (
        <ul className="invite-list workspace-invite-list">
          {invitations.map((invitation) => (
            <li key={invitation.id}>
              <span>
                {formatUserWithEmail(invitation.invitee_display_name, invitation.email)} ·{' '}
                {formatBandMemberRoleLabel(invitation.role)}
              </span>
              <button
                type="button"
                className="auth-button auth-button-secondary"
                onClick={() => handleRevoke(invitation.id)}
              >
                Revoke
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="workspace-empty-note">No pending invitations.</p>
      )}
    </div>
  );
}
