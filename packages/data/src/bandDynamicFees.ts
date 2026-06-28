import type { BandDynamicFeeOfferInput } from './types/bandProfile';

export type DynamicFeeCalculation = {
  sessionCount: number | null;
  appearanceFee: number;
  sessionFeeTotal: number;
  total: number | null;
};

export function countDynamicFeeSessions(
  overallSetLengthMinutes: number | null | undefined,
  sessionDurationMinutes: number | null | undefined,
): number | null {
  if (
    overallSetLengthMinutes == null ||
    overallSetLengthMinutes <= 0 ||
    sessionDurationMinutes == null ||
    sessionDurationMinutes <= 0
  ) {
    return null;
  }

  return Math.ceil(overallSetLengthMinutes / sessionDurationMinutes);
}

export function calculateDynamicFee(
  offer: Pick<
    BandDynamicFeeOfferInput,
    'appearance_fee' | 'session_fee' | 'session_duration_minutes' | 'overall_set_length_minutes'
  >,
): DynamicFeeCalculation {
  const appearanceFee = offer.appearance_fee ?? 0;
  const sessionCount = countDynamicFeeSessions(
    offer.overall_set_length_minutes,
    offer.session_duration_minutes,
  );
  const sessionFee = offer.session_fee ?? 0;

  if (sessionCount == null) {
    const appearanceOnly = offer.appearance_fee != null ? appearanceFee : null;
    return {
      sessionCount: null,
      appearanceFee,
      sessionFeeTotal: 0,
      total: appearanceOnly,
    };
  }

  const sessionFeeTotal = sessionCount * sessionFee;
  const hasFeeParts =
    offer.appearance_fee != null || offer.session_fee != null || sessionCount > 0;

  return {
    sessionCount,
    appearanceFee: offer.appearance_fee ?? 0,
    sessionFeeTotal,
    total: hasFeeParts ? appearanceFee + sessionFeeTotal : null,
  };
}

export function formatDynamicFeeBreakdown(
  offer: Pick<
    BandDynamicFeeOfferInput,
    'appearance_fee' | 'session_fee' | 'session_duration_minutes' | 'overall_set_length_minutes'
  >,
): string | null {
  const calculation = calculateDynamicFee(offer);

  if (calculation.total == null) {
    return null;
  }

  const parts: string[] = [];

  if (offer.appearance_fee != null && offer.appearance_fee > 0) {
    parts.push(`£${offer.appearance_fee.toLocaleString()} appearance`);
  }

  if (
    calculation.sessionCount != null &&
    calculation.sessionCount > 0 &&
    offer.session_fee != null &&
    offer.session_fee > 0
  ) {
    parts.push(
      `${calculation.sessionCount} × £${offer.session_fee.toLocaleString()} sessions`,
    );
  }

  if (!parts.length) {
    return `£${calculation.total.toLocaleString()} total`;
  }

  return `${parts.join(' + ')} = £${calculation.total.toLocaleString()}`;
}
