export { createBandieClient, getAppCode } from './client';
export type { BandieClientConfig } from './client';

export { initBandieData, getBandieClient, getBandieAppCode } from './context';

export {
  initBandieDataMode,
  getBandieDataMode,
  includeTestData,
  filterTestRows,
  isHiddenTestRow,
  isTestDataEntity,
  TEST_DATA_BADGE_LABEL,
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
  getOrganiserVenue,
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
  createOrganiserInvitation,
  listOrganiserInvitationsForAdmin,
  revokeOrganiserInvitation,
  resolveInviteTokenType,
  listPendingOrganiserInvitationsForCurrentUser,
  acceptOrganiserInvitation,
  declineOrganiserInvitation,
  acceptInviteByToken,
} from './organiserInvitations';
export type {
  OrganiserInvitation,
  PendingOrganiserInvitation,
  InviteTokenType,
  AcceptInviteResult,
} from './organiserInvitations';

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
  filterResolvedInviteCommunications,
  filterResolvedSentCommunications,
  filterReadGeneralMessages,
  getCommunicationCategory,
  isPlayerInviteCommunication,
  isGigInviteCommunication,
  isGeneralMessageCommunication,
  getNotificationSummary,
  COMMUNICATION_CATEGORY_LABELS,
} from './communications';
export type {
  CommunicationFilter,
  CommunicationCategory,
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
  getSongPartDisplay,
  canPreviewSongPartFile,
  SONG_PARTS_LEADER_ONLY_MESSAGE,
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
  SETLIST_STATUS_OPTIONS,
  SETLIST_VIBE_PRESETS,
  SETLIST_LEADER_ONLY_MESSAGE,
  listBandSetlists,
  getBandSetlist,
  createBandSetlist,
  updateBandSetlist,
  duplicateBandSetlist,
  deleteBandSetlist,
  archiveBandSetlist,
  addSetlistItem,
  removeSetlistItem,
  updateSetlistItemNotes,
  reorderSetlistItems,
  recordSetlistUsage,
  formatSetlistStatus,
  setlistStatusPillClass,
  formatSetlistLastUsed,
  isSetlistRecentlyUsed,
  formatSetlistDuration,
  computeSetlistMetrics,
  computeSetlistLibraryMetrics,
  suggestSetlistStatus,
  formatSetlistSongMeta,
  formatSongReadinessLabel,
} from './setlists';
export type {
  SetlistStatus,
  BandSetlist,
  SetlistItem,
  SetlistItemWithSong,
  SetlistMetrics,
  SetlistWithDetails,
  SetlistLibraryEntry,
  SetlistLibraryMetrics,
  SetlistListFilters,
  CreateSetlistInput,
  UpdateSetlistInput,
} from './setlists';

export {
  SONG_SUGGESTION_LEADER_ONLY_MESSAGE,
  SONG_SUGGESTION_GENRE_OPTIONS,
  SONG_SUGGESTION_DECADE_OPTIONS,
  SONG_SUGGESTION_VOTE_LABELS,
  SONG_SUGGESTION_GROUP_STATUS_LABELS,
  listBandSongSuggestionGroups,
  getSongSuggestionGroup,
  getSongSuggestionGroupDetail,
  createSongSuggestionGroup,
  updateSongSuggestionGroup,
  findSimilarSongSuggestions,
  submitSongSuggestion,
  voteOnSongSuggestion,
  clearSongSuggestionVote,
  withdrawSongSuggestion,
  closeSongSuggestions,
  reopenSongSuggestions,
  closeSongSuggestionVoting,
  vetoSongSuggestion,
  resetSongSuggestionVotes,
  confirmSongSuggestionGroup,
  listSongSuggestionGroupEvents,
  listConfirmedSongSuggestions,
  createSkeletonSetlistFromSuggestionGroup,
  rankSongSuggestions,
  isSongSuggestionSameRankingTier,
  isSongSuggestionInAutoSelection,
  isSongSuggestionCutoffTieCandidate,
  songSuggestionGroupStatusClass,
  isSongSuggestionVotingOpen,
  isSongSuggestionSubmitOpen,
  DEFAULT_SONG_SUGGESTION_LIST_FILTERS,
  collectSongSuggestionFilterOptions,
  filterAndSortSongSuggestions,
} from './songSuggestions';
export type {
  SongSuggestionGroupStatus,
  SongSuggestionVoteState,
  SongSuggestionStatus,
  VoteVisibility,
  VocalSuitability,
  SongSuggestionGroup,
  SongSuggestion,
  SongSuggestionVote,
  SongSuggestionVoteSummary,
  SongSuggestionWithSummary,
  SongSuggestionGroupListItem,
  SongSuggestionGroupEvent,
  SongSuggestionConfirmedSong,
  CreateSongSuggestionGroupInput,
  SongSuggestionVoteFilter,
  SongSuggestionSortKey,
  SongSuggestionListFilters,
  SongSuggestionFilterOptions,
  UpdateSongSuggestionGroupInput,
  SubmitSongSuggestionInput,
  ConfirmSelectionItem,
} from './songSuggestions';

export {
  DEFAULT_BAND_SONG_PART_TEMPLATES,
  listBandSongPartTemplates,
  ensureBandSongPartTemplates,
  createBandSongPartTemplate,
  updateBandSongPartTemplate,
  deleteBandSongPartTemplate,
  createDefaultBandSongPartTemplates,
  songPartIcon,
  songPartDescription,
} from './songPartTemplates';
export type {
  BandSongPartTemplate,
  SongPartTemplateDefinition,
  CreateBandSongPartTemplateInput,
  UpdateBandSongPartTemplateInput,
} from './songPartTemplates';

export {
  listBandSongs,
  getBandSongDashboardMetrics,
  getBandSong,
  createBandSong,
  updateBandSong,
  softDeleteBandSong,
  restoreBandSong,
  listSongPartFolders,
  listSongPartFiles,
  listRecentSongPartActivity,
  uploadSongPartFile,
  createSongPartFolder,
  updateSongPartFolder,
  deleteSongPartFolder,
  applyBandTemplatesToSong,
  recalculateSongReadiness,
  formatSongDuration,
  songTitleInitials,
  formatSongReadinessStatus,
  computeSongReadiness,
  computeSongDashboardMetrics,
  collectSongGenres,
  collectSongKeys,
  formatSongPartActivityLabel,
  getSongPartFilePreviewUrl,
  loadSongPartFileInlinePreview,
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
  CreateSongPartFolderInput,
  UpdateSongPartFolderInput,
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

export { copyBandSongToBand } from './songCopy';
export type { CopyBandSongInput, CopyBandSongResult } from './songCopy';

export {
  initBandieEntitlementEnforcement,
  isEntitlementEnforcementEnabled,
  isPlatformAccessModeActive,
  resolveEntitlementEnforcement,
  setPlatformEntitlementEnforcement,
  setPlatformAccessModeState,
} from './entitlementEnforcement';

export { EntitlementGateError, isEntitlementGateError } from './entitlementErrors';

export {
  PLAN_CODES,
  PLAN_DISPLAY_NAMES,
  UPGRADE_URL,
} from './entitlementTypes';
export type {
  EntitlementCheckInput,
  EntitlementPlanScope,
  EntitlementSubjectType,
  GateDecision,
  GateReasonCode,
  PlanCode,
  UsageMeterEntry,
  UsageSummary,
} from './entitlementTypes';

export {
  canPerform,
  assertCanPerform,
  checkBandLeaderCapability,
  checkUserLeaderCapability,
  checkUserOrganiserCapability,
  isPlanCapabilityEnabledForUser,
  getUsageSummaryForUser,
  getBandUsageSummary,
  listPublicPlans,
  ensureDefaultUserSubscriptions,
} from './entitlements';

export {
  METER_KEYS,
  METER_LABELS,
  meterKeyForLimitCapability,
  measureUsage,
  syncUsageMeter,
  reconcileBandUsageMeters,
  reconcileUserUsageMeters,
  countBandsLedByUser,
  countActiveSongsInBand,
  countSetlistsInBand,
  countOrganiserVenues,
  countActiveBandMembers,
  countActiveGigsForOrganiser,
  countBookingEnquiriesSentThisMonth,
} from './usageMeters';

export {
  listBandCalendarEvents,
  listBandCalendarEventsWithVotes,
  getCalendarEventWithVotes,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  deleteCalendarEventSeries,
  castAvailabilityVote,
  getBandCalendarTier,
  summarizeAvailabilityVotes,
  mergeCalendarMemberVotes,
  formatCalendarEventType,
  availabilityStatusClass,
  availabilityVoteClass,
  CALENDAR_LEADER_ONLY_MESSAGE,
  AVAILABILITY_STATUS_LABELS,
  AVAILABILITY_VOTE_LABELS,
} from './calendar';
export {
  expandCalendarOccurrences,
  repeatPatternFromInput,
  serializeCalendarRepeatPattern,
  parseCalendarRepeatPattern,
  formatCalendarRepeatPattern,
  inferMonthlyOrdinal,
  clampOccurrenceCount,
  CALENDAR_DEFAULT_OCCURRENCE_COUNT,
  CALENDAR_MAX_OCCURRENCE_COUNT,
  CALENDAR_REPEAT_ORDINAL_OPTIONS,
} from './calendarRecurrence';
export type {
  CalendarEvent,
  CalendarEventType,
  CalendarEventVote,
  CalendarEventWithVotes,
  AvailabilityStatus as CalendarAvailabilityStatus,
  AvailabilityVote,
  CreateCalendarEventInput,
  UpdateCalendarEventInput,
  CalendarMemberAvailabilityRow,
} from './calendar';
export type {
  CalendarRepeatInput,
  CalendarRepeatKind,
  CalendarRepeatPattern,
  CalendarOccurrence,
} from './calendarRecurrence';

export {
  listOrganiserGigs,
  getOrganiserGig,
  createOrganiserGig,
  updateOrganiserGig,
  archiveOrganiserGig,
  confirmOrganiserGig,
  reopenOrganiserGig,
  inviteBandToGig,
  cancelGigBandInvite,
  updateGigBandSlot,
  updateGigBandRunningOrder,
  buildGigSlotSchedule,
  buildGigWorkflowSteps,
  canConfirmOrganiserGig,
  formatSlotDuration,
  formatSlotTimeRange,
  listBandGigInvitations,
  getBandGigInvitation,
  respondToGigInvitation,
  assignGigSetlist,
  computeGigDashboardMetrics,
  computeBandGigInviteMetrics,
  formatGigStatus,
  formatGigInviteStatus,
  formatGigInviteNotificationBody,
  gigStatusPillClass,
  gigInviteStatusPillClass,
  GIG_STATUS_OPTIONS,
  GIG_INVITE_STATUS_OPTIONS,
  ACTIVE_GIG_INVITE_STATUSES,
  isActiveGigInviteStatus,
  ACTIVE_GIG_STATUSES,
  GIG_BAND_LEADER_MESSAGE,
  GIG_ORGANISER_ONLY_MESSAGE,
} from './gigs';
export type {
  OrganiserGig,
  GigStatus,
  GigInviteStatus,
  GigBandInvite,
  GigBandInviteWithBand,
  GigSlotScheduleEntry,
  GigWorkflowStep,
  BandGigInvitation,
  OrganiserGigDetail,
  CreateOrganiserGigInput,
  UpdateOrganiserGigInput,
  InviteBandToGigInput,
  UpdateGigBandSlotInput,
} from './gigs';

export {
  OPEN_MIC_ORGANISER_ONLY_MESSAGE,
  OPEN_MIC_STATUS_OPTIONS,
  OPEN_MIC_EVENT_TYPE_OPTIONS,
  OPEN_MIC_SIGNUP_MODE_OPTIONS,
  listOrganiserOpenMicEvents,
  getOpenMicEvent,
  createOpenMicEvent,
  updateOpenMicEvent,
  publishOpenMicEvent,
  cancelOpenMicEvent,
  duplicateOpenMicEvent,
  getPublicOpenMicEvent,
  formatOpenMicEventStatus,
  formatOpenMicEventType,
  formatOpenMicSignupMode,
  openMicStatusPillClass,
  getOpenMicPublicUrl,
  computeOpenMicDashboardMetrics,
  countCancelledOpenMicEvents,
  filterOpenMicEventsForDashboard,
  resolveOpenMicVenueLabel,
} from './openMicEvents';
export type {
  OpenMicEvent,
  OpenMicEventSummary,
  OpenMicEventStatus,
  OpenMicEventType,
  OpenMicSignupMode,
  OpenMicVisibility,
  OpenMicContactField,
  PublicOpenMicEvent,
  CreateOpenMicEventInput,
  UpdateOpenMicEventInput,
} from './openMicEvents';

export {
  listOpenMicSongs,
  addOpenMicSong,
  deleteOpenMicSong,
  reorderOpenMicSongs,
  applyInstrumentTemplate,
  listOpenMicSignups,
  requestOpenMicSlot,
  approveOpenMicAssignment,
  rejectOpenMicAssignment,
  submitOpenMicSongSuggestion,
  listOpenMicSongSuggestions,
  getPublicOpenMicSongs,
  listMyOpenMicAssignments,
  computeOpenMicSongReadiness,
  formatSongReadiness,
} from './openMicSongs';
export type {
  OpenMicSong,
  OpenMicSongSlot,
  OpenMicPlayer,
  OpenMicAssignment,
  OpenMicSongSuggestion,
  OpenMicSongWithSlots,
  OpenMicAssignmentWithDetails,
  PublicOpenMicSong,
  PublicOpenMicSongSlot,
  OpenMicSongReadiness,
  OpenMicLiveStatus,
  OpenMicSlotStatus,
  OpenMicAssignmentStatus,
  OpenMicSuggestionStatus,
  OpenMicSuggestionType,
  OpenMicSongSlotWithPlayer,
} from './openMicSongs';

export {
  startOpenMicEvent,
  endOpenMicEvent,
  updateOpenMicSongLiveStatus,
  getOpenMicLiveDashboard,
  subscribeOpenMicEvent,
  getOpenMicEventSummary,
} from './openMicLive';
export type { OpenMicLiveDashboard, OpenMicEventSummaryStats } from './openMicLive';

export {
  listOpenMicHouseBandMembers,
  addOpenMicHouseBandMember,
  deleteOpenMicHouseBandMember,
  listOpenMicPartTemplates,
  addOpenMicPartTemplate,
  updateOpenMicPartTemplate,
  deleteOpenMicPartTemplate,
  seedOpenMicDefaultParts,
  setOpenMicSongSlotEnabled,
  clearOpenMicSlotAssignment,
} from './openMicParts';
export type { OpenMicHouseBandMember, OpenMicPartTemplate } from './openMicParts';

export {
  listOpenMicJamSlots,
  listOpenMicJamSignups,
  generateOpenMicJamSlots,
  assignOpenMicJamSlot,
  clearOpenMicJamSlot,
  requestJamSlot,
  approveJamSignup,
  getPublicJamSlots,
  formatJamSlotStatus,
} from './openMicJam';
export type {
  OpenMicJamSlot,
  OpenMicJamSignup,
  OpenMicJamSlotStatus,
  PublicJamSlot,
} from './openMicJam';

export {
  listMyBookingEnquiries,
  listReceivedBookingEnquiries,
  countUnreadBookingEnquiries,
  sendBookingEnquiry,
  updateBookingEnquiryStatus,
  markBookingEnquiryRead,
  BOOKING_ENQUIRY_STATUS_LABELS,
} from './bookingEnquiries';
export type { BookingEnquiry, BookingEnquiryStatus, SendBookingEnquiryInput } from './bookingEnquiries';

export {
  listMyGigInviteCommunications,
  listReceivedGigInviteCommunications,
  listSentGigInviteCommunications,
  countUnreadGigInviteNotifications,
  markGigInviteNotificationRead,
} from './gigInviteCommunications';
export type { GigInviteCommunication } from './gigInviteCommunications';

export {
  trackMetricEvent,
  trackSessionActive,
  listMetricSnapshots,
  aggregateDailyMetrics,
  snapshotsToCsv,
} from './metrics';
export type { MetricEventInput, MetricSnapshot } from './metrics';

export {
  searchAdminUsers,
  searchAdminBands,
  logAdminAuditEvent,
  listAuditEvents,
  getAdminOverviewCounts,
} from './adminPortal';
export type { AdminSearchUser, AdminSearchBand, AuditEvent, AdminOverviewCounts } from './adminPortal';

export {
  ADMIN_ACCOUNTS_PAGE_SIZE,
  getAdminTestDataCounts,
  listAdminUserAccounts,
  listAdminBandAccounts,
  adminUpdateUserWorkspaceRoles,
  adminUpdateUserEntitlementTestPlan,
  adminSetUserSubscriptionPlan,
  adminSetUserSubscriptionTrialEnd,
  formatAdminAccountDate,
  formatAdminWorkspaceRoles,
  isStripeBilledSubscription,
  toDateTimeLocalValue,
  fromDateTimeLocalValue,
} from './adminAccounts';
export type { AdminUserAccount, AdminBandAccount, AdminAccountsPage, AdminTestDataCounts } from './adminAccounts';

export {
  listPlansWithEntitlements,
  listCapabilities,
  formatEntitlementValueForInput,
  parseEntitlementInputValue,
  updatePlanCatalogueEntry,
  updatePlanEntitlement,
  removePlanEntitlement,
  listEntitlementDrafts,
  listEntitlementDraftItems,
  createEntitlementDraft,
  addEntitlementDraftItem,
  publishEntitlementDraft,
  listEntitlementOverrides,
  createEntitlementOverride,
  deleteEntitlementOverride,
  buildEntitlementImpactPreview,
} from './entitlementAdmin';
export type {
  PlanWithEntitlements,
  CapabilityDefinition,
  EntitlementDraft,
  EntitlementDraftItem,
  EntitlementOverride,
  EntitlementImpactPreview,
} from './entitlementAdmin';

export {
  loadPlatformEntitlementEnforcement,
  getPlatformSetting,
  setPlatformSetting,
  setEntitlementsEnforced,
  isEntitlementsEnforcedOnPlatform,
} from './platformSettings';

export {
  PLATFORM_ACCESS_MODE_KEY,
  buildPlatformAccessModeStatus,
  formatPlatformAccessModeEndDate,
  getPlatformAccessModeConfig,
  getPlatformAccessModeStatus,
  getPlatformAccessModeTitle,
  loadPlatformAccessMode,
  parsePlatformAccessModeConfig,
  setPlatformAccessMode,
} from './platformAccessMode';
export type {
  PlatformAccessMode,
  PlatformAccessModeConfig,
  PlatformAccessModeStatus,
} from './platformAccessMode';

export {
  LAUNCH_PROMO_ENDS_AT_KEY,
  buildLaunchPromoStatus,
  ensureLaunchTrialsExpired,
  formatLaunchPromoEndDate,
  getLaunchPromoStatus,
  isLaunchPromoSubscription,
  isLaunchTrialExpired,
  parseLaunchPromoEndsAt,
  setLaunchPromoEndsAt,
} from './launchPromo';
export type { LaunchPromoStatus } from './launchPromo';

export {
  PLAYER_ENTITLEMENT_TEST_PLAN_CODES,
  ORGANISER_ENTITLEMENT_TEST_PLAN_CODES,
  canConfigureEntitlementTestLeaderPlan,
  canConfigureEntitlementTestPlans,
  formatEntitlementTestPlanLabel,
  getEntitlementTestPlanSettings,
  hasActiveTestPlanSimulation,
  isOrganiserEntitlementTestPlanCode,
  isPlayerEntitlementTestPlanCode,
  resolveEffectiveLeaderPlanCode,
  resolveEffectiveOrganiserPlanCode,
  shouldApplyEntitlementTestPlanOverride,
  shouldApplyLeaderTestPlanOverride,
  shouldApplyOrganiserTestPlanOverride,
  updateEntitlementTestLeaderPlan,
  updateEntitlementTestOrganiserPlan,
} from './entitlementTestPlan';
export type {
  EntitlementTestPlanSettings,
  OrganiserEntitlementTestPlanCode,
  PlayerEntitlementTestPlanCode,
} from './entitlementTestPlan';

export {
  getPlayerWorkspaceAccess,
} from './playerWorkspaceAccess';
export type { PlayerWorkspaceAccess } from './playerWorkspaceAccess';

export { logGateDecision, listGateDecisionLogs } from './gateLogs';
export type { GateDecisionLog } from './gateLogs';

export {
  listUserSubscriptions,
  listPublicPlanOffers,
  startPlanCheckout,
  openBillingPortal,
  syncStripePlanCatalogueAsAdmin,
  listStripeWebhookEvents,
  formatPlanDisplayName,
} from './billing';
export type { UserSubscriptionSummary, PublicPlanOffer } from './billing';
