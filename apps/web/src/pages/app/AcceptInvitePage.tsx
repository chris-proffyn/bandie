import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  acceptBandInvitation,
  ensureAppMembership,
  ensureBandieProfile,
  resolveInviteTokenType,
  acceptOrganiserInvitation,
  workspaceModeHomePath,
  type InviteTokenType,
} from '@bandie/data';
import { AuthLayout, AuthMessage } from '../../components/auth/AuthLayout';
import { useAuth } from '../../context/AuthContext';

export function AcceptInvitePage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { session, refreshBands, refreshProfile } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [inviteType, setInviteType] = useState<InviteTokenType | null>(null);

  useEffect(() => {
    if (!token) {
      return;
    }

    void resolveInviteTokenType(token)
      .then(setInviteType)
      .catch(() => setInviteType(null));
  }, [token]);

  useEffect(() => {
    if (!session || !token) {
      return;
    }

    let cancelled = false;

    void (async () => {
      setError(null);
      setStatusMessage('Please wait…');

      try {
        await ensureAppMembership();
        const type = await resolveInviteTokenType(token);

        if (cancelled) {
          return;
        }

        if (type === 'band') {
          setStatusMessage('Adding you to the band workspace…');
          await ensureBandieProfile();
          const bandId = await acceptBandInvitation(token);
          await refreshBands();
          navigate(`/app/${bandId}`, { replace: true });
          return;
        }

        if (type === 'organiser') {
          setStatusMessage('Setting up your organiser workspace…');
          await acceptOrganiserInvitation(token);
          await refreshProfile();
          navigate(workspaceModeHomePath('organiser'), { replace: true });
          return;
        }

        throw new Error('Invitation not found or expired.');
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unable to accept invitation.');
          setStatusMessage(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [session, token, navigate, refreshBands, refreshProfile]);

  const isOrganiserInvite = inviteType === 'organiser';

  if (!session) {
    return (
      <AuthLayout
        title={isOrganiserInvite ? 'Join as organiser' : 'Join the band'}
        lead={
          isOrganiserInvite
            ? 'Sign in or create an account to accept this organiser invitation.'
            : 'Sign in or create an account to accept this invitation.'
        }
      >
        <div className="auth-links">
          <Link to={`/login?redirect=${encodeURIComponent(`/invite/${token}`)}`}>Sign in</Link>
          <Link to={`/signup?redirect=${encodeURIComponent(`/invite/${token}`)}`}>Create account</Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title={isOrganiserInvite ? 'Accepting organiser invitation' : 'Accepting invitation'}
      lead={
        isOrganiserInvite
          ? 'We are setting up your organiser workspace.'
          : 'We are adding you to the band workspace.'
      }
    >
      {error ? <AuthMessage tone="error">{error}</AuthMessage> : null}
      {!error && statusMessage ? <p className="auth-lead">{statusMessage}</p> : null}
    </AuthLayout>
  );
}
