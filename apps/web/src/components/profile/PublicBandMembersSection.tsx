import { Link } from 'react-router-dom';
import { formatBandMemberRoleLabel, type PublicBandMember } from '@bandie/data';
import { bandInitials } from '../../lib/profileHelpers';

type PublicBandMembersSectionProps = {
  members: PublicBandMember[];
  variant?: 'public' | 'workspace';
};

export function PublicBandMembersSection({
  members,
  variant = 'public',
}: PublicBandMembersSectionProps) {
  if (!members.length) {
    return null;
  }

  return (
    <section className="band-profile-section" id="members">
      <h2>Band members</h2>
      <ul className="band-profile-members-grid">
        {members.map((member) => {
          const profilePath =
            member.profile_id != null
              ? variant === 'workspace'
                ? `/app/players/${member.profile_id}`
                : `/players/${member.profile_id}`
              : null;

          const card = (
            <>
              {member.is_primary_contact ? (
                <span className="band-profile-member-primary-pill">Primary</span>
              ) : null}
              <div className="band-profile-member-avatar">
                {member.profile_image_url ? (
                  <img src={member.profile_image_url} alt="" />
                ) : (
                  <span>{bandInitials(member.display_name)}</span>
                )}
              </div>
              <div className="band-profile-member-body">
                <strong>{member.display_name}</strong>
                <p className="band-profile-member-meta">
                  {formatBandMemberRoleLabel(member.member_role)}
                  {member.lineup_part_title ? ` · ${member.lineup_part_title}` : null}
                </p>
                <p className="band-profile-member-meta band-profile-member-instrument">
                  {member.preferred_instrument || '\u00A0'}
                </p>
              </div>
            </>
          );

          const cardClassName = `band-profile-member-card${
            member.is_primary_contact ? ' band-profile-member-card-primary' : ''
          }`;

          return (
            <li key={member.user_id}>
              {profilePath ? (
                <Link className={cardClassName} to={profilePath}>
                  {card}
                </Link>
              ) : (
                <div className={cardClassName}>{card}</div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
