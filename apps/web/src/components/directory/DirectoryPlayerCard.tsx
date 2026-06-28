import { Link, useLocation } from 'react-router-dom';
import {
  formatPlayerTravelDistance,
  playerDirectoryFooter,
  playerDirectoryMeta,
  playerDirectoryInviteBadges,
  playerDirectoryTags,
  resolvePlayerDisplayName,
  type PlayerDirectoryFilters,
  type PlayerDirectoryListing,
  type PlayerDirectorySort,
  type PlayerSearchMode,
} from '@bandie/data';
import { directoryLinkState } from '../../lib/backNavigation';
import { bandCardGradient } from '../../lib/directoryHelpers';
import { bandInitials } from '../../lib/profileHelpers';

import type { FindPlayersContext } from '../../lib/findPlayersNavigation';

type DirectoryPlayerCardProps = {
  player: PlayerDirectoryListing;
  mode: PlayerSearchMode;
  variant?: 'public' | 'workspace';
  filters?: PlayerDirectoryFilters;
  sort?: PlayerDirectorySort;
  findPlayersContext?: FindPlayersContext | null;
};

export function DirectoryPlayerCard({
  player,
  mode,
  variant = 'public',
  filters,
  sort,
  findPlayersContext = null,
}: DirectoryPlayerCardProps) {
  const location = useLocation();
  const profilePath =
    variant === 'workspace' ? `/app/players/${player.id}` : `/players/${player.id}`;
  const name = resolvePlayerDisplayName(player);
  const footer = playerDirectoryFooter(player, mode);
  const inviteBadges = playerDirectoryInviteBadges(player);
  const travelLabel = formatPlayerTravelDistance(player.travel_distance_miles);
  const heroStyle = player.profile_image_url
    ? { backgroundImage: `url(${player.profile_image_url})` }
    : { background: bandCardGradient(name) };

  return (
    <article className="directory-band-card directory-player-card">
      <div className="directory-band-hero directory-player-hero" style={heroStyle}>
        <div className="directory-band-logo directory-player-avatar">
          {player.profile_image_url ? (
            <img src={player.profile_image_url} alt="" />
          ) : (
            bandInitials(name)
          )}
        </div>
        <div className="directory-invite-badges">
          {inviteBadges.map((label) => (
            <span key={label} className="directory-availability-badge">
              {label}
            </span>
          ))}
        </div>
      </div>
      <div className="directory-band-body">
        <div className="directory-band-title-row">
          <h3>{name}</h3>
        </div>
        <p className="directory-band-meta">{playerDirectoryMeta(player)}</p>
        {travelLabel ? <p className="directory-player-travel">{travelLabel}</p> : null}
        {player.bio ? <p className="directory-band-desc">{player.bio}</p> : null}
        {playerDirectoryTags(player).length ? (
          <div className="directory-tag-row">
            {playerDirectoryTags(player).map((tag) => (
              <span key={tag} className="directory-tag">
                {tag}
              </span>
            ))}
          </div>
        ) : null}
        <div className="directory-band-footer">
          <div className="directory-price">
            <strong>{footer.value}</strong>
            {footer.label}
          </div>
          <div className="band-card-actions">
            <Link
              className="directory-btn directory-btn-dark"
              to={profilePath}
              state={directoryLinkState(location.pathname + location.search, {
                variant,
                directory: 'players',
                playerMode: mode,
                playerFilters: filters,
                playerSort: sort,
                findPlayers: findPlayersContext ?? undefined,
              })}
            >
              View profile
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
