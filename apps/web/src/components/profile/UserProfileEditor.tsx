import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  formatPlayerInvitePreferences,
  PLAYER_GENDER_OPTIONS,
  PRIMARY_INSTRUMENT_OPTIONS,
  PRIMARY_INSTRUMENT_OTHER,
  primaryInstrumentFormState,
  proposeUsernameFromDisplayName,
  resolveDisplayName,
  resolvePrimaryInstrumentValue,
  resolveUsernameForProfile,
  updateUserProfile,
  updateUserProfileByUserId,
  type PlayerGender,
  type UpdateUserProfileInput,
  type UserProfile,
} from '@bandie/data';
import { UserAvatarUploadField } from './UserAvatarUploadField';
import { HeadingWithHelp } from '../ui/InfoHelp';
import { PlayerProfilePreview } from './PlayerProfilePreview';

type UserProfileEditorProps = {
  variant: 'self' | 'admin';
  profile: UserProfile;
  accountEmail?: string | null;
  formId?: string;
  onSaved?: (profile: UserProfile) => void;
  onRefreshAuth?: () => Promise<void>;
  onSubmittingChange?: (submitting: boolean) => void;
};

function applyProfileToForm(profile: UserProfile) {
  const instrumentState = primaryInstrumentFormState(profile.preferred_instrument);

  return {
    displayName: profile.display_name ?? '',
    username: profile.username ?? proposeUsernameFromDisplayName(profile.display_name ?? ''),
    primaryInstrumentChoice: instrumentState.choice,
    primaryInstrumentOther: instrumentState.other,
    gender: profile.gender ?? '',
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
    isPlayer: profile.is_player,
    isOrganiser: profile.is_organiser,
  };
}

export function UserProfileEditor({
  variant,
  profile,
  accountEmail,
  formId = 'player-profile-form',
  onSaved,
  onRefreshAuth,
  onSubmittingChange,
}: UserProfileEditorProps) {
  const isAdmin = variant === 'admin';
  const [formProfile, setFormProfile] = useState(profile);
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [primaryInstrumentChoice, setPrimaryInstrumentChoice] = useState('');
  const [primaryInstrumentOther, setPrimaryInstrumentOther] = useState('');
  const [gender, setGender] = useState('');
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
  const [isPlayer, setIsPlayer] = useState(true);
  const [isOrganiser, setIsOrganiser] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setFormProfile(profile);
    const values = applyProfileToForm(profile);
    setDisplayName(values.displayName);
    setUsername(values.username);
    setPrimaryInstrumentChoice(values.primaryInstrumentChoice);
    setPrimaryInstrumentOther(values.primaryInstrumentOther);
    setGender(values.gender);
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
    setIsPlayer(values.isPlayer);
    setIsOrganiser(values.isOrganiser);
  }, [profile]);

  function buildUpdateInput(): UpdateUserProfileInput {
    return {
      display_name: displayName,
      username: resolveUsernameForProfile(username, displayName),
      preferred_instrument: isPlayer
        ? resolvePrimaryInstrumentValue(primaryInstrumentChoice, primaryInstrumentOther)
        : undefined,
      gender: isPlayer ? (gender ? (gender as PlayerGender) : null) : undefined,
      profile_image_url: profileImageUrl || null,
      bio,
      location,
      genres: isPlayer
        ? genres
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean)
        : undefined,
      instruments: isPlayer
        ? instruments
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean)
        : undefined,
      years_playing: isPlayer && yearsPlaying ? Number(yearsPlaying) : isPlayer ? null : undefined,
      gear_items: isPlayer
        ? gearItems
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean)
        : undefined,
      gear_notes: isPlayer ? gearNotes : undefined,
      open_to_deputy_invites: isPlayer ? openToDeputyInvites : undefined,
      open_to_member_invites: isPlayer ? openToMemberInvites : undefined,
      public_player_profile_enabled: isPlayer ? publicPlayerProfile : undefined,
      travel_distance_miles:
        isPlayer && travelDistanceMiles ? Number(travelDistanceMiles) : isPlayer ? null : undefined,
      deputy_fee_guidance_min:
        isPlayer && deputyFeeMin ? Number(deputyFeeMin) : isPlayer ? null : undefined,
      deputy_fee_guidance_max:
        isPlayer && deputyFeeMax ? Number(deputyFeeMax) : isPlayer ? null : undefined,
      is_player: isPlayer,
      is_organiser: isOrganiser,
    };
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!isPlayer && !isOrganiser) {
      setError('Choose at least one role: player, organiser, or both.');
      return;
    }

    setSubmitting(true);
    onSubmittingChange?.(true);

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
      onSubmittingChange?.(false);
    }
  }

  const previewName = displayName.trim() || resolveDisplayName(formProfile, accountEmail);
  const previewInstrument = resolvePrimaryInstrumentValue(
    primaryInstrumentChoice,
    primaryInstrumentOther,
  );
  const previewGear = gearItems
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  const previewInviteLabels = formatPlayerInvitePreferences({
    open_to_deputy_invites: openToDeputyInvites,
    open_to_member_invites: openToMemberInvites,
  });

  const fieldPrefix = isAdmin ? `admin-${formProfile.id}` : 'self';
  const showPlayerSections = isAdmin || isPlayer;

  return (
    <>
      {isAdmin ? (
        <PlayerProfilePreview
          data={{
            displayName: previewName,
            profileImageUrl: profileImageUrl || null,
            primaryLine: showPlayerSections
              ? previewInstrument || 'Instrument not set'
              : 'Event organiser',
            location: location || null,
            gearItems: previewGear,
            inviteLabels: previewInviteLabels,
          }}
        />
      ) : null}

      <form
        id={formId}
        className="auth-form user-profile-editor-form"
        onSubmit={handleSubmit}
      >
        {error ? <div className="auth-message auth-message-error">{error}</div> : null}
        {success ? <div className="auth-message auth-message-success">{success}</div> : null}

        {!isAdmin ? (
          <div className="profile-editor-section">
            <HeadingWithHelp
              as="h3"
              helpLabel="About how you use Bandie"
              help={
                <p>
                  Choose whether you use Bandie as a musician, an event organiser, or both. This
                  controls which workspace screens and options you see.
                </p>
              }
            >
              How you use Bandie
            </HeadingWithHelp>
            <div className="profile-editor-toggle">
              <input
                id={`${fieldPrefix}-isPlayer`}
                type="checkbox"
                checked={isPlayer}
                onChange={(event) => setIsPlayer(event.target.checked)}
              />
              <label htmlFor={`${fieldPrefix}-isPlayer`}>
                I am a player / musician (bands, player profile, player directory)
              </label>
            </div>
            <div className="profile-editor-toggle">
              <input
                id={`${fieldPrefix}-isOrganiser`}
                type="checkbox"
                checked={isOrganiser}
                onChange={(event) => setIsOrganiser(event.target.checked)}
              />
              <label htmlFor={`${fieldPrefix}-isOrganiser`}>
                I am an event organiser (find and book bands)
              </label>
            </div>
          </div>
        ) : null}

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
            <label htmlFor={`${fieldPrefix}-username`}>Username</label>
            <input
              id={`${fieldPrefix}-username`}
              autoComplete="username"
              placeholder={proposeUsernameFromDisplayName(displayName) || 'e.g. daltonc'}
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
            />
            <p className="directory-field-hint">
              Sign in with this or your email. From your name: last name + first initial (Chris
              Dalton → daltonc).
            </p>
          </div>
          {showPlayerSections ? (
            <>
              <div className="auth-field">
                <label htmlFor={`${fieldPrefix}-gender`}>Gender</label>
                <select
                  id={`${fieldPrefix}-gender`}
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                >
                  <option value="">Not specified</option>
                  {PLAYER_GENDER_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="directory-field-hint">
                  Optional. Used when band leaders search the player directory.
                </p>
              </div>
              <div className="auth-field">
                <label htmlFor={`${fieldPrefix}-preferredInstrument`}>Primary instrument</label>
                <select
                  id={`${fieldPrefix}-preferredInstrument`}
                  value={primaryInstrumentChoice}
                  onChange={(e) => setPrimaryInstrumentChoice(e.target.value)}
                >
                  <option value="">Select primary instrument</option>
                  {PRIMARY_INSTRUMENT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                  <option value={PRIMARY_INSTRUMENT_OTHER}>Other…</option>
                </select>
                {primaryInstrumentChoice === PRIMARY_INSTRUMENT_OTHER ? (
                  <input
                    id={`${fieldPrefix}-preferredInstrumentOther`}
                    type="text"
                    placeholder="e.g. Upright bass, fiddle, accordion"
                    value={primaryInstrumentOther}
                    onChange={(e) => setPrimaryInstrumentOther(e.target.value)}
                    style={{ marginTop: '0.65rem' }}
                  />
                ) : null}
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
            </>
          ) : null}
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
              placeholder={
                showPlayerSections
                  ? "Experience, style, bands you've played with, session work…"
                  : 'Venues you book for, areas you cover, types of events you organise…'
              }
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>
          {showPlayerSections ? (
            <div className="profile-editor-row-grid-dual">
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
          ) : null}
        </div>

        {showPlayerSections ? (
          <>
        <div className="profile-editor-section">
          <HeadingWithHelp
            as="h3"
            helpLabel="About gear"
            help={
              <p>
                {isAdmin
                  ? 'What they play and bring to gigs — helps bandmates plan stage setup and backline.'
                  : 'What you play and bring to gigs — helps bandmates plan stage setup and backline.'}
              </p>
            }
          >
            Gear
          </HeadingWithHelp>
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
          <HeadingWithHelp
            as="h3"
            helpLabel="About band invitations"
            help={
              <p>
                Controls whether this musician appears in the{' '}
                <Link to="/app/players" className="profile-preview-link">
                  player directory
                </Link>{' '}
                and what types of invite they are open to.
              </p>
            }
          >
            Band invitations
          </HeadingWithHelp>
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
            <div className="profile-editor-row-grid-triple" style={{ marginTop: '1rem' }}>
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
          </>
        ) : null}

        <button className="auth-button" type="submit" disabled={submitting}>
          {submitting ? 'Saving profile…' : 'Save profile'}
        </button>
      </form>
    </>
  );
}
