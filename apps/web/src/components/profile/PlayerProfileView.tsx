import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  formatPlayerTravelDistance,
  getPublicPlayerProfileById,
  getUserProfileById,
  playerDirectoryFooter,
  playerDirectoryMeta,
  playerInviteSummary,
  resolvePlayerDisplayName,
  type PlayerDirectoryListing,
  type UserProfile,
} from '@bandie/data';
import { useAuth } from '../../context/AuthContext';
import { BackLink } from '../navigation/BackLink';
import { bandCardGradient } from '../../lib/directoryHelpers';
import { bandInitials } from '../../lib/profileHelpers';
import '../../styles/directory.css';

type PlayerProfileViewProps = {
  profileId: string | undefined;
  variant: 'public' | 'workspace';
};

function userProfileToDirectoryListing(profile: UserProfile): PlayerDirectoryListing {
  return {
    id: profile.id,
    display_name: profile.display_name,
    preferred_instrument: profile.preferred_instrument,
    profile_image_url: profile.profile_image_url,
    bio: profile.bio,
    location: profile.location,
    genres: profile.genres,
    instruments: profile.instruments,
    years_playing: profile.years_playing,
    travel_distance_miles: profile.travel_distance_miles,
    deputy_fee_guidance_min: profile.deputy_fee_guidance_min,
    deputy_fee_guidance_max: profile.deputy_fee_guidance_max,
    open_to_deputy_invites: profile.open_to_deputy_invites,
    open_to_member_invites: profile.open_to_member_invites,
    created_at: profile.created_at,
  };
}

export function PlayerProfileView({ profileId, variant }: PlayerProfileViewProps) {
  const { session, isAppAdmin } = useAuth();
  const isWorkspace = variant === 'workspace';
  const [player, setPlayer] = useState<PlayerDirectoryListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profileId) {
      setLoading(false);
      setError('Profile not found.');
      return;
    }

    setLoading(true);

    async function loadProfile() {
      if (isAppAdmin) {
        const adminProfile = await getUserProfileById(profileId!);
        if (!adminProfile) {
          setError('This player profile is not available.');
          setPlayer(null);
          return;
        }
        setPlayer(userProfileToDirectoryListing(adminProfile));
        setError(null);
        return;
      }

      const result = await getPublicPlayerProfileById(profileId!);
      if (!result) {
        setError('This player profile is not available.');
        setPlayer(null);
        return;
      }
      if (!result.open_to_deputy_invites && !result.open_to_member_invites) {
        setError('This player profile is not available.');
        setPlayer(null);
        return;
      }
      setPlayer(result);
      setError(null);
    }

    loadProfile()
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load profile.'))
      .finally(() => setLoading(false));
  }, [profileId, isAppAdmin]);

  const backProps = {
    fallbackTo: '/players',
    workspaceFallbackTo: '/app/players',
    label: 'Back to player directory',
  };

  if (loading) {
    return (
      <div className={isWorkspace ? 'workspace-directory-loading panel' : 'directory-page directory-loading'}>
        <div className={isWorkspace ? undefined : 'directory-shell'}>
          <BackLink {...backProps} />
          <p>Loading player profile…</p>
        </div>
      </div>
    );
  }

  if (error || !player) {
    return (
      <div className={isWorkspace ? 'panel' : 'directory-page directory-error'}>
        <div className={isWorkspace ? undefined : 'directory-shell'}>
          <BackLink {...backProps} />
          <h1>Profile unavailable</h1>
          <p>{error ?? 'This profile could not be loaded.'}</p>
        </div>
      </div>
    );
  }

  const name = resolvePlayerDisplayName(player);
  const inviteLabels = playerInviteSummary(player);
  const travelLabel = formatPlayerTravelDistance(player.travel_distance_miles);
  const deputyFooter = playerDirectoryFooter(player, 'temporary');
  const memberFooter = playerDirectoryFooter(player, 'permanent');
  const heroStyle = player.profile_image_url
    ? { backgroundImage: `url(${player.profile_image_url})` }
    : { background: bandCardGradient(name) };

  const profileBody = (
    <>
      <BackLink {...backProps} />

      <section className="directory-player-profile-hero">
        <div className="directory-player-profile-avatar-wrap" style={heroStyle}>
          <div className="directory-player-profile-avatar">
            {player.profile_image_url ? (
              <img src={player.profile_image_url} alt="" />
            ) : (
              bandInitials(name)
            )}
          </div>
        </div>
        <div>
          <h1>{name}</h1>
          <p className="directory-player-profile-meta">{playerDirectoryMeta(player)}</p>
          {travelLabel ? <p className="directory-player-travel">{travelLabel}</p> : null}
          {inviteLabels.length ? (
            <div className="directory-tag-row">
              {inviteLabels.map((label) => (
                <span key={label} className="directory-tag">
                  {label}
                </span>
              ))}
            </div>
          ) : null}
          {isAppAdmin && isWorkspace && profileId ? (
            <div className="directory-tag-row" style={{ marginTop: '0.75rem' }}>
              <Link className="directory-btn directory-btn-primary" to={`/app/profiles/${profileId}/edit`}>
                Edit profile
              </Link>
            </div>
          ) : null}
        </div>
      </section>

      {player.bio ? (
        <section className="directory-player-profile-section">
          <h2>About</h2>
          <p>{player.bio}</p>
        </section>
      ) : null}

      <section className="directory-player-profile-grid">
        {player.genres.length ? (
          <div className="directory-player-profile-section">
            <h2>Genres</h2>
            <div className="directory-tag-row">
              {player.genres.map((genre) => (
                <span key={genre} className="directory-tag">
                  {genre}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {player.instruments.length ? (
          <div className="directory-player-profile-section">
            <h2>Instruments</h2>
            <div className="directory-tag-row">
              {player.instruments.map((instrument) => (
                <span key={instrument} className="directory-tag">
                  {instrument}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {player.open_to_deputy_invites ? (
          <div className="directory-player-profile-section">
            <h2>Deputy / stand-in gigs</h2>
            <p>
              <strong>{deputyFooter.value}</strong> — {deputyFooter.label}
            </p>
          </div>
        ) : null}

        {player.open_to_member_invites ? (
          <div className="directory-player-profile-section">
            <h2>Permanent membership</h2>
            <p>
              <strong>{memberFooter.value}</strong> — {memberFooter.label}
            </p>
          </div>
        ) : null}
      </section>

      {!session && !isWorkspace ? (
        <section className="directory-player-profile-cta">
          <p>Sign in to your Bandie workspace to connect with this player through your band.</p>
          <Link to="/login" className="directory-btn directory-btn-primary">
            Log in
          </Link>
        </section>
      ) : null}
    </>
  );

  if (isWorkspace) {
    return <div className="workspace-directory-page directory-player-profile">{profileBody}</div>;
  }

  return (
    <div className="directory-page">
      <header className="directory-header">
        <div className="directory-header-inner">
          <Link to="/" className="directory-brand" aria-label="Bandie home">
            <span className="directory-brand-mark">B</span>
            <span>Bandie</span>
          </Link>
          <div className="directory-header-actions">
            <Link to="/players" className="directory-btn directory-btn-secondary">
              Player directory
            </Link>
            {session ? (
              <Link to="/app" className="directory-btn directory-btn-secondary">
                My workspace
              </Link>
            ) : (
              <Link to="/login" className="directory-btn directory-btn-primary">
                Log in to contact
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="directory-shell directory-player-profile">{profileBody}</main>
    </div>
  );
}
