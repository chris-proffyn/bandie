import { useEffect, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { sendDirectMessageToUser, isEntitlementGateError, type GateDecision } from '@bandie/data';
import { UpgradePromptModal } from '../entitlements/UpgradePromptModal';
import '../../styles/gigs.css';

export type DirectMessageRecipient = {
  userId: string;
  displayName: string;
  username: string | null;
};

export type DirectMessageSender = {
  displayName: string;
  username: string | null;
  email?: string | null;
};

type DirectMessageModalProps = {
  open: boolean;
  onClose: () => void;
  sender: DirectMessageSender;
  recipient: DirectMessageRecipient;
  onSent?: () => void;
};

export function DirectMessageModal({
  open,
  onClose,
  sender,
  recipient,
  onSent,
}: DirectMessageModalProps) {
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [upgradeDecision, setUpgradeDecision] = useState<GateDecision | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    setBody('');
    setError(null);
    setUpgradeDecision(null);
  }, [open, recipient.userId]);

  if (!open) {
    return null;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setUpgradeDecision(null);

    try {
      await sendDirectMessageToUser(recipient.userId, body);
      onSent?.();
      onClose();
    } catch (err) {
      if (isEntitlementGateError(err)) {
        setUpgradeDecision(err.decision);
        return;
      }

      setError(err instanceof Error ? err.message : 'Unable to send message.');
    } finally {
      setSubmitting(false);
    }
  }

  return createPortal(
    <div className="gigs-dialog-backdrop" role="presentation" onClick={onClose}>
      <div
        className="gigs-dialog surface-light"
        role="dialog"
        aria-modal="true"
        aria-labelledby="direct-message-dialog-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="gigs-dialog-header">
          <h2 id="direct-message-dialog-title">Message this player</h2>
          <button type="button" className="gigs-dialog-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        <form className="gigs-dialog-body" onSubmit={handleSubmit}>
          <p>Send a direct message. It will appear in Communications for both of you.</p>

          <div className="band-profile-booking-sender">
            <p className="band-profile-booking-sender-label">From</p>
            <dl className="band-profile-booking-sender-grid">
              <div>
                <dt>Name</dt>
                <dd>{sender.displayName}</dd>
              </div>
              {sender.username ? (
                <div>
                  <dt>Bandie</dt>
                  <dd>@{sender.username}</dd>
                </div>
              ) : null}
              {sender.email ? (
                <div>
                  <dt>Email</dt>
                  <dd>{sender.email}</dd>
                </div>
              ) : null}
            </dl>
          </div>

          <div className="band-profile-booking-sender">
            <p className="band-profile-booking-sender-label">To</p>
            <dl className="band-profile-booking-sender-grid">
              <div>
                <dt>Name</dt>
                <dd>{recipient.displayName}</dd>
              </div>
              {recipient.username ? (
                <div>
                  <dt>Bandie</dt>
                  <dd>@{recipient.username}</dd>
                </div>
              ) : null}
            </dl>
          </div>

          <div className="auth-field">
            <label htmlFor="direct-message-body">Message</label>
            <textarea
              id="direct-message-body"
              rows={5}
              placeholder="Say hello, ask about availability, or follow up on a gig…"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              required
            />
          </div>

          {error ? <p className="gigs-dialog-error">{error}</p> : null}

          <p className="gigs-dialog-note">
            Replies and new messages are managed in{' '}
            <Link to="/app/communications" onClick={onClose}>
              Communications
            </Link>
            .
          </p>

          <div className="gigs-dialog-actions">
            <button type="button" className="directory-btn directory-btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="directory-btn directory-btn-primary"
              disabled={submitting || !body.trim()}
            >
              {submitting ? 'Sending…' : 'Send message'}
            </button>
          </div>
        </form>

        {upgradeDecision ? (
          <UpgradePromptModal decision={upgradeDecision} onClose={() => setUpgradeDecision(null)} />
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
