import { Link } from 'react-router-dom';
import { formatBandMemberRoleLabel, formatBandDirectorySubtitle, type UserBand } from '@bandie/data';
import { BandCard } from './BandCard';

function workspaceTags(band: UserBand): string[] {
  const tags = [...band.genres];
  if (band.band_size) {
    tags.push(`${band.band_size}-piece`);
  }
  if (band.public_profile_enabled) {
    tags.push('Published');
  } else {
    tags.push('Draft profile');
  }
  return tags.slice(0, 4);
}

type WorkspaceBandCardProps = {
  band: UserBand;
};

export function WorkspaceBandCard({ band }: WorkspaceBandCardProps) {
  const meta = formatBandDirectorySubtitle(band) || 'No location set';
  const roleLabel = formatBandMemberRoleLabel(band.member_role);

  return (
    <BandCard
      band={band}
      badgeLabel={roleLabel}
      meta={meta}
      tags={workspaceTags(band)}
      footerLabel="Your access"
      footerValue={roleLabel}
      actions={
        <>
          <Link className="directory-btn directory-btn-dark" to={`/app/${band.id}`}>
            Open workspace
          </Link>
          {band.public_profile_enabled ? (
            <Link className="directory-btn directory-btn-secondary" to={`/bands/${band.slug}`} target="_blank">
              Public profile
            </Link>
          ) : null}
        </>
      }
    />
  );
}
