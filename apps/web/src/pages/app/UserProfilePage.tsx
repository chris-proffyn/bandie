import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getCurrentUserProfile, listUserSubscriptions, type UserProfile } from '@bandie/data';
import { useAuth } from '../../context/AuthContext';
import { usePlayerWorkspaceAccess } from '../../hooks/usePlayerWorkspaceAccess';
import { AdminModePanel } from '../../components/profile/AdminModePanel';
import { BillingPanel } from '../../components/profile/BillingPanel';
import { WorkspaceModePanel } from '../../components/profile/WorkspaceModePanel';
import { UserProfileEditor } from '../../components/profile/UserProfileEditor';
import {
  PlayerProfilePreview,
  playerProfilePreviewFromUserProfile,
} from '../../components/profile/PlayerProfilePreview';
import { ProfileCollapsibleSection } from '../../components/profile/ProfileCollapsibleSection';
import { HeadingWithHelp } from '../../components/ui/InfoHelp';
import { resolveWorkspacePlanPill } from '../../lib/planPill';
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
  const { access: playerAccess } = usePlayerWorkspaceAccess();
  const [searchParams] = useSearchParams();
  const [formProfile, setFormProfile] = useState<UserProfile | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [planPill, setPlanPill] = useState<ReturnType<typeof resolveWorkspacePlanPill> | null>(null);

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

  useEffect(() => {
    listUserSubscriptions()
      .then((subscriptions) => setPlanPill(resolveWorkspacePlanPill(subscriptions, workspaceMode)))
      .catch(() => setPlanPill(resolveWorkspacePlanPill([], workspaceMode)));
  }, [workspaceMode, profile]);

  const planPillTitle = useMemo(() => {
    if (!planPill) {
      return undefined;
    }

    if (planPill.planName) {
      return `${planPill.planName} plan`;
    }

    return `${planPill.label} plan`;
  }, [planPill]);

  if (!formProfile) {
    return (
      <div className="user-profile-page">
        <div className="panel user-profile-page-panel">
          <p>Loading profile…</p>
        </div>
      </div>
    );
  }

  const previewData = playerProfilePreviewFromUserProfile(formProfile, user?.email);

  return (
    <div className="user-profile-page">
      <div className="panel user-profile-page-panel">
        <header className="user-profile-page-header">
          <div>
            <HeadingWithHelp
              as="h2"
              helpLabel="About your profile"
              help={<p>{profilePageIntro(formProfile)}</p>}
            >
              {profilePageTitle(formProfile)}
            </HeadingWithHelp>
            <p className="user-profile-page-intro">
              {workspaceMode === 'organiser' || (formProfile.is_organiser && !formProfile.is_player) ? (
                playerAccess.canBrowseBandDirectory ? (
                  <Link to="/app/bands" className="profile-preview-link">
                    Browse the band directory
                  </Link>
                ) : null
              ) : (
                <>
                  {playerAccess.canBrowseBandDirectory ? (
                    <Link to="/app/bands" className="profile-preview-link">
                      Browse the band directory
                    </Link>
                  ) : null}
                  {playerAccess.canBrowseBandDirectory && playerAccess.canBrowsePlayerDirectory
                    ? ' or '
                    : null}
                  {playerAccess.canBrowsePlayerDirectory ? (
                    <Link to="/app/players" className="profile-preview-link">
                      find players
                    </Link>
                  ) : null}
                </>
              )}
            </p>
          </div>
        </header>

        <PlayerProfilePreview
          data={previewData}
          planPill={
            planPill
              ? {
                  label: planPill.label,
                  tone: planPill.tone,
                  title: planPillTitle,
                }
              : null
          }
        />

        <ProfileCollapsibleSection
          title="Edit profile"
          summary="Photo, identity, gear, invitations, and workspace settings"
          actions={
            <button
              className="auth-button user-profile-page-save"
              type="submit"
              form={PROFILE_FORM_ID}
              disabled={submitting}
            >
              {submitting ? 'Saving profile…' : 'Save profile'}
            </button>
          }
        >
          {isAppAdmin ? <AdminModePanel /> : null}
          <WorkspaceModePanel />
          <UserProfileEditor
            variant="self"
            profile={formProfile}
            accountEmail={user?.email}
            formId={PROFILE_FORM_ID}
            onSaved={setFormProfile}
            onRefreshAuth={refreshProfile}
            onSubmittingChange={setSubmitting}
          />
        </ProfileCollapsibleSection>

        <ProfileCollapsibleSection
          title="Billing & plans"
          summary="Subscriptions, upgrades, and launch access"
          defaultOpen={Boolean(billingNotice)}
        >
          <BillingPanel
            showLeaderPlans={formProfile.is_player !== false}
            showOrganiserPlans={Boolean(formProfile.is_organiser)}
            billingNotice={billingNotice}
            showHeading={false}
          />
        </ProfileCollapsibleSection>
      </div>
    </div>
  );
}
