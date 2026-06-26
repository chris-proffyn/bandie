export type AnalyticsPayload = Record<string, string | number | boolean | undefined>;

/**
 * Provider-neutral analytics helper. Wire to a real provider when selected.
 */
export function trackEvent(eventName: string, payload: AnalyticsPayload = {}): void {
  if (import.meta.env?.DEV) {
    console.info('[analytics]', eventName, payload);
  }
}
