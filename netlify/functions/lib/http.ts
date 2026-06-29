import type { HandlerResponse } from '@netlify/functions';

export function jsonResponse(body: unknown, status = 200): HandlerResponse {
  return {
    statusCode: status,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

export function errorResponse(message: string, status = 400): HandlerResponse {
  return jsonResponse({ error: message }, status);
}

export function redirectResponse(location: string, status = 302): HandlerResponse {
  return {
    statusCode: status,
    headers: { Location: location },
    body: '',
  };
}

export function binaryResponse(
  body: Buffer,
  contentType: string,
  options?: { disposition?: 'inline' | 'attachment'; filename?: string },
): HandlerResponse {
  const filename = (options?.filename ?? 'file').replace(/[^\w.\-() ]+/g, '_');
  const disposition = options?.disposition ?? 'inline';

  return {
    statusCode: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `${disposition}; filename="${filename}"`,
      'Cache-Control': 'private, no-store',
    },
    body: body.toString('base64'),
    isBase64Encoded: true,
  };
}
