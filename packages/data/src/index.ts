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
  canSwitchWorkspaceMode,
  isPlayerWorkspaceRoute,
  resolveWorkspaceMode,
  workspaceModeHomePath,
  WORKSPACE_MODE_LABELS,
} from './workspaceMode';
export type { WorkspaceMode } from './workspaceMode';
export { setBandieAdminModeActive, isBandieAdminModeActive } from './adminMode';

export {
  signUpWithEmail,
  signUpAndSignInWithEmail,
  signInWithEmail,
  signInWithEmailOrUsername,
  resolveLoginEmail,
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
  setBandMemberLineupUnavailable,
  removeBandMember,
} from './bandMembers';
export type { BandMemberProfile, BandMemberWithProfile } from './bandMembers';

export {
  listBandParts,
  createBandPart,
  updateBandPart,
  assignMemberToPart,
  clearPartAssignmentsForMember,
  deleteBandPart,
  createDefaultBandParts,
  syncBandSizeFromParts,
  BAND_PART_TEMPLATES,
} from './bandParts';
export type { BandPart, CreateBandPartInput, UpdateBandPartInput } from './bandParts';

export {
  getBandLeaderContact,
  listBandLeaders,
  addBandLeader,
  assignBandLeader,
  removeBandLeader,
  setPrimaryBandContact,
  ensureBandLeader,
} from './bandLeader';
export type { BandLeaderContact, BandLeaderSummary } from './bandLeader';

export {
  createPlayerOutreach,
  listPlayerOutreachForBand,
  listMyPendingPlayerOutreach,
  listMyReceivedPlayerOutreach,
  countMyPendingPlayerOutreach,
  listMySentPlayerOutreach,
  respondToPlayerOutreach,
  revokePlayerOutreach,
  playerOutreachTypeLabel,
} from './playerOutreach';
export type {
  PlayerOutreach,
  PlayerOutreachType,
  CreatePlayerOutreachInput,
  PendingPlayerOutreach,
  ReceivedPlayerOutreach,
  SentPlayerOutreach,
} from './playerOutreach';

export {
  ORGANISER_VENUE_TYPES,
  formatOrganiserVenueType,
  formatOrganiserVenueLocation,
  formatOrganiserVenueAddress,
  listMyOrganiserVenues,
  createOrganiserVenue,
  updateOrganiserVenue,
  deleteOrganiserVenue,
} from './organiserVenues';
export type {
  OrganiserVenue,
  OrganiserVenueInput,
  OrganiserVenueType,
} from './organiserVenues';

export {
  getCurrentUserProfile,
  getUserProfileById,
  getUserProfileByUserId,
  ensureBandieProfile,
  ensureProfileUsername,
  updateUserProfile,
  updateUserProfileByUserId,
  resolveDisplayName,
  formatUserWithEmail,
  formatPlayerInvitePreferences,
} from './userProfile';
export type { UserProfile, UpdateUserProfileInput } from './userProfile';

export {
  PLAYER_GENDER_OPTIONS,
  formatPlayerGenderLabel,
  isPlayerGender,
} from './playerGender';
export type { PlayerGender } from './playerGender';

export {
  PRIMARY_INSTRUMENT_OPTIONS,
  PRIMARY_INSTRUMENT_OTHER,
  isPrimaryInstrumentOption,
  primaryInstrumentFormState,
  resolvePrimaryInstrumentValue,
} from './playerInstruments';
export type { PrimaryInstrumentOption } from './playerInstruments';

export {
  normalizeUsername,
  proposeUsernameFromDisplayName,
  resolveUsernameForProfile,
  validateUsernameInput,
} from './username';

export {
  formatInvitationStatusLabel,
  isInvitationAwaitingResponse,
  isResolvedInviteStatus,
} from './invitationStatus';

export {
  createBandInvitation,
  listBandInvitations,
  listPendingInvitationsForCurrentUser,
  listMyReceivedBandInvitations,
  acceptBandInvitation,
  acceptAllPendingInvitations,
  declineBandInvitation,
  revokeBandInvitation,
  listMySentBandInvitations,
} from './invitations';
export type {
  BandInvitation,
  CreateInvitationInput,
  PendingBandInvitation,
  ReceivedBandInvitation,
  SentBandInvitation,
} from './invitations';

export {
  listMyMessages,
  countUnreadMessages,
  sendDirectMessage,
  sendDirectMessageToUser,
  replyToMessage,
  markMessageRead,
} from './messages';
export type { UserMessage, SendDirectMessageInput, ReplyToMessageInput } from './messages';

export {
  getCommunicationSummary,
  listCommunications,
  filterCommunications,
  filterResolvedSentCommunications,
  getNotificationSummary,
} from './communications';
export type {
  CommunicationFilter,
  CommunicationSummary,
  CommunicationItem,
  BandInvitationCommunication,
  PlayerOutreachCommunication,
  MessageCommunication,
  SentBandInvitationCommunication,
  SentPlayerOutreachCommunication,
} from './communications';
export type { NotificationSummary } from './communications';

export { mapAuthError } from './errors';

export {
  uploadBandProfileImage,
  removeBandProfileImage,
  uploadOrganiserVenueImage,
  removeOrganiserVenueImage,
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
  calculateDynamicFee,
  countDynamicFeeSessions,
  formatDynamicFeeBreakdown,
} from './bandDynamicFees';
export type { DynamicFeeCalculation } from './bandDynamicFees';

export {
  getPublicBandProfileBySlug,
  getBandProfileForEdit,
  updateBandProfile,
  formatBandSubtitle,
  formatBandLocation,
  formatBandDirectorySubtitle,
  availabilityLabel,
  formatFeeRange,
  formatAverageFee,
  formatSetOfferSummary,
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
  BandSetOfferInput,
  BandDynamicFeeOfferInput,
  BandMediaItem,
  BandSocialLink,
  BandPublicDate,
  BandSetOffer,
  BandDynamicFeeOffer,
  PublicBandMember,
  PublicBandPrimaryContact,
  AvailabilityStatus,
  BandMediaKind,
  SocialPlatform,
  PublicDateStatus,
} from './types/bandProfile';

export {
  listBandieCountries,
  listBandieRegions,
  loadGeographyIndex,
  buildGeographyIndex,
  matchesAreaFilter,
  locationMatchesRegion,
  locationMatchesCountry,
  areaFilterLabel,
  inferCountryCodeFromLocale,
  inferCountryCodeFromTimeZone,
  inferDefaultCountryCode,
  regionsForCountryCode,
  mergeDirectoryAreaFilters,
  resetDirectoryAreaFilters,
  DEFAULT_DIRECTORY_AREA_FILTERS,
  BANDIE_DEFAULT_COUNTRY_CODE,
} from './geography';
export type {
  BandieCountry,
  BandieRegion,
  DirectoryAreaFilters,
  GeographyIndex,
  AreaListable,
} from './geography';

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
  collectPlayerDirectoryPrimaryInstruments,
  collectPlayerDirectoryInstruments,
  playerDirectoryMeta,
  playerDirectoryModeBadge,
  playerDirectoryModeLabel,
  playerDirectoryInviteBadges,
  playerDirectoryTags,
  playerDirectoryFooter,
  formatPlayerTravelDistance,
  computePlayerDirectoryStats,
  computePlayerInstrumentCategoryCounts,
  classifyPlayerInstrumentCategory,
  PLAYER_DIRECTORY_INSTRUMENT_CATEGORY_ORDER,
  PLAYER_DIRECTORY_INSTRUMENT_CATEGORY_LABELS,
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
  PlayerDirectoryInstrumentCategory,
  PlayerDirectoryInstrumentCategoryCounts,
} from './playerDirectory';

export {
  STANDARD_SONG_PARTS,
  getStandardSongPart,
  formatSongPartFileStatus,
} from './songParts';
export type {
  StandardSongPartKey,
  StandardSongPartDefinition,
  SongPartFolder,
  SongPartFileStatus,
  SongPartFile,
  SongPartFileActivity,
  SongPartFolderWithStats,
} from './songParts';

export {
  listBandSongs,
  getBandSongDashboardMetrics,
  getBandSong,
  createBandSong,
  updateBandSong,
  listSongPartFolders,
  listSongPartFiles,
  listRecentSongPartActivity,
  uploadSongPartFile,
  formatSongDuration,
  songTitleInitials,
  formatSongReadinessStatus,
  computeSongReadiness,
  computeSongDashboardMetrics,
  collectSongGenres,
  collectSongKeys,
  formatSongPartActivityLabel,
  getSongPartFilePreviewUrl,
  getSongPartFileDownloadUrl,
  downloadSongPartFile,
  formatActivityTimestamp,
  computeReadinessSnapshots,
} from './songs';
export type {
  SongReadinessStatus,
  BandSong,
  SongWithReadiness,
  SongDashboardMetrics,
  SongListFilters,
  CreateSongInput,
  UpdateSongInput,
  UploadSongPartFileInput,
} from './songs';

export {
  getUserDropboxIntegration,
  getBandSongPartStorage,
  startDropboxConnect,
  setupBandSongPartStorage,
  checkBandSongPartStorageHealth,
  disconnectDropbox,
  buildSongPartStorageHealthFromRecords,
  formatSongPartStorageStatus,
} from './songPartStorage';
export type {
  IntegrationProvider,
  UserIntegrationStatus,
  UserIntegration,
  BandSongPartStorageStatus,
  BandSongPartStorage,
  SongPartStorageHealth,
} from './songPartStorage';
