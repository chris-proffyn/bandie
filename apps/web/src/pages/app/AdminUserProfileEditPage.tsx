import { useEffect, useState } from 'react';
import { Navigate, useLocation, useParams } from 'react-router-dom';
import { getUserProfileById, resolveDisplayName, type UserProfile } from '@bandie/data';
import { useAuth } from '../../context/AuthContext';
import { BackLink } from '../../components/navigation/BackLink';
import { UserProfileEditor } from '../../components/profile/UserProfileEditor';
import {
  buildPlayerDirectoryBackState,
  WORKSPACE_PLAYER_DIRECTORY_DEFAULTS,
} from '../../lib/playerDirectoryNavigation';
import '../../styles/bandProfile.css';
import '../../styles/workspace.css';

const ADMIN_PROFILE_FORM_ID = 'admin-player-profile-form';

export function AdminUserProfileEditPage() {
  const { profileId } = useParams();
  const location = useLocation();
  const { adminModeActive } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!profileId || !adminModeActive) {
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
  }, [profileId, adminModeActive]);

  if (!adminModeActive) {
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
    const directoryBackState = buildPlayerDirectoryBackState(
      'workspace',
      WORKSPACE_PLAYER_DIRECTORY_DEFAULTS,
      location.state,
    );

    return (
      <div className="user-profile-page">
        <div className="panel" style={{ maxWidth: 820 }}>
          <BackLink
            fallbackTo="/app/players"
            workspaceFallbackTo="/app/players"
            label="Back to player directory"
            navigationState={directoryBackState}
          />
          <h2>Profile unavailable</h2>
          <p>{error ?? 'This profile could not be loaded.'}</p>
        </div>
      </div>
    );
  }

  const displayName = resolveDisplayName(profile);
  const directoryBackState = buildPlayerDirectoryBackState(
    'workspace',
    WORKSPACE_PLAYER_DIRECTORY_DEFAULTS,
    location.state,
  );

  return (
    <div className="user-profile-page">
      <div className="panel" style={{ maxWidth: 820 }}>
        <BackLink
          fallbackTo="/app/players"
          workspaceFallbackTo="/app/players"
          label="Back to player directory"
          navigationState={directoryBackState}
        />
        <div className="workspace-section-header" style={{ marginTop: '1rem' }}>
          <div>
            <h2>Edit player profile</h2>
            <p>
              Editing <strong>{displayName}</strong> as a Bandie admin. Changes apply to their
              workspace and public player directory listing.
            </p>
          </div>
          <div className="user-profile-page-header-actions">
            <button
              className="auth-button user-profile-page-save"
              type="submit"
              form={ADMIN_PROFILE_FORM_ID}
              disabled={submitting}
            >
              {submitting ? 'Saving profile…' : 'Save profile'}
            </button>
            <span className="app-admin-badge">Admin</span>
          </div>
        </div>

        <UserProfileEditor
          variant="admin"
          profile={profile}
          formId={ADMIN_PROFILE_FORM_ID}
          onSaved={setProfile}
          onSubmittingChange={setSubmitting}
        />
      </div>
    </div>
  );
}
