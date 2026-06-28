import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  formatBandMemberRoleLabel,
  isBandLeaderRole,
  memberDisplayName,
  type BandMemberWithProfile,
  type BandPart,
} from '@bandie/data';
import { bandInitials } from '../../lib/profileHelpers';

type BandMemberCardProps = {
  member: BandMemberWithProfile;
  parts?: BandPart[];
  bandId?: string;
  canEditProfile?: boolean;
  canManage?: boolean;
  canMakeLeader?: boolean;
  canMakePrimary?: boolean;
  canRemoveLeader?: boolean;
  canRemoveFromBand?: boolean;
  isPrimaryContact?: boolean;
  submitting?: boolean;
  onToggleUnavailable?: () => void;
  onRemove?: () => void;
  onAssign?: (partId: string) => void;
  onMakeLeader?: () => void;
  onMakePrimary?: () => void;
  onRemoveLeader?: () => void;
};

function HamburgerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        d="M2 4.5h14M2 9h14M2 13.5h14"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function BandMemberCard({
  member,
  parts = [],
  bandId,
  canEditProfile = false,
  canManage = false,
  canMakeLeader = false,
  canMakePrimary = false,
  canRemoveLeader = false,
  canRemoveFromBand = false,
  isPrimaryContact = false,
  submitting = false,
  onToggleUnavailable,
  onRemove,
  onAssign,
  onMakeLeader,
  onMakePrimary,
  onRemoveLeader,
}: BandMemberCardProps) {
  const [showAssignPicker, setShowAssignPicker] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const name = memberDisplayName(member);
  const profile = member.profile;
  const instrument =
    profile?.preferred_instrument ||
    (profile?.instruments?.length ? profile.instruments.join(', ') : null);
  const assignedPart = parts.find((part) => part.assigned_member_id === member.id) ?? null;

  const showAssign = canManage && parts.length > 0;
  const showUnavailable = canManage;
  const showEditProfile = canEditProfile && Boolean(profile?.id);
  const showRemove = canManage && canRemoveFromBand;
  const showViewProfile = Boolean(profile?.id);
  const profilePath = profile?.id ? `/app/players/${profile.id}` : '';
  const profileLinkState = bandId ? { from: `/app/${bandId}` } : undefined;

  const hasMenu =
    canMakeLeader ||
    canMakePrimary ||
    canRemoveLeader ||
    showAssign ||
    showUnavailable ||
    showEditProfile ||
    showRemove;

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

  function closeMenu() {
    setMenuOpen(false);
  }

  function handleSelectPart(partId: string) {
    onAssign?.(partId);
    setShowAssignPicker(false);
  }

  function handleAssignClick() {
    closeMenu();
    setShowAssignPicker((open) => !open);
  }

  const metaItems = [
    assignedPart ? { key: 'part', label: assignedPart.title, prefix: 'Lineup' } : null,
    instrument ? { key: 'instrument', label: instrument } : null,
    profile?.location ? { key: 'location', label: profile.location } : null,
  ].filter(Boolean) as Array<{ key: string; label: string; prefix?: string }>;

  return (
    <article
      className={`band-member-card ${member.lineup_unavailable ? 'band-member-card-unavailable' : ''}`}
    >
      <div className="band-member-card-top">
        <div className="band-member-card-avatar">
          {profile?.profile_image_url ? (
            <img src={profile.profile_image_url} alt="" />
          ) : (
            <span>{bandInitials(name)}</span>
          )}
        </div>
        <div className="band-member-card-identity">
          <div className="band-member-card-heading">
            <strong>{name}</strong>
            <span
              className={`band-member-role ${isBandLeaderRole(member.role) ? 'band-member-role-leader' : ''}`}
            >
              {formatBandMemberRoleLabel(member.role)}
            </span>
            {isPrimaryContact ? (
              <span className="band-member-primary-badge">Primary contact</span>
            ) : null}
            {member.lineup_unavailable ? (
              <span className="band-lineup-unavailable-badge">Unavailable</span>
            ) : null}
          </div>
          {metaItems.length ? (
            <ul className="band-member-card-meta-list">
              {metaItems.map((item) => (
                <li key={item.key}>
                  {item.prefix ? (
                    <>
                      <span className="band-member-card-meta-prefix">{item.prefix}</span>
                      {item.label}
                    </>
                  ) : (
                    item.label
                  )}
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        {hasMenu ? (
          <div className="band-member-card-menu" ref={menuRef}>
            <button
              type="button"
              className="band-member-menu-btn"
              aria-label={`Actions for ${name}`}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              disabled={submitting}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <HamburgerIcon />
            </button>

            {menuOpen ? (
              <div className="band-member-menu-dropdown" role="menu">
                {canMakeLeader ? (
                  <button
                    type="button"
                    className="band-member-menu-item"
                    role="menuitem"
                    disabled={submitting}
                    onClick={() => {
                      closeMenu();
                      onMakeLeader?.();
                    }}
                  >
                    {submitting ? 'Assigning…' : 'Make leader'}
                  </button>
                ) : null}
                {canMakePrimary ? (
                  <button
                    type="button"
                    className="band-member-menu-item"
                    role="menuitem"
                    disabled={submitting}
                    onClick={() => {
                      closeMenu();
                      onMakePrimary?.();
                    }}
                  >
                    {submitting ? 'Updating…' : 'Make primary'}
                  </button>
                ) : null}
                {canRemoveLeader ? (
                  <button
                    type="button"
                    className="band-member-menu-item"
                    role="menuitem"
                    disabled={submitting}
                    onClick={() => {
                      closeMenu();
                      onRemoveLeader?.();
                    }}
                  >
                    {submitting ? 'Updating…' : 'Remove leader'}
                  </button>
                ) : null}
                {showAssign ? (
                  <button
                    type="button"
                    className="band-member-menu-item"
                    role="menuitem"
                    disabled={submitting}
                    aria-expanded={showAssignPicker}
                    onClick={handleAssignClick}
                  >
                    Assign to part
                  </button>
                ) : null}
                {showUnavailable ? (
                  <button
                    type="button"
                    className="band-member-menu-item"
                    role="menuitem"
                    disabled={submitting}
                    onClick={() => {
                      closeMenu();
                      onToggleUnavailable?.();
                    }}
                  >
                    {member.lineup_unavailable ? 'Mark available' : 'Mark unavailable'}
                  </button>
                ) : null}
                {showEditProfile && profile?.id ? (
                  <Link
                    className="band-member-menu-item"
                    role="menuitem"
                    to={`/app/profiles/${profile.id}/edit`}
                    onClick={closeMenu}
                  >
                    Edit profile
                  </Link>
                ) : null}
                {showRemove ? (
                  <button
                    type="button"
                    className="band-member-menu-item band-member-menu-item-danger"
                    role="menuitem"
                    disabled={submitting}
                    onClick={() => {
                      closeMenu();
                      onRemove?.();
                    }}
                  >
                    Remove from band
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {profile?.bio ? <p className="band-member-card-bio">{profile.bio}</p> : null}

      {showViewProfile ? (
        <footer className="band-member-card-footer">
          <Link
            className="band-member-btn band-member-btn-primary"
            to={profilePath}
            state={profileLinkState}
          >
            View profile
          </Link>
        </footer>
      ) : null}

      {showAssign && showAssignPicker ? (
        <div className="band-member-assign-picker" role="listbox" aria-label="Band parts">
          <p className="band-member-assign-picker-label">Choose a band part</p>
          <ul className="band-member-assign-picker-list">
            {parts.map((part) => {
              const occupied =
                part.assigned_member_id != null && part.assigned_member_id !== member.id;
              return (
                <li key={part.id}>
                  <button
                    type="button"
                    className="band-member-assign-option"
                    disabled={submitting || occupied}
                    onClick={() => handleSelectPart(part.id)}
                  >
                    <span>{part.title}</span>
                    {part.instrument_filter ? (
                      <span className="band-part-instrument">{part.instrument_filter}</span>
                    ) : null}
                    {part.assigned_member_id === member.id ? (
                      <span className="band-member-assign-current">Current</span>
                    ) : occupied ? (
                      <span className="band-member-assign-occupied">Filled</span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </article>
  );
}
