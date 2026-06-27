import { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { getUserProfileById, resolveDisplayName, type UserProfile } from '@bandie/data';
import { useAuth } from '../../context/AuthContext';
import { BackLink } from '../../components/navigation/BackLink';
import { UserProfileEditor } from '../../components/profile/UserProfileEditor';
import '../../styles/bandProfile.css';
import '../../styles/workspace.css';

export function AdminUserProfileEditPage() {
  const { profileId } = useParams();
  const { isAppAdmin } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profileId || !isAppAdmin) {
      setLoading(false);
      return;
    }

    setLoading(true);
    getUserProfileById(profileId)
      .then((result) => {
        if (!result) {
          setError('Profile not found.');
          return;
        }
        setProfile(result);
        setError(null);
      })
      .catch((err) => {
        setProfile(null);
        setError(err instanceof Error ? err.message : 'Unable to load profile.');
      })
      .finally(() => setLoading(false));
  }, [profileId, isAppAdmin]);

  if (!isAppAdmin) {
    return <Navigate to="/app" replace />;
  }

  if (loading) {
    return (
      <div className="user-profile-page">
        <div className="panel" style={{ maxWidth: 820 }}>
          <p>Loading profile…</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="user-profile-page">
        <div className="panel" style={{ maxWidth: 820 }}>
          <BackLink fallbackTo="/app/players" workspaceFallbackTo="/app/players" label="Back to player directory" />
          <h2>Profile unavailable</h2>
          <p>{error ?? 'This profile could not be loaded.'}</p>
        </div>
      </div>
    );
  }

  const displayName = resolveDisplayName(profile);

  return (
    <div className="user-profile-page">
      <div className="panel" style={{ maxWidth: 820 }}>
        <BackLink fallbackTo="/app/players" workspaceFallbackTo="/app/players" label="Back to player directory" />
        <div className="workspace-section-header" style={{ marginTop: '1rem' }}>
          <div>
            <h2>Edit player profile</h2>
            <p>
              Editing <strong>{displayName}</strong> as a Bandie admin. Changes apply to their
              workspace and public player directory listing.
            </p>
          </div>
          <span className="app-admin-badge">Admin</span>
        </div>

        <UserProfileEditor variant="admin" profile={profile} onSaved={setProfile} />
      </div>
    </div>
  );
}
