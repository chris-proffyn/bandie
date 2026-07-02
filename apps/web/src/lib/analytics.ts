import { trackEvent as track } from '@bandie/utils';

export type HomepageEventSection =
  | 'nav'
  | 'hero'
  | 'bands'
  | 'organisers'
  | 'players'
  | 'final_cta';

export type SongSuggestionAnalyticsContext = {
  bandId: string;
  groupId: string;
};

export function trackHomepageView(): void {
  track('homepage_viewed', { page: 'homepage' });
}

export function trackNavClick(label: string, target: string): void {
  track('homepage_nav_clicked', {
    page: 'homepage',
    section: 'nav',
    label,
    target,
    audience_intent: 'general',
  });
}

export function trackCtaClick(
  section: HomepageEventSection,
  label: string,
  target: string,
  audienceIntent: 'band' | 'organiser' | 'player' | 'general',
): void {
  track('homepage_cta_clicked', {
    page: 'homepage',
    section,
    label,
    target,
    audience_intent: audienceIntent,
  });

  if (audienceIntent === 'band') {
    track('homepage_band_intent_clicked', {
      page: 'homepage',
      section,
      label,
      target,
      audience_intent: audienceIntent,
    });
  }

  if (audienceIntent === 'organiser') {
    track('homepage_organiser_intent_clicked', {
      page: 'homepage',
      section,
      label,
      target,
      audience_intent: audienceIntent,
    });
  }

  if (audienceIntent === 'player') {
    track('homepage_player_intent_clicked', {
      page: 'homepage',
      section,
      label,
      target,
      audience_intent: audienceIntent,
    });
  }
}

export function trackSongSuggestionGroupCreated(
  context: SongSuggestionAnalyticsContext & { targetSongCount: number },
): void {
  track('song_suggestion_group_created', {
    feature: 'song_suggestions',
    ...context,
  });
}

export function trackSongSuggestionAdded(
  context: SongSuggestionAnalyticsContext & { suggestionId: string },
): void {
  track('song_suggestion_added', {
    feature: 'song_suggestions',
    ...context,
  });
}

export function trackSongSuggestionVoteCast(
  context: SongSuggestionAnalyticsContext & {
    suggestionId: string;
    voteState: string;
  },
): void {
  track('song_suggestion_vote_cast', {
    feature: 'song_suggestions',
    ...context,
  });
}

export function trackSongSuggestionVoteChanged(
  context: SongSuggestionAnalyticsContext & {
    suggestionId: string;
    voteState: string;
    previousVoteState: string;
  },
): void {
  track('song_suggestion_vote_changed', {
    feature: 'song_suggestions',
    ...context,
  });
}

export function trackSongSuggestionVoteCleared(
  context: SongSuggestionAnalyticsContext & {
    suggestionId: string;
    previousVoteState: string;
  },
): void {
  track('song_suggestion_vote_cleared', {
    feature: 'song_suggestions',
    ...context,
  });
}

export function trackSongSuggestionWithdrawn(
  context: SongSuggestionAnalyticsContext & { suggestionId: string },
): void {
  track('song_suggestion_withdrawn', {
    feature: 'song_suggestions',
    ...context,
  });
}

export function trackSongSuggestionsClosed(context: SongSuggestionAnalyticsContext): void {
  track('song_suggestions_closed', {
    feature: 'song_suggestions',
    ...context,
  });
}

export function trackSongSuggestionVotingClosed(context: SongSuggestionAnalyticsContext): void {
  track('song_suggestion_voting_closed', {
    feature: 'song_suggestions',
    ...context,
  });
}

export function trackSongSuggestionGroupConfirmed(
  context: SongSuggestionAnalyticsContext & { selectedCount: number },
): void {
  track('song_suggestion_group_confirmed', {
    feature: 'song_suggestions',
    ...context,
  });
}

export function trackSongSuggestionSetlistCreated(
  context: SongSuggestionAnalyticsContext & { setlistId: string },
): void {
  track('song_suggestion_setlist_created', {
    feature: 'song_suggestions',
    ...context,
  });
}

export function trackSongSuggestionGroupArchived(context: SongSuggestionAnalyticsContext): void {
  track('song_suggestion_group_archived', {
    feature: 'song_suggestions',
    ...context,
  });
}

export function trackSongSuggestionCarryOver(
  context: SongSuggestionAnalyticsContext & { newGroupId: string; carriedCount: number },
): void {
  track('song_suggestion_carry_over', {
    feature: 'song_suggestions',
    ...context,
  });
}
