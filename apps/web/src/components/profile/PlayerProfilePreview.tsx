import { formatPlayerInvitePreferences, resolveDisplayName, type UserProfile } from '@bandie/data';
import { bandInitials } from '../../lib/profileHelpers';
import type { PlanPillTone } from '../../lib/planPill';

export type PlayerProfilePreviewData = {
  displayName: string;
  profileImageUrl: string | null;
  primaryLine: string;
  location?: string | null;
  gearItems: string[];
  inviteLabels: string[];
};

export type PlayerProfilePlanPill = {
  label: string;
  tone: PlanPillTone;
  title?: string;
};

type PlayerProfilePreviewProps = {
  data: PlayerProfilePreviewData;
  planPill?: PlayerProfilePlanPill | null;
  className?: string;
};

export function playerProfilePreviewFromUserProfile(
  profile: UserProfile,
  accountEmail?: string | null,
): PlayerProfilePreviewData {
  const showPlayer = profile.is_player !== false;
  const displayName = resolveDisplayName(profile, accountEmail);

  if (!showPlayer) {
    return {
      displayName,
      profileImageUrl: profile.profile_image_url,
      primaryLine: 'Event organiser',
      location: profile.location,
      gearItems: [],
      inviteLabels: [],
    };
  }

  return {
    displayName,
    profileImageUrl: profile.profile_image_url,
    primaryLine: profile.preferred_instrument?.trim() || 'Instrument not set',
    location: profile.location,
    gearItems: profile.gear_items,
    inviteLabels: formatPlayerInvitePreferences({
      open_to_deputy_invites: profile.open_to_deputy_invites,
      open_to_member_invites: profile.open_to_member_invites,
    }),
  };
}

export function PlayerProfilePreview({ data, planPill, className }: PlayerProfilePreviewProps) {
  return (
    <aside
      className={['player-profile-preview', className].filter(Boolean).join(' ')}
      aria-label="Profile summary"
    >
      <div className="player-profile-preview-avatar">
        {data.profileImageUrl ? (
          <img src={data.profileImageUrl} alt="" />
        ) : (
          <span>{bandInitials(data.displayName)}</span>
        )}
      </div>
      <div className="player-profile-preview-body">
        <div className="player-profile-preview-title-row">
          <strong>{data.displayName}</strong>
          {planPill ? (
            <span
              className={`app-plan-pill app-plan-pill-${planPill.tone} player-profile-plan-pill`}
              title={planPill.title}
            >
              {planPill.label}
            </span>
          ) : null}
        </div>
        <p>
          {data.primaryLine}
          {data.location ? ` · ${data.location}` : ''}
        </p>
        {data.gearItems.length ? (
          <p className="player-profile-preview-gear">
            Gear: {data.gearItems.slice(0, 3).join(', ')}
            {data.gearItems.length > 3 ? ` +${data.gearItems.length - 3} more` : ''}
          </p>
        ) : null}
        {data.inviteLabels.length ? (
          <p className="player-profile-preview-invites">{data.inviteLabels.join(' · ')}</p>
        ) : null}
      </div>
    </aside>
  );
}
