import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listPendingInvitationsForCurrentUser } from '@bandie/data';
import { useAuth } from '../../context/AuthContext';
import { WorkspaceBandCard } from '../../components/bands/WorkspaceBandCard';
import '../../styles/directory.css';

export function AppEntryPage() {
  const navigate = useNavigate();
  const { bands, loading, displayName } = useAuth();
  const [checkingInvites, setCheckingInvites] = useState(true);

  useEffect(() => {
    if (loading) {
      return;
    }

    listPendingInvitationsForCurrentUser()
      .then((pending) => {
        if (pending.length > 0) {
          navigate('/app/invites', { replace: true });
        }
      })
      .finally(() => setCheckingInvites(false));
  }, [loading, navigate]);

  if (loading || checkingInvites) {
    return (
      <div className="my-bands-page">
        <div className="panel">
          <p>Loading your bands…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="my-bands-page">
      <header className="my-bands-header">
        <div>
          <p className="my-bands-eyebrow">Signed in as {displayName}</p>
          <h1>Your bands</h1>
          <p className="my-bands-lead">
            {bands.length
              ? 'Open a band workspace to manage your profile, members, and upcoming tools.'
              : 'Create a band or accept an invitation to get started.'}
          </p>
        </div>
        <div className="my-bands-header-actions">
          <Link to="/app/players" className="directory-btn directory-btn-secondary">
            Find players
          </Link>
          <Link to="/app/bands" className="directory-btn directory-btn-secondary">
            Browse band directory
          </Link>
          <Link to="/app/bands/new" className="directory-btn directory-btn-primary">
            Create a band
          </Link>
        </div>
      </header>

      {bands.length === 0 ? (
        <div className="directory-empty-state">
          <strong>No bands yet</strong>
          <p>
            You are not a member of any bands. Create your own band workspace or ask a band leader to
            send you an invitation.
          </p>
          <Link to="/app/bands/new" className="directory-btn directory-btn-primary">
            Create your first band
          </Link>
          <Link to="/app/players" className="directory-btn directory-btn-secondary" style={{ marginTop: '0.75rem' }}>
            Find players
          </Link>
          <Link to="/app/bands" className="directory-btn directory-btn-secondary" style={{ marginTop: '0.75rem' }}>
            Browse band directory
          </Link>
        </div>
      ) : (
        <>
          <p className="my-bands-count">
            {bands.length} {bands.length === 1 ? 'band' : 'bands'}
          </p>
          <div className="directory-band-grid my-bands-grid">
            {bands.map((band) => (
              <WorkspaceBandCard key={band.id} band={band} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
