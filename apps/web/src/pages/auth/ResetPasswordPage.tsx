import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { updatePassword } from '@bandie/data';
import { AuthLayout, AuthMessage } from '../../components/auth/AuthLayout';
import { PasswordField } from '../../components/auth/PasswordField';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);

    try {
      await updatePassword(password);
      navigate('/app', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update password.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout title="Choose a new password" lead="Enter your new password below.">
      <form className="auth-form" onSubmit={handleSubmit}>
        {error ? <AuthMessage tone="error">{error}</AuthMessage> : null}
        <PasswordField
          id="password"
          label="New password"
          autoComplete="new-password"
          required
          minLength={6}
          value={password}
          onChange={setPassword}
        />
        <PasswordField
          id="confirmPassword"
          label="Confirm password"
          autoComplete="new-password"
          required
          minLength={6}
          value={confirmPassword}
          onChange={setConfirmPassword}
        />
        <button className="auth-button" type="submit" disabled={submitting}>
          {submitting ? 'Updating…' : 'Update password'}
        </button>
      </form>
      <div className="auth-links">
        <Link to="/login">Back to sign in</Link>
      </div>
    </AuthLayout>
  );
}
