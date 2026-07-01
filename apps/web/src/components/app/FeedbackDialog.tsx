import { useEffect, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { submitFeedback } from '@bandie/data';
import '../../styles/gigs.css';

type FeedbackDialogProps = {
  open: boolean;
  onClose: () => void;
  displayName: string;
  email: string | null;
  pageUrl: string;
};

export function FeedbackDialog({
  open,
  onClose,
  displayName,
  email,
  pageUrl,
}: FeedbackDialogProps) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setSubject('');
    setMessage('');
    setError(null);
    setSent(false);
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await submitFeedback({
        subject: subject.trim() || undefined,
        message,
        pageUrl,
      });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send feedback.');
    } finally {
      setSubmitting(false);
    }
  }

  return createPortal(
    <div className="gigs-dialog-backdrop" role="presentation" onClick={onClose}>
      <div
        className="gigs-dialog surface-light feedback-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-dialog-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="gigs-dialog-header">
          <h2 id="feedback-dialog-title">Send feedback</h2>
          <button type="button" className="gigs-dialog-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        {sent ? (
          <div className="gigs-dialog-body">
            <p className="auth-message auth-message-success">Thanks — your feedback has been sent.</p>
            <div className="songs-form-actions">
              <button type="button" className="directory-btn directory-btn-primary" onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        ) : (
          <form className="gigs-dialog-body auth-form" onSubmit={handleSubmit}>
            <p>Tell us what is working, what is not, or what you would like to see next in Bandie.</p>

            <div className="band-profile-booking-sender">
              <p className="band-profile-booking-sender-label">From</p>
              <dl className="band-profile-booking-sender-grid">
                <div>
                  <dt>Name</dt>
                  <dd>{displayName}</dd>
                </div>
                {email ? (
                  <div>
                    <dt>Email</dt>
                    <dd>{email}</dd>
                  </div>
                ) : null}
              </dl>
            </div>

            <div className="auth-field">
              <label htmlFor="feedback-subject">Subject (optional)</label>
              <input
                id="feedback-subject"
                type="text"
                value={subject}
                maxLength={160}
                autoComplete="off"
                placeholder="What is this about?"
                onChange={(event) => setSubject(event.target.value)}
              />
            </div>

            <div className="auth-field">
              <label htmlFor="feedback-message">Message</label>
              <textarea
                id="feedback-message"
                value={message}
                required
                rows={6}
                maxLength={5000}
                placeholder="Share your feedback…"
                onChange={(event) => setMessage(event.target.value)}
              />
            </div>

            {error ? <div className="auth-message auth-message-error">{error}</div> : null}

            <div className="songs-form-actions">
              <button type="button" className="directory-btn directory-btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="directory-btn directory-btn-primary" disabled={submitting}>
                {submitting ? 'Sending…' : 'Send feedback'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body,
  );
}
