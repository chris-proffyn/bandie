import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BandieLogo } from '../brand/BandieLogo';
import {
  formatPlayerTravelDistance,
  formatPlayerGenderLabel,
  DEFAULT_PLAYER_DIRECTORY_FILTERS,
  isBandLeaderRole,
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
import { usePlayerWorkspaceAccess } from '../../hooks/usePlayerWorkspaceAccess';
import { DirectMessageModal } from '../communications/DirectMessageModal';
import { BackLink } from '../navigation/BackLink';
import { PlayerInvitePanel } from '../band/PlayerInvitePanel';
import {
  AdminRecruitingBandSelector,
  adminRecruitingBandContext,
} from '../band/AdminRecruitingBandSelector';
import { resolveBackPath } from '../../lib/backNavigation';
import type { BackNavigationState } from '../../lib/backNavigation';
import {
  buildPlayerDirectoryBackState,
  WORKSPACE_PLAYER_DIRECTORY_DEFAULTS,
} from '../../lib/playerDirectoryNavigation';
import { bandCardGradient } from '../../lib/directoryHelpers';
import { bandInitials } from '../../lib/profileHelpers';
import { TestDataBadge } from '../common/TestDataBadge';
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
    gender: profile.gender,
    profile_image_url: profile.profile_image_url,
    bio: profile.bio,
    location: profile.location,
    country_id: null,
    region_id: null,
    genres: profile.genres,
    instruments: profile.instruments,
    years_playing: profile.years_playing,
    travel_distance_miles: profile.travel_distance_miles,
    deputy_fee_guidance_min: profile.deputy_fee_guidance_min,
    deputy_fee_guidance_max: profile.deputy_fee_guidance_max,
    open_to_deputy_invites: profile.open_to_deputy_invites,
    open_to_member_invites: profile.open_to_member_invites,
    created_at: profile.created_at,
    test_user: profile.test_user,
  };
}

export function PlayerProfileView({ profileId, variant }: PlayerProfileViewProps) {
  const { session, adminModeActive, bands, profile: currentProfile, displayName } = useAuth();
  const { access: playerAccess } = usePlayerWorkspaceAccess();
  const location = useLocation();
  const isWorkspace = variant === 'workspace';
  const [player, setPlayer] = useState<PlayerDirectoryListing | null>(null);
  const [recipientProfile, setRecipientProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adminRecruitBandId, setAdminRecruitBandId] = useState('');
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [messageSentNotice, setMessageSentNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!profileId) {
      setLoading(false);
      setError('Profile not found.');
      return;
    }

    setLoading(true);

    async function loadProfile() {
      if (adminModeActive) {
        const adminProfile = await getUserProfileById(profileId!);
        if (!adminProfile) {
          setError('This player profile is not available.');
          setPlayer(null);
          setRecipientProfile(null);
          return;
        }
        setPlayer(userProfileToDirectoryListing(adminProfile));
        setRecipientProfile(adminProfile);
        setError(null);
        return;
      }

      if (session) {
        const sharedProfile = await getUserProfileById(profileId!);
        if (sharedProfile) {
          setPlayer(userProfileToDirectoryListing(sharedProfile));
          setRecipientProfile(sharedProfile);
          setError(null);
          return;
        }
      }

      const result = await getPublicPlayerProfileById(profileId!);
      if (!result) {
        setError('This player profile is not available.');
        setPlayer(null);
        setRecipientProfile(null);
        return;
      }
      if (!result.open_to_deputy_invites && !result.open_to_member_invites) {
        setError('This player profile is not available.');
        setPlayer(null);
        setRecipientProfile(null);
        return;
      }
      setPlayer(result);
      if (session) {
        const sharedProfile = await getUserProfileById(profileId!);
        setRecipientProfile(sharedProfile);
      } else {
        setRecipientProfile(null);
      }
      setError(null);
    }

    loadProfile()
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load profile.'))
      .finally(() => setLoading(false));
  }, [profileId, adminModeActive, isWorkspace, session]);

  const navigationState = location.state as BackNavigationState | null;
  const knownAppRoutes = /^\/app\/(?:profile|profiles|bands|players|communications|notifications|invites)(?:\/|$)/;
  const fromBandOverview = Boolean(
    navigationState?.from?.startsWith('/app/') && !knownAppRoutes.test(navigationState.from),
  );
  const backProps = {
    fallbackTo: '/players',
    workspaceFallbackTo: '/app/players',
    label: fromBandOverview ? 'Back to band' : 'Back to player directory',
  };
  const directoryPath = resolveBackPath(
    location.pathname,
    location.state,
    '/players',
    isWorkspace ? '/app/players' : undefined,
  );
  const directoryNavState = buildPlayerDirectoryBackState(
    isWorkspace ? 'workspace' : 'public',
    isWorkspace ? WORKSPACE_PLAYER_DIRECTORY_DEFAULTS : DEFAULT_PLAYER_DIRECTORY_FILTERS,
    location.state,
  );
  const profileNavigationState = (location.state as BackNavigationState | null) ?? directoryNavState;
  const findPlayersFromNav = profileNavigationState.findPlayers;
  const effectiveFindPlayers =
    findPlayersFromNav ??
    (adminModeActive ? adminRecruitingBandContext(bands, adminRecruitBandId) : null);
  const recruitingBand = effectiveFindPlayers
    ? bands.find((band) => band.id === effectiveFindPlayers.bandId)
    : undefined;
  const canInvitePlayer =
    isWorkspace &&
    Boolean(profileId) &&
    (adminModeActive
      ? Boolean(effectiveFindPlayers)
      : Boolean(findPlayersFromNav) && isBandLeaderRole(recruitingBand?.member_role));
  const isOwnProfile = Boolean(
    session?.user &&
      recipientProfile &&
      recipientProfile.user_id === session.user.id,
  );
  const canMessagePlayer =
    Boolean(session?.user && recipientProfile && !isOwnProfile) && playerAccess.canSendPlayerMessage;
  const messageRecipient = recipientProfile
    ? {
        userId: recipientProfile.user_id,
        displayName: resolvePlayerDisplayName(userProfileToDirectoryListing(recipientProfile)),
        username: recipientProfile.username,
      }
    : null;
  const messageSender = session
    ? {
        displayName,
        username: currentProfile?.username ?? null,
        email: session.user.email ?? null,
      }
    : null;

  useEffect(() => {
    if (findPlayersFromNav?.bandId) {
      setAdminRecruitBandId(findPlayersFromNav.bandId);
    }
  }, [findPlayersFromNav?.bandId]);

  if (loading) {
    return (
      <div className={isWorkspace ? 'workspace-directory-loading panel' : 'directory-page directory-loading'}>
        <div className={isWorkspace ? undefined : 'directory-shell'}>
          <BackLink {...backProps} navigationState={directoryNavState} />
          <p>Loading player profile…</p>
        </div>
      </div>
    );
  }

  if (error || !player) {
    return (
      <div className={isWorkspace ? 'panel' : 'directory-page directory-error'}>
        <div className={isWorkspace ? undefined : 'directory-shell'}>
          <BackLink {...backProps} navigationState={directoryNavState} />
          <h1>Profile unavailable</h1>
          <p>{error ?? 'This profile could not be loaded.'}</p>
        </div>
      </div>
    );
  }

  const name = resolvePlayerDisplayName(player);
  const genderLabel =
    player.gender && player.gender !== 'prefer_not_to_say'
      ? formatPlayerGenderLabel(player.gender)
      : null;
  const inviteLabels = playerInviteSummary(player);
  const travelLabel = formatPlayerTravelDistance(player.travel_distance_miles);
  const deputyFooter = playerDirectoryFooter(player, 'temporary');
  const memberFooter = playerDirectoryFooter(player, 'permanent');
  const heroStyle = player.profile_image_url
    ? { backgroundImage: `url(${player.profile_image_url})` }
    : { background: bandCardGradient(name) };

  const profileBody = (
    <>
      <BackLink {...backProps} navigationState={directoryNavState} />

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
          <div className="directory-band-title-row">
            <h1>{name}</h1>
            <TestDataBadge testUser={player.test_user} />
          </div>
          <p className="directory-player-profile-meta">{playerDirectoryMeta(player)}</p>
          {genderLabel ? <p className="directory-player-profile-meta">{genderLabel}</p> : null}
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
          {adminModeActive && isWorkspace && profileId ? (
            <div className="directory-tag-row" style={{ marginTop: '0.75rem' }}>
              <Link
                className="directory-btn directory-btn-primary"
                to={`/app/profiles/${profileId}/edit`}
                state={profileNavigationState}
              >
                Edit profile
              </Link>
            </div>
          ) : null}
          {canMessagePlayer ? (
            <div className="directory-tag-row" style={{ marginTop: '0.75rem' }}>
              <button
                type="button"
                className="directory-btn directory-btn-primary"
                onClick={() => {
                  setMessageSentNotice(null);
                  setMessageModalOpen(true);
                }}
              >
                Message this player
              </button>
            </div>
          ) : null}
          {messageSentNotice ? (
            <p className="directory-player-profile-meta" style={{ marginTop: '0.75rem' }}>
              {messageSentNotice}
            </p>
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
    return (
      <div className="workspace-directory-page directory-player-profile">
        {profileBody}
        {messageRecipient && messageSender ? (
          <DirectMessageModal
            open={messageModalOpen}
            onClose={() => setMessageModalOpen(false)}
            sender={messageSender}
            recipient={messageRecipient}
            onSent={() => {
              setMessageSentNotice('Message sent. Open Communications to view replies.');
            }}
          />
        ) : null}
        {adminModeActive && !findPlayersFromNav ? (
          <AdminRecruitingBandSelector
            bands={bands}
            bandId={adminRecruitBandId}
            onChange={setAdminRecruitBandId}
            intro="Select the band you are recruiting for, then send an audition or join invitation below."
          />
        ) : null}
        {canInvitePlayer && effectiveFindPlayers && profileId ? (
          <PlayerInvitePanel
            playerProfileId={profileId}
            playerName={name}
            findPlayers={{
              ...effectiveFindPlayers,
              bandName: effectiveFindPlayers.bandName ?? recruitingBand?.name,
            }}
          />
        ) : null}
      </div>
    );
  }

  return (
    <div className="directory-page">
      <header className="directory-header">
        <div className="directory-header-inner">
          <Link to="/" className="directory-brand" aria-label="Bandie home">
            <BandieLogo className="directory-brand-mark" />
            <span>Bandie</span>
          </Link>
          <div className="directory-header-actions">
            <Link
              to={directoryPath}
              state={directoryNavState}
              className="directory-btn directory-btn-secondary"
            >
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

      <main className="directory-shell directory-player-profile">
        {profileBody}
        {messageRecipient && messageSender ? (
          <DirectMessageModal
            open={messageModalOpen}
            onClose={() => setMessageModalOpen(false)}
            sender={messageSender}
            recipient={messageRecipient}
            onSent={() => {
              setMessageSentNotice('Message sent. Open Communications in your workspace to view replies.');
            }}
          />
        ) : null}
      </main>
    </div>
  );
}
