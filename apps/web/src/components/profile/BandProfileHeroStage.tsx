import { availabilityLabel, type AvailabilityStatus } from '@bandie/data';
import { bandInitials } from '../../lib/profileHelpers';

type BandProfileHeroStageProps = {
  bandName: string;
  heroImageUrl: string | null;
  logoUrl: string | null;
  availabilityStatus: AvailabilityStatus;
};

export function BandProfileHeroStage({
  bandName,
  heroImageUrl,
  logoUrl,
  availabilityStatus,
}: BandProfileHeroStageProps) {
  return (
    <div
      className={`band-profile-hero-stage${heroImageUrl ? '' : ' band-profile-hero-stage-fallback'}`}
    >
      {heroImageUrl ? (
        <img className="band-profile-hero-stage-image" src={heroImageUrl} alt="" />
      ) : null}

      <div className="band-profile-hero-stage-logo" aria-hidden={Boolean(logoUrl)}>
        {logoUrl ? (
          <img src={logoUrl} alt={`${bandName} logo`} />
        ) : (
          <span>{bandInitials(bandName)}</span>
        )}
      </div>

      <div className="band-profile-hero-stage-availability">
        <span className="band-profile-eyebrow band-profile-eyebrow-overlay">
          {availabilityLabel(availabilityStatus)}
        </span>
      </div>
    </div>
  );
}
