export { createBandieClient, getAppCode } from './client';
export type { BandieClientConfig } from './client';

export { initBandieData, getBandieClient, getBandieAppCode } from './context';

export {
  initBandieDataMode,
  getBandieDataMode,
  includeTestData,
  filterTestRows,
  isHiddenTestRow,
  resolveBandieDataMode,
} from './testDataMode';
export type { BandieDataMode } from './testDataMode';

export {
  signUpWithEmail,
  signUpAndSignInWithEmail,
  signInWithEmail,
  signOut,
  requestPasswordReset,
  updatePassword,
  getCurrentSession,
  onAuthStateChange,
} from './auth';
export type { AuthResult } from './auth';

export {
  getAppMembership,
  ensureAppMembership,
  isCurrentUserAppAdmin,
  isPlatformAppAdminRole,
  PLATFORM_APP_ADMIN_ROLES,
} from './membership';
export type { AppMembership, PlatformAppAdminRole } from './membership';

export {
  BAND_LEADER_ROLE,
  formatBandMemberRoleLabel,
  isBandLeaderRole,
} from './membershipRoles';

export {
  listUserBands,
  getBandById,
  createBand,
} from './bands';
export type { Band, UserBand, CreateBandInput } from './bands';

export {
  listBandMembersWithProfiles,
  memberDisplayName,
} from './bandMembers';
export type { BandMemberProfile, BandMemberWithProfile } from './bandMembers';

export {
  getCurrentUserProfile,
  getUserProfileById,
  getUserProfileByUserId,
  ensureBandieProfile,
  updateUserProfile,
  updateUserProfileByUserId,
  resolveDisplayName,
  formatUserWithEmail,
  formatPlayerInvitePreferences,
} from './userProfile';
export type { UserProfile, UpdateUserProfileInput } from './userProfile';

export {
  createBandInvitation,
  listBandInvitations,
  listPendingInvitationsForCurrentUser,
  acceptBandInvitation,
  acceptAllPendingInvitations,
  revokeBandInvitation,
} from './invitations';
export type { BandInvitation, CreateInvitationInput, PendingBandInvitation } from './invitations';

export { mapAuthError } from './errors';

export {
  uploadBandProfileImage,
  removeBandProfileImage,
  uploadUserProfileImage,
  removeUserProfileImage,
  uploadUserProfileImageForUser,
  removeUserProfileImageForUser,
  validateProfileImageFile,
  PROFILE_IMAGE_BUCKET,
  PROFILE_IMAGE_MAX_BYTES,
} from './storage';
export type { BandProfileImageKind } from './storage';

export {
  getPublicBandProfileBySlug,
  getBandProfileForEdit,
  updateBandProfile,
  formatBandSubtitle,
  formatBandLocation,
  formatBandDirectorySubtitle,
  availabilityLabel,
  formatFeeRange,
} from './bandProfile';
export {
  BAND_NAME_FONTS,
  DEFAULT_BAND_NAME_FONT,
  bandNameFontFamily,
  bandNameFontGoogleStylesheetUrl,
  allBandNameFontsGoogleStylesheetUrl,
  isBandNameFont,
  resolveBandNameFont,
} from './bandNameFonts';
export type { BandNameFont } from './bandNameFonts';
export {
  BAND_COLOR_PALETTES,
  DEFAULT_BAND_COLOR_PALETTE,
  bandPaletteCssVariables,
  getBandColorPalette,
  isBandColorPalette,
  resolveBandColorPalette,
} from './bandColorPalettes';
export type { BandColorPalette, BandColorPaletteId } from './bandColorPalettes';
export type {
  PublicBandProfile,
  UpdateBandProfileInput,
  BandMediaInput,
  BandSocialLinkInput,
  BandPublicDateInput,
  BandMediaItem,
  BandSocialLink,
  BandPublicDate,
  AvailabilityStatus,
  BandMediaKind,
  SocialPlatform,
  PublicDateStatus,
} from './types/bandProfile';

export {
  listPublishedBandsForDirectory,
  filterDirectoryBands,
  sortDirectoryBands,
  collectDirectoryGenres,
  directoryBandMeta,
  directoryAvailabilityBadge,
  directoryPriceLabel,
  directoryBandTags,
  computeDirectoryStats,
  DEFAULT_DIRECTORY_FILTERS,
} from './directory';
export type {
  DirectoryBandListing,
  DirectoryFilters,
  DirectorySort,
  DirectoryAvailabilityFilter,
  DirectoryStats,
} from './directory';

export {
  listPublishedPlayersForDirectory,
  getPublicPlayerProfileById,
  filterPlayerDirectory,
  sortPlayerDirectory,
  collectPlayerDirectoryGenres,
  collectPlayerDirectoryInstruments,
  playerDirectoryMeta,
  playerDirectoryModeBadge,
  playerDirectoryModeLabel,
  playerDirectoryInviteBadges,
  playerDirectoryTags,
  playerDirectoryFooter,
  formatPlayerTravelDistance,
  computePlayerDirectoryStats,
  resolvePlayerDisplayName,
  playerInviteSummary,
  DEFAULT_PLAYER_DIRECTORY_FILTERS,
} from './playerDirectory';
export type {
  PlayerDirectoryListing,
  PlayerDirectoryFilters,
  PlayerDirectorySort,
  PlayerSearchMode,
  PlayerDirectoryStats,
} from './playerDirectory';
