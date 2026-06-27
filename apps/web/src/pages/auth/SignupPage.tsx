import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ensureAppMembership, ensureBandieProfile, signUpAndSignInWithEmail } from '@bandie/data';
import { AuthLayout, AuthMessage } from '../../components/auth/AuthLayout';
import { PasswordField } from '../../components/auth/PasswordField';
import { routeAfterAuth } from '../../lib/routeAfterAuth';
import { useAuth } from '../../context/AuthContext';

export function SignupPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshBands } = useAuth();
  const intent = searchParams.get('intent');
  const redirect = searchParams.get('redirect');

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
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
      await signUpAndSignInWithEmail(email, password, displayName);
      await ensureAppMembership();
      await ensureBandieProfile(displayName);
      await refreshBands();
      const nextPath = await routeAfterAuth({ intent, redirect });
      navigate(nextPath, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create account.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Create your Bandie account"
      lead={
        intent === 'create-band'
          ? 'Start with a free account, then create your band page and workspace.'
          : intent === 'player-profile'
            ? 'Create your account, then build your player profile for the directory.'
            : 'Join Bandie to organise songs, setlists, gigs and availability.'
      }
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        {error ? <AuthMessage tone="error">{error}</AuthMessage> : null}
        <div className="auth-field">
          <label htmlFor="displayName">Your name</label>
          <input
            id="displayName"
            type="text"
            autoComplete="name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </div>
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
        <PasswordField
          id="password"
          label="Password"
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
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>
      <div className="auth-links">
        <Link to={`/login${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}>
          Already have an account? Sign in
        </Link>
      </div>
    </AuthLayout>
  );
}
