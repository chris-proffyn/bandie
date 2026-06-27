import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getPublicBandProfileBySlug, type PublicBandProfile } from '@bandie/data';
import { PublicBandProfileView } from '../components/profile/PublicBandProfileView';
import { BackLink } from '../components/navigation/BackLink';
import { usePageMeta } from '../lib/usePageMeta';
import '../styles/bandProfile.css';

export function PublicBandProfilePage() {
  const { slug } = useParams();
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

  const metaDescription =
    profile?.description?.trim() ||
    `${profile?.name ?? 'Band'} on Bandie — view tracks, videos, booking info and availability.`;

  usePageMeta({
    title: profile ? `${profile.name} | Bandie` : 'Band profile | Bandie',
    description: metaDescription,
    canonicalPath: slug ? `/bands/${slug}` : '/bands',
  });

  if (loading) {
    return (
      <div className="band-profile-page band-profile-empty">
        <div>
          <BackLink
            fallbackTo="/bands"
            workspaceFallbackTo="/app/bands"
            label="Back to band directory"
          />
          <h1>Loading band profile…</h1>
        </div>
      </div>
    );
  }

  if (missing || !profile) {
    return (
      <div className="band-profile-page band-profile-empty">
        <div>
          <BackLink
            fallbackTo="/bands"
            workspaceFallbackTo="/app/bands"
            label="Back to band directory"
          />
          <h1>Profile not found</h1>
          <p>
            This band profile is not published yet, or the link may be incorrect. Published profiles appear
            here once a band leader enables their public page.
          </p>
        </div>
      </div>
    );
  }

  return <PublicBandProfileView profile={profile} />;
}
