import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getCurrentUserProfile, type UserProfile } from '@bandie/data';
import { useAuth } from '../../context/AuthContext';
import { AdminModePanel } from '../../components/profile/AdminModePanel';
import { BillingPanel } from '../../components/profile/BillingPanel';
import { WorkspaceModePanel } from '../../components/profile/WorkspaceModePanel';
import { UserProfileEditor } from '../../components/profile/UserProfileEditor';
import '../../styles/bandProfile.css';

const PROFILE_FORM_ID = 'player-profile-form';

function profilePageTitle(profile: UserProfile): string {
  if (profile.is_player && profile.is_organiser) {
    return 'Your profile';
  }

  if (profile.is_organiser) {
    return 'Your organiser profile';
  }

  return 'Your player profile';
}

function profilePageIntro(profile: UserProfile): string {
  if (profile.is_organiser && !profile.is_player) {
    return 'Your organiser identity on Bandie — used when browsing bands and managing booking discovery.';
  }

  if (profile.is_player && profile.is_organiser) {
    return 'Your identity across Bandie as a musician and event organiser.';
  }

  return 'Your musician identity across Bandie — how bandmates and organisers see you.';
}

export function UserProfilePage() {
  const { user, profile, refreshProfile, isAppAdmin, workspaceMode } = useAuth();
  const [searchParams] = useSearchParams();
  const [formProfile, setFormProfile] = useState<UserProfile | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const billingNotice = useMemo(() => {
    const result = searchParams.get('billing');
    if (result === 'success') {
      return 'Payment received. Your plan will update shortly once Stripe confirms the subscription.';
    }
    if (result === 'cancelled') {
      return 'Checkout was cancelled. No charge was made.';
    }
    return null;
  }, [searchParams]);

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
        <div className="user-profile-page-header">
          <div>
            <h2>{profilePageTitle(formProfile)}</h2>
            <p className="user-profile-page-intro">
              {profilePageIntro(formProfile)}{' '}
              {workspaceMode === 'organiser' || (formProfile.is_organiser && !formProfile.is_player) ? (
                <>
                  <Link to="/app/bands" className="profile-preview-link">
                    Browse the band directory
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/app/bands" className="profile-preview-link">
                    Browse the band directory
                  </Link>{' '}
                  or{' '}
                  <Link to="/app/players" className="profile-preview-link">
                    find players
                  </Link>
                </>
              )}
            </p>
          </div>
          <button
            className="auth-button user-profile-page-save"
            type="submit"
            form={PROFILE_FORM_ID}
            disabled={submitting}
          >
            {submitting ? 'Saving profile…' : 'Save profile'}
          </button>
        </div>

        {isAppAdmin ? <AdminModePanel /> : null}
        <WorkspaceModePanel />

        <BillingPanel
          showLeaderPlans={formProfile.is_player !== false}
          showOrganiserPlans={Boolean(formProfile.is_organiser)}
          billingNotice={billingNotice}
        />

        <UserProfileEditor
          variant="self"
          profile={formProfile}
          accountEmail={user?.email}
          formId={PROFILE_FORM_ID}
          onSaved={setFormProfile}
          onRefreshAuth={refreshProfile}
          onSubmittingChange={setSubmitting}
        />
      </div>
    </div>
  );
}
