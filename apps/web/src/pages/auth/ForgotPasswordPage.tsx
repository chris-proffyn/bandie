import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { requestPasswordReset } from '@bandie/data';
import { AuthLayout, AuthMessage } from '../../components/auth/AuthLayout';
import { getAppOrigin } from '../../lib/bandieClient';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      await requestPasswordReset(email, `${getAppOrigin()}/reset-password`);
      setSuccess('If an account exists for that email, a reset link has been sent.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send reset email.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout title="Reset your password" lead="We will email you a link to choose a new password.">
      <form className="auth-form" onSubmit={handleSubmit}>
        {error ? <AuthMessage tone="error">{error}</AuthMessage> : null}
        {success ? <AuthMessage tone="success">{success}</AuthMessage> : null}
        <div className="auth-field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <button className="auth-button" type="submit" disabled={submitting}>
          {submitting ? 'Sending…' : 'Send reset link'}
        </button>
      </form>
      <div className="auth-links">
        <Link to="/login">Back to sign in</Link>
      </div>
    </AuthLayout>
  );
}
