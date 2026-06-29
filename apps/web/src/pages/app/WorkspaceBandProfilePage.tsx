import { useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { getOrganiserGig, getPublicBandProfileBySlug, isActiveGigInviteStatus, type GigBandInviteWithBand, type PublicBandProfile } from '@bandie/data';
import { BackLink } from '../../components/navigation/BackLink';
import { PublicBandProfileView } from '../../components/profile/PublicBandProfileView';
import type { BackNavigationState } from '../../lib/backNavigation';
import '../../styles/bandProfile.css';

export function WorkspaceBandProfilePage() {
  const { slug } = useParams();
  const location = useLocation();
  const navigationState = location.state as BackNavigationState | null;
  const findGig = navigationState?.findGig ?? null;

  const [profile, setProfile] = useState<PublicBandProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [inviteRefreshKey, setInviteRefreshKey] = useState(0);
  const [resolvedInvite, setResolvedInvite] = useState<GigBandInviteWithBand | null>(null);

  useEffect(() => {
    if (!slug) {
      setMissing(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    getPublicBandProfileBySlug(slug)
      .then((result) => {
        setProfile(result);
        setMissing(!result);
      })
      .catch(() => {
        setProfile(null);
        setMissing(true);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!profile || !findGig) {
      setResolvedInvite(null);
      return;
    }

    getOrganiserGig(findGig.gigId)
      .then((gig) => {
        const invite = gig?.bands.find(
          (item) => item.band_id === profile.id && isActiveGigInviteStatus(item.invite_status),
        );
        setResolvedInvite(invite ?? null);
      })
      .catch(() => setResolvedInvite(null));
  }, [profile, findGig, inviteRefreshKey]);

  if (loading) {
    return (
      <div className="panel">
        <BackLink
          fallbackTo="/bands"
          workspaceFallbackTo="/app/bands"
          label="Back to band directory"
        />
        <p>Loading band profile…</p>
      </div>
    );
  }

  if (missing || !profile) {
    return (
      <div className="panel">
        <BackLink
          fallbackTo="/bands"
          workspaceFallbackTo="/app/bands"
          label="Back to band directory"
        />
        <h2>Profile not found</h2>
        <p>This band profile is not published yet, or the link may be incorrect.</p>
      </div>
    );
  }

  return (
    <PublicBandProfileView
      profile={profile}
      variant="workspace"
      findGig={findGig}
      existingGigInvite={resolvedInvite}
      onGigInvited={() => setInviteRefreshKey((value) => value + 1)}
    />
  );
}
