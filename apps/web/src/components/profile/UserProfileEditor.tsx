import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  formatPlayerInvitePreferences,
  resolveDisplayName,
  updateUserProfile,
  updateUserProfileByUserId,
  type UpdateUserProfileInput,
  type UserProfile,
} from '@bandie/data';
import { UserAvatarUploadField } from './UserAvatarUploadField';
import { bandInitials } from '../../lib/profileHelpers';

type UserProfileEditorProps = {
  variant: 'self' | 'admin';
  profile: UserProfile;
  accountEmail?: string | null;
  onSaved?: (profile: UserProfile) => void;
  onRefreshAuth?: () => Promise<void>;
};

function applyProfileToForm(profile: UserProfile) {
  return {
    displayName: profile.display_name ?? '',
    preferredInstrument: profile.preferred_instrument ?? '',
    profileImageUrl: profile.profile_image_url ?? '',
    bio: profile.bio ?? '',
    location: profile.location ?? '',
    genres: profile.genres.join(', '),
    instruments: profile.instruments.join(', '),
    yearsPlaying: profile.years_playing?.toString() ?? '',
    gearItems: profile.gear_items.join(', '),
    gearNotes: profile.gear_notes ?? '',
    openToDeputyInvites: profile.open_to_deputy_invites,
    openToMemberInvites: profile.open_to_member_invites,
    publicPlayerProfile: profile.public_player_profile_enabled,
    travelDistanceMiles: profile.travel_distance_miles?.toString() ?? '',
    deputyFeeMin: profile.deputy_fee_guidance_min?.toString() ?? '',
    deputyFeeMax: profile.deputy_fee_guidance_max?.toString() ?? '',
  };
}

export function UserProfileEditor({
  variant,
  profile,
  accountEmail,
  onSaved,
  onRefreshAuth,
}: UserProfileEditorProps) {
  const isAdmin = variant === 'admin';
  const [formProfile, setFormProfile] = useState(profile);
  const [displayName, setDisplayName] = useState('');
  const [preferredInstrument, setPreferredInstrument] = useState('');
  const [profileImageUrl, setProfileImageUrl] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [genres, setGenres] = useState('');
  const [instruments, setInstruments] = useState('');
  const [yearsPlaying, setYearsPlaying] = useState('');
  const [gearItems, setGearItems] = useState('');
  const [gearNotes, setGearNotes] = useState('');
  const [openToDeputyInvites, setOpenToDeputyInvites] = useState(false);
  const [openToMemberInvites, setOpenToMemberInvites] = useState(false);
  const [publicPlayerProfile, setPublicPlayerProfile] = useState(false);
  const [travelDistanceMiles, setTravelDistanceMiles] = useState('');
  const [deputyFeeMin, setDeputyFeeMin] = useState('');
  const [deputyFeeMax, setDeputyFeeMax] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setFormProfile(profile);
    const values = applyProfileToForm(profile);
    setDisplayName(values.displayName);
    setPreferredInstrument(values.preferredInstrument);
    setProfileImageUrl(values.profileImageUrl);
    setBio(values.bio);
    setLocation(values.location);
    setGenres(values.genres);
    setInstruments(values.instruments);
    setYearsPlaying(values.yearsPlaying);
    setGearItems(values.gearItems);
    setGearNotes(values.gearNotes);
    setOpenToDeputyInvites(values.openToDeputyInvites);
    setOpenToMemberInvites(values.openToMemberInvites);
    setPublicPlayerProfile(values.publicPlayerProfile);
    setTravelDistanceMiles(values.travelDistanceMiles);
    setDeputyFeeMin(values.deputyFeeMin);
    setDeputyFeeMax(values.deputyFeeMax);
  }, [profile]);

  function buildUpdateInput(): UpdateUserProfileInput {
    return {
      display_name: displayName,
      preferred_instrument: preferredInstrument,
      profile_image_url: profileImageUrl || null,
      bio,
      location,
      genres: genres
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      instruments: instruments
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      years_playing: yearsPlaying ? Number(yearsPlaying) : null,
      gear_items: gearItems
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      gear_notes: gearNotes,
      open_to_deputy_invites: openToDeputyInvites,
      open_to_member_invites: openToMemberInvites,
      public_player_profile_enabled: publicPlayerProfile,
      travel_distance_miles: travelDistanceMiles ? Number(travelDistanceMiles) : null,
      deputy_fee_guidance_min: deputyFeeMin ? Number(deputyFeeMin) : null,
      deputy_fee_guidance_max: deputyFeeMax ? Number(deputyFeeMax) : null,
    };
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      const input = buildUpdateInput();
      const updated = isAdmin
        ? await updateUserProfileByUserId(formProfile.user_id, input)
        : await updateUserProfile(input);

      if (!isAdmin) {
        await onRefreshAuth?.();
      }

      setFormProfile(updated);
      onSaved?.(updated);
      setSuccess(isAdmin ? 'Player profile updated.' : 'Player profile saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save profile.');
    } finally {
      setSubmitting(false);
    }
  }

  const previewName = displayName.trim() || resolveDisplayName(formProfile, accountEmail);
  const previewGear = gearItems
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  const previewInviteLabels = formatPlayerInvitePreferences({
    open_to_deputy_invites: openToDeputyInvites,
    open_to_member_invites: openToMemberInvites,
  });

  const fieldPrefix = isAdmin ? `admin-${formProfile.id}` : 'self';

  return (
    <>
      <aside className="player-profile-preview" aria-label="Profile preview">
        <div className="player-profile-preview-avatar">
          {profileImageUrl ? (
            <img src={profileImageUrl} alt="" />
          ) : (
            <span>{bandInitials(previewName)}</span>
          )}
        </div>
        <div>
          <strong>{previewName}</strong>
          <p>
            {preferredInstrument || 'Instrument not set'}
            {location ? ` · ${location}` : ''}
          </p>
          {previewGear.length ? (
            <p className="player-profile-preview-gear">
              Gear: {previewGear.slice(0, 3).join(', ')}
              {previewGear.length > 3 ? ` +${previewGear.length - 3} more` : ''}
            </p>
          ) : null}
          {previewInviteLabels.length ? (
            <p className="player-profile-preview-invites">{previewInviteLabels.join(' · ')}</p>
          ) : null}
        </div>
      </aside>

      <form className="auth-form" onSubmit={handleSubmit} style={{ marginTop: '1.5rem' }}>
        {error ? <div className="auth-message auth-message-error">{error}</div> : null}
        {success ? <div className="auth-message auth-message-success">{success}</div> : null}

        <div className="profile-editor-section">
          <h3>Photo</h3>
          <UserAvatarUploadField
            value={profileImageUrl}
            onChange={setProfileImageUrl}
            targetUserId={isAdmin ? formProfile.user_id : undefined}
          />
          <p style={{ color: '#bbb6aa', fontSize: '0.88rem', marginTop: 0 }}>
            Click Save profile after uploading to store the photo URL.
          </p>
        </div>

        <div className="profile-editor-section">
          <h3>Identity</h3>
          <div className="auth-field">
            <label htmlFor={`${fieldPrefix}-displayName`}>Display name</label>
            <input
              id={`${fieldPrefix}-displayName`}
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
          {!isAdmin && accountEmail ? (
            <div className="auth-field">
              <label htmlFor={`${fieldPrefix}-accountEmail`}>Email</label>
              <input
                id={`${fieldPrefix}-accountEmail`}
                type="email"
                value={accountEmail}
                readOnly
                disabled
              />
            </div>
          ) : null}
          <div className="auth-field">
            <label htmlFor={`${fieldPrefix}-preferredInstrument`}>Primary instrument</label>
            <input
              id={`${fieldPrefix}-preferredInstrument`}
              placeholder="e.g. Guitar, vocals, drums"
              value={preferredInstrument}
              onChange={(e) => setPreferredInstrument(e.target.value)}
            />
          </div>
          <div className="auth-field">
            <label htmlFor={`${fieldPrefix}-instruments`}>All instruments (comma-separated)</label>
            <input
              id={`${fieldPrefix}-instruments`}
              placeholder="Guitar, backing vocals, keys"
              value={instruments}
              onChange={(e) => setInstruments(e.target.value)}
            />
          </div>
          <div className="auth-field">
            <label htmlFor={`${fieldPrefix}-location`}>Location</label>
            <input
              id={`${fieldPrefix}-location`}
              placeholder="e.g. Surrey, UK"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
        </div>

        <div className="profile-editor-section">
          <h3>About you</h3>
          <div className="auth-field">
            <label htmlFor={`${fieldPrefix}-bio`}>Bio</label>
            <textarea
              id={`${fieldPrefix}-bio`}
              rows={4}
              placeholder="Experience, style, bands you've played with, session work…"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>
          <div className="profile-editor-row-grid">
            <div className="auth-field">
              <label htmlFor={`${fieldPrefix}-genres`}>Genres (comma-separated)</label>
              <input
                id={`${fieldPrefix}-genres`}
                placeholder="Rock, soul, covers"
                value={genres}
                onChange={(e) => setGenres(e.target.value)}
              />
            </div>
            <div className="auth-field">
              <label htmlFor={`${fieldPrefix}-yearsPlaying`}>Years playing</label>
              <input
                id={`${fieldPrefix}-yearsPlaying`}
                inputMode="numeric"
                value={yearsPlaying}
                onChange={(e) => setYearsPlaying(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="profile-editor-section">
          <h3>Gear</h3>
          <p className="profile-section-intro">
            {isAdmin
              ? 'What they play and bring to gigs — helps bandmates plan stage setup and backline.'
              : 'What you play and bring to gigs — helps bandmates plan stage setup and backline.'}
          </p>
          <div className="auth-field">
            <label htmlFor={`${fieldPrefix}-gearItems`}>Gear list (comma-separated)</label>
            <input
              id={`${fieldPrefix}-gearItems`}
              placeholder="Fender Strat, Boss TU-3, Vox AC30, Shure SM58"
              value={gearItems}
              onChange={(e) => setGearItems(e.target.value)}
            />
          </div>
          <div className="auth-field">
            <label htmlFor={`${fieldPrefix}-gearNotes`}>Setup & requirements</label>
            <textarea
              id={`${fieldPrefix}-gearNotes`}
              rows={3}
              placeholder="Amp needs a power socket, prefer DI for acoustic, can share backline…"
              value={gearNotes}
              onChange={(e) => setGearNotes(e.target.value)}
            />
          </div>
        </div>

        <div className="profile-editor-section">
          <h3>Band invitations</h3>
          <p className="profile-section-intro">
            Controls whether this musician appears in the{' '}
            <Link to="/players" className="profile-preview-link">
              player directory
            </Link>{' '}
            and what types of invite they are open to.
          </p>
          <div className="profile-editor-toggle">
            <input
              id={`${fieldPrefix}-openToDeputyInvites`}
              type="checkbox"
              checked={openToDeputyInvites}
              onChange={(event) => setOpenToDeputyInvites(event.target.checked)}
            />
            <label htmlFor={`${fieldPrefix}-openToDeputyInvites`}>
              Open to deputy / stand-in invitations (one-off gigs with other bands)
            </label>
          </div>
          {openToDeputyInvites ? (
            <div className="profile-editor-row-grid" style={{ marginTop: '1rem' }}>
              <div className="auth-field">
                <label htmlFor={`${fieldPrefix}-travelDistanceMiles`}>Willing to travel (miles)</label>
                <input
                  id={`${fieldPrefix}-travelDistanceMiles`}
                  inputMode="numeric"
                  placeholder="e.g. 40"
                  value={travelDistanceMiles}
                  onChange={(e) => setTravelDistanceMiles(e.target.value)}
                />
              </div>
              <div className="auth-field">
                <label htmlFor={`${fieldPrefix}-deputyFeeMin`}>Deputy fee guidance min (£)</label>
                <input
                  id={`${fieldPrefix}-deputyFeeMin`}
                  inputMode="numeric"
                  placeholder="e.g. 100"
                  value={deputyFeeMin}
                  onChange={(e) => setDeputyFeeMin(e.target.value)}
                />
              </div>
              <div className="auth-field">
                <label htmlFor={`${fieldPrefix}-deputyFeeMax`}>Deputy fee guidance max (£)</label>
                <input
                  id={`${fieldPrefix}-deputyFeeMax`}
                  inputMode="numeric"
                  placeholder="e.g. 250"
                  value={deputyFeeMax}
                  onChange={(e) => setDeputyFeeMax(e.target.value)}
                />
              </div>
            </div>
          ) : null}
          <div className="profile-editor-toggle">
            <input
              id={`${fieldPrefix}-openToMemberInvites`}
              type="checkbox"
              checked={openToMemberInvites}
              onChange={(event) => setOpenToMemberInvites(event.target.checked)}
            />
            <label htmlFor={`${fieldPrefix}-openToMemberInvites`}>
              Open to permanent member invitations (joining another band)
            </label>
          </div>
        </div>

        <div className="profile-editor-section">
          <h3>Directory visibility</h3>
          <div className="profile-editor-toggle">
            <input
              id={`${fieldPrefix}-publicPlayerProfile`}
              type="checkbox"
              checked={publicPlayerProfile}
              onChange={(event) => setPublicPlayerProfile(event.target.checked)}
            />
            <label htmlFor={`${fieldPrefix}-publicPlayerProfile`}>
              List this player profile in the public player directory (requires at least one
              invitation preference above)
            </label>
          </div>
        </div>

        <button className="auth-button" type="submit" disabled={submitting}>
          {submitting ? 'Saving profile…' : 'Save profile'}
        </button>
      </form>
    </>
  );
}
