import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { acceptBandInvitation, ensureAppMembership, ensureBandieProfile } from '@bandie/data';
import { AuthLayout, AuthMessage } from '../../components/auth/AuthLayout';
import { useAuth } from '../../context/AuthContext';

export function AcceptInvitePage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { session, refreshBands } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    if (!session || !token || accepting) {
      return;
    }

    setAccepting(true);
    ensureAppMembership()
      .then(() => ensureBandieProfile())
      .then(() => acceptBandInvitation(token))
      .then(async (bandId) => {
        await refreshBands();
        navigate(`/app/${bandId}`, { replace: true });
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Unable to accept invitation.');
        setAccepting(false);
      });
  }, [session, token, accepting, navigate, refreshBands]);

  if (!session) {
    return (
      <AuthLayout
        title="Join the band"
        lead="Sign in or create an account to accept this invitation."
      >
        <div className="auth-links">
          <Link to={`/login?redirect=${encodeURIComponent(`/invite/${token}`)}`}>Sign in</Link>
          <Link to={`/signup?redirect=${encodeURIComponent(`/invite/${token}`)}`}>Create account</Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Accepting invitation" lead="We are adding you to the band workspace.">
      {error ? <AuthMessage tone="error">{error}</AuthMessage> : <p className="auth-lead">Please wait…</p>}
    </AuthLayout>
  );
}
