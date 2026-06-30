import { useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { getPublicBandProfileBySlug, type PublicBandProfile } from '@bandie/data';
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
      initialGigId={findGig?.gigId ?? null}
    />
  );
}
