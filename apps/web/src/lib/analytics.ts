import { trackEvent as track } from '@bandie/utils';

export type HomepageEventSection =
  | 'nav'
  | 'hero'
  | 'bands'
  | 'organisers'
  | 'players'
  | 'final_cta';

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
