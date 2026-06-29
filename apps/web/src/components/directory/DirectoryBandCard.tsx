import { Link, useLocation } from 'react-router-dom';
import {
  directoryAvailabilityBadge,
  directoryBandMeta,
  directoryBandTags,
  directoryPriceLabel,
  type DirectoryBandListing,
} from '@bandie/data';
import { directoryLinkState } from '../../lib/backNavigation';
import type { FindGigContext } from '../../lib/findGigNavigation';
import { BandCard } from '../bands/BandCard';

type DirectoryBandCardProps = {
  band: DirectoryBandListing;
  variant?: 'public' | 'workspace';
  findGigContext?: FindGigContext | null;
};

function availabilityDotClass(status: DirectoryBandListing['availability_status']): string {
  if (status === 'limited') return 'limited';
  if (status === 'unavailable') return 'unavailable';
  return '';
}

export function DirectoryBandCard({
  band,
  variant = 'public',
  findGigContext = null,
}: DirectoryBandCardProps) {
  const location = useLocation();
  const profilePath =
    variant === 'workspace' ? `/app/bands/${band.slug}` : `/bands/${band.slug}`;

  return (
    <BandCard
      band={band}
      testUser={band.test_user}
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
          state={directoryLinkState(location.pathname + location.search, {
            variant,
            directory: 'bands',
            findGig: findGigContext ?? undefined,
          })}
        >
          View profile
        </Link>
      }
    />
  );
}
