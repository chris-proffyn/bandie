/** Path segments under `/app/:bandId` that are not band UUIDs. */
const RESERVED_APP_BAND_SEGMENTS = new Set(['admin', 'gigs', 'venues', 'bands', 'players']);

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isBandRouteId(value: string | undefined): value is string {
  if (!value) {
    return false;
  }

  if (RESERVED_APP_BAND_SEGMENTS.has(value)) {
    return false;
  }

  return UUID_RE.test(value);
}

export function bandRouteIdFromParam(value: string | undefined): string | undefined {
  return isBandRouteId(value) ? value : undefined;
}
