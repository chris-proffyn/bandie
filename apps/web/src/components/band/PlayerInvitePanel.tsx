import { useState, type FormEvent } from 'react';
import {
  createPlayerOutreach,
  playerOutreachTypeLabel,
  type PlayerOutreachType,
} from '@bandie/data';
import type { FindPlayersContext } from '../../lib/findPlayersNavigation';
import { findPlayersContextLabel } from '../../lib/findPlayersNavigation';

type PlayerInvitePanelProps = {
  playerProfileId: string;
  playerName: string;
  findPlayers: FindPlayersContext;
};

export function PlayerInvitePanel({
  playerProfileId,
  playerName,
  findPlayers,
}: PlayerInvitePanelProps) {
  const [inviteType, setInviteType] = useState<PlayerOutreachType>('join');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await createPlayerOutreach({
        bandId: findPlayers.bandId,
        playerProfileId,
        inviteType,
        bandPartId: findPlayers.partId ?? null,
        message: message.trim() || null,
      });

      setSuccess(
        inviteType === 'join'
          ? `Join invitation sent to ${playerName}. They can accept from their Bandie communications.`
          : `Audition invite recorded for ${playerName}. Follow up using their profile details.`,
      );
      setMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send invite.');
    } finally {
      setSubmitting(false);
    }
  }

  const roleLabel = findPlayersContextLabel(findPlayers);

  return (
    <section className="workspace-section panel workspace-player-invite-panel">
      <h2>Invite {playerName}</h2>
      <p className="workspace-section-intro">
        Recruiting for <strong>{findPlayers.bandName ?? 'your band'}</strong>
        {findPlayers.partTitle ? (
          <>
            {' '}
            · <strong>{findPlayers.partTitle}</strong>
          </>
        ) : null}
        {findPlayers.instrument ? <> · matching {findPlayers.instrument}</> : null}
      </p>

      <form className="auth-form" onSubmit={handleSubmit}>
        {error ? <div className="auth-message auth-message-error">{error}</div> : null}
        {success ? <div className="auth-message auth-message-success">{success}</div> : null}

        <div className="auth-field">
          <span className="directory-filter-label">Invitation type</span>
          <div className="directory-mode-toggle">
            <button
              type="button"
              className={`directory-mode-btn ${inviteType === 'join' ? 'active' : ''}`}
              onClick={() => setInviteType('join')}
            >
              Join the band
            </button>
            <button
              type="button"
              className={`directory-mode-btn ${inviteType === 'audition' ? 'active' : ''}`}
              onClick={() => setInviteType('audition')}
            >
              Audition
            </button>
          </div>
          <p className="directory-field-hint">
            {inviteType === 'join'
              ? 'Sends a band membership invitation the player can accept in Bandie.'
              : `Records an audition invite for the ${roleLabel} role. Add a message with your audition details.`}
          </p>
        </div>

        <div className="auth-field">
          <label htmlFor="playerInviteMessage">Message (optional)</label>
          <textarea
            id="playerInviteMessage"
            rows={3}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder={
              inviteType === 'audition'
                ? 'e.g. We rehearse Tuesday evenings in Guildford. Can you make an audition on 12 July?'
                : 'e.g. We are looking for a permanent bassist to join our covers band.'
            }
          />
        </div>

        <button type="submit" className="auth-button" disabled={submitting}>
          {submitting ? 'Sending…' : `Send ${playerOutreachTypeLabel(inviteType).toLowerCase()}`}
        </button>
      </form>
    </section>
  );
}
