import { useState, type CSSProperties, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  availabilityLabel,
  bandNameFontFamily,
  bandPaletteCssVariables,
  formatBandSubtitle,
  formatFeeRange,
  getBandColorPalette,
  resolveBandColorPalette,
  resolveBandNameFont,
  updateBandProfile,
  type BandColorPaletteId,
  type BandNameFont,
  type PublicBandProfile,
  type SocialPlatform,
} from '@bandie/data';
import {
  bandInitials,
  formatDisplayDate,
  socialPlatformLabel,
  youtubeEmbedUrl,
} from '../../lib/profileHelpers';
import {
  dateDraftsFromProfile,
  dateDraftsToInput,
  emptyDate,
  emptyMedia,
  emptySocial,
  mediaDraftsFromProfile,
  mediaDraftsToInput,
  socialDraftsFromProfile,
  socialDraftsToInput,
  type DateDraft,
  type MediaDraft,
  type SocialDraft,
} from '../../lib/bandProfileDrafts';
import { useBandNameFont } from '../../lib/useBandNameFont';
import { BandNameFontPicker } from '../profile/BandNameFontPicker';
import { BandColorPalettePicker } from '../profile/BandColorPalettePicker';
import { ProfileImageUploadField } from '../profile/ProfileImageUploadField';
import {
  WorkspaceEditActions,
  WorkspaceEditableSection,
  WorkspaceSectionBlock,
} from './WorkspaceEditControl';
import '../../styles/bandProfile.css';

type EditSection =
  | 'hero'
  | 'logo'
  | 'name'
  | 'palette'
  | 'availability'
  | 'tagline'
  | 'location'
  | 'genres'
  | 'bio'
  | 'meta'
  | 'equipment'
  | 'media'
  | 'social'
  | 'dates'
  | 'booking';

type BandWorkspaceProfileViewProps = {
  bandId: string;
  profile: PublicBandProfile;
  canEdit: boolean;
  onProfileUpdated: (profile: PublicBandProfile) => void;
  onPublishChange?: (published: boolean) => Promise<void>;
};

export function BandWorkspaceProfileView({
  bandId,
  profile,
  canEdit,
  onProfileUpdated,
  onPublishChange,
}: BandWorkspaceProfileViewProps) {
  const tagline = formatBandSubtitle(profile);
  const genreLabel = profile.genres.filter(Boolean).join(', ');
  const feeRange = formatFeeRange(profile.fee_guidance_min, profile.fee_guidance_max);
  const photos = profile.media.filter((item) => item.kind === 'photo');
  const videos = profile.media.filter((item) => item.kind === 'video');
  const tracks = profile.media.filter((item) => item.kind === 'track');
  const bookingEmail = profile.booking_email?.trim();
  const bookingPhone = profile.booking_phone?.trim();
  const hasMeta = Boolean(profile.band_size || profile.set_length_minutes || feeRange);

  useBandNameFont(profile.name_font);

  const [editing, setEditing] = useState<EditSection | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [draftHeroUrl, setDraftHeroUrl] = useState('');
  const [draftLogoUrl, setDraftLogoUrl] = useState('');
  const [draftName, setDraftName] = useState('');
  const [draftSlug, setDraftSlug] = useState('');
  const [draftNameFont, setDraftNameFont] = useState<BandNameFont>('inter');
  const [draftColorPalette, setDraftColorPalette] = useState<BandColorPaletteId>('bandie-gold');
  const [draftAvailabilityStatus, setDraftAvailabilityStatus] = useState<
    'available' | 'limited' | 'unavailable'
  >('available');
  const [draftAvailabilityNote, setDraftAvailabilityNote] = useState('');
  const [draftTagline, setDraftTagline] = useState('');
  const [draftHomeCity, setDraftHomeCity] = useState('');
  const [draftTravelDistance, setDraftTravelDistance] = useState('');
  const [draftGenres, setDraftGenres] = useState('');
  const [draftDescription, setDraftDescription] = useState('');
  const [draftBandSize, setDraftBandSize] = useState('');
  const [draftSetLength, setDraftSetLength] = useState('');
  const [draftFeeMin, setDraftFeeMin] = useState('');
  const [draftFeeMax, setDraftFeeMax] = useState('');
  const [draftEquipmentNotes, setDraftEquipmentNotes] = useState('');
  const [draftBookingEmail, setDraftBookingEmail] = useState('');
  const [draftBookingPhone, setDraftBookingPhone] = useState('');
  const [draftMediaItems, setDraftMediaItems] = useState<MediaDraft[]>([]);
  const [draftSocialItems, setDraftSocialItems] = useState<SocialDraft[]>([]);
  const [draftDateItems, setDraftDateItems] = useState<DateDraft[]>([]);

  function openEdit(section: EditSection) {
    setError(null);
    setEditing(section);

    switch (section) {
      case 'hero':
        setDraftHeroUrl(profile.hero_image_url ?? '');
        break;
      case 'logo':
        setDraftLogoUrl(profile.logo_url ?? '');
        break;
      case 'name':
        setDraftName(profile.name);
        setDraftSlug(profile.slug);
        setDraftNameFont(resolveBandNameFont(profile.name_font));
        break;
      case 'palette':
        setDraftColorPalette(resolveBandColorPalette(profile.color_palette));
        break;
      case 'availability':
        setDraftAvailabilityStatus(profile.availability_status);
        setDraftAvailabilityNote(profile.availability_note ?? '');
        break;
      case 'tagline':
        setDraftTagline(profile.tagline ?? '');
        break;
      case 'location':
        setDraftHomeCity(profile.location ?? '');
        setDraftTravelDistance(profile.travel_distance_miles?.toString() ?? '');
        break;
      case 'genres':
        setDraftGenres(profile.genres.join(', '));
        break;
      case 'bio':
        setDraftDescription(profile.description ?? '');
        break;
      case 'meta':
        setDraftBandSize(profile.band_size?.toString() ?? '');
        setDraftSetLength(profile.set_length_minutes?.toString() ?? '');
        setDraftFeeMin(profile.fee_guidance_min?.toString() ?? '');
        setDraftFeeMax(profile.fee_guidance_max?.toString() ?? '');
        break;
      case 'equipment':
        setDraftEquipmentNotes(profile.equipment_notes ?? '');
        break;
      case 'media':
        setDraftMediaItems(mediaDraftsFromProfile(profile.media));
        break;
      case 'social':
        setDraftSocialItems(socialDraftsFromProfile(profile.socialLinks));
        break;
      case 'dates':
        setDraftDateItems(dateDraftsFromProfile(profile.publicDates));
        break;
      case 'booking':
        setDraftBookingEmail(profile.booking_email ?? '');
        setDraftBookingPhone(profile.booking_phone ?? '');
        break;
    }
  }

  function closeEdit() {
    setEditing(null);
    setError(null);
  }

  async function saveSection(section: EditSection) {
    setSaving(true);
    setError(null);

    try {
      let updated: PublicBandProfile;

      switch (section) {
        case 'hero':
          updated = await updateBandProfile(bandId, { hero_image_url: draftHeroUrl || null });
          break;
        case 'logo':
          updated = await updateBandProfile(bandId, { logo_url: draftLogoUrl || null });
          break;
        case 'name':
          updated = await updateBandProfile(bandId, {
            name: draftName,
            slug: draftSlug,
            name_font: draftNameFont,
          });
          break;
        case 'palette':
          updated = await updateBandProfile(bandId, { color_palette: draftColorPalette });
          break;
        case 'availability':
          updated = await updateBandProfile(bandId, {
            availability_status: draftAvailabilityStatus,
            availability_note: draftAvailabilityNote,
          });
          break;
        case 'tagline':
          updated = await updateBandProfile(bandId, { tagline: draftTagline });
          break;
        case 'location':
          updated = await updateBandProfile(bandId, {
            location: draftHomeCity,
            travel_distance_miles: draftTravelDistance ? Number(draftTravelDistance) : null,
          });
          break;
        case 'genres':
          updated = await updateBandProfile(bandId, {
            genres: draftGenres
              .split(',')
              .map((genre) => genre.trim())
              .filter(Boolean),
          });
          break;
        case 'bio':
          updated = await updateBandProfile(bandId, { description: draftDescription });
          break;
        case 'meta':
          updated = await updateBandProfile(bandId, {
            band_size: draftBandSize ? Number(draftBandSize) : null,
            set_length_minutes: draftSetLength ? Number(draftSetLength) : null,
            fee_guidance_min: draftFeeMin ? Number(draftFeeMin) : null,
            fee_guidance_max: draftFeeMax ? Number(draftFeeMax) : null,
          });
          break;
        case 'equipment':
          updated = await updateBandProfile(bandId, { equipment_notes: draftEquipmentNotes });
          break;
        case 'media':
          updated = await updateBandProfile(bandId, { media: mediaDraftsToInput(draftMediaItems) });
          break;
        case 'social':
          updated = await updateBandProfile(bandId, { socialLinks: socialDraftsToInput(draftSocialItems) });
          break;
        case 'dates':
          updated = await updateBandProfile(bandId, { publicDates: dateDraftsToInput(draftDateItems) });
          break;
        case 'booking':
          updated = await updateBandProfile(bandId, {
            booking_email: draftBookingEmail || null,
            booking_phone: draftBookingPhone || null,
          });
          break;
        default:
          return;
      }

      onProfileUpdated(updated);
      closeEdit();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save changes.');
    } finally {
      setSaving(false);
    }
  }

  function editPanel(section: EditSection, form: ReactNode) {
    if (editing !== section) {
      return null;
    }

    return (
      <div className="workspace-edit-panel auth-form">
        {error ? <div className="auth-message auth-message-error">{error}</div> : null}
        {form}
        <WorkspaceEditActions
          onSave={() => saveSection(section)}
          onCancel={closeEdit}
          saving={saving}
        />
      </div>
    );
  }

  const showEquipment = Boolean(profile.equipment_notes) || (canEdit && editing === 'equipment');
  const showTracks = tracks.length > 0 || (canEdit && editing === 'media');
  const showVideos = videos.length > 0 || (canEdit && editing === 'media');
  const showPhotos = photos.length > 0 || (canEdit && editing === 'media');
  const showSocial = profile.socialLinks.length > 0 || (canEdit && editing === 'social');
  const showDates = profile.publicDates.length > 0 || (canEdit && editing === 'dates');
  const showBooking = Boolean(bookingEmail || bookingPhone) || (canEdit && editing === 'booking');

  const displayedPalette =
    editing === 'palette' ? draftColorPalette : resolveBandColorPalette(profile.color_palette);
  const paletteStyle = bandPaletteCssVariables(displayedPalette) as CSSProperties;
  const activePalette = getBandColorPalette(displayedPalette);

  return (
    <div className="band-workspace-profile band-profile-page" style={paletteStyle}>
      <div className="band-workspace-toolbar">
        {profile.public_profile_enabled ? (
          <span className="workspace-badge workspace-badge-live">Public profile live</span>
        ) : (
          <span className="workspace-badge workspace-badge-draft">Profile not published</span>
        )}
        {canEdit && onPublishChange ? (
          <label className="band-workspace-publish-toggle">
            <input
              type="checkbox"
              checked={profile.public_profile_enabled}
              onChange={(event) => onPublishChange(event.target.checked)}
            />
            Publish public profile
          </label>
        ) : null}
        {profile.public_profile_enabled ? (
          <Link className="profile-preview-link" to={`/bands/${profile.slug}`} target="_blank">
            View public profile
          </Link>
        ) : null}
      </div>

      <div className="band-profile-shell band-workspace-fields">
        <WorkspaceEditableSection
          title="Hero image"
          canEdit={canEdit}
          isEditing={editing === 'hero'}
          onEdit={() => openEdit('hero')}
          editLabel={profile.hero_image_url ? 'Edit' : 'Add'}
          className="band-workspace-hero-wrap"
        >
          {editing === 'hero' ? (
            editPanel(
              'hero',
              <ProfileImageUploadField
                bandId={bandId}
                kind="hero"
                label="Hero image"
                hint="Wide photo or poster for the top of your public profile."
                value={draftHeroUrl}
                onChange={setDraftHeroUrl}
                previewClassName="profile-image-preview profile-image-preview-hero"
              />,
            )
          ) : profile.hero_image_url ? (
            <div className="band-profile-hero-banner">
              <img src={profile.hero_image_url} alt="" />
            </div>
          ) : canEdit ? (
            <div className="band-workspace-hero-placeholder">Add a hero image for your public profile</div>
          ) : null}
        </WorkspaceEditableSection>

        <section className="band-workspace-identity">
          <WorkspaceEditableSection
            title="Logo"
            canEdit={canEdit}
            isEditing={editing === 'logo'}
            onEdit={() => openEdit('logo')}
            editLabel={profile.logo_url ? 'Edit' : 'Add'}
            className="band-workspace-logo-wrap"
          >
            {editing === 'logo' ? (
              editPanel(
                'logo',
                <ProfileImageUploadField
                  bandId={bandId}
                  kind="logo"
                  label="Logo"
                  hint="Square image works best."
                  value={draftLogoUrl}
                  onChange={setDraftLogoUrl}
                  previewClassName="profile-image-preview profile-image-preview-logo"
                />,
              )
            ) : (
              <div className="band-profile-logo-mark" aria-hidden={Boolean(profile.logo_url)}>
                {profile.logo_url ? (
                  <img src={profile.logo_url} alt={`${profile.name} logo`} />
                ) : (
                  bandInitials(profile.name)
                )}
              </div>
            )}
          </WorkspaceEditableSection>

          <WorkspaceEditableSection
            title="Band name"
            canEdit={canEdit}
            isEditing={editing === 'name'}
            onEdit={() => openEdit('name')}
            className="band-workspace-name-wrap"
          >
            {editing === 'name' ? (
              editPanel(
                'name',
                <>
                  <div className="auth-field">
                    <label htmlFor="workspaceBandName">Band name</label>
                    <input
                      id="workspaceBandName"
                      required
                      value={draftName}
                      onChange={(event) => setDraftName(event.target.value)}
                    />
                  </div>
                  <div className="auth-field">
                    <label htmlFor="workspaceBandSlug">Public slug</label>
                    <input
                      id="workspaceBandSlug"
                      required
                      value={draftSlug}
                      onChange={(event) => setDraftSlug(event.target.value)}
                    />
                  </div>
                  <div className="auth-field">
                    <label htmlFor="workspaceBandFont">Band name font</label>
                    <BandNameFontPicker
                      value={draftNameFont}
                      onChange={setDraftNameFont}
                      previewName={draftName.trim() || 'Your band name'}
                    />
                  </div>
                </>,
              )
            ) : (
              <h1
                id="band-workspace-title"
                className="band-profile-name"
                style={{ fontFamily: bandNameFontFamily(profile.name_font) }}
              >
                {profile.name}
              </h1>
            )}
          </WorkspaceEditableSection>

          <WorkspaceEditableSection
            title="Colour palette"
            canEdit={canEdit}
            isEditing={editing === 'palette'}
            onEdit={() => openEdit('palette')}
          >
            {editing === 'palette' ? (
              editPanel(
                'palette',
                <BandColorPalettePicker value={draftColorPalette} onChange={setDraftColorPalette} />,
              )
            ) : (
              <>
                <p className="band-workspace-palette-label">{activePalette.label}</p>
                <p className="band-workspace-palette-desc">{activePalette.description}</p>
              </>
            )}
          </WorkspaceEditableSection>

          <WorkspaceEditableSection
            title="Availability"
            canEdit={canEdit}
            isEditing={editing === 'availability'}
            onEdit={() => openEdit('availability')}
          >
            {editing === 'availability' ? (
              editPanel(
                'availability',
                <>
                  <div className="auth-field">
                    <label htmlFor="workspaceAvailability">Availability status</label>
                    <select
                      id="workspaceAvailability"
                      value={draftAvailabilityStatus}
                      onChange={(event) =>
                        setDraftAvailabilityStatus(event.target.value as typeof draftAvailabilityStatus)
                      }
                    >
                      <option value="available">Available for gigs</option>
                      <option value="limited">Limited availability</option>
                      <option value="unavailable">Not currently booking</option>
                    </select>
                  </div>
                  <div className="auth-field">
                    <label htmlFor="workspaceAvailabilityNote">Availability note</label>
                    <textarea
                      id="workspaceAvailabilityNote"
                      rows={2}
                      value={draftAvailabilityNote}
                      onChange={(event) => setDraftAvailabilityNote(event.target.value)}
                    />
                  </div>
                </>,
              )
            ) : (
              <div className="band-profile-eyebrow">{availabilityLabel(profile.availability_status)}</div>
            )}
          </WorkspaceEditableSection>

          <WorkspaceEditableSection
            title="Tagline"
            canEdit={canEdit}
            isEditing={editing === 'tagline'}
            onEdit={() => openEdit('tagline')}
          >
            {editing === 'tagline' ? (
              editPanel(
                'tagline',
                <div className="auth-field">
                  <label htmlFor="workspaceTagline">Tagline</label>
                  <input
                    id="workspaceTagline"
                    placeholder="Post-punk covers · high energy"
                    value={draftTagline}
                    onChange={(event) => setDraftTagline(event.target.value)}
                  />
                </div>,
              )
            ) : tagline ? (
              <p className="band-profile-subtitle">{tagline}</p>
            ) : canEdit ? (
              <p className="band-workspace-placeholder">Add a short tagline for your band</p>
            ) : null}
          </WorkspaceEditableSection>

          <WorkspaceEditableSection
            title="Location"
            canEdit={canEdit}
            isEditing={editing === 'location'}
            onEdit={() => openEdit('location')}
          >
            {editing === 'location' ? (
              editPanel(
                'location',
                <>
                  <div className="auth-field">
                    <label htmlFor="workspaceHomeCity">Home city</label>
                    <input
                      id="workspaceHomeCity"
                      placeholder="e.g. Guildford, UK"
                      value={draftHomeCity}
                      onChange={(event) => setDraftHomeCity(event.target.value)}
                    />
                  </div>
                  <div className="auth-field">
                    <label htmlFor="workspaceTravelDistance">Distance prepared to travel (miles)</label>
                    <input
                      id="workspaceTravelDistance"
                      inputMode="numeric"
                      placeholder="e.g. 50"
                      value={draftTravelDistance}
                      onChange={(event) => setDraftTravelDistance(event.target.value)}
                    />
                  </div>
                </>,
              )
            ) : profile.location || profile.travel_distance_miles != null ? (
              <div className="band-workspace-field-lines">
                {profile.location ? (
                  <p>
                    <span className="band-workspace-field-label">Home city</span>
                    {profile.location}
                  </p>
                ) : null}
                {profile.travel_distance_miles != null ? (
                  <p>
                    <span className="band-workspace-field-label">Will travel</span>
                    Up to {profile.travel_distance_miles} miles
                  </p>
                ) : null}
              </div>
            ) : canEdit ? (
              <p className="band-workspace-placeholder">Add your home city and how far you will travel</p>
            ) : null}
          </WorkspaceEditableSection>

          <WorkspaceEditableSection
            title="Genres"
            canEdit={canEdit}
            isEditing={editing === 'genres'}
            onEdit={() => openEdit('genres')}
          >
            {editing === 'genres' ? (
              editPanel(
                'genres',
                <div className="auth-field">
                  <label htmlFor="workspaceGenres">Genres (comma-separated)</label>
                  <input
                    id="workspaceGenres"
                    placeholder="Rock, soul, covers"
                    value={draftGenres}
                    onChange={(event) => setDraftGenres(event.target.value)}
                  />
                </div>,
              )
            ) : genreLabel ? (
              <p className="band-workspace-genres">{genreLabel}</p>
            ) : canEdit ? (
              <p className="band-workspace-placeholder">Add the genres you play</p>
            ) : null}
          </WorkspaceEditableSection>

          <WorkspaceEditableSection
            title="Bio"
            canEdit={canEdit}
            isEditing={editing === 'bio'}
            onEdit={() => openEdit('bio')}
          >
            {editing === 'bio' ? (
              editPanel(
                'bio',
                <div className="auth-field">
                  <label htmlFor="workspaceBio">Bio</label>
                  <textarea
                    id="workspaceBio"
                    rows={4}
                    value={draftDescription}
                    onChange={(event) => setDraftDescription(event.target.value)}
                  />
                </div>,
              )
            ) : profile.description ? (
              <p className="band-profile-lead">{profile.description}</p>
            ) : canEdit ? (
              <p className="band-workspace-placeholder">Add your band bio</p>
            ) : null}
          </WorkspaceEditableSection>

          {(hasMeta || canEdit) && (
            <WorkspaceEditableSection
              title="Band details"
              canEdit={canEdit}
              isEditing={editing === 'meta'}
              onEdit={() => openEdit('meta')}
            >
              {editing === 'meta' ? (
                editPanel(
                  'meta',
                  <div className="profile-editor-row-grid">
                    <div className="auth-field">
                      <label htmlFor="workspaceBandSize">Band size</label>
                      <input
                        id="workspaceBandSize"
                        inputMode="numeric"
                        value={draftBandSize}
                        onChange={(event) => setDraftBandSize(event.target.value)}
                      />
                    </div>
                    <div className="auth-field">
                      <label htmlFor="workspaceSetLength">Set length (minutes)</label>
                      <input
                        id="workspaceSetLength"
                        inputMode="numeric"
                        value={draftSetLength}
                        onChange={(event) => setDraftSetLength(event.target.value)}
                      />
                    </div>
                    <div className="auth-field">
                      <label htmlFor="workspaceFeeMin">Fee from (£)</label>
                      <input
                        id="workspaceFeeMin"
                        inputMode="numeric"
                        value={draftFeeMin}
                        onChange={(event) => setDraftFeeMin(event.target.value)}
                      />
                    </div>
                    <div className="auth-field">
                      <label htmlFor="workspaceFeeMax">Fee to (£)</label>
                      <input
                        id="workspaceFeeMax"
                        inputMode="numeric"
                        value={draftFeeMax}
                        onChange={(event) => setDraftFeeMax(event.target.value)}
                      />
                    </div>
                  </div>,
                )
              ) : hasMeta ? (
                <div className="band-profile-meta-grid">
                  {profile.band_size ? (
                    <div className="band-profile-meta-card">
                      <strong>{profile.band_size}</strong>
                      <span>Band members</span>
                    </div>
                  ) : null}
                  {profile.set_length_minutes ? (
                    <div className="band-profile-meta-card">
                      <strong>{profile.set_length_minutes} min</strong>
                      <span>Typical set length</span>
                    </div>
                  ) : null}
                  {feeRange ? (
                    <div className="band-profile-meta-card">
                      <strong>{feeRange}</strong>
                      <span>Fee guidance</span>
                    </div>
                  ) : null}
                </div>
              ) : canEdit ? (
                <p className="band-workspace-placeholder">Add band size, set length or fee guidance</p>
              ) : null}
            </WorkspaceEditableSection>
          )}
        </section>

        {(showEquipment || canEdit) && (
          <WorkspaceSectionBlock
            title="Equipment & setup"
            canEdit={canEdit}
            isEditing={editing === 'equipment'}
            onEdit={() => openEdit('equipment')}
            editLabel={profile.equipment_notes ? 'Edit' : 'Add'}
            id="equipment"
          >
            {editing === 'equipment' ? (
              editPanel(
                'equipment',
                <div className="auth-field">
                  <label htmlFor="workspaceEquipment">Equipment notes</label>
                  <textarea
                    id="workspaceEquipment"
                    rows={3}
                    value={draftEquipmentNotes}
                    onChange={(event) => setDraftEquipmentNotes(event.target.value)}
                  />
                </div>,
              )
            ) : profile.equipment_notes ? (
              <p>{profile.equipment_notes}</p>
            ) : canEdit ? (
              <p className="band-workspace-placeholder">Describe your equipment and stage setup</p>
            ) : null}
          </WorkspaceSectionBlock>
        )}

        {(showTracks || showVideos || showPhotos || canEdit) && (
          <WorkspaceSectionBlock
            title="Media"
            canEdit={canEdit}
            isEditing={editing === 'media'}
            onEdit={() => openEdit('media')}
            id="media"
          >
            {editing === 'media' ? (
              editPanel(
                'media',
                <>
                  {draftMediaItems.map((item, index) => (
                    <div key={item.key} className="profile-editor-item">
                      <div className="profile-editor-row-grid">
                        <label>
                          Type
                          <select
                            value={item.kind}
                            onChange={(event) => {
                              const next = [...draftMediaItems];
                              next[index] = { ...item, kind: event.target.value as MediaDraft['kind'] };
                              setDraftMediaItems(next);
                            }}
                          >
                            <option value="track">Track</option>
                            <option value="video">Video</option>
                            <option value="photo">Photo</option>
                          </select>
                        </label>
                        <label>
                          Title
                          <input
                            value={item.title ?? ''}
                            onChange={(event) => {
                              const next = [...draftMediaItems];
                              next[index] = { ...item, title: event.target.value };
                              setDraftMediaItems(next);
                            }}
                          />
                        </label>
                      </div>
                      <label>
                        URL
                        <input
                          value={item.url}
                          onChange={(event) => {
                            const next = [...draftMediaItems];
                            next[index] = { ...item, url: event.target.value };
                            setDraftMediaItems(next);
                          }}
                        />
                      </label>
                      <div className="profile-editor-inline-actions">
                        <button
                          type="button"
                          onClick={() => setDraftMediaItems((items) => items.filter((_, i) => i !== index))}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="auth-button auth-button-secondary"
                    onClick={() => setDraftMediaItems((items) => [...items, emptyMedia()])}
                  >
                    Add media link
                  </button>
                </>,
              )
            ) : (
              <>
                {tracks.length ? (
                  <>
                    <h3 className="band-workspace-subheading">Listen</h3>
                    <div className="band-profile-grid">
                      {tracks.map((item) => (
                        <article key={item.id} className="band-profile-card">
                          <h3>{item.title || 'Track'}</h3>
                          <a href={item.url} target="_blank" rel="noreferrer">
                            Open track
                          </a>
                        </article>
                      ))}
                    </div>
                  </>
                ) : null}
                {videos.length ? (
                  <>
                    <h3 className="band-workspace-subheading">Videos</h3>
                    <div className="band-profile-grid">
                      {videos.map((item) => {
                        const embedUrl = youtubeEmbedUrl(item.url);
                        return (
                          <article key={item.id} className="band-profile-card">
                            <h3>{item.title || 'Video'}</h3>
                            {embedUrl ? (
                              <iframe
                                className="band-profile-video"
                                src={embedUrl}
                                title={item.title || `${profile.name} video`}
                                loading="lazy"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              />
                            ) : (
                              <a href={item.url} target="_blank" rel="noreferrer">
                                Watch video
                              </a>
                            )}
                          </article>
                        );
                      })}
                    </div>
                  </>
                ) : null}
                {photos.length ? (
                  <>
                    <h3 className="band-workspace-subheading">Photos</h3>
                    <div className="band-profile-grid">
                      {photos.map((item) => (
                        <article key={item.id} className="band-profile-card">
                          <h3>{item.title || 'Photo'}</h3>
                          <a href={item.url} target="_blank" rel="noreferrer">
                            View photo
                          </a>
                        </article>
                      ))}
                    </div>
                  </>
                ) : null}
                {!tracks.length && !videos.length && !photos.length && canEdit ? (
                  <p className="band-workspace-placeholder">Add tracks, videos or photos</p>
                ) : null}
              </>
            )}
          </WorkspaceSectionBlock>
        )}

        {(showSocial || canEdit) && (
          <WorkspaceSectionBlock
            title="Links & socials"
            canEdit={canEdit}
            isEditing={editing === 'social'}
            onEdit={() => openEdit('social')}
            id="socials"
          >
            {editing === 'social' ? (
              editPanel(
                'social',
                <>
                  {draftSocialItems.map((item, index) => (
                    <div key={item.key} className="profile-editor-item">
                      <div className="profile-editor-row-grid">
                        <label>
                          Platform
                          <select
                            value={item.platform}
                            onChange={(event) => {
                              const next = [...draftSocialItems];
                              next[index] = { ...item, platform: event.target.value as SocialPlatform };
                              setDraftSocialItems(next);
                            }}
                          >
                            <option value="website">Website</option>
                            <option value="instagram">Instagram</option>
                            <option value="youtube">YouTube</option>
                            <option value="spotify">Spotify</option>
                            <option value="bandcamp">Bandcamp</option>
                            <option value="facebook">Facebook</option>
                            <option value="other">Other</option>
                          </select>
                        </label>
                        <label>
                          Label
                          <input
                            value={item.label ?? ''}
                            onChange={(event) => {
                              const next = [...draftSocialItems];
                              next[index] = { ...item, label: event.target.value };
                              setDraftSocialItems(next);
                            }}
                          />
                        </label>
                      </div>
                      <label>
                        URL
                        <input
                          value={item.url}
                          onChange={(event) => {
                            const next = [...draftSocialItems];
                            next[index] = { ...item, url: event.target.value };
                            setDraftSocialItems(next);
                          }}
                        />
                      </label>
                      <div className="profile-editor-inline-actions">
                        <button
                          type="button"
                          onClick={() => setDraftSocialItems((items) => items.filter((_, i) => i !== index))}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="auth-button auth-button-secondary"
                    onClick={() => setDraftSocialItems((items) => [...items, emptySocial()])}
                  >
                    Add social link
                  </button>
                </>,
              )
            ) : profile.socialLinks.length ? (
              <div className="band-profile-socials">
                {profile.socialLinks.map((link) => (
                  <a
                    key={link.id}
                    className="band-profile-social-link"
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {socialPlatformLabel(link.platform, link.label)}
                  </a>
                ))}
              </div>
            ) : canEdit ? (
              <p className="band-workspace-placeholder">Add website and social links</p>
            ) : null}
          </WorkspaceSectionBlock>
        )}

        {(showDates || canEdit) && (
          <WorkspaceSectionBlock
            title="Public availability"
            canEdit={canEdit}
            isEditing={editing === 'dates'}
            onEdit={() => openEdit('dates')}
            id="availability-dates"
          >
            {editing === 'dates' ? (
              editPanel(
                'dates',
                <>
                  {draftDateItems.map((item, index) => (
                    <div key={item.key} className="profile-editor-item">
                      <div className="profile-editor-row-grid">
                        <label>
                          Date
                          <input
                            type="date"
                            value={item.event_date}
                            onChange={(event) => {
                              const next = [...draftDateItems];
                              next[index] = { ...item, event_date: event.target.value };
                              setDraftDateItems(next);
                            }}
                          />
                        </label>
                        <label>
                          Status
                          <select
                            value={item.status ?? 'confirmed'}
                            onChange={(event) => {
                              const next = [...draftDateItems];
                              next[index] = { ...item, status: event.target.value as DateDraft['status'] };
                              setDraftDateItems(next);
                            }}
                          >
                            <option value="confirmed">Confirmed</option>
                            <option value="provisional">Provisional</option>
                          </select>
                        </label>
                      </div>
                      <label>
                        Label
                        <input
                          placeholder="Available for booking"
                          value={item.title ?? ''}
                          onChange={(event) => {
                            const next = [...draftDateItems];
                            next[index] = { ...item, title: event.target.value };
                            setDraftDateItems(next);
                          }}
                        />
                      </label>
                      <div className="profile-editor-inline-actions">
                        <button
                          type="button"
                          onClick={() => setDraftDateItems((items) => items.filter((_, i) => i !== index))}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="auth-button auth-button-secondary"
                    onClick={() => setDraftDateItems((items) => [...items, emptyDate()])}
                  >
                    Add public date
                  </button>
                </>,
              )
            ) : (
              <>
                <p>
                  {profile.availability_note ||
                    'These dates are published for organisers. Enquire to confirm booking details.'}
                </p>
                {profile.publicDates.length ? (
                  <div className="band-profile-grid">
                    {profile.publicDates.map((entry) => (
                      <article key={entry.id} className="band-profile-card">
                        <h3>{formatDisplayDate(entry.event_date)}</h3>
                        <p>
                          {entry.title ||
                            (entry.status === 'confirmed' ? 'Confirmed date' : 'Provisional date')}
                        </p>
                      </article>
                    ))}
                  </div>
                ) : canEdit ? (
                  <p className="band-workspace-placeholder">Add public availability dates</p>
                ) : null}
              </>
            )}
          </WorkspaceSectionBlock>
        )}

        {(showBooking || canEdit) && (
          <WorkspaceSectionBlock
            title={`Book ${profile.name}`}
            canEdit={canEdit}
            isEditing={editing === 'booking'}
            onEdit={() => openEdit('booking')}
            id="book"
            className="band-profile-booking"
          >
            {editing === 'booking' ? (
              editPanel(
                'booking',
                <div className="profile-editor-row-grid">
                  <div className="auth-field">
                    <label htmlFor="workspaceBookingEmail">Booking email</label>
                    <input
                      id="workspaceBookingEmail"
                      type="email"
                      value={draftBookingEmail}
                      onChange={(event) => setDraftBookingEmail(event.target.value)}
                    />
                  </div>
                  <div className="auth-field">
                    <label htmlFor="workspaceBookingPhone">Booking phone</label>
                    <input
                      id="workspaceBookingPhone"
                      value={draftBookingPhone}
                      onChange={(event) => setDraftBookingPhone(event.target.value)}
                    />
                  </div>
                </div>,
              )
            ) : (
              <>
                <p>
                  Send booking details including date, venue, event type and budget. The band will respond
                  from their private Bandie workspace.
                </p>
                <div className="band-profile-actions">
                  {bookingEmail ? (
                    <a
                      className="band-profile-button band-profile-button-primary"
                      href={`mailto:${bookingEmail}`}
                    >
                      Email {profile.name}
                    </a>
                  ) : null}
                  {bookingPhone ? (
                    <a
                      className="band-profile-button band-profile-button-secondary"
                      href={`tel:${bookingPhone}`}
                    >
                      Call {bookingPhone}
                    </a>
                  ) : null}
                  {!bookingEmail && !bookingPhone && canEdit ? (
                    <p className="band-workspace-placeholder">Add booking contact details</p>
                  ) : null}
                </div>
              </>
            )}
          </WorkspaceSectionBlock>
        )}
      </div>
    </div>
  );
}
