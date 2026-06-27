import { Link, useLocation } from 'react-router-dom';
import {
  directoryAvailabilityBadge,
  directoryBandMeta,
  directoryBandTags,
  directoryPriceLabel,
  type DirectoryBandListing,
} from '@bandie/data';
import { directoryLinkState } from '../../lib/backNavigation';
import { BandCard } from '../bands/BandCard';

type DirectoryBandCardProps = {
  band: DirectoryBandListing;
  variant?: 'public' | 'workspace';
};

function availabilityDotClass(status: DirectoryBandListing['availability_status']): string {
  if (status === 'limited') return 'limited';
  if (status === 'unavailable') return 'unavailable';
  return '';
}

export function DirectoryBandCard({ band, variant = 'public' }: DirectoryBandCardProps) {
  const location = useLocation();
  const profilePath =
    variant === 'workspace' ? `/app/bands/${band.slug}` : `/bands/${band.slug}`;

  return (
    <BandCard
      band={band}
      badgeLabel={directoryAvailabilityBadge(band.availability_status)}
      badgeDotClass={availabilityDotClass(band.availability_status)}
      meta={directoryBandMeta(band)}
      tags={directoryBandTags(band)}
      footerLabel="Typical event fee"
      footerValue={directoryPriceLabel(band)}
      actions={
        <Link
          className="directory-btn directory-btn-dark"
          to={profilePath}
          state={directoryLinkState(location.pathname, {
            variant,
            directory: 'bands',
          })}
        >
          View profile
        </Link>
      }
    />
  );
}
