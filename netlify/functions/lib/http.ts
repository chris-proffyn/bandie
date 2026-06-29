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
