import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCurrentUserProfile, type UserProfile } from '@bandie/data';
import { useAuth } from '../../context/AuthContext';
import { UserProfileEditor } from '../../components/profile/UserProfileEditor';
import '../../styles/bandProfile.css';

export function UserProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const [formProfile, setFormProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    getCurrentUserProfile()
      .then((result) => {
        if (result) {
          setFormProfile(result);
        }
      })
      .catch(() => setFormProfile(null));
  }, [profile]);

  if (!formProfile) {
    return (
      <div className="user-profile-page">
        <div className="panel" style={{ maxWidth: 820 }}>
          <p>Loading profile…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="user-profile-page">
      <div className="panel" style={{ maxWidth: 820 }}>
        <h2>Your player profile</h2>
        <p>
          This is your musician identity across Bandie — how bandmates and organisers see you. Your
          display name appears in the app shell and workspace.{' '}
          <Link to="/app/bands" className="profile-preview-link">
            Browse the band directory
          </Link>{' '}
          or{' '}
          <Link to="/app/players" className="profile-preview-link">
            find players
          </Link>
        </p>

        <UserProfileEditor
          variant="self"
          profile={formProfile}
          accountEmail={user?.email}
          onSaved={setFormProfile}
          onRefreshAuth={refreshProfile}
        />
      </div>
    </div>
  );
}
