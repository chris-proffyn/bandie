import { Link } from 'react-router-dom';
import { formatBandMemberRoleLabel, memberDisplayName, type BandMemberWithProfile } from '@bandie/data';
import { bandInitials } from '../../lib/profileHelpers';

type BandMemberCardProps = {
  member: BandMemberWithProfile;
  canEditProfile?: boolean;
};

export function BandMemberCard({ member, canEditProfile = false }: BandMemberCardProps) {
  const name = memberDisplayName(member);
  const profile = member.profile;
  const instrument =
    profile?.preferred_instrument ||
    (profile?.instruments?.length ? profile.instruments.join(', ') : null);

  return (
    <article className="band-member-card">
      <div className="band-member-card-avatar">
        {profile?.profile_image_url ? (
          <img src={profile.profile_image_url} alt="" />
        ) : (
          <span>{bandInitials(name)}</span>
        )}
      </div>
      <div className="band-member-card-body">
        <div className="band-member-card-heading">
          <strong>{name}</strong>
          <span className="band-member-role">{formatBandMemberRoleLabel(member.role)}</span>
        </div>
        {instrument ? <p className="band-member-card-meta">{instrument}</p> : null}
        {profile?.location ? <p className="band-member-card-meta">{profile.location}</p> : null}
        {profile?.bio ? <p className="band-member-card-bio">{profile.bio}</p> : null}
        {canEditProfile && profile?.id ? (
          <div className="band-card-actions" style={{ marginTop: '0.75rem' }}>
            <Link
              className="directory-btn directory-btn-secondary"
              to={`/app/profiles/${profile.id}/edit`}
            >
              Edit profile
            </Link>
          </div>
        ) : null}
      </div>
    </article>
  );
}
