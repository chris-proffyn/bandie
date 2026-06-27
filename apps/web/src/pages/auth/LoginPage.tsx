import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { signInWithEmail, ensureAppMembership, ensureBandieProfile } from '@bandie/data';
import { AuthLayout, AuthMessage } from '../../components/auth/AuthLayout';
import { PasswordField } from '../../components/auth/PasswordField';
import { routeAfterAuth } from '../../lib/routeAfterAuth';
import { useAuth } from '../../context/AuthContext';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshBands } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const redirectPath =
    (location.state as { from?: string } | null)?.from ??
    new URLSearchParams(location.search).get('redirect') ??
    '/app';
  const intent = new URLSearchParams(location.search).get('intent');

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await signInWithEmail(email, password);
      await ensureAppMembership();
      await ensureBandieProfile();
      await refreshBands();
      const nextPath = await routeAfterAuth({
        intent,
        redirect: redirectPath !== '/app' ? redirectPath : null,
      });
      navigate(nextPath, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout title="Welcome back" lead="Sign in to manage your band workspace.">
      <form className="auth-form" onSubmit={handleSubmit}>
        {error ? <AuthMessage tone="error">{error}</AuthMessage> : null}
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
          autoComplete="current-password"
          required
          value={password}
          onChange={setPassword}
        />
        <button className="auth-button" type="submit" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <div className="auth-links">
        <Link to="/forgot-password">Forgot password?</Link>
        <Link to={`/signup${location.search}`}>Create an account</Link>
      </div>
    </AuthLayout>
  );
}
